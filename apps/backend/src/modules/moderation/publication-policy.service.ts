import { Injectable } from '@nestjs/common';

import type { ModerationTargetType, Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { type PriorReviewReason, priorReviewReason } from './rules';

export type ModerationTarget = { type: ModerationTargetType; id: string };

/** Foreign-key columns shared by moderation cases, reports and events. */
export function targetColumns(target: ModerationTarget) {
  return {
    targetType: target.type,
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
    // Only content that is still retired counts: a restored retiro was undone.
    const retired = {
      orderBy: { statusChangedAt: 'desc' },
      select: { statusChangedAt: true },
    } as const;
    const [author, ...lastRetired] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: authorId },
        select: { createdAt: true, emailVerified: true },
      }),
      this.prisma.material.findFirst({
        where: { authorId, publicationStatus: 'REMOVED' },
        ...retired,
      }),
      this.prisma.courseReview.findFirst({
        where: { userId: authorId, publicationStatus: 'REMOVED' },
        ...retired,
      }),
      this.prisma.examExperience.findFirst({
        where: { userId: authorId, publicationStatus: 'REMOVED' },
        ...retired,
      }),
    ]);
    const lastRemovalAt =
      lastRetired
        .map((entry) => entry?.statusChangedAt ?? null)
        .filter((date): date is Date => date !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return priorReviewReason({ ...author, lastRemovalAt }, now);
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
      data: { kind: 'PRIOR_REVIEW', ...columns, targetAuthorId: authorId },
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
