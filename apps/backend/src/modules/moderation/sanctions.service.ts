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
type Options = { caseId?: string; tx?: Tx };

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
    const voided = await tx.sanction.updateMany({
      where: { id: sanction.id, voidedAt: null },
      data: { voidedAt: now, voidedByAppealId: input.appealId },
    });
    if (voided.count === 0) {
      throw new ConflictException('La sanción ya fue anulada');
    }
    const inForce =
      sanction.liftedAt === null &&
      (sanction.endsAt === null || sanction.endsAt.getTime() > now.getTime());
    if (inForce && sanction.type === 'MUTE') {
      await tx.user.update({
        where: { id: sanction.userId },
        data: { isMuted: false, mutedUntil: null },
      });
    }
    if (inForce && sanction.type === 'SUSPENSION') {
      await tx.user.update({
        where: { id: sanction.userId },
        data: { isBanned: false, bannedUntil: null },
      });
    }
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
      const target = await this.loadTarget(tx, userId);
      const source = options.caseId
        ? await this.loadCase(tx, options.caseId, actor.id)
        : null;
      assertAllowed(
        canSanction(actor, target, action, {
          reportedInCase: source?.reportedByActor ?? false,
        }),
      );
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
      if (type === 'MUTE') {
        await tx.user.update({
          where: { id: userId },
          data: { isMuted: true, mutedUntil: endsAt },
        });
      }
      if (type === 'SUSPENSION') {
        await tx.user.update({
          where: { id: userId },
          data: { isBanned: true, bannedUntil: endsAt },
        });
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
      await tx.user.update({
        where: { id: userId },
        data:
          type === 'MUTE'
            ? { isMuted: false, mutedUntil: null }
            : { isBanned: false, bannedUntil: null },
      });
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
  private async loadCase(tx: Tx, caseId: string, actorId: string) {
    const moderationCase = await tx.moderationCase.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        targetType: true,
        materialId: true,
        courseReviewId: true,
        examExperienceId: true,
      },
    });
    if (!moderationCase) throw new NotFoundException('Caso no encontrado');
    const reported = await tx.report.findFirst({
      where: { caseId, reporterId: actorId },
      select: { id: true },
    });
    return {
      reportedByActor: reported !== null,
      columns: {
        caseId,
        targetType: moderationCase.targetType,
        materialId: moderationCase.materialId,
        courseReviewId: moderationCase.courseReviewId,
        examExperienceId: moderationCase.examExperienceId,
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
