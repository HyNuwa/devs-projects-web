import { describe, expect, it } from 'vitest';

import {
  GOOD_STANDING_DAYS,
  standing,
  type StandingSanction,
} from './standing';

const DAY = 86_400_000;
const now = new Date('2026-10-10T12:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * DAY);
const daysAhead = (days: number) => new Date(now.getTime() + days * DAY);

const mute = (extra: Partial<StandingSanction> = {}): StandingSanction => ({
  type: 'MUTE',
  startsAt: daysAgo(67),
  endsAt: daysAgo(60),
  liftedAt: null,
  voidedAt: null,
  ...extra,
});

/** Good standing (openspec reputation/trust-privileges). */
describe('standing', () => {
  it('is good without sanciones or retiros', () => {
    expect(standing({ sanctions: [], retiros: [], now })).toEqual({
      good: true,
      until: null,
      permanent: false,
    });
  });

  it('waits 90 days after a silenciamiento ends', () => {
    const result = standing({ sanctions: [mute()], retiros: [], now });

    expect(result.good).toBe(false);
    expect(result.until).toEqual(new Date(daysAgo(60).getTime() + 90 * DAY));
    expect(GOOD_STANDING_DAYS).toBe(90);
  });

  it('is good again exactly 90 days after the end', () => {
    const result = standing({
      sanctions: [mute({ endsAt: daysAgo(90) })],
      retiros: [],
      now,
    });
    expect(result.good).toBe(true);
  });

  it('counts a lifted silenciamiento from when it was lifted', () => {
    const result = standing({
      sanctions: [mute({ endsAt: daysAhead(5), liftedAt: daysAgo(95) })],
      retiros: [],
      now,
    });
    expect(result.good).toBe(true);
  });

  it('ignores voided sanciones, reverted retiros and advertencias', () => {
    const result = standing({
      sanctions: [
        mute({ voidedAt: daysAgo(50) }),
        {
          type: 'WARNING',
          startsAt: daysAgo(3),
          endsAt: null,
          liftedAt: null,
          voidedAt: null,
        },
      ],
      retiros: [{ closedAt: daysAgo(10), revertedAt: daysAgo(2) }],
      now,
    });
    expect(result.good).toBe(true);
  });

  it('waits 90 days after a retiro closes, anonymous content included', () => {
    const result = standing({
      sanctions: [],
      retiros: [{ closedAt: daysAgo(30), revertedAt: null }],
      now,
    });
    expect(result).toEqual({
      good: false,
      until: new Date(daysAgo(30).getTime() + 90 * DAY),
      permanent: false,
    });
  });

  it('is not good during an active suspensión', () => {
    const result = standing({
      sanctions: [
        {
          type: 'SUSPENSION',
          startsAt: daysAgo(2),
          endsAt: daysAhead(5),
          liftedAt: null,
          voidedAt: null,
        },
      ],
      retiros: [],
      now,
    });
    expect(result).toEqual({
      good: false,
      until: new Date(daysAhead(5).getTime() + 90 * DAY),
      permanent: false,
    });
  });

  it('never comes back after a permanent suspensión', () => {
    const result = standing({
      sanctions: [
        {
          type: 'SUSPENSION',
          startsAt: daysAgo(400),
          endsAt: null,
          liftedAt: null,
          voidedAt: null,
        },
      ],
      retiros: [],
      now,
    });
    expect(result).toEqual({ good: false, until: null, permanent: true });
  });
});
