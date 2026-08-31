import { z } from 'zod';

import { materialResourceTypes } from '@/lib/discovery-client';
import type { MaterialResourceType } from '@/types/material';

const uuidSchema = z.string().uuid();
const resourceTypeSchema = z.enum(materialResourceTypes);

export type MaterialHierarchyRoute =
  | { kind: 'careers' }
  | { kind: 'years'; careerId: string }
  | { kind: 'subjects'; careerId: string; studyPlanId: string; year: number }
  | {
      kind: 'categories';
      careerId: string;
      studyPlanId: string;
      subjectId: string;
      year: number;
    }
  | {
      kind: 'files';
      careerId: string;
      resourceType: MaterialResourceType;
      studyPlanId: string;
      subjectId: string;
      year: number;
    }
  | { kind: 'invalid' };

function isUuid(value: string | undefined): value is string {
  return uuidSchema.safeParse(value).success;
}

function parseYear(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const year = Number(value);
  return Number.isSafeInteger(year) && year <= 50 ? year : null;
}

/** Parses only canonical hierarchy paths, so hand-edited URLs cannot alter API scope. */
export function parseMaterialHierarchyRoute(segments: readonly string[]): MaterialHierarchyRoute {
  if (segments.length === 0) {
    return { kind: 'careers' };
  }

  const [
    careersSegment,
    careerId,
    plansSegment,
    studyPlanId,
    yearsSegment,
    yearSegment,
    materiasSegment,
    subjectId,
    resourceType,
  ] = segments;
  const year = parseYear(yearSegment);

  if (segments.length === 2 && careersSegment === 'carreras' && isUuid(careerId)) {
    return { kind: 'years', careerId };
  }

  if (
    plansSegment !== 'planes' ||
    yearsSegment !== 'anios' ||
    careersSegment !== 'carreras' ||
    !isUuid(careerId) ||
    !isUuid(studyPlanId) ||
    !year
  ) {
    return { kind: 'invalid' };
  }

  if (segments.length === 6) {
    return { kind: 'subjects', careerId, studyPlanId, year };
  }

  if (materiasSegment !== 'materias' || !isUuid(subjectId)) {
    return { kind: 'invalid' };
  }

  if (segments.length === 8) {
    return { kind: 'categories', careerId, studyPlanId, subjectId, year };
  }

  const parsedResourceType = resourceTypeSchema.safeParse(resourceType);
  if (segments.length !== 9 || !parsedResourceType.success) {
    return { kind: 'invalid' };
  }

  return {
    kind: 'files',
    careerId,
    studyPlanId,
    subjectId,
    year,
    resourceType: parsedResourceType.data,
  };
}

export function materialHierarchyPath(
  route: Exclude<MaterialHierarchyRoute, { kind: 'invalid' }>,
): string {
  if (route.kind === 'careers') {
    return '/materiales';
  }

  const base = `/materiales/carreras/${encodeURIComponent(route.careerId)}`;
  if (route.kind === 'years') {
    return base;
  }

  const subjectBase = `${base}/planes/${encodeURIComponent(route.studyPlanId)}/anios/${route.year}`;
  if (route.kind === 'subjects') {
    return subjectBase;
  }

  const categoryBase = `${subjectBase}/materias/${encodeURIComponent(route.subjectId)}`;
  return route.kind === 'categories'
    ? categoryBase
    : `${categoryBase}/${encodeURIComponent(route.resourceType)}`;
}

export function toMaterialHierarchyHref(
  route: Exclude<MaterialHierarchyRoute, { kind: 'invalid' }>,
  query = '',
  selectedFileId?: string,
): string {
  const path = materialHierarchyPath(route);
  const normalizedQuery = query.trim().slice(0, 120);
  const normalizedFileId = selectedFileId?.trim();
  const params: string[] = [];

  if (normalizedQuery) params.push(`q=${encodeURIComponent(normalizedQuery)}`);
  if (normalizedFileId) params.push(`archivo=${encodeURIComponent(normalizedFileId)}`);

  const search = params.join('&');
  return search ? `${path}?${search}` : path;
}
