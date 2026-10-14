import { permanentRedirect } from 'next/navigation';

/** One level of the browsing pages (openspec academic-structure/browsing). */
export type BrowseLevel = { id: string; name: string; shortName: string; slug: string };

export type UniversityCard = BrowseLevel & { facultyCount: number; materialCount: number };
export type FacultyCard = BrowseLevel & { careerCount: number; materialCount: number };
export type CareerCard = {
  id: string;
  name: string;
  code: string;
  slug: string;
  subjectCount: number;
  materialCount: number;
};

export type UniversityPage = { university: BrowseLevel; faculties: FacultyCard[] };
export type FacultyPage = { university: BrowseLevel; faculty: BrowseLevel; careers: CareerCard[] };
export type CareerSubject = {
  id: string;
  code: string | null;
  name: string;
  year: number;
  /** 0 = anual, 1 and 2 = cuatrimestres. */
  semester: number;
  credits: number | null;
  materialCount: number;
};
export type CareerPage = {
  university: BrowseLevel;
  faculty: BrowseLevel;
  career: {
    id: string;
    name: string;
    code: string;
    slug: string;
    planUrl: string | null;
    years: number | null;
    credits: number;
    subjectCount: number;
  };
  subjects: CareerSubject[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/** Browsing pages refresh their counts every few minutes. */
const REVALIDATE_SECONDS = 300;

/**
 * Reads one browsing level on the server. `null` means the slug names nothing,
 * so the page answers not-found; any other failure throws to the error page.
 */
async function browse<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_URL}/institutions/browse${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`No se pudo leer el catálogo (${response.status}).`);
  const body = (await response.json()) as T | { redirect: string };
  // An old slug of a renamed universidad, facultad or carrera (catalog-editing).
  if (isRedirect(body)) permanentRedirect(body.redirect);
  return body;
}

const isRedirect = (body: unknown): body is { redirect: string } =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as { redirect?: unknown }).redirect === 'string';

/**
 * The materia page's server check: an old code of a renamed materia redirects
 * permanently to the current one, keeping `query` (like `carrera=ii`).
 */
export async function redirectOldSubjectCode(code: string, query: string) {
  let target: string | null = null;
  try {
    const response = await fetch(`${API_URL}/subjects/${encodeURIComponent(code)}/current`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (response.ok) {
      const body = (await response.json()) as { redirect?: unknown };
      if (typeof body.redirect === 'string') target = body.redirect;
    }
  } catch {
    // The check is a convenience: the page renders without it.
  }
  if (target) permanentRedirect(query ? `${target}?${query}` : target);
}

const segment = (value: string) => `/${encodeURIComponent(value.toLowerCase())}`;

export function getUniversities() {
  return browse<UniversityCard[]>('');
}

export function getUniversityPage(uni: string) {
  return browse<UniversityPage>(segment(uni));
}

export function getFacultyPage(uni: string, fac: string) {
  return browse<FacultyPage>(segment(uni) + segment(fac));
}

export function getCareerPage(uni: string, fac: string, career: string) {
  return browse<CareerPage>(segment(uni) + segment(fac) + segment(career));
}

/** Browsing addresses: lowercase short names and the carrera code. */
export const browsePath = {
  universities: () => '/universidades',
  university: (uni: string) => `/universidades/${uni.toLowerCase()}`,
  faculty: (uni: string, fac: string) => `/universidades/${uni.toLowerCase()}/${fac.toLowerCase()}`,
  career: (uni: string, fac: string, code: string) =>
    `/universidades/${uni.toLowerCase()}/${fac.toLowerCase()}/${code.toLowerCase()}`,
};
