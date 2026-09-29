import type { ModerationTargetType } from '../../generated/prisma';

/**
 * Current points for each contribution type. The points change redefines these
 * amounts; moderation only awards, reverts and re-awards them.
 */
export const CONTRIBUTION_POINTS: Record<
  ModerationTargetType,
  { amount: number; reason: string }
> = {
  MATERIAL: { amount: 10, reason: 'MATERIAL_PUBLISHED' },
  COURSE_REVIEW: { amount: 5, reason: 'COURSE_REVIEWED' },
  EXAM_EXPERIENCE: { amount: 5, reason: 'EXAM_EXPERIENCE_SHARED' },
};
