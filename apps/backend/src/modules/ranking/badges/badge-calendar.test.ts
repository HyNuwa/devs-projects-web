import { describe, expect, it } from 'vitest';

import {
  examPeriodEdition,
  founderWindow,
  longestConsecutiveSemesters,
  semesterOf,
} from './badge-calendar';

/** A local (UTC-3) date at noon, so the time zone never moves the day. */
const local = (iso: string) => new Date(`${iso}T15:00:00.000Z`);

describe('badge calendar', () => {
  it('places March–July in the first cuatrimestre and August–December in the second', () => {
    expect(semesterOf(local('2026-03-01'))).toEqual({ year: 2026, half: 1 });
    expect(semesterOf(local('2026-07-31'))).toEqual({ year: 2026, half: 1 });
    expect(semesterOf(local('2026-08-01'))).toEqual({ year: 2026, half: 2 });
    expect(semesterOf(local('2026-12-31'))).toEqual({ year: 2026, half: 2 });
  });

  it('counts January and February in the preceding second cuatrimestre', () => {
    expect(semesterOf(local('2027-01-15'))).toEqual({ year: 2026, half: 2 });
    expect(semesterOf(local('2027-02-28'))).toEqual({ year: 2026, half: 2 });
  });

  it('uses the local day: 1 March at 01:00 UTC is still February in Argentina', () => {
    expect(semesterOf(new Date('2026-03-01T01:00:00.000Z'))).toEqual({
      year: 2025,
      half: 2,
    });
  });

  it('finds the longest run of consecutive cuatrimestres with a contribution', () => {
    expect(longestConsecutiveSemesters([])).toBe(0);
    expect(
      longestConsecutiveSemesters([
        local('2025-04-01'),
        local('2025-05-01'),
        local('2025-09-01'),
        local('2026-01-20'),
        local('2026-04-01'),
        // A gap: 2026-2 has nothing.
        local('2027-04-01'),
      ]),
    ).toBe(3);
  });

  it('gives each exam period its edición as YYYYMM of its first month', () => {
    expect(examPeriodEdition(local('2026-02-10'))).toBe(202602);
    expect(examPeriodEdition(local('2026-03-20'))).toBe(202602);
    expect(examPeriodEdition(local('2026-07-05'))).toBe(202607);
    expect(examPeriodEdition(local('2026-12-15'))).toBe(202612);
    expect(examPeriodEdition(local('2026-05-15'))).toBeNull();
  });

  it('reads the Primera camada window only when both dates are configured', () => {
    expect(founderWindow({})).toBeNull();
    expect(founderWindow({ start: '2026-03-01' })).toBeNull();
    expect(founderWindow({ start: '2026-03-01', end: '2026-07-31' })).toEqual({
      start: new Date('2026-03-01T03:00:00.000Z'),
      end: new Date('2026-08-01T03:00:00.000Z'),
    });
  });
});
