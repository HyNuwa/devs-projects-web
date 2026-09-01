import {
  examFormats,
  examOutcomes,
  examSessions,
  type ExamExperienceDiscoveryQuery,
} from '@/lib/discovery-client';

const minimumAcademicYear = 1900;
const maximumAcademicYear = new Date().getUTCFullYear() + 1;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ExamExperienceDiscoveryState = Omit<ExamExperienceDiscoveryQuery, 'page'> & {
  page: number;
};

function optionalUuid(value: string | null) {
  return value && uuidPattern.test(value) ? value : undefined;
}

function optionalYear(value: string | null) {
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

/** Parses exactly the public final-experience listing contract. */
export function parseExamExperienceDiscoveryState(
  searchParams: URLSearchParams,
): ExamExperienceDiscoveryState {
  return {
    format: optionalEnum(searchParams.get('format'), examFormats),
    outcome: optionalEnum(searchParams.get('outcome'), examOutcomes),
    page: positivePage(searchParams.get('page')),
    professorId: optionalUuid(searchParams.get('professorId')),
    session: optionalEnum(searchParams.get('session'), examSessions),
    subjectId: optionalUuid(searchParams.get('subjectId')),
    year: optionalYear(searchParams.get('year')),
  };
}

/** Generates a compact, shareable public final-experience URL. */
export function toExamExperienceDiscoveryHref(state: ExamExperienceDiscoveryState) {
  const searchParams = new URLSearchParams();

  if (state.subjectId) searchParams.set('subjectId', state.subjectId);
  if (state.year) searchParams.set('year', String(state.year));
  if (state.session) searchParams.set('session', state.session);
  if (state.professorId) searchParams.set('professorId', state.professorId);
  if (state.format) searchParams.set('format', state.format);
  if (state.outcome) searchParams.set('outcome', state.outcome);
  if (state.page > 1) searchParams.set('page', String(state.page));

  const query = searchParams.toString();
  return query ? `/finales?${query}` : '/finales';
}
