const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ExperiencesLandingKind = 'resenas' | 'finales';

export type ExperiencesLandingState = {
  careerId: string | null;
  /** Explicit «Todas las carreras» (`carrera=todas`); distinct from an implicit default. */
  allCareers: boolean;
  year: number | null;
  kind: ExperiencesLandingKind | null;
};

function optionalCareer(value: string | null) {
  return value && uuidPattern.test(value) ? value : null;
}

function optionalYear(value: string | null) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1 && year <= 10 ? year : null;
}

function optionalKind(value: string | null): ExperiencesLandingKind | null {
  return value === 'resenas' || value === 'finales' ? value : null;
}

/**
 * The landing's shareable context (openspec academic-community/experiences):
 * `carrera` id, `anio` 1–10 and `tipo` resenas|finales; anything else falls
 * back to the «todo» defaults.
 */
export function parseExperiencesLandingState(
  searchParams: URLSearchParams,
): ExperiencesLandingState {
  return {
    allCareers: searchParams.get('carrera') === 'todas',
    careerId: optionalCareer(searchParams.get('carrera')),
    year: optionalYear(searchParams.get('anio')),
    kind: optionalKind(searchParams.get('tipo')),
  };
}

/** Serializes only the non-default pieces of the landing context. */
export function toExperiencesLandingHref(state: ExperiencesLandingState): string {
  const searchParams = new URLSearchParams();
  if (state.allCareers) searchParams.set('carrera', 'todas');
  else if (state.careerId) searchParams.set('carrera', state.careerId);
  if (state.year) searchParams.set('anio', String(state.year));
  if (state.kind) searchParams.set('tipo', state.kind);
  const query = searchParams.toString();
  return query ? `/experiencias?${query}` : '/experiencias';
}
