import { describe, expect, it } from 'vitest';

import {
  parseMaterialSearchState,
  serializeMaterialSearchState,
  toMaterialSearchHref,
} from './material-search-state';

const subjectId = '20000000-0000-4000-8000-000000000001';
const professorId = '40000000-0000-4000-8000-000000000001';

describe('material search URL state', () => {
  it('parses every supported parameter from a shareable URL', () => {
    expect(
      parseMaterialSearchState(
        new URLSearchParams(
          `q=%20grafos%20&subjectId=${subjectId}&resourceType=FINAL&academicYear=2026&professorId=${professorId}&sort=RECENT&page=3&scope=all`,
        ),
      ),
    ).toEqual({
      q: 'grafos',
      subjectId,
      resourceType: 'FINAL',
      academicYear: 2026,
      professorId,
      sort: 'RECENT',
      page: 3,
      scope: 'all',
    });
  });

  it('drops unsupported or malformed values instead of forwarding them', () => {
    expect(
      parseMaterialSearchState(
        new URLSearchParams(
          'q=grafos&subjectId=not-a-uuid&resourceType=ARCHIVO&academicYear=not-a-year&professorId=bad&sort=POPULAR&page=0&scope=subject',
        ),
      ),
    ).toEqual({ q: 'grafos', sort: 'RELEVANCE', page: 1, scope: undefined });
  });

  it('serializes canonical URLs without default sort or first-page noise', () => {
    const state = {
      q: 'Álgebra I',
      subjectId,
      resourceType: 'PARCIAL' as const,
      academicYear: 2026,
      professorId,
      sort: 'RELEVANCE' as const,
      page: 1,
    };

    expect(serializeMaterialSearchState(state).toString()).toBe(
      `q=%C3%81lgebra+I&subjectId=${subjectId}&resourceType=PARCIAL&academicYear=2026&professorId=${professorId}`,
    );
    expect(toMaterialSearchHref(state)).toBe(
      `/buscar?q=%C3%81lgebra+I&subjectId=${subjectId}&resourceType=PARCIAL&academicYear=2026&professorId=${professorId}`,
    );
  });
});
