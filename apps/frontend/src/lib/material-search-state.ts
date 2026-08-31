import { z } from 'zod';

import { materialDiscoverySorts, materialResourceTypes } from '@/lib/discovery-client';
import type { MaterialResourceType } from '@/types/material';

const minimumAcademicYear = 1900;
const maximumAcademicYear = new Date().getUTCFullYear() + 1;
const uuidSchema = z.string().uuid();

export type MaterialSearchSort = (typeof materialDiscoverySorts)[number];

export interface MaterialSearchState {
  q: string;
  subjectId?: string;
  resourceType?: MaterialResourceType;
  academicYear?: number;
  professorId?: string;
  sort: MaterialSearchSort;
  page: number;
  scope?: 'all';
}

function readFirst(source: URLSearchParams, key: string): string | undefined {
  return source.get(key) ?? undefined;
}

function parseUuid(value: string | undefined): string | undefined {
  return uuidSchema.safeParse(value).success ? value : undefined;
}

function parseInteger(
  value: string | undefined,
  minimum: number,
  maximum: number,
): number | undefined {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

function parseEnum<T extends readonly string[]>(
  value: string | undefined,
  values: T,
): T[number] | undefined {
  return values.includes(value ?? '') ? (value as T[number]) : undefined;
}

/**
 * The URL is the source of truth. Invalid public parameters are discarded rather
 * than forwarded to the API, so old or hand-edited links remain safe to open.
 */
export function parseMaterialSearchState(source: URLSearchParams): MaterialSearchState {
  const q = (readFirst(source, 'q') ?? '').trim().slice(0, 120);

  return {
    q,
    subjectId: parseUuid(readFirst(source, 'subjectId')),
    resourceType: parseEnum(readFirst(source, 'resourceType'), materialResourceTypes),
    academicYear: parseInteger(
      readFirst(source, 'academicYear'),
      minimumAcademicYear,
      maximumAcademicYear,
    ),
    professorId: parseUuid(readFirst(source, 'professorId')),
    sort: parseEnum(readFirst(source, 'sort'), materialDiscoverySorts) ?? 'RELEVANCE',
    page: parseInteger(readFirst(source, 'page'), 1, Number.MAX_SAFE_INTEGER) ?? 1,
    scope: readFirst(source, 'scope') === 'all' ? 'all' : undefined,
  };
}

export function serializeMaterialSearchState(state: MaterialSearchState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.q) params.set('q', state.q);
  if (state.subjectId) params.set('subjectId', state.subjectId);
  if (state.resourceType) params.set('resourceType', state.resourceType);
  if (state.academicYear) params.set('academicYear', String(state.academicYear));
  if (state.professorId) params.set('professorId', state.professorId);
  if (state.sort !== 'RELEVANCE') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', String(state.page));
  if (state.scope === 'all') params.set('scope', 'all');

  return params;
}

export function toMaterialSearchHref(state: MaterialSearchState): string {
  const params = serializeMaterialSearchState(state);
  const search = params.toString();

  return search ? `/buscar?${search}` : '/buscar';
}
