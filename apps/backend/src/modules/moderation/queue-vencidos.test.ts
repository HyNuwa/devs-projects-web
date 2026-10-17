import { describe, expect, it } from 'vitest';

import { groupQueue, type QueueItem } from './queue';

const now = new Date('2026-09-30T12:00:00.000Z');
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000);

const item = (overrides: Partial<QueueItem>): QueueItem => ({
  caseId: 'case',
  kind: 'REPORTS',
  targetStatus: 'PUBLISHED',
  reportCount: 1,
  highPriority: false,
  openedAt: hoursAgo(1),
  hiddenAt: null,
  overdueHidden: false,
  ...overrides,
});

describe('groupQueue with a clock: Vencidos', () => {
  it('moves hidden content past 48 hours to Vencidos, at the top', () => {
    const groups = groupQueue(
      [
        item({
          caseId: 'hidden-late',
          targetStatus: 'HIDDEN',
          openedAt: hoursAgo(60),
          hiddenAt: hoursAgo(49),
        }),
        item({
          caseId: 'hidden-ok',
          targetStatus: 'HIDDEN',
          openedAt: hoursAgo(20),
          hiddenAt: hoursAgo(10),
        }),
      ],
      now,
    );

    expect(groups.vencidos.map((entry) => entry.caseId)).toEqual([
      'hidden-late',
    ]);
    expect(groups.hidden.map((entry) => entry.caseId)).toEqual(['hidden-ok']);
    expect(Object.keys(groups)[0]).toBe('vencidos');
  });

  it('gives the rest 7 days, revisión previa included', () => {
    const groups = groupQueue(
      [
        item({ caseId: 'reported-late', openedAt: hoursAgo(7 * 24 + 1) }),
        item({
          caseId: 'prior-late',
          kind: 'PRIOR_REVIEW',
          targetStatus: 'PENDING_REVIEW',
          openedAt: hoursAgo(8 * 24),
        }),
        item({ caseId: 'reported-ok', openedAt: hoursAgo(6 * 24) }),
      ],
      now,
    );

    expect(groups.vencidos.map((entry) => entry.caseId)).toEqual([
      'prior-late',
      'reported-late',
    ]);
    expect(groups.reported.map((entry) => entry.caseId)).toEqual([
      'reported-ok',
    ]);
    expect(groups.priorReview).toEqual([]);
  });

  it('orders Vencidos by how overdue each caso is', () => {
    const groups = groupQueue(
      [
        item({ caseId: 'a', openedAt: hoursAgo(7 * 24 + 5) }),
        item({
          caseId: 'b',
          targetStatus: 'HIDDEN',
          openedAt: hoursAgo(100),
          hiddenAt: hoursAgo(90),
        }),
      ],
      now,
    );

    // b is 42 h past its 48 h; a is 5 h past its 7 days.
    expect(groups.vencidos.map((entry) => entry.caseId)).toEqual(['b', 'a']);
  });

  it('exposes when each caso is due', () => {
    const groups = groupQueue(
      [item({ caseId: 'fresh', openedAt: hoursAgo(1) })],
      now,
    );

    expect(groups.reported[0].dueAt).toEqual(
      new Date(hoursAgo(1).getTime() + 7 * 24 * 3_600_000),
    );
  });
});
