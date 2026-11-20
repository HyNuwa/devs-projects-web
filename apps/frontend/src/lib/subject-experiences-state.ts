import {
  courseAttempts,
  courseConditions,
  courseReviewDiscoverySorts,
  courseShifts,
  examFormats,
  examOutcomes,
  examSessions,
} from '@/lib/discovery-client';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const minimumAcademicYear = 1900;
const maximumAcademicYear = new Date().getUTCFullYear() + 1;

export type SubjectExperiencesTab = 'resenas' | 'finales';
export type ReviewSort = (typeof courseReviewDiscoverySorts)[number];

export type SubjectReviewFilters = {
  academicYear?: number;
  shift?: (typeof courseShifts)[number];
  professorId?: string;
  attempt?: (typeof courseAttempts)[number];
  condition?: (typeof courseConditions)[number];
  sort: ReviewSort;
};

export type SubjectExamFilters = {
  session?: (typeof examSessions)[number];
  year?: number;
  format?: (typeof examFormats)[number];
  professorId?: string;
  outcome?: (typeof examOutcomes)[number];
};

/** The shareable state of a materia's experiencias page. */
export type SubjectExperiencesState = {
  tab: SubjectExperiencesTab;
  /** Breadcrumb carrera (code or id) carried from the trail. */
  careerId: string | null;
  reviews: SubjectReviewFilters;
  exams: SubjectExamFilters;
};

function optionalEnum<TValue extends string>(value: string | null, values: readonly TValue[]) {
  return value && values.includes(value as TValue) ? (value as TValue) : undefined;
}

function optionalUuid(value: string | null) {
  return value && uuidPattern.test(value) ? value : undefined;
}

function optionalYear(value: string | null) {
  const year = Number(value);
  return Number.isInteger(year) && year >= minimumAcademicYear && year <= maximumAcademicYear
    ? year
    : undefined;
}

function optionalCareer(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Parses the namespaced URL state; malformed values drop to defaults and
 * page/limit/subjectId or unknown keys are ignored.
 */
export function parseSubjectExperiencesState(
  searchParams: URLSearchParams,
): SubjectExperiencesState {
  return {
    tab: searchParams.get('tab') === 'finales' ? 'finales' : 'resenas',
    careerId: optionalCareer(searchParams.get('carrera')),
    reviews: {
      academicYear: optionalYear(searchParams.get('resenas.academicYear')),
      shift: optionalEnum(searchParams.get('resenas.shift'), courseShifts),
      professorId: optionalUuid(searchParams.get('resenas.professorId')),
      attempt: optionalEnum(searchParams.get('resenas.attempt'), courseAttempts),
      condition: optionalEnum(searchParams.get('resenas.condition'), courseConditions),
      sort: optionalEnum(searchParams.get('resenas.sort'), courseReviewDiscoverySorts) ?? 'RECENT',
    },
    exams: {
      session: optionalEnum(searchParams.get('finales.session'), examSessions),
      year: optionalYear(searchParams.get('finales.year')),
      format: optionalEnum(searchParams.get('finales.format'), examFormats),
      professorId: optionalUuid(searchParams.get('finales.professorId')),
      outcome: optionalEnum(searchParams.get('finales.outcome'), examOutcomes),
    },
  };
}

/**
 * Serializes only non-default state; `tab=resenas` and `sort=RECENT` are the
 * implicit defaults and no page ever enters the URL.
 */
export function toSubjectExperiencesHref(code: string, state: SubjectExperiencesState): string {
  const searchParams = new URLSearchParams();
  if (state.tab === 'finales') searchParams.set('tab', 'finales');
  if (state.careerId) searchParams.set('carrera', state.careerId);

  const { reviews, exams } = state;
  if (reviews.academicYear) {
    searchParams.set('resenas.academicYear', String(reviews.academicYear));
  }
  if (reviews.shift) searchParams.set('resenas.shift', reviews.shift);
  if (reviews.professorId) searchParams.set('resenas.professorId', reviews.professorId);
  if (reviews.attempt) searchParams.set('resenas.attempt', reviews.attempt);
  if (reviews.condition) searchParams.set('resenas.condition', reviews.condition);
  if (reviews.sort !== 'RECENT') searchParams.set('resenas.sort', reviews.sort);

  if (exams.session) searchParams.set('finales.session', exams.session);
  if (exams.year) searchParams.set('finales.year', String(exams.year));
  if (exams.format) searchParams.set('finales.format', exams.format);
  if (exams.professorId) searchParams.set('finales.professorId', exams.professorId);
  if (exams.outcome) searchParams.set('finales.outcome', exams.outcome);

  const query = searchParams.toString();
  const path = `/experiencias/${encodeURIComponent(code)}`;
  return query ? `${path}?${query}` : path;
}
