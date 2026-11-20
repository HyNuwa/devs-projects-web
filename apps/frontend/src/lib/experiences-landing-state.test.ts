import { describe, expect, it } from 'vitest';

import {
  parseExperiencesLandingState,
  toExperiencesLandingHref,
} from './experiences-landing-state';

const careerId = '20000000-0000-4000-8000-000000000042';

describe('experiences-landing-state', () => {
  it('parses carrera, anio and tipo', () => {
    expect(
      parseExperiencesLandingState(new URLSearchParams(`carrera=${careerId}&anio=2&tipo=finales`)),
    ).toEqual({ allCareers: false, careerId, year: 2, kind: 'finales' });
  });

  it('parses an explicit «Todas» marker apart from an implicit one', () => {
    expect(parseExperiencesLandingState(new URLSearchParams('carrera=todas'))).toEqual({
      allCareers: true,
      careerId: null,
      year: null,
      kind: null,
    });
    expect(parseExperiencesLandingState(new URLSearchParams('carrera=todas&tipo=resenas'))).toEqual(
      { allCareers: true, careerId: null, year: null, kind: 'resenas' },
    );
    // The implicit default is not the explicit choice.
    expect(parseExperiencesLandingState(new URLSearchParams()).allCareers).toBe(false);
  });

  it('falls back to defaults for missing or invalid values', () => {
    expect(parseExperiencesLandingState(new URLSearchParams())).toEqual({
      allCareers: false,
      careerId: null,
      year: null,
      kind: null,
    });
    expect(
      parseExperiencesLandingState(new URLSearchParams('carrera=nope&anio=0&tipo=todo')),
    ).toEqual({ allCareers: false, careerId: null, year: null, kind: null });
    expect(parseExperiencesLandingState(new URLSearchParams('anio=11'))).toEqual({
      allCareers: false,
      careerId: null,
      year: null,
      kind: null,
    });
    expect(parseExperiencesLandingState(new URLSearchParams('anio=abc'))).toEqual({
      allCareers: false,
      careerId: null,
      year: null,
      kind: null,
    });
  });

  it('round-trips only non-default values', () => {
    expect(
      toExperiencesLandingHref({ allCareers: false, careerId: null, year: null, kind: null }),
    ).toBe('/experiencias');
    expect(
      toExperiencesLandingHref({ allCareers: false, careerId, year: 3, kind: 'resenas' }),
    ).toBe(`/experiencias?carrera=${careerId}&anio=3&tipo=resenas`);
    expect(
      toExperiencesLandingHref({
        allCareers: false,
        careerId: null,
        year: null,
        kind: 'finales',
      }),
    ).toBe('/experiencias?tipo=finales');
    expect(
      toExperiencesLandingHref({ allCareers: true, careerId: null, year: null, kind: null }),
    ).toBe('/experiencias?carrera=todas');
    expect(
      parseExperiencesLandingState(
        new URLSearchParams(
          toExperiencesLandingHref({
            allCareers: true,
            careerId: null,
            year: null,
            kind: 'finales',
          }).split('?')[1],
        ),
      ),
    ).toEqual({ allCareers: true, careerId: null, year: null, kind: 'finales' });
  });
});
