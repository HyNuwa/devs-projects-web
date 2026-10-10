import { Injectable } from '@nestjs/common';

import type { PointReason, Prisma } from '../../generated/prisma';
import { levelForPoints } from './rpg-levels';

type Tx = Prisma.TransactionClient;

export const REPORT_CAP_PER_WEEK = 10;

export const HELPFUL_CAPS = {
  perMaterial: 25,
  perDay: 20,
  perGiverPerMonth: 5,
};

/** Days and months for caps are counted in the faculty's time zone (UTC-3, no DST). */
const LOCAL_OFFSET_MS = -3 * 3_600_000;

/** The start of the local day of `now`, or of `offset` days later. */
function startOfLocalDay(now: Date, offset = 0) {
  const local = new Date(now.getTime() + LOCAL_OFFSET_MS);
  return new Date(
    Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate() + offset,
    ) - LOCAL_OFFSET_MS,
  );
}

/** The start of the local month of `now`, or of `offset` months later. */
function startOfLocalMonth(now: Date, offset = 0) {
  const local = new Date(now.getTime() + LOCAL_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + offset, 1) -
      LOCAL_OFFSET_MS,
  );
}

export type SanctionState = {
  mutedUntil: Date | null;
  isBanned: boolean;
  bannedUntil: Date | null;
};

/** Silenced until a future date, or suspended permanently or until a future date. */
export function isSanctioned(account: SanctionState, now: Date) {
  const future = (date: Date | null) =>
    date !== null && date.getTime() > now.getTime();
  return (
    future(account.mutedUntil) ||
    (account.isBanned &&
      (account.bannedUntil === null || future(account.bannedUntil)))
  );
}

export type PointAward = {
  userId: string;
  reason: PointReason;
  referenceId: string;
  amount: number;
  /** Points given back by an accepted appeal, awarded even during a sanción. */
  appeal?: boolean;
  /**
   * Replays a past event (rebuild-points): the movimiento is dated then and caps
   * are counted around that date. Past sanciones are not reconstructed.
   */
  replayAt?: Date;
};

/**
 * The points ledger (openspec reputation/points). Every movimiento de puntos goes
 * through it inside the caller's transaction:
 * - An award is recorded at most once per reference until it is reversed. Its
 *   idempotency key counts the reversals so far, so a restoration earns again.
 * - A reversal is a new negative movimiento that names the one it reverses.
 * - `User.points` is always the sum of the account's movimientos.
 *
 * A unique violation would abort the caller's whole transaction, so instead of
 * relying on the constraints alone, each movimiento locks the account row first
 * and then an advisory lock on its key, and checks before writing. Accounts are
 * always locked before keys, so concurrent operations cannot deadlock on them;
 * a caller touching several accounts locks them up front with `lockAccounts`.
 */
@Injectable()
export class PointLedger {
  /** Records the award unless the reference already holds an active one. */
  async award(tx: Tx, input: PointAward): Promise<boolean> {
    const { appeal, replayAt, ...award } = input;
    const now = replayAt ?? new Date();
    const keyBase = `${award.reason}:${award.referenceId}`;
    const account = await this.lockAccount(tx, award.userId);
    await this.lockKey(tx, keyBase);
    // A silenced or suspended account earns nothing, and nothing is kept for later.
    if (!appeal && !replayAt && account && isSanctioned(account, now)) {
      return false;
    }

    if (await this.activeAward(tx, award.reason, award.referenceId)) {
      return false;
    }
    if (await this.capReached(tx, award, now)) return false;
    const reversals = await tx.pointTransaction.count({
      where: {
        reason: award.reason,
        referenceId: award.referenceId,
        reversesId: { not: null },
      },
    });

    await tx.pointTransaction.create({
      data: {
        ...award,
        idempotencyKey: `${keyBase}:${reversals}`,
        ...(replayAt ? { createdAt: replayAt } : {}),
      },
    });
    await this.applyDelta(tx, award.userId, award.amount);
    return true;
  }

  /** Reverses the active award of a reference, if there is one. */
  async revert(
    tx: Tx,
    target: { reason: PointReason; referenceId: string },
  ): Promise<boolean> {
    const found = await this.activeAward(tx, target.reason, target.referenceId);
    if (!found) return false;
    // Account first, then key; the award is read again under both locks.
    await this.lockAccount(tx, found.userId);
    await this.lockKey(tx, `${target.reason}:${target.referenceId}`);
    const original = await this.activeAward(
      tx,
      target.reason,
      target.referenceId,
    );
    if (!original) return false;

    await tx.pointTransaction.create({
      data: {
        userId: original.userId,
        reason: original.reason,
        referenceId: original.referenceId,
        amount: -original.amount,
        reversesId: original.id,
        idempotencyKey: `reversal:${original.id}`,
      },
    });
    await this.applyDelta(tx, original.userId, -original.amount);
    return true;
  }

  /** Reverses every active award whose reference starts with `referencePrefix`. */
  async revertMatching(
    tx: Tx,
    target: { reason: PointReason; referencePrefix: string },
  ): Promise<number> {
    const awards = await tx.pointTransaction.findMany({
      where: {
        reason: target.reason,
        referenceId: { startsWith: target.referencePrefix },
        amount: { gt: 0 },
        reversedBy: null,
      },
      select: { referenceId: true },
    });
    let reverted = 0;
    for (const { referenceId } of awards) {
      if (
        await this.revert(tx, {
          reason: target.reason,
          referenceId: referenceId!,
        })
      ) {
        reverted += 1;
      }
    }
    return reverted;
  }

  /**
   * Caps limit points, never publication: an entry over its cap is still
   * published, and the point is not kept for later (§3.1).
   */
  private async capReached(
    tx: Tx,
    award: PointAward,
    now: Date,
  ): Promise<boolean> {
    switch (award.reason) {
      case 'COURSE_REVIEWED': {
        // One reseña with points per materia and ciclo lectivo; no ciclo is one more.
        const review = await tx.courseReview.findUnique({
          where: { id: award.referenceId },
          select: { subjectId: true, academicYear: true },
        });
        if (!review) return false;
        const siblings = await tx.courseReview.findMany({
          where: {
            userId: award.userId,
            subjectId: review.subjectId,
            academicYear: review.academicYear,
            id: { not: award.referenceId },
          },
          select: { id: true },
        });
        return this.anyActive(tx, award.reason, siblings);
      }
      case 'EXAM_EXPERIENCE_SHARED': {
        // One experiencia with points per materia, período de examen and year.
        const exam = await tx.examExperience.findUnique({
          where: { id: award.referenceId },
          select: { subjectId: true, session: true, year: true },
        });
        if (!exam) return false;
        const siblings = await tx.examExperience.findMany({
          where: {
            userId: award.userId,
            subjectId: exam.subjectId,
            session: exam.session,
            year: exam.year,
            id: { not: award.referenceId },
          },
          select: { id: true },
        });
        return this.anyActive(tx, award.reason, siblings);
      }
      case 'HELPFUL_RECEIVED': {
        // `<materialId>:<giverId>`: 25 per material, 20 per day per author, and
        // 5 per month from the same giver to the same author.
        const [materialId, giverId] = award.referenceId.split(':');
        const active = (where: Prisma.PointTransactionWhereInput) =>
          tx.pointTransaction.count({
            where: {
              reason: 'HELPFUL_RECEIVED',
              amount: { gt: 0 },
              reversedBy: null,
              ...where,
            },
          });
        const [perMaterial, today, fromGiver] = await Promise.all([
          active({ referenceId: { startsWith: `${materialId}:` } }),
          active({
            userId: award.userId,
            createdAt: {
              gte: startOfLocalDay(now),
              lt: startOfLocalDay(now, 1),
            },
          }),
          active({
            userId: award.userId,
            referenceId: { endsWith: `:${giverId}` },
            createdAt: {
              gte: startOfLocalMonth(now),
              lt: startOfLocalMonth(now, 1),
            },
          }),
        ]);
        return (
          perMaterial >= HELPFUL_CAPS.perMaterial ||
          today >= HELPFUL_CAPS.perDay ||
          fromGiver >= HELPFUL_CAPS.perGiverPerMonth
        );
      }
      case 'REPORT_CONFIRMED': {
        // At most 10 points from confirmed reportes per account in 7 days.
        const { _sum } = await tx.pointTransaction.aggregate({
          where: {
            userId: award.userId,
            reason: 'REPORT_CONFIRMED',
            amount: { gt: 0 },
            reversedBy: null,
            createdAt: {
              gte: new Date(now.getTime() - 7 * 86_400_000),
              lte: now,
            },
          },
          _sum: { amount: true },
        });
        return (_sum.amount ?? 0) + award.amount > REPORT_CAP_PER_WEEK;
      }
      default:
        return false;
    }
  }

  private async anyActive(
    tx: Tx,
    reason: PointReason,
    entries: { id: string }[],
  ) {
    if (entries.length === 0) return false;
    const active = await tx.pointTransaction.count({
      where: {
        reason,
        referenceId: { in: entries.map((entry) => entry.id) },
        amount: { gt: 0 },
        reversedBy: null,
      },
    });
    return active > 0;
  }

  private activeAward(tx: Tx, reason: PointReason, referenceId: string) {
    return tx.pointTransaction.findFirst({
      where: { reason, referenceId, amount: { gt: 0 }, reversedBy: null },
    });
  }

  private async lockKey(tx: Tx, key: string) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }

  /**
   * Locks several accounts in a fixed order, for a caller that moves points of
   * more than one (a retiro: its author and its reporters).
   */
  async lockAccounts(tx: Tx, userIds: string[]) {
    for (const userId of [...new Set(userIds)].sort()) {
      await this.lockAccount(tx, userId);
    }
  }

  /** Serializes this account's movimientos, so caps hold under concurrency. */
  private async lockAccount(tx: Tx, userId: string) {
    const [account] = await tx.$queryRaw<SanctionState[]>`
      SELECT "muted_until" AS "mutedUntil", "is_banned" AS "isBanned",
             "banned_until" AS "bannedUntil"
      FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`;
    return account;
  }

  private async applyDelta(tx: Tx, userId: string, amount: number) {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { points: { increment: amount } },
      select: { points: true, level: true, maxLevel: true },
    });
    const level = levelForPoints(updated.points);
    if (level !== updated.level || level > updated.maxLevel) {
      // The nivel máximo alcanzado never goes down: not on reversals, not
      // under a sanción. The account row is locked, so this read is current.
      await tx.user.update({
        where: { id: userId },
        data: { level, maxLevel: Math.max(level, updated.maxLevel) },
      });
    }
  }
}
