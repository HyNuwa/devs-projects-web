import { describe, expect, it } from 'vitest';

import {
  canSuggestCorrections,
  eligibleToModerate,
  priorityReporter,
  type TrustFacts,
} from './privileges';

const now = new Date('2026-10-10T12:00:00Z');
const good = { good: true, until: null, permanent: false };
const until = new Date('2026-11-20T00:00:00Z');

const facts = (extra: Partial<TrustFacts> = {}): TrustFacts => ({
  role: 'USER',
  maxLevel: 3,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  standing: good,
  recentReports: { confirmed: 0, dismissed: 0 },
  confirmedReports: 0,
  acceptedCorrections: 0,
  now,
  ...extra,
});

/** Privilegios de confianza (openspec reputation/trust-privileges). */
describe('canSuggestCorrections', () => {
  it('needs nivel máximo alcanzado 3', () => {
    expect(canSuggestCorrections(facts())).toEqual({
      active: true,
      missing: [],
    });
    expect(canSuggestCorrections(facts({ maxLevel: 2 }))).toEqual({
      active: false,
      missing: [{ kind: 'LEVEL', needed: 3, current: 2 }],
    });
  });

  it('needs good standing', () => {
    expect(
      canSuggestCorrections(
        facts({ standing: { good: false, until, permanent: false } }),
      ),
    ).toEqual({ active: false, missing: [{ kind: 'STANDING', until }] });
  });
});

describe('priorityReporter', () => {
  it('needs 5 confirmed and 70 % precision in 90 days', () => {
    expect(
      priorityReporter(facts({ recentReports: { confirmed: 6, dismissed: 2 } }))
        .active,
    ).toBe(true);
    expect(
      priorityReporter(
        facts({ recentReports: { confirmed: 3, dismissed: 0 } }),
      ),
    ).toEqual({
      active: false,
      missing: [{ kind: 'CONFIRMED_REPORTS', needed: 5, current: 3 }],
    });
    expect(
      priorityReporter(
        facts({ recentReports: { confirmed: 5, dismissed: 4 } }),
      ),
    ).toEqual({
      active: false,
      missing: [{ kind: 'PRECISION', needed: 70, current: 56 }],
    });
  });

  it('accepts exactly 70 %', () => {
    expect(
      priorityReporter(facts({ recentReports: { confirmed: 7, dismissed: 3 } }))
        .active,
    ).toBe(true);
  });

  it('needs good standing, whatever the precision', () => {
    const result = priorityReporter(
      facts({
        recentReports: { confirmed: 9, dismissed: 0 },
        standing: { good: false, until: null, permanent: true },
      }),
    );
    expect(result).toEqual({
      active: false,
      missing: [{ kind: 'STANDING', until: null }],
    });
  });
});

describe('eligibleToModerate', () => {
  const eligible = facts({ maxLevel: 6, confirmedReports: 5 });

  it('is true when every requirement holds', () => {
    expect(eligibleToModerate(eligible)).toBe(true);
    expect(
      eligibleToModerate({
        ...eligible,
        confirmedReports: 0,
        acceptedCorrections: 10,
      }),
    ).toBe(true);
  });

  it.each<[string, Partial<TrustFacts>]>([
    ['a moderator', { role: 'MODERATOR' }],
    ['nivel 5', { maxLevel: 5 }],
    [
      'an account under 6 months',
      { createdAt: new Date('2026-06-01T00:00:00Z') },
    ],
    [
      'too few reportes and corrections',
      { confirmedReports: 4, acceptedCorrections: 9 },
    ],
    [
      'no good standing',
      { standing: { good: false, until, permanent: false } },
    ],
  ])('is false for %s', (_, extra) => {
    expect(eligibleToModerate({ ...eligible, ...extra })).toBe(false);
  });
});
