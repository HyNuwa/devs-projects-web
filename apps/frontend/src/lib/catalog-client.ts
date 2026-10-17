import { permanentRedirect } from 'next/navigation';

import type { SubjectHub } from '@/types/subject';

import { api } from '@/lib/api';
import { getData } from '@/lib/apiHelpers';

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
  /** Highest placement year in the plan (null when optativa-only). */
  years: number | null;
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
/** A materia the carrera lists with no año or cuatrimestre. */
export type CareerOptativa = Omit<CareerSubject, 'year' | 'semester'>;
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
  optativas: CareerOptativa[];
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
 * The API reports a renamed materia as an alias pointing at `/materias/<code>`;
 * only that known target shape is remapped to the caller's prefix.
 */
function remapSubjectAlias(target: string, prefix: '/materias' | '/experiencias') {
  // Only the known one-segment alias shape; no nested/query/fragment/absolute.
  return /^\/materias\/[^/?#\s]+$/.test(target)
    ? `${prefix}/${target.slice('/materias/'.length)}`
    : null;
}

/**
 * The materia page's server check: an old code of a renamed materia redirects
 * permanently to the current one, keeping `query` (like `carrera=ii`).
 */
export async function redirectOldSubjectCode(
  code: string,
  query: string,
  prefix: '/materias' | '/experiencias' = '/materias',
) {
  let target: string | null = null;
  try {
    const response = await fetch(`${API_URL}/subjects/${encodeURIComponent(code)}/current`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (response.ok) {
      const body = (await response.json()) as { redirect?: unknown };
      if (typeof body.redirect === 'string') {
        target = remapSubjectAlias(body.redirect, prefix);
      }
    }
  } catch {
    // The check is a convenience: the page renders without it.
  }
  if (target) permanentRedirect(query ? `${target}?${query}` : target);
}

/**
 * The materia's public metadata for the server shell of a subject page
 * (`/materias` and `/experiencias` share it). A 404 resolves to `null`, any
 * other failure throws to the segment error UI. An API alias to the renamed
 * code redirects permanently under the requested prefix; unrelated alias
 * targets throw instead of being mistaken for metadata.
 */
export async function getSubjectPage(
  code: string,
  query: string = '',
  prefix: '/materias' | '/experiencias' = '/materias',
): Promise<SubjectHub | null> {
  const response = await fetch(`${API_URL}/subjects/${encodeURIComponent(code)}`, {
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`No se pudo leer la materia (${response.status}).`);
  const body = (await response.json()) as SubjectHub | { redirect: string };
  if (isRedirect(body)) {
    const target = remapSubjectAlias(body.redirect, prefix);
    if (!target) throw new Error('Alias de materia desconocido.');
    permanentRedirect(query ? `${target}?${query}` : target);
  }
  return body;
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

/**
 * Client-side facultad browse (openspec academic-community/experiences): the
 * landing reads the published carreras this way. A moved or unknown slug
 * resolves to `null` instead of redirecting.
 */
export async function getFacultyBrowse(uni: string, fac: string): Promise<FacultyPage | null> {
  const response = await api.get<FacultyPage | { redirect: string }>(
    `/institutions/browse${segment(uni)}${segment(fac)}`,
    { skipAuthRedirect: true },
  );
  const body = getData(response);
  return isRedirect(body) ? null : body;
}

/** Browsing addresses: lowercase short names and the carrera code. */
export const browsePath = {
  universities: () => '/universidades',
  university: (uni: string) => `/universidades/${uni.toLowerCase()}`,
  faculty: (uni: string, fac: string) => `/universidades/${uni.toLowerCase()}/${fac.toLowerCase()}`,
  career: (uni: string, fac: string, code: string) =>
    `/universidades/${uni.toLowerCase()}/${fac.toLowerCase()}/${code.toLowerCase()}`,
};
