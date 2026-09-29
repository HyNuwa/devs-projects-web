import type {
  ModerationCaseKind,
  PublicationStatus,
} from '../../generated/prisma';

export type QueueItem = {
  caseId: string;
  kind: ModerationCaseKind;
  targetStatus: PublicationStatus;
  reportCount: number;
  highPriority: boolean;
  openedAt: Date;
  overdueHidden: boolean;
};

const oldestFirst = (a: QueueItem, b: QueueItem) =>
  a.openedAt.getTime() - b.openedAt.getTime();

/**
 * Groups open casos for the moderation panel (docs/README_MODERACION.md §4.5):
 * hidden content first, then revisión previa, then reported and still visible.
 */
export function groupQueue<T extends QueueItem>(items: T[]) {
  const byUrgency = (a: T, b: T) =>
    Number(b.overdueHidden) - Number(a.overdueHidden) ||
    Number(b.highPriority) - Number(a.highPriority) ||
    b.reportCount - a.reportCount ||
    oldestFirst(a, b);

  return {
    hidden: items
      .filter(
        (entry) => entry.kind === 'REPORTS' && entry.targetStatus === 'HIDDEN',
      )
      .sort(byUrgency),
    priorReview: items
      .filter((entry) => entry.kind === 'PRIOR_REVIEW')
      .sort(oldestFirst),
    reported: items
      .filter(
        (entry) => entry.kind === 'REPORTS' && entry.targetStatus !== 'HIDDEN',
      )
      .sort(byUrgency),
  };
}
