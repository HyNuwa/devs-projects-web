import { browsePath } from '@/lib/catalog-client';
import type { InstitutionTree } from '@/lib/study-plans-client';

type SubjectRef = { id: string; code: string | null };

export type LegacyLoaders = {
  catalog: () => Promise<InstitutionTree>;
  subjects: () => Promise<SubjectRef[]>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Where an address of the old career-first browser (`/materiales/carreras/…`)
 * lives now (openspec academic-resources/discovery, «Hierarchical materials
 * browsing» removed): its materia page, else its carrera page, else
 * Universidades.
 */
export async function legacyMaterialesTarget(
  segments: readonly string[],
  load: LegacyLoaders,
): Promise<string> {
  const fallback = browsePath.universities();
  const [kind, careerId] = segments;
  if (kind !== 'carreras' || !careerId || !UUID.test(careerId)) return fallback;
  const subjectIndex = segments.indexOf('materias');
  const subjectId = subjectIndex >= 0 ? segments[subjectIndex + 1] : undefined;

  try {
    const tree = await load.catalog();
    const career = tree
      .flatMap((university) =>
        university.faculties.flatMap((faculty) =>
          faculty.careers.map((entry) => ({ university, faculty, entry })),
        ),
      )
      .find(({ entry }) => entry.id === careerId);
    if (!career) return fallback;
    const carrera = career.entry.code.toLowerCase();

    if (subjectId && UUID.test(subjectId)) {
      const subject = (await load.subjects()).find((entry) => entry.id === subjectId);
      if (subject?.code) {
        return `/materias/${encodeURIComponent(subject.code)}?carrera=${carrera}`;
      }
    }
    return browsePath.career(career.university.shortName, career.faculty.shortName, carrera);
  } catch {
    return fallback;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return (await response.json()) as T;
}

/** The loaders the redirect route uses on the server. */
export const serverLegacyLoaders: LegacyLoaders = {
  catalog: () => get<InstitutionTree>('/institutions'),
  subjects: () => get<SubjectRef[]>('/subjects'),
};
