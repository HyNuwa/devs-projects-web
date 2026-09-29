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
  hiddenAt?: Date | null;
  overdueHidden: boolean;
};

/** Response times (docs/README_MODERACION.md §14.2). */
const HIDDEN_RESPONSE_MS = 48 * 60 * 60 * 1000;
const RESPONSE_MS = 7 * 24 * 60 * 60 * 1000;

const oldestFirst = (a: QueueItem, b: QueueItem) =>
  a.openedAt.getTime() - b.openedAt.getTime();

/** When a caso should be decided: 48 h after hiding, 7 days after opening otherwise. */
export function dueAt(item: QueueItem): Date {
  return item.targetStatus === 'HIDDEN' && item.hiddenAt
    ? new Date(item.hiddenAt.getTime() + HIDDEN_RESPONSE_MS)
    : new Date(item.openedAt.getTime() + RESPONSE_MS);
}

/**
 * Groups open casos for the moderation panel (docs/README_MODERACION.md §4.5):
 * overdue casos first («Vencidos», most overdue first), then hidden content, then
 * revisión previa, then reported and still visible. Without a clock (`now`) there is
 * no Vencidos group.
 */
export function groupQueue<T extends QueueItem>(items: T[], now?: Date) {
  const byUrgency = (a: T, b: T) =>
    Number(b.overdueHidden) - Number(a.overdueHidden) ||
    Number(b.highPriority) - Number(a.highPriority) ||
    b.reportCount - a.reportCount ||
    oldestFirst(a, b);

  const withDue = items.map((item) => ({ ...item, dueAt: dueAt(item) }));
  const overdue = (item: T & { dueAt: Date }) =>
    now !== undefined && item.dueAt.getTime() < now.getTime();
  const onTime = withDue.filter((item) => !overdue(item));

  return {
    vencidos: withDue
      .filter(overdue)
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime()),
    hidden: onTime
      .filter(
        (entry) => entry.kind === 'REPORTS' && entry.targetStatus === 'HIDDEN',
      )
      .sort(byUrgency),
    priorReview: onTime
      .filter((entry) => entry.kind === 'PRIOR_REVIEW')
      .sort(oldestFirst),
    reported: onTime
      .filter(
        (entry) => entry.kind === 'REPORTS' && entry.targetStatus !== 'HIDDEN',
      )
      .sort(byUrgency),
  };
}
