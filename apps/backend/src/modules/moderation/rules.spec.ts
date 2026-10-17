import { hideDecision, isQualifiedReporter, priorReviewReason } from './rules';

const now = new Date('2026-09-29T12:00:00.000Z');
const hoursAgo = (hours: number) =>
  new Date(now.getTime() - hours * 60 * 60 * 1000);
const daysAgo = (days: number) => hoursAgo(days * 24);

const established = {
  createdAt: daysAgo(90),
  emailVerified: true,
  lastRemovalAt: null,
};

describe('priorReviewReason', () => {
  it('publishes directly for an established, verified account without recent retiros', () => {
    expect(priorReviewReason(established, now)).toBeNull();
  });

  it.each([
    [
      'an account younger than 7 days',
      { ...established, createdAt: daysAgo(2) },
      'NEW_ACCOUNT',
    ],
    [
      'an unverified email',
      { ...established, emailVerified: false },
      'UNVERIFIED_EMAIL',
    ],
    [
      'a retiro 30 days ago',
      { ...established, lastRemovalAt: daysAgo(30) },
      'RECENT_REMOVAL',
    ],
  ] as const)('holds content for %s', (_label, author, reason) => {
    expect(priorReviewReason(author, now)).toBe(reason);
  });

  it('ignores a retiro older than 90 days', () => {
    expect(
      priorReviewReason({ ...established, lastRemovalAt: daysAgo(91) }, now),
    ).toBeNull();
  });

  it('reports the account age first when several conditions apply', () => {
    expect(
      priorReviewReason(
        { createdAt: daysAgo(1), emailVerified: false, lastRemovalAt: null },
        now,
      ),
    ).toBe('NEW_ACCOUNT');
  });
});

describe('isQualifiedReporter', () => {
  it.each([
    [{ createdAt: daysAgo(30), emailVerified: true }, true],
    [{ createdAt: daysAgo(30), emailVerified: false }, false],
    [{ createdAt: daysAgo(3), emailVerified: true }, false],
  ])('%o → %s', (reporter, expected) => {
    expect(isQualifiedReporter(reporter, now)).toBe(expected);
  });
});

describe('hideDecision', () => {
  const report = (
    reporterId: string,
    hours: number,
    options: {
      qualified?: boolean;
      reason?: 'DATOS_PERSONALES' | 'INSULTOS_O_ACOSO';
    } = {},
  ) => ({
    reporterId,
    createdAt: hoursAgo(hours),
    qualified: options.qualified ?? true,
    reason: options.reason ?? 'INSULTOS_O_ACOSO',
  });

  it('hides on the third distinct qualified reporter within 48 hours', () => {
    expect(
      hideDecision([report('a', 30), report('b', 10), report('c', 0)], now),
    ).toBe('HIDE_REPORT_COUNT');
  });

  it('does not hide when reports are spread over more than 48 hours', () => {
    expect(
      hideDecision([report('a', 100), report('b', 50), report('c', 0)], now),
    ).toBe('NONE');
  });

  it('does not count unqualified reporters towards the threshold', () => {
    expect(
      hideDecision(
        [report('a', 5), report('b', 3, { qualified: false }), report('c', 0)],
        now,
      ),
    ).toBe('NONE');
  });

  it('hides immediately on one qualified personal-data report', () => {
    expect(
      hideDecision([report('a', 0, { reason: 'DATOS_PERSONALES' })], now),
    ).toBe('HIDE_PERSONAL_DATA');
  });

  it('raises priority without hiding on an unqualified personal-data report', () => {
    expect(
      hideDecision(
        [report('a', 0, { reason: 'DATOS_PERSONALES', qualified: false })],
        now,
      ),
    ).toBe('HIGH_PRIORITY');
  });

  it('names the report-count rule when an unqualified personal-data report is also open', () => {
    expect(
      hideDecision(
        [
          report('new', 1, { reason: 'DATOS_PERSONALES', qualified: false }),
          report('a', 2),
          report('b', 1),
          report('c', 0),
        ],
        now,
      ),
    ).toBe('HIDE_REPORT_COUNT');
  });

  it('does nothing special for a single ordinary report', () => {
    expect(hideDecision([report('a', 0)], now)).toBe('NONE');
  });
});
