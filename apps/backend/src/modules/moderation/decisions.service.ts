import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ModerationDecision,
  ModerationEventAction,
  Prisma,
  PublicationStatus,
} from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { MaterialsService } from '../materials/materials.service';
import { PointService } from '../ranking/point.service';
import { CONTRIBUTION_POINTS } from './contribution-points';
import type { CaseDecisionDto } from './dto/case-decision.dto';
import {
  type ModerationTarget,
  targetColumns,
} from './publication-policy.service';
import { loadTarget, targetWhere, updateTargetStatusFrom } from './targets';
import { canSanction } from './sanction-rules';
import { type Actor, SanctionsService } from './sanctions.service';
import { nextStatusFor } from './transitions';

const REASON_REQUIRED: ReadonlySet<ModerationDecision> = new Set([
  'REMOVE',
  'RESTORE',
  'REJECT',
]);

const EVENT_FOR: Record<ModerationDecision, ModerationEventAction> = {
  KEEP_VISIBLE: 'KEPT_VISIBLE',
  REMOVE: 'REMOVED',
  RESTORE: 'RESTORED',
  APPROVE: 'PRIOR_REVIEW_APPROVED',
  REJECT: 'PRIOR_REVIEW_REJECTED',
};

/** Decisions on a caso de moderación (docs/README_MODERACION.md §5). */
@Injectable()
export class DecisionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointService,
    private readonly materials: MaterialsService,
    private readonly sanctions: SanctionsService,
  ) {}

  async decide(caseId: string, moderator: Actor, dto: CaseDecisionDto) {
    const moderatorId = moderator.id;
    const { decision } = dto;
    const reason = dto.reason?.trim() || null;
    if (REASON_REQUIRED.has(decision) && !reason) {
      throw new BadRequestException('Escribí la razón de la decisión');
    }

    const moderationCase = await this.prisma.moderationCase.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        kind: true,
        status: true,
        decision: true,
        targetType: true,
        materialId: true,
        courseReviewId: true,
        examExperienceId: true,
        reports: { select: { reporterId: true } },
      },
    });
    if (!moderationCase) throw new NotFoundException('Caso no encontrado');

    const target: ModerationTarget = {
      type: moderationCase.targetType,
      id: (moderationCase.materialId ??
        moderationCase.courseReviewId ??
        moderationCase.examExperienceId)!,
    };
    const snapshot = await loadTarget(this.prisma, target);
    if (!snapshot) throw new NotFoundException('El contenido ya no existe');

    if (
      snapshot.authorId === moderatorId ||
      moderationCase.reports.some((report) => report.reporterId === moderatorId)
    ) {
      throw new ForbiddenException(
        'No podés decidir sobre tu propio contenido ni sobre un caso que reportaste',
      );
    }

    const restoresRetiro =
      decision === 'RESTORE' &&
      moderationCase.status === 'CLOSED' &&
      moderationCase.decision === 'REMOVE';
    if (moderationCase.status !== 'OPEN' && !restoresRetiro) {
      throw new ConflictException('Este caso ya fue resuelto');
    }
    if (restoresRetiro) {
      // Only the latest caso speaks for the content: an older one would skip
      // the conflict-of-interest check against the newer caso's reporters.
      const latest = await this.prisma.moderationCase.findFirst({
        where: targetWhere(target),
        orderBy: [{ openedAt: 'desc' }, { id: 'desc' }],
        select: { id: true },
      });
      if (latest?.id !== moderationCase.id) {
        throw new ConflictException(
          'Restauralo desde el caso más reciente de este contenido',
        );
      }
    }
    const nextStatus = nextStatusFor(
      decision,
      moderationCase.kind,
      snapshot.publicationStatus,
    );
    if (!nextStatus) {
      throw new ConflictException(
        'Esa decisión no aplica al estado actual del contenido',
      );
    }

    // Drive upload happens before the transaction; it cannot be rolled back.
    const published =
      decision === 'APPROVE' && target.type === 'MATERIAL'
        ? await this.materials.publishStagedFile(target.id)
        : null;

    const now = new Date();
    const columns = targetColumns(target);
    const points = CONTRIBUTION_POINTS[target.type];

    await this.prisma.$transaction(async (tx) => {
      // Both writes are conditional: a concurrent decision that committed first
      // leaves them matching no row, and this one rolls back before any points
      // or events are written.
      if (!restoresRetiro) {
        const closed = await tx.moderationCase.updateMany({
          where: { id: moderationCase.id, status: 'OPEN' },
          data: {
            status: 'CLOSED',
            closedAt: now,
            decision,
            decidedById: moderatorId,
            decisionReason: reason,
          },
        });
        if (closed.count === 0) {
          throw new ConflictException('Este caso ya fue resuelto');
        }
      }

      const statusChange = {
        publicationStatus: nextStatus,
        statusChangedAt: now,
        hiddenAt: null,
        ...authorFacingReasonFor(decision, reason),
      };
      const changed = published
        ? (
            await tx.material.updateMany({
              where: {
                id: target.id,
                publicationStatus: snapshot.publicationStatus,
              },
              data: { ...statusChange, ...published, stagedFilePath: null },
            })
          ).count > 0
        : await updateTargetStatusFrom(
            tx,
            target,
            snapshot.publicationStatus,
            statusChange,
          );
      if (!changed) {
        throw new ConflictException(
          'El contenido cambió mientras decidías; volvé a abrir el caso',
        );
      }
      // The retiro no longer counts for the escalera once it is undone.
      if (restoresRetiro) {
        await tx.moderationCase.update({
          where: { id: moderationCase.id },
          data: { revertedAt: now },
        });
      }
      if (decision === 'KEEP_VISIBLE' || decision === 'REMOVE') {
        await tx.report.updateMany({
          where: { caseId: moderationCase.id, status: 'OPEN' },
          data: {
            status: decision === 'REMOVE' ? 'CONFIRMED' : 'DISMISSED',
            resolvedAt: now,
          },
        });
      }

      // Points never move for anonymous content: the author's public points
      // would change with the decision and name them (README_PUNTOS_E_INSIGNIAS §3.4).
      if (decision === 'REMOVE' && !snapshot.isAnonymous) {
        await this.points.revertFor(tx, target.id);
      }
      if (
        (decision === 'RESTORE' || decision === 'APPROVE') &&
        !snapshot.isAnonymous
      ) {
        await this.points.awardFor(tx, {
          userId: snapshot.authorId,
          amount: points.amount,
          reason: points.reason,
          referenceId: target.id,
        });
      }

      const countDelta = materialCountDelta(
        target,
        decision,
        snapshot.publicationStatus,
      );
      if (countDelta) {
        await tx.subject.update({
          where: { id: snapshot.subjectId },
          data: {
            materialCount:
              countDelta > 0
                ? { increment: countDelta }
                : { decrement: -countDelta },
          },
        });
      }

      await tx.moderationEvent.create({
        data: {
          actorId: moderatorId,
          action: EVENT_FOR[decision],
          ...columns,
          targetUserId: snapshot.authorId,
          caseId: moderationCase.id,
          reason,
          metadata: { label: snapshot.label },
        },
      });

      // «Advertir también»: the advertencia goes to the author's account (anonymous
      // or not) in the same transaction as the retiro.
      if (decision === 'REMOVE' && dto.warn && reason) {
        // An author the moderator may not sanction (staff) is not warned, and the
        // retiro still succeeds: failing would reveal that an anonymous author is staff.
        const author = await tx.user.findUnique({
          where: { id: snapshot.authorId },
          select: { id: true, role: true },
        });
        if (author && canSanction(moderator, author, 'WARN').allowed) {
          await this.sanctions.warn(moderator, snapshot.authorId, reason, {
            caseId: moderationCase.id,
            tx,
            decidingCase: true,
          });
        }
      }
    });

    return { caseId: moderationCase.id, decision, status: nextStatus };
  }

  /**
   * An accepted appeal undoes a retiro (openspec moderation/appeals): the content is
   * published again with its points, the retiro stops counting for the escalera, and
   * the advertencia given with it is voided. Runs inside the answer's transaction.
   */
  async restoreFromAppeal(
    tx: Prisma.TransactionClient,
    input: {
      caseId: string;
      appealId: string;
      actorId: string;
      reason: string;
    },
  ) {
    const now = new Date();
    const moderationCase = await tx.moderationCase.findUnique({
      where: { id: input.caseId },
      select: {
        id: true,
        targetType: true,
        materialId: true,
        courseReviewId: true,
        examExperienceId: true,
        revertedAt: true,
      },
    });
    if (!moderationCase) throw new NotFoundException('Caso no encontrado');
    const voidWarning = () =>
      tx.sanction.updateMany({
        where: { caseId: moderationCase.id, type: 'WARNING', voidedAt: null },
        data: { voidedAt: now, voidedByAppealId: input.appealId },
      });
    // Already restored: the appeal is right, and there is nothing left to undo.
    if (moderationCase.revertedAt) {
      await voidWarning();
      return;
    }
    const target: ModerationTarget = {
      type: moderationCase.targetType,
      id: (moderationCase.materialId ??
        moderationCase.courseReviewId ??
        moderationCase.examExperienceId)!,
    };
    const snapshot = await loadTarget(tx, target);
    if (!snapshot) throw new NotFoundException('El contenido ya no existe');

    // A newer caso speaks for the content now: this retiro stops counting, but the
    // newer decision stands.
    const latest = await tx.moderationCase.findFirst({
      where: targetWhere(target),
      orderBy: [{ openedAt: 'desc' }, { id: 'desc' }],
      select: { id: true },
    });
    if (latest && latest.id !== moderationCase.id) {
      await tx.moderationCase.update({
        where: { id: moderationCase.id },
        data: { revertedAt: now },
      });
      await voidWarning();
      return;
    }

    const changed = await updateTargetStatusFrom(tx, target, 'REMOVED', {
      publicationStatus: 'PUBLISHED',
      statusChangedAt: now,
      hiddenAt: null,
      authorFacingReason: null,
    });
    if (!changed) {
      throw new ConflictException('El contenido ya no está retirado');
    }
    await tx.moderationCase.update({
      where: { id: moderationCase.id },
      data: { revertedAt: now },
    });
    // The retiro was a mistake: points come back even during an active sanción.
    // Anonymous content kept its points when retired, so nothing comes back.
    const points = CONTRIBUTION_POINTS[target.type];
    if (!snapshot.isAnonymous) {
      await this.points.awardFor(tx, {
        userId: snapshot.authorId,
        amount: points.amount,
        reason: points.reason,
        referenceId: target.id,
      });
    }
    if (target.type === 'MATERIAL') {
      await tx.subject.update({
        where: { id: snapshot.subjectId },
        data: { materialCount: { increment: 1 } },
      });
    }
    await voidWarning();
    await tx.moderationEvent.create({
      data: {
        actorId: input.actorId,
        action: 'RESTORED',
        ...targetColumns(target),
        targetUserId: snapshot.authorId,
        caseId: moderationCase.id,
        reason: input.reason,
        metadata: { label: snapshot.label, appealId: input.appealId },
      },
    });
  }
}

function authorFacingReasonFor(
  decision: ModerationDecision,
  reason: string | null,
) {
  if (decision === 'REMOVE' || decision === 'REJECT') {
    return { authorFacingReason: reason };
  }
  if (decision === 'RESTORE' || decision === 'APPROVE') {
    return { authorFacingReason: null };
  }
  return {};
}

/** Materia counts include published and hidden materials, as on upload. */
function materialCountDelta(
  target: ModerationTarget,
  decision: ModerationDecision,
  current: PublicationStatus,
) {
  if (target.type !== 'MATERIAL') return 0;
  if (decision === 'REMOVE' && current !== 'REMOVED') return -1;
  if (decision === 'RESTORE' || decision === 'APPROVE') return 1;
  return 0;
}
