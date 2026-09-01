import { z } from 'zod';
import { api } from '@/lib/api';
import { getData } from '@/lib/apiHelpers';
import type {
  DiscoveryCourseReviewList,
  DiscoveryExamExperienceList,
  GroupedDiscoverySuggestions,
} from '@/types/discovery';
import type { Material, MaterialResourceType, Paginated } from '@/types/material';

export const materialResourceTypes = [
  'PARCIAL',
  'FINAL',
  'APUNTE',
  'RESUMEN',
  'TRABAJO_PRACTICO',
  'GUIA_EJERCICIOS',
  'OTRO',
] as const satisfies readonly MaterialResourceType[];

export const materialDiscoverySorts = ['RELEVANCE', 'RECENT'] as const;
export const courseReviewDiscoverySorts = ['RECENT', 'STARS_ASC', 'STARS_DESC'] as const;
export const communityDifficulties = ['MUY_BAJA', 'BAJA', 'MEDIA', 'ALTA', 'MUY_ALTA'] as const;
export const courseAttempts = [
  'PRIMERA_CURSADA',
  'PRIMERA_RECURSADA',
  'SEGUNDA_O_MAS_RECURSADAS',
  'PREFIERO_NO_RESPONDER',
] as const;
export const examSessions = [
  'DICIEMBRE',
  'JULIO',
  'MARZO',
  'FEBRERO_MARZO',
  'ESPECIAL',
  'NO_RECUERDO',
] as const;
export const examFormats = ['ESCRITO', 'ORAL', 'MIXTO'] as const;
export const examOutcomes = ['APROBADO', 'DESAPROBADO', 'PREFIERO_NO_DECIR'] as const;

const minimumAcademicYear = 1900;
const maximumAcademicYear = new Date().getUTCFullYear() + 1;

const nonEmptySearchText = z.string().trim().min(1);

/**
 * Query contract for the bounded public grouped-suggestions endpoint.
 * The strict schema makes accidental or unsupported query keys fail before
 * they can produce a misleading request.
 */
export const groupedSuggestionsQuerySchema = z
  .object({
    q: nonEmptySearchText.max(120),
    limit: z.number().int().min(1).max(10).optional(),
  })
  .strict();

/** Mirrors the public `GET /materials` filtering contract. */
export const materialDiscoveryQuerySchema = z
  .object({
    subjectId: z.string().uuid().optional(),
    search: nonEmptySearchText.optional(),
    resourceType: z.enum(materialResourceTypes).optional(),
    academicYear: z.number().int().min(minimumAcademicYear).max(maximumAcademicYear).optional(),
    professorId: z.string().uuid().optional(),
    sort: z.enum(materialDiscoverySorts).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .strict();

export const courseReviewDiscoveryQuerySchema = z
  .object({
    subjectId: z.string().uuid().optional(),
    academicYear: z.number().int().min(minimumAcademicYear).max(maximumAcademicYear).optional(),
    professorId: z.string().uuid().optional(),
    difficulty: z.enum(communityDifficulties).optional(),
    attempt: z.enum(courseAttempts).optional(),
    sort: z.enum(courseReviewDiscoverySorts).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .strict();

export const examExperienceDiscoveryQuerySchema = z
  .object({
    subjectId: z.string().uuid().optional(),
    year: z.number().int().min(minimumAcademicYear).max(maximumAcademicYear).optional(),
    session: z.enum(examSessions).optional(),
    professorId: z.string().uuid().optional(),
    format: z.enum(examFormats).optional(),
    outcome: z.enum(examOutcomes).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .strict();

export type GroupedSuggestionsQuery = z.input<typeof groupedSuggestionsQuerySchema>;
export type MaterialDiscoveryQuery = z.input<typeof materialDiscoveryQuerySchema>;
export type CourseReviewDiscoveryQuery = z.input<typeof courseReviewDiscoveryQuerySchema>;
export type ExamExperienceDiscoveryQuery = z.input<typeof examExperienceDiscoveryQuerySchema>;

function toSearchParams(
  entries: ReadonlyArray<readonly [string, string | number | undefined]>,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of entries) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  return params;
}

export function serializeGroupedSuggestionsQuery(input: GroupedSuggestionsQuery): URLSearchParams {
  const query = groupedSuggestionsQuerySchema.parse(input);

  return toSearchParams([
    ['q', query.q],
    ['limit', query.limit],
  ]);
}

export function serializeMaterialDiscoveryQuery(input: MaterialDiscoveryQuery): URLSearchParams {
  const query = materialDiscoveryQuerySchema.parse(input);

  return toSearchParams([
    ['subjectId', query.subjectId],
    ['search', query.search],
    ['resourceType', query.resourceType],
    ['academicYear', query.academicYear],
    ['professorId', query.professorId],
    ['sort', query.sort],
    ['page', query.page],
    ['limit', query.limit],
  ]);
}

export function serializeCourseReviewDiscoveryQuery(
  input: CourseReviewDiscoveryQuery,
): URLSearchParams {
  const query = courseReviewDiscoveryQuerySchema.parse(input);

  return toSearchParams([
    ['subjectId', query.subjectId],
    ['academicYear', query.academicYear],
    ['professorId', query.professorId],
    ['difficulty', query.difficulty],
    ['attempt', query.attempt],
    ['sort', query.sort],
    ['page', query.page],
    ['limit', query.limit],
  ]);
}

export function serializeExamExperienceDiscoveryQuery(
  input: ExamExperienceDiscoveryQuery,
): URLSearchParams {
  const query = examExperienceDiscoveryQuerySchema.parse(input);

  return toSearchParams([
    ['subjectId', query.subjectId],
    ['year', query.year],
    ['session', query.session],
    ['professorId', query.professorId],
    ['format', query.format],
    ['outcome', query.outcome],
    ['page', query.page],
    ['limit', query.limit],
  ]);
}

export async function getGroupedSuggestions(
  query: GroupedSuggestionsQuery,
): Promise<GroupedDiscoverySuggestions> {
  const response = await api.get<GroupedDiscoverySuggestions>('/discovery/suggestions', {
    params: serializeGroupedSuggestionsQuery(query),
  });

  return getData(response);
}

export async function getMaterialDiscovery(
  query: MaterialDiscoveryQuery,
): Promise<Paginated<Material>> {
  const response = await api.get<Paginated<Material>>('/materials', {
    params: serializeMaterialDiscoveryQuery(query),
  });

  return getData(response);
}

/** Reads the approved public projection used by the in-list preview dialog. */
export async function getPublicMaterial(id: string): Promise<Material> {
  const response = await api.get<Material>(`/materials/${encodeURIComponent(id)}`);

  return getData(response);
}

export async function getCourseReviewDiscovery(
  query: CourseReviewDiscoveryQuery,
): Promise<DiscoveryCourseReviewList> {
  const response = await api.get<DiscoveryCourseReviewList>('/discovery/course-reviews', {
    params: serializeCourseReviewDiscoveryQuery(query),
  });

  return getData(response);
}

export async function getExamExperienceDiscovery(
  query: ExamExperienceDiscoveryQuery,
): Promise<DiscoveryExamExperienceList> {
  const response = await api.get<DiscoveryExamExperienceList>('/discovery/exam-experiences', {
    params: serializeExamExperienceDiscoveryQuery(query),
  });

  return getData(response);
}
