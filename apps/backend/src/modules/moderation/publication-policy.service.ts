import { Injectable } from '@nestjs/common';

import type { ModerationTargetType, Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { type PriorReviewReason, priorReviewReason } from './rules';

export type ModerationTarget =
  | { type: 'MATERIAL'; id: string }
  | { type: 'COURSE_REVIEW'; id: string }
  | { type: 'EXAM_EXPERIENCE'; id: string };

/** Foreign-key columns shared by moderation cases, reports and events. */
export function targetColumns(target: ModerationTarget) {
  return {
    targetType: target.type satisfies ModerationTargetType,
    materialId: target.type === 'MATERIAL' ? target.id : undefined,
    courseReviewId: target.type === 'COURSE_REVIEW' ? target.id : undefined,
    examExperienceId: target.type === 'EXAM_EXPERIENCE' ? target.id : undefined,
  };
}

/**
 * Decides whether a contribution is published immediately or waits for revisión
 * previa, and opens the revisión previa caso when it does.
 */
@Injectable()
export class PublicationPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async priorReviewFor(
    authorId: string,
    now = new Date(),
  ): Promise<PriorReviewReason | null> {
    const [author, lastRemoval] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: authorId },
        select: { createdAt: true, emailVerified: true },
      }),
      this.prisma.moderationEvent.findFirst({
        where: { action: 'REMOVED', targetUserId: authorId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return priorReviewReason(
      { ...author, lastRemovalAt: lastRemoval?.createdAt ?? null },
      now,
    );
  }

  /** Opens the revisión previa caso and records why, inside the caller's transaction. */
  async openPriorReview(
    tx: Prisma.TransactionClient,
    target: ModerationTarget,
    authorId: string,
    reason: PriorReviewReason | 'RESUBMITTED',
    label: string,
    action: 'PRIOR_REVIEW_OPENED' | 'RESUBMITTED' = 'PRIOR_REVIEW_OPENED',
  ) {
    const columns = targetColumns(target);
    const moderationCase = await tx.moderationCase.create({
      data: { kind: 'PRIOR_REVIEW', ...columns },
    });
    await tx.moderationEvent.create({
      data: {
        action,
        ...columns,
        actorId: action === 'RESUBMITTED' ? authorId : null,
        targetUserId: authorId,
        caseId: moderationCase.id,
        reason,
        metadata: { label },
      },
    });
    return moderationCase;
  }
}
