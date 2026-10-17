import type { Prisma } from '../../generated/prisma';
import type { PointService } from '../ranking/point.service';
import type { ModerationTarget } from './publication-policy.service';
import { targetWhere, updateTargetStatusFrom } from './targets';

type Tx = Prisma.TransactionClient;

/**
 * Retires every `Publicado` contribution of an account, as when an admin suspends
 * a spam account (docs/README_MODERACION.md §6.4). Each item gets its own closed
 * REMOVE caso, so it keeps an attributable history and its own appealable retiro.
 */
export async function retireAllPublished(
  tx: Tx,
  points: Pick<PointService, 'revertFor'>,
  input: { authorId: string; actorId: string; reason: string; now: Date },
) {
  const { authorId, actorId, reason, now } = input;
  const [materials, reviews, exams] = await Promise.all([
    tx.material.findMany({
      where: { authorId, publicationStatus: 'PUBLISHED', isDeleted: false },
      select: { id: true, title: true, subjectId: true },
    }),
    tx.courseReview.findMany({
      where: { userId: authorId, publicationStatus: 'PUBLISHED' },
      select: { id: true, subjectId: true },
    }),
    tx.examExperience.findMany({
      where: { userId: authorId, publicationStatus: 'PUBLISHED' },
      select: { id: true, subjectId: true },
    }),
  ]);

  const items: Array<{
    target: ModerationTarget;
    label: string;
    subjectId: string;
  }> = [
    ...materials.map((m) => ({
      target: { type: 'MATERIAL' as const, id: m.id },
      label: m.title,
      subjectId: m.subjectId,
    })),
    ...reviews.map((r) => ({
      target: { type: 'COURSE_REVIEW' as const, id: r.id },
      label: 'Reseña de cursada',
      subjectId: r.subjectId,
    })),
    ...exams.map((e) => ({
      target: { type: 'EXAM_EXPERIENCE' as const, id: e.id },
      label: 'Experiencia de final',
      subjectId: e.subjectId,
    })),
  ];

  let retired = 0;
  for (const { target, label, subjectId } of items) {
    const changed = await updateTargetStatusFrom(tx, target, 'PUBLISHED', {
      publicationStatus: 'REMOVED',
      statusChangedAt: now,
      hiddenAt: null,
      authorFacingReason: reason,
    });
    if (!changed) continue;
    const moderationCase = await tx.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: target.type,
        ...targetWhere(target),
        targetAuthorId: authorId,
        status: 'CLOSED',
        openedAt: now,
        closedAt: now,
        decision: 'REMOVE',
        decidedById: actorId,
        decisionReason: reason,
      },
    });
    await points.revertFor(tx, target.id);
    if (target.type === 'MATERIAL') {
      await tx.subject.update({
        where: { id: subjectId },
        data: { materialCount: { decrement: 1 } },
      });
    }
    await tx.moderationEvent.create({
      data: {
        actorId,
        action: 'REMOVED',
        targetType: target.type,
        ...targetWhere(target),
        targetUserId: authorId,
        caseId: moderationCase.id,
        reason,
        metadata: { label },
      },
    });
    retired += 1;
  }
  return retired;
}
