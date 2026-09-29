import {
  HIDDEN_REVIEW_WINDOW_DAYS,
  isOverdueHidden,
  isPubliclyVisible,
  publicVisibility,
} from './visibility';

const now = new Date('2026-09-29T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

describe('public visibility', () => {
  it.each([
    ['PUBLISHED', null, true],
    ['HIDDEN', daysAgo(1), false],
    ['HIDDEN', daysAgo(7), false],
    ['HIDDEN', daysAgo(7.01), true],
    ['PENDING_REVIEW', null, false],
    ['REJECTED', null, false],
    ['REMOVED', null, false],
  ] as const)(
    '%s hidden at %s → visible %s',
    (publicationStatus, hiddenAt, expected) => {
      expect(isPubliclyVisible({ publicationStatus, hiddenAt }, now)).toBe(
        expected,
      );
    },
  );

  it('flags hidden content that nobody reviewed within 7 days as overdue', () => {
    expect(HIDDEN_REVIEW_WINDOW_DAYS).toBe(7);
    expect(
      isOverdueHidden(
        { publicationStatus: 'HIDDEN', hiddenAt: daysAgo(8) },
        now,
      ),
    ).toBe(true);
    expect(
      isOverdueHidden(
        { publicationStatus: 'HIDDEN', hiddenAt: daysAgo(2) },
        now,
      ),
    ).toBe(false);
    expect(
      isOverdueHidden({ publicationStatus: 'PUBLISHED', hiddenAt: null }, now),
    ).toBe(false);
  });

  it('builds the equivalent Prisma filter for public reads', () => {
    expect(publicVisibility(now)).toEqual({
      OR: [
        { publicationStatus: 'PUBLISHED' },
        { publicationStatus: 'HIDDEN', hiddenAt: { lt: daysAgo(7) } },
      ],
    });
  });
});
