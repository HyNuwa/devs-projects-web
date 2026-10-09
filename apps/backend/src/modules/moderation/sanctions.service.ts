import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ModerationEventAction,
  Prisma,
  Role,
  SanctionType,
} from '../../generated/prisma';
import { assertNoReportConflict } from './conflict-of-interest';
import { PrismaService } from '../../prisma/prisma.service';
import { canSanction, type SanctionAction } from './sanction-rules';

export const MUTE_DAYS = 7;
export const SUSPENSION_DAYS: ReadonlySet<number | null> = new Set([
  7,
  30,
  null,
]);
const REASON_MAX = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type Actor = { id: string; role: Role };
type Tx = Prisma.TransactionClient;
/**
 * `decidingCase`: the advertencia of a caso's decision («Advertir también»). Only
 * then is the report conflict skipped: the reporter check covers that caso, and
 * refusing for another report could reveal who wrote anonymous content.
 */
type Options = { caseId?: string; tx?: Tx; decidingCase?: boolean };

const EVENT_FOR: Record<SanctionType, ModerationEventAction> = {
  WARNING: 'WARNED',
  MUTE: 'MUTED',
  SUSPENSION: 'SUSPENDED',
};

const DENIED: Record<'SELF' | 'ROLE' | 'REPORTED_CASE', string> = {
  SELF: 'No podés sancionar tu propia cuenta',
  ROLE: 'Tu rol no permite esta sanción sobre esa cuenta',
  REPORTED_CASE: 'No podés sancionar desde un caso que reportaste',
};

/**
 * Applies and lifts sanciones (docs/README_MODERACION.md §6). Every change writes the
 * `Sanction` row, the account's cached status and the history event in one
 * transaction; nothing else writes `mutedUntil`, `isBanned` or `bannedUntil`.
 */
@Injectable()
export class SanctionsService {
  constructor(private readonly prisma: PrismaService) {}

  warn(actor: Actor, userId: string, reason: string, options: Options = {}) {
    return this.apply(actor, userId, 'WARNING', reason, null, options);
  }

  async mute(
    actor: Actor,
    userId: string,
    reason: string,
    options: Options = {},
  ) {
    const now = new Date();
    return this.apply(
      actor,
      userId,
      'MUTE',
      reason,
      new Date(now.getTime() + MUTE_DAYS * DAY_MS),
      options,
    );
  }

  async suspend(
    actor: Actor,
    userId: string,
    reason: string,
    durationDays: 7 | 30 | null,
    options: Options = {},
  ) {
    if (!SUSPENSION_DAYS.has(durationDays)) {
      throw new BadRequestException(
        'La suspensión dura 7 días, 30 días o es permanente',
      );
    }
    const now = new Date();
    const endsAt =
      durationDays === null
        ? null
        : new Date(now.getTime() + durationDays * DAY_MS);
    return this.apply(actor, userId, 'SUSPENSION', reason, endsAt, options);
  }

  /**
   * An accepted appeal voids a sanción: it stops counting for the escalera and, if
   * still in force, stops applying now. Runs inside the answer's transaction.
   */
  async voidByAppeal(tx: Tx, input: { sanctionId: string; appealId: string }) {
    const now = new Date();
    const sanction = await tx.sanction.findUnique({
      where: { id: input.sanctionId },
      select: {
        id: true,
        userId: true,
        type: true,
        endsAt: true,
        liftedAt: true,
      },
    });
    if (!sanction) throw new NotFoundException('Sanción no encontrada');
    await lockAccount(tx, sanction.userId);
    const voided = await tx.sanction.updateMany({
      where: { id: sanction.id, voidedAt: null },
      data: { voidedAt: now, voidedByAppealId: input.appealId },
    });
    if (voided.count === 0) {
      throw new ConflictException('La sanción ya fue anulada');
    }
    await refreshAccountCache(tx, sanction.userId, now);
  }

  unmute(actor: Actor, userId: string, reason: string) {
    return this.lift(actor, userId, 'MUTE', reason);
  }

  liftSuspension(actor: Actor, userId: string, reason: string) {
    return this.lift(actor, userId, 'SUSPENSION', reason);
  }

  private async apply(
    actor: Actor,
    userId: string,
    type: SanctionType,
    rawReason: string,
    endsAt: Date | null,
    options: Options,
  ) {
    const reason = requireReason(rawReason);
    const action: SanctionAction =
      type === 'WARNING' ? 'WARN' : type === 'MUTE' ? 'MUTE' : 'SUSPEND';

    const run = async (tx: Tx) => {
      const now = new Date();
      await lockAccount(tx, userId);
      const target = await this.loadTarget(tx, userId);
      const source = options.caseId
        ? await this.loadCase(tx, options.caseId, actor.id, userId)
        : null;
      assertAllowed(
        canSanction(actor, target, action, {
          reportedInCase: source?.reportedByActor ?? false,
        }),
      );
      // Only a caso's decision skips it; Usuarios actions never name a caso.
      if (!options.decidingCase && type !== 'SUSPENSION') {
        await assertNoReportConflict(tx, actor.id, userId, now);
      }
      if (type === 'MUTE' && isFuture(target.mutedUntil, now)) {
        throw new ConflictException('La cuenta ya está silenciada');
      }
      if (type === 'SUSPENSION' && isSuspended(target, now)) {
        throw new ConflictException('La cuenta ya está suspendida');
      }

      const sanction = await tx.sanction.create({
        data: {
          userId,
          type,
          reason,
          startsAt: now,
          endsAt,
          appliedById: actor.id,
          caseId: options.caseId ?? null,
        },
      });
      if (type !== 'WARNING') await refreshAccountCache(tx, userId, now);
      if (type === 'SUSPENSION') {
        // End every open session; login and refresh refuse the account from now on.
        await tx.refreshToken.deleteMany({ where: { userId } });
      }
      await tx.moderationEvent.create({
        data: {
          actorId: actor.id,
          action: EVENT_FOR[type],
          targetUserId: userId,
          reason,
          ...(source?.columns ?? {}),
          metadata: { endsAt: endsAt?.toISOString() ?? null },
        },
      });
      return sanction;
    };

    return options.tx ? run(options.tx) : this.prisma.$transaction(run);
  }

  private async lift(
    actor: Actor,
    userId: string,
    type: 'MUTE' | 'SUSPENSION',
    rawReason: string,
  ) {
    const reason = requireReason(rawReason);
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await lockAccount(tx, userId);
      const target = await this.loadTarget(tx, userId);
      assertAllowed(
        canSanction(
          actor,
          target,
          type === 'MUTE' ? 'UNMUTE' : 'LIFT_SUSPENSION',
        ),
      );
      const active = await tx.sanction.findFirst({
        where: {
          userId,
          type,
          liftedAt: null,
          voidedAt: null,
          ...(type === 'MUTE'
            ? { endsAt: { gt: now } }
            : { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }),
        },
        select: { id: true },
      });
      if (!active) {
        throw new ConflictException(
          type === 'MUTE'
            ? 'La cuenta no está silenciada'
            : 'La cuenta no está suspendida',
        );
      }
      await tx.sanction.update({
        where: { id: active.id },
        data: { liftedAt: now, liftedById: actor.id, liftReason: reason },
      });
      // Another sanción of the same type may still be in force.
      await refreshAccountCache(tx, userId, now);
      await tx.moderationEvent.create({
        data: {
          actorId: actor.id,
          action: 'SANCTION_LIFTED',
          targetUserId: userId,
          reason,
          metadata: { sanctionId: active.id, type },
        },
      });
    });
  }

  private async loadTarget(tx: Tx, userId: string) {
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        mutedUntil: true,
        isBanned: true,
        bannedUntil: true,
      },
    });
    if (!target) throw new NotFoundException('Cuenta no encontrada');
    return target;
  }

  /** The caso a sanción comes from: its content columns for the event, and COI. */
  private async loadCase(
    tx: Tx,
    caseId: string,
    actorId: string,
    userId: string,
  ) {
    const moderationCase = await caseAbout(tx, caseId, userId);
    const reported = await tx.report.findFirst({
      where: { caseId, reporterId: actorId },
      select: { id: true },
    });
    return {
      reportedByActor: reported !== null,
      columns: {
        caseId,
        ...moderationCase,
      },
    };
  }
}

function requireReason(raw: string) {
  const reason = raw?.trim();
  if (!reason || reason.length > REASON_MAX) {
    throw new BadRequestException(
      `Escribí la razón de la sanción (hasta ${REASON_MAX} caracteres)`,
    );
  }
  return reason;
}

function assertAllowed(
  permission: ReturnType<typeof canSanction>,
): asserts permission is { allowed: true } {
  if (!permission.allowed) {
    throw new ForbiddenException(DENIED[permission.reason]);
  }
}

function isFuture(date: Date | null, now: Date) {
  return date !== null && date.getTime() > now.getTime();
}

/** Suspended while banned and either permanent or not yet over. */
export function isSuspended(
  account: { isBanned: boolean; bannedUntil: Date | null },
  now: Date,
) {
  return (
    account.isBanned &&
    (account.bannedUntil === null ||
      account.bannedUntil.getTime() > now.getTime())
  );
}

/**
 * Serializes sanción changes on one account (two moderators at once, or a
 * confirmation racing a direct suspension), so the cache below stays exact.
 */
async function lockAccount(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
}

/**
 * Rebuilds `User.isMuted/mutedUntil/isBanned/bannedUntil` from the sanciones still
 * in force, so lifting or voiding one never clears another that also applies.
 */
async function refreshAccountCache(tx: Tx, userId: string, now: Date) {
  const active = await tx.sanction.findMany({
    where: {
      userId,
      type: { in: ['MUTE', 'SUSPENSION'] },
      liftedAt: null,
      voidedAt: null,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    select: { type: true, endsAt: true },
  });
  const latest = (dates: Array<Date | null>) =>
    dates
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
  const mutes = active.filter((row) => row.type === 'MUTE');
  const suspensions = active.filter((row) => row.type === 'SUSPENSION');
  const mutedUntil = latest(mutes.map((row) => row.endsAt));
  await tx.user.update({
    where: { id: userId },
    data: {
      isMuted: mutedUntil !== null,
      mutedUntil,
      isBanned: suspensions.length > 0,
      // A permanent suspensión (no end) wins over any temporary one.
      bannedUntil: suspensions.some((row) => row.endsAt === null)
        ? null
        : latest(suspensions.map((row) => row.endsAt)),
    },
  });
}

/**
 * The content columns of the caso a sanción comes from, after checking that the
 * caso is about that account: a sanción never links to someone else's content.
 */
export async function caseAbout(tx: Tx, caseId: string, userId: string) {
  const moderationCase = await tx.moderationCase.findUnique({
    where: { id: caseId },
    select: {
      targetType: true,
      materialId: true,
      courseReviewId: true,
      examExperienceId: true,
      targetAuthorId: true,
    },
  });
  if (!moderationCase) throw new NotFoundException('Caso no encontrado');
  const { targetAuthorId, ...content } = moderationCase;
  if (targetAuthorId !== userId) {
    throw new BadRequestException('Ese caso no es sobre esta cuenta');
  }
  return content;
}
