import { describe, expect, it } from 'vitest';

import { fiUnju } from '@/test/institutions';
import type { SubjectHub } from '@/types/subject';

import { byCareerName, placementEyebrow, trailPlacement } from './subject-context';

const placement = (
  id: string,
  name: string,
  code: string,
  year: number | null,
  semester: number | null,
): SubjectHub['studyPlans'][number] => ({
  credits: null,
  semester,
  studyPlan: { career: { code, faculty: fiUnju, id, name }, name: 'Plan' },
  year,
});

const informatica = placement('c-inf', 'Ingeniería Informática', 'II', 1, 1);
const industrial = placement('c-ind', 'Ingeniería Industrial', 'IN', 3, 2);
const optativa = placement('c-opt', 'Tecnicatura Optativa', 'TO', null, null);
const placements = [industrial, informatica];

describe('subject-context', () => {
  it('orders placements by Spanish carrera name', () => {
    expect([...placements].sort(byCareerName).map((p) => p.studyPlan.career.id)).toEqual([
      'c-ind',
      'c-inf',
    ]);
  });

  it('resolves the trail carrera by code or id', () => {
    expect(trailPlacement(placements, 'ii', [])).toBe(informatica);
    expect(trailPlacement(placements, 'C-IND', [])).toBe(industrial);
    // An id match is an actual match, not the alphabetical fallback:
    // informatica would not win by name here.
    expect(trailPlacement([industrial, informatica], 'C-INF'.toLowerCase(), [])).toBe(informatica);
  });

  it('falls back to the first declared carrera, then the first by name', () => {
    expect(
      trailPlacement(placements, 'zz', [
        { careerId: 'other', declaredAt: '2025-01-01' },
        { careerId: 'c-inf', declaredAt: '2024-01-01' },
      ]),
    ).toBe(informatica);
    expect(trailPlacement(placements, null, [])).toBe(industrial);
    expect(trailPlacement([], 'ii', [])).toBeNull();
  });

  it('renders the placement eyebrow with año, cuatrimestre, Anual and Optativa', () => {
    expect(placementEyebrow(informatica)).toBe('1° año · 1° cuatrimestre');
    expect(placementEyebrow(industrial)).toBe('3° año · 2° cuatrimestre');
    expect(placementEyebrow(placement('a', 'A', 'A', 2, 0))).toBe('2° año · Anual');
    expect(placementEyebrow(optativa)).toBe('Optativa');
    expect(placementEyebrow(placement('b', 'B', 'B', 4, null))).toBe('4° año');
    expect(placementEyebrow(null)).toBeNull();
  });
});
