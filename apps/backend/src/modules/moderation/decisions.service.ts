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
import { loadTarget, updateTargetStatus } from './targets';
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
  ) {}

  async decide(caseId: string, moderatorId: string, dto: CaseDecisionDto) {
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
      const statusChange = {
        publicationStatus: nextStatus,
        statusChangedAt: now,
        hiddenAt: null,
        ...authorFacingReasonFor(decision, reason),
      };
      if (published) {
        await tx.material.update({
          where: { id: target.id },
          data: { ...statusChange, ...published, stagedFilePath: null },
        });
      } else {
        await updateTargetStatus(tx, target, statusChange);
      }

      if (!restoresRetiro) {
        await tx.moderationCase.update({
          where: { id: moderationCase.id },
          data: {
            status: 'CLOSED',
            closedAt: now,
            decision,
            decidedById: moderatorId,
            decisionReason: reason,
          },
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

      if (decision === 'REMOVE') {
        await this.points.revertFor(tx, target.id);
      }
      if (decision === 'RESTORE' || decision === 'APPROVE') {
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
    });

    return { caseId: moderationCase.id, decision, status: nextStatus };
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
