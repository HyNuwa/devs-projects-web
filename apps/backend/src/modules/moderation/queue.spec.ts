import { groupQueue, type QueueItem } from './queue';

const item = (overrides: Partial<QueueItem>): QueueItem => ({
  caseId: 'case',
  kind: 'REPORTS',
  targetStatus: 'PUBLISHED',
  reportCount: 1,
  highPriority: false,
  openedAt: new Date('2026-09-20T00:00:00.000Z'),
  overdueHidden: false,
  ...overrides,
});

describe('groupQueue', () => {
  it('splits open casos into hidden, prior review and reported', () => {
    const groups = groupQueue([
      item({ caseId: 'reported' }),
      item({ caseId: 'hidden', targetStatus: 'HIDDEN' }),
      item({
        caseId: 'prior',
        kind: 'PRIOR_REVIEW',
        targetStatus: 'PENDING_REVIEW',
        reportCount: 0,
      }),
    ]);

    expect(groups.hidden.map((entry) => entry.caseId)).toEqual(['hidden']);
    expect(groups.priorReview.map((entry) => entry.caseId)).toEqual(['prior']);
    expect(groups.reported.map((entry) => entry.caseId)).toEqual(['reported']);
  });

  it('orders reported casos by priority, then report count, then age', () => {
    const groups = groupQueue([
      item({
        caseId: 'one-old',
        reportCount: 1,
        openedAt: new Date('2026-09-01T00:00:00.000Z'),
      }),
      item({ caseId: 'two', reportCount: 2 }),
      item({
        caseId: 'one-new',
        reportCount: 1,
        openedAt: new Date('2026-09-25T00:00:00.000Z'),
      }),
      item({ caseId: 'urgent', reportCount: 1, highPriority: true }),
    ]);

    expect(groups.reported.map((entry) => entry.caseId)).toEqual([
      'urgent',
      'two',
      'one-old',
      'one-new',
    ]);
  });

  it('keeps overdue hidden content in the hidden group, flagged, and first', () => {
    const groups = groupQueue([
      item({
        caseId: 'hidden-recent',
        targetStatus: 'HIDDEN',
        openedAt: new Date('2026-09-27T00:00:00.000Z'),
      }),
      item({ caseId: 'overdue', targetStatus: 'HIDDEN', overdueHidden: true }),
    ]);

    expect(groups.hidden.map((entry) => entry.caseId)).toEqual([
      'overdue',
      'hidden-recent',
    ]);
  });

  it('orders prior reviews oldest first', () => {
    const groups = groupQueue([
      item({
        caseId: 'new',
        kind: 'PRIOR_REVIEW',
        openedAt: new Date('2026-09-28T00:00:00.000Z'),
      }),
      item({
        caseId: 'old',
        kind: 'PRIOR_REVIEW',
        openedAt: new Date('2026-09-10T00:00:00.000Z'),
      }),
    ]);

    expect(groups.priorReview.map((entry) => entry.caseId)).toEqual([
      'old',
      'new',
    ]);
  });
});
