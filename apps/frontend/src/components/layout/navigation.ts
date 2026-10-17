import { BookOpen, House, MessagesSquare, Upload, type LucideIcon } from 'lucide-react';

export type DestinationId = 'inicio' | 'materias' | 'experiencias' | 'subir';

export type Destination = {
  id: DestinationId;
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Route patterns that make this destination current. `*` matches one segment,
   * `**` matches any remaining segments. When several destinations match, the most
   * specific pattern wins, so `/materias/<codigo>/resenar` belongs to Experiencias.
   */
  match: readonly string[];
};

// Menu order. Later changes append their own destination (Eventos, Clasificados)
// when the page exists; never list a destination without a working page.
export const primaryDestinations: readonly Destination[] = [
  { id: 'inicio', label: 'Inicio', href: '/', icon: House, match: ['/'] },
  {
    id: 'materias',
    label: 'Materias',
    href: '/materias',
    icon: BookOpen,
    match: ['/materias', '/materias/*', '/materiales', '/materiales/**'],
  },
  {
    id: 'experiencias',
    label: 'Experiencias',
    href: '/resenas',
    icon: MessagesSquare,
    match: [
      '/resenas',
      '/resenas/**',
      '/finales',
      '/finales/**',
      '/materias/*/resenar',
      '/materias/*/final',
    ],
  },
];

export const uploadDestination: Destination = {
  id: 'subir',
  label: 'Subir',
  href: '/materiales/nuevo',
  icon: Upload,
  match: ['/materiales/nuevo'],
};

const allDestinations = [...primaryDestinations, uploadDestination];

function segmentsOf(path: string) {
  return path.split('/').filter(Boolean);
}

/** Specificity of `pattern` against `path`, or -1 when it does not match. */
function matchScore(pattern: string, path: string[]) {
  const parts = segmentsOf(pattern);
  let score = 0;

  for (const [index, part] of parts.entries()) {
    if (part === '**') return index < path.length ? score : -1;
    if (index >= path.length) return -1;
    if (part === '*') score += 1;
    else if (part === path[index]) score += 2;
    else return -1;
  }

  return parts.length === path.length ? score : -1;
}

export function currentDestination(pathname: string): DestinationId | null {
  const path = segmentsOf(pathname);
  let best: { id: DestinationId; score: number } | null = null;

  for (const destination of allDestinations) {
    for (const pattern of destination.match) {
      const score = matchScore(pattern, path);
      if (score >= 0 && (best === null || score > best.score)) {
        best = { id: destination.id, score };
      }
    }
  }

  return best?.id ?? null;
}
