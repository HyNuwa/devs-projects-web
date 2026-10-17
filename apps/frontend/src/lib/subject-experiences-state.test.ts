import { describe, expect, it } from 'vitest';

import {
  parseSubjectExperiencesState,
  toSubjectExperiencesHref,
} from './subject-experiences-state';

const professorA = '60000000-0000-4000-8000-0000000000a1';
const professorB = '60000000-0000-4000-8000-0000000000b2';

describe('subject-experiences-state', () => {
  it('parses tab, breadcrumb carrera and both namespaced filter sets', () => {
    const params = new URLSearchParams(
      'tab=finales&carrera=ii' +
        '&resenas.academicYear=2024&resenas.shift=TARDE&resenas.condition=PROMO' +
        `&resenas.professorId=${professorA}&resenas.attempt=PRIMERA_CURSADA&resenas.sort=STARS_DESC` +
        `&finales.session=DICIEMBRE&finales.year=2024&finales.format=ORAL` +
        `&finales.professorId=${professorB}&finales.outcome=APROBADO`,
    );

    expect(parseSubjectExperiencesState(params)).toEqual({
      careerId: 'ii',
      exams: {
        format: 'ORAL',
        outcome: 'APROBADO',
        professorId: professorB,
        session: 'DICIEMBRE',
        year: 2024,
      },
      reviews: {
        academicYear: 2024,
        attempt: 'PRIMERA_CURSADA',
        condition: 'PROMO',
        professorId: professorA,
        shift: 'TARDE',
        sort: 'STARS_DESC',
      },
      tab: 'finales',
    });
  });

  it('keeps each tab’s professor filter without collision and round-trips', () => {
    const state = parseSubjectExperiencesState(
      new URLSearchParams(
        `resenas.professorId=${professorA}&finales.professorId=${professorB}&tab=finales`,
      ),
    );

    expect(state.reviews.professorId).toBe(professorA);
    expect(state.exams.professorId).toBe(professorB);

    const href = toSubjectExperiencesHref('06', state);
    expect(href).toBe(
      `/experiencias/06?tab=finales&resenas.professorId=${professorA}&finales.professorId=${professorB}`,
    );
    expect(parseSubjectExperiencesState(new URLSearchParams(href.split('?')[1]))).toEqual(state);
  });

  it('omits defaults: resenas tab, RECENT sort and empty filters', () => {
    expect(
      toSubjectExperiencesHref('06', {
        careerId: null,
        exams: {},
        reviews: { sort: 'RECENT' },
        tab: 'resenas',
      }),
    ).toBe('/experiencias/06');
  });

  it('drops malformed values and ignores page/limit/unknown keys', () => {
    const params = new URLSearchParams(
      'tab=otro&carrera=&resenas.academicYear=99&resenas.shift=MAL' +
        '&resenas.condition=X&resenas.attempt=X&resenas.sort=X&resenas.professorId=nope' +
        '&finales.session=X&finales.year=abc&finales.format=X&finales.outcome=X' +
        '&page=4&limit=50&subjectId=nope&extra=1',
    );

    expect(parseSubjectExperiencesState(params)).toEqual({
      careerId: null,
      exams: {},
      reviews: { sort: 'RECENT' },
      tab: 'resenas',
    });
  });
});
