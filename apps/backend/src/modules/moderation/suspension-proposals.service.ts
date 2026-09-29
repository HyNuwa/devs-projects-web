import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { PointService } from '../ranking/point.service';
import { retireAllPublished } from './bulk-retiro';
import { canSanction } from './sanction-rules';
import { caseAbout } from './sanctions.service';
import {
  type Actor,
  isSuspended,
  SanctionsService,
  SUSPENSION_DAYS,
} from './sanctions.service';

type Duration = 7 | 30 | null;
const REASON_MAX = 1000;

/**
 * Suspensiones: a moderator proposes, an admin confirms or rejects, and an admin
 * can also suspend directly (docs/README_MODERACION.md §6.4).
 */
@Injectable()
export class SuspensionProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sanctions: SanctionsService,
    private readonly points: PointService,
  ) {}

  async propose(
    actor: Actor,
    userId: string,
    rawReason: string,
    durationDays: Duration,
    options: { caseId?: string } = {},
  ) {
    const reason = requireReason(rawReason);
    requireDuration(durationDays);
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isBanned: true, bannedUntil: true },
      });
      if (!target) throw new NotFoundException('Cuenta no encontrada');
      const source = options.caseId
        ? await caseAbout(tx, options.caseId, userId)
        : null;
      const reported = options.caseId
        ? await tx.report.findFirst({
            where: { caseId: options.caseId, reporterId: actor.id },
            select: { id: true },
          })
        : null;
      const permission = canSanction(actor, target, 'PROPOSE_SUSPENSION', {
        reportedInCase: reported !== null,
      });
      if (!permission.allowed) {
        throw new ForbiddenException(
          'No podés proponer una suspensión para esa cuenta',
        );
      }
      if (isSuspended(target, new Date())) {
        throw new ConflictException('La cuenta ya está suspendida');
      }

      let proposal: { id: string };
      try {
        proposal = await tx.suspensionProposal.create({
          data: {
            userId,
            proposedById: actor.id,
            reason,
            durationDays,
            caseId: options.caseId ?? null,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Ya hay una propuesta de suspensión pendiente para esta cuenta',
          );
        }
        throw error;
      }
      await tx.moderationEvent.create({
        data: {
          actorId: actor.id,
          action: 'SUSPENSION_PROPOSED',
          targetUserId: userId,
          caseId: options.caseId ?? null,
          ...(source ?? {}),
          reason,
          metadata: { proposalId: proposal.id, durationDays },
        },
      });
      return proposal;
    });
  }

  async confirm(
    actor: Actor,
    proposalId: string,
    input: {
      reason: string;
      durationDays?: Duration;
      retireContributions?: boolean;
    },
  ) {
    const reason = requireReason(input.reason);
    if (input.durationDays !== undefined) requireDuration(input.durationDays);
    requireAdmin(actor);

    return this.prisma.$transaction(async (tx) => {
      const proposal = await this.loadPending(tx, proposalId);
      const now = new Date();
      // Conditional: two admins deciding at once cannot both win.
      const decided = await tx.suspensionProposal.updateMany({
        where: { id: proposalId, status: 'PENDING' },
        data: {
          status: 'CONFIRMED',
          decidedById: actor.id,
          decisionReason: reason,
          decidedAt: now,
        },
      });
      if (decided.count === 0) {
        throw new ConflictException('La propuesta ya fue decidida');
      }
      const durationDays =
        input.durationDays !== undefined
          ? input.durationDays
          : (proposal.durationDays as Duration);
      const sanction = await this.sanctions.suspend(
        actor,
        proposal.userId,
        reason,
        durationDays,
        { tx, caseId: proposal.caseId ?? undefined },
      );
      await tx.suspensionProposal.update({
        where: { id: proposalId },
        data: { sanctionId: sanction.id },
      });
      if (input.retireContributions) {
        await retireAllPublished(tx, this.points, {
          authorId: proposal.userId,
          actorId: actor.id,
          reason,
          now,
        });
      }
      return sanction;
    });
  }

  async reject(actor: Actor, proposalId: string, rawReason: string) {
    const reason = requireReason(rawReason);
    requireAdmin(actor);
    return this.prisma.$transaction(async (tx) => {
      const proposal = await this.loadPending(tx, proposalId);
      const decided = await tx.suspensionProposal.updateMany({
        where: { id: proposalId, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          decidedById: actor.id,
          decisionReason: reason,
          decidedAt: new Date(),
        },
      });
      if (decided.count === 0) {
        throw new ConflictException('La propuesta ya fue decidida');
      }
      await tx.moderationEvent.create({
        data: {
          actorId: actor.id,
          action: 'SUSPENSION_REJECTED',
          targetUserId: proposal.userId,
          reason,
          metadata: { proposalId },
        },
      });
    });
  }

  /** An admin suspends without a proposal, e.g. spam or fake accounts. */
  async suspendDirectly(
    actor: Actor,
    userId: string,
    rawReason: string,
    durationDays: Duration,
    retireContributions = false,
  ) {
    const reason = requireReason(rawReason);
    return this.prisma.$transaction(async (tx) => {
      // Captured before the suspensión, so its retiros do not look newer than it.
      const now = new Date();
      const sanction = await this.sanctions.suspend(
        actor,
        userId,
        reason,
        durationDays,
        { tx },
      );
      if (retireContributions) {
        await retireAllPublished(tx, this.points, {
          authorId: userId,
          actorId: actor.id,
          reason,
          now,
        });
      }
      return sanction;
    });
  }

  private async loadPending(tx: Prisma.TransactionClient, proposalId: string) {
    const proposal = await tx.suspensionProposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        userId: true,
        status: true,
        durationDays: true,
        caseId: true,
      },
    });
    if (!proposal) throw new NotFoundException('Propuesta no encontrada');
    if (proposal.status !== 'PENDING') {
      throw new ConflictException('La propuesta ya fue decidida');
    }
    return proposal;
  }
}

function requireReason(raw: string) {
  const reason = raw?.trim();
  if (!reason || reason.length > REASON_MAX) {
    throw new BadRequestException(
      `Escribí la razón (hasta ${REASON_MAX} caracteres)`,
    );
  }
  return reason;
}

function requireDuration(durationDays: Duration) {
  if (!SUSPENSION_DAYS.has(durationDays)) {
    throw new BadRequestException(
      'La suspensión dura 7 días, 30 días o es permanente',
    );
  }
}

function requireAdmin(actor: Actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'SUPERADMIN') {
    throw new ForbiddenException('Solo un admin decide una suspensión');
  }
}
