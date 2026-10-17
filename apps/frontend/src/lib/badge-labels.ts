/** Shared insignia labels and art paths for «Tu progreso» and the perfil público. */
export type BadgeTier = 'BRONCE' | 'PLATA' | 'ORO';

export const TIER_LABEL: Record<BadgeTier, string> = {
  BRONCE: 'Bronce',
  PLATA: 'Plata',
  ORO: 'Oro',
};

export const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** «Edición 2025» for a year, «Edición jul 2026» for an exam period. */
export function editionLabel(edition: number) {
  if (edition === 0) return null;
  if (edition > 9999) {
    return `Edición ${MONTHS[(edition % 100) - 1]} ${Math.floor(edition / 100)}`;
  }
  return `Edición ${edition}`;
}

export const gemPath = (slug: string, extension: 'svg' | 'lottie') =>
  `/assets/insignias/gema/${slug}.${extension}`;
