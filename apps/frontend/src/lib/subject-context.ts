import type { SubjectHub } from '@/types/subject';

export type SubjectPlacement = SubjectHub['studyPlans'][number];

/** The viewer's declared carrera (a «cursando» entry of the Ubicación store). */
export type DeclaredCareer = { careerId: string; declaredAt: string };

/** Sorts placements by carrera name in Spanish (a fallback for the trail). */
export const byCareerName = (a: SubjectPlacement, b: SubjectPlacement) =>
  a.studyPlan.career.name.localeCompare(b.studyPlan.career.name, 'es', {
    sensitivity: 'base',
  });

/**
 * The carrera of the breadcrumb (openspec academic-structure/browsing, «Materia
 * breadcrumb»): the one the link named — by code (`carrera=ii`) or id
 * (`carrera=<uuid>`) — else the first carrera the viewer declared that includes
 * the materia, else the first by name.
 */
export function trailPlacement(
  placements: readonly SubjectPlacement[],
  named: string | null,
  declared: readonly DeclaredCareer[],
): SubjectPlacement | null {
  const sorted = [...placements].sort(byCareerName);
  const fromLink = named
    ? sorted.find(
        (p) =>
          p.studyPlan.career.code.toLowerCase() === named.toLowerCase() ||
          p.studyPlan.career.id.toLowerCase() === named.toLowerCase(),
      )
    : undefined;
  if (fromLink) return fromLink;
  const mine = [...declared]
    .sort((a, b) => a.declaredAt.localeCompare(b.declaredAt))
    .map((entry) => sorted.find((p) => p.studyPlan.career.id === entry.careerId))
    .find(Boolean);
  return mine ?? sorted[0] ?? null;
}

/**
 * The shared placement eyebrow: «1° año · 2° cuatrimestre», «Anual» for
 * semester 0, «Optativa» for a null year; an unknown semester is omitted.
 */
export function placementEyebrow(placement: SubjectPlacement | null): string | null {
  if (!placement) return null;
  if (placement.year === null) return 'Optativa';
  const parts = [`${placement.year}° año`];
  if (placement.semester === 0) return `${parts[0]} · Anual`;
  if (placement.semester === 1 || placement.semester === 2) {
    parts.push(`${placement.semester}° cuatrimestre`);
  }
  return parts.join(' · ');
}
