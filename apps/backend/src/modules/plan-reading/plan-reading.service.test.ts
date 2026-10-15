import { describe, expect, it } from 'vitest';

import { startOfArgentinaDay } from './plan-reading.service';

describe('startOfArgentinaDay', () => {
  it('starts the day at 03:00 UTC', () => {
    expect(
      startOfArgentinaDay(new Date('2026-10-15T03:00:00Z')).toISOString(),
    ).toBe('2026-10-15T03:00:00.000Z');
    expect(
      startOfArgentinaDay(new Date('2026-10-15T23:59:00Z')).toISOString(),
    ).toBe('2026-10-15T03:00:00.000Z');
  });

  it('keeps the previous day before 03:00 UTC', () => {
    expect(
      startOfArgentinaDay(new Date('2026-10-15T02:59:59Z')).toISOString(),
    ).toBe('2026-10-14T03:00:00.000Z');
    expect(
      startOfArgentinaDay(new Date('2027-01-01T01:00:00Z')).toISOString(),
    ).toBe('2026-12-31T03:00:00.000Z');
  });
});
