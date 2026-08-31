import { describe, expect, it } from 'vitest';

import {
  materialHierarchyPath,
  parseMaterialHierarchyRoute,
  toMaterialHierarchyHref,
} from './material-hierarchy-state';

const careerId = '10000000-0000-4000-8000-000000000001';
const studyPlanId = '20000000-0000-4000-8000-000000000002';
const subjectId = '30000000-0000-4000-8000-000000000003';

describe('material hierarchy route state', () => {
  it('parses the canonical career-to-file route without accepting altered scopes', () => {
    const route = parseMaterialHierarchyRoute([
      'carreras',
      careerId,
      'planes',
      studyPlanId,
      'anios',
      '2',
      'materias',
      subjectId,
      'PARCIAL',
    ]);

    expect(route).toEqual({
      kind: 'files',
      careerId,
      studyPlanId,
      year: 2,
      subjectId,
      resourceType: 'PARCIAL',
    });
    expect(
      parseMaterialHierarchyRoute(['carreras', careerId, 'planes', studyPlanId, 'anios', '0']),
    ).toEqual({ kind: 'invalid' });
    expect(
      parseMaterialHierarchyRoute([
        'carreras',
        careerId,
        'planes',
        studyPlanId,
        'anios',
        '2',
        'materias',
        subjectId,
        'REVISADO',
      ]),
    ).toEqual({ kind: 'invalid' });
  });

  it('creates shareable URLs that retain the selected academic scope and query', () => {
    const route = {
      kind: 'categories' as const,
      careerId,
      studyPlanId,
      year: 2,
      subjectId,
    };

    expect(materialHierarchyPath(route)).toBe(
      `/materiales/carreras/${careerId}/planes/${studyPlanId}/anios/2/materias/${subjectId}`,
    );
    expect(toMaterialHierarchyHref(route, ' listas enlazadas ')).toBe(
      `/materiales/carreras/${careerId}/planes/${studyPlanId}/anios/2/materias/${subjectId}?q=listas%20enlazadas`,
    );
  });
});
