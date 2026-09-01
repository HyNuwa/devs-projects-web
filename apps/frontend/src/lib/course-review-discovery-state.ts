import {
  communityDifficulties,
  courseAttempts,
  courseReviewDiscoverySorts,
  type CourseReviewDiscoveryQuery,
} from '@/lib/discovery-client';

const minimumAcademicYear = 1900;
const maximumAcademicYear = new Date().getUTCFullYear() + 1;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CourseReviewDiscoveryState = Omit<CourseReviewDiscoveryQuery, 'page' | 'sort'> & {
  page: number;
  sort: (typeof courseReviewDiscoverySorts)[number];
};

function optionalUuid(value: string | null) {
  return value && uuidPattern.test(value) ? value : undefined;
}

function optionalAcademicYear(value: string | null) {
  const year = Number(value);
  return Number.isInteger(year) && year >= minimumAcademicYear && year <= maximumAcademicYear
    ? year
    : undefined;
}

function optionalEnum<TValue extends string>(value: string | null, values: readonly TValue[]) {
  return value && values.includes(value as TValue) ? (value as TValue) : undefined;
}

function positivePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/** Parses only the public review-list contract, dropping unknown or malformed values. */
export function parseCourseReviewDiscoveryState(
  searchParams: URLSearchParams,
): CourseReviewDiscoveryState {
  return {
    academicYear: optionalAcademicYear(searchParams.get('academicYear')),
    attempt: optionalEnum(searchParams.get('attempt'), courseAttempts),
    difficulty: optionalEnum(searchParams.get('difficulty'), communityDifficulties),
    page: positivePage(searchParams.get('page')),
    professorId: optionalUuid(searchParams.get('professorId')),
    sort: optionalEnum(searchParams.get('sort'), courseReviewDiscoverySorts) ?? 'RECENT',
    subjectId: optionalUuid(searchParams.get('subjectId')),
  };
}

/** Generates a shareable canonical URL while omitting default review-list state. */
export function toCourseReviewDiscoveryHref(state: CourseReviewDiscoveryState) {
  const searchParams = new URLSearchParams();

  if (state.subjectId) searchParams.set('subjectId', state.subjectId);
  if (state.academicYear) searchParams.set('academicYear', String(state.academicYear));
  if (state.professorId) searchParams.set('professorId', state.professorId);
  if (state.difficulty) searchParams.set('difficulty', state.difficulty);
  if (state.attempt) searchParams.set('attempt', state.attempt);
  if (state.sort !== 'RECENT') searchParams.set('sort', state.sort);
  if (state.page > 1) searchParams.set('page', String(state.page));

  const query = searchParams.toString();
  return query ? `/resenas?${query}` : '/resenas';
}
