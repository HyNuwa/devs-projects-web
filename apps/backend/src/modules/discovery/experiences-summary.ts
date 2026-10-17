import {
  CommunityDifficulty,
  CourseCondition,
  ExamFormat,
  ExamOutcome,
  ExamSession,
} from '../../generated/prisma';

/**
 * Mínimo de muestra (openspec academic-community/experiences): below these
 * counts a figure is omitted (null) and the interface falls back to counts.
 * Percentages and the grade average need 5; most-chosen values and the
 * theory/practice averages need 3; the recomendación average shows from 1.
 */
export const MIN_FOR_PERCENT = 5;
export const MIN_FOR_TOP = 3;
export const MIN_FOR_AVERAGE = 3;
export const MIN_FOR_GRADE = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/** «Materias más comentadas» counts entries published in this window. */
export const MOST_COMMENTED_WINDOW_DAYS = 120;

/** A materia needs at least this many experiencias in the window to qualify. */
export const MIN_MOST_COMMENTED = 3;

export function mostCommentedSince(now: Date): Date {
  return new Date(now.getTime() - MOST_COMMENTED_WINDOW_DAYS * DAY_MS);
}

/** One groupBy bucket; `value: null` carries the undeclared rows. */
export type GroupCount<T extends string> = {
  value: T | null;
  count: number;
};

const DIFFICULTY_ORDER = [
  CommunityDifficulty.MUY_BAJA,
  CommunityDifficulty.BAJA,
  CommunityDifficulty.MEDIA,
  CommunityDifficulty.ALTA,
  CommunityDifficulty.MUY_ALTA,
] as const;

const FORMAT_ORDER = [
  ExamFormat.ESCRITO,
  ExamFormat.ORAL,
  ExamFormat.MIXTO,
] as const;

/** «No recuerdo» is not a mesa, so it never competes for the topSession. */
const REMEMBERED_SESSION_ORDER = [
  ExamSession.DICIEMBRE,
  ExamSession.JULIO,
  ExamSession.MARZO,
  ExamSession.FEBRERO_MARZO,
  ExamSession.ESPECIAL,
] as const;

function countsBy<T extends string>(
  groups: readonly GroupCount<T>[],
): Partial<Record<T, number>> {
  const counts: Partial<Record<T, number>> = {};
  for (const group of groups) {
    if (group.value !== null) {
      counts[group.value] = (counts[group.value] ?? 0) + group.count;
    }
  }
  return counts;
}

function zeroFilled<T extends string>(
  order: readonly T[],
  counts: Partial<Record<T, number>>,
): Record<T, number> {
  const filled = {} as Record<T, number>;
  for (const value of order) {
    filled[value] = counts[value] ?? 0;
  }
  return filled;
}

function sumOf<T extends string>(
  order: readonly T[],
  counts: Partial<Record<T, number>>,
): number {
  return order.reduce((sum, value) => sum + (counts[value] ?? 0), 0);
}

/** Whole-number percentage, e.g. 67 for «67%». */
function percentOf(part: number, total: number): number {
  return Math.round((part * 100) / total);
}

function roundToDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * The most-chosen value among the answered groups, or null when fewer than
 * MIN_FOR_TOP answered. Ties go to the first value in enum order.
 */
function topChoice<T extends string>(
  order: readonly T[],
  counts: Partial<Record<T, number>>,
): { value: T; count: number } | null {
  if (sumOf(order, counts) < MIN_FOR_TOP) return null;
  let best: { value: T; count: number } | null = null;
  for (const value of order) {
    const count = counts[value] ?? 0;
    if (count > 0 && (best === null || count > best.count)) {
      best = { value, count };
    }
  }
  return best;
}

function gatedAverage(
  aggregate: { average: number | null; count: number },
  minimum: number,
): { average: number | null; count: number } {
  return {
    average:
      aggregate.count >= minimum && aggregate.average !== null
        ? roundToDecimal(aggregate.average)
        : null,
    count: aggregate.count,
  };
}

export interface ReviewsSummary {
  count: number;
  recommendation: { average: number | null; count: number };
  results: {
    answered: number;
    unanswered: number;
    promo: number;
    regular: number;
    libre: number;
    percents: { promo: number; regular: number; libre: number } | null;
  };
  difficulty: {
    answered: number;
    unanswered: number;
    counts: Record<CommunityDifficulty, number>;
    top: CommunityDifficulty | null;
  };
}

export function summarizeReviews(input: {
  total: number;
  recommendationAverage: number | null;
  recommendationCount: number;
  conditions: readonly GroupCount<CourseCondition>[];
  difficulties: readonly GroupCount<CommunityDifficulty>[];
}): ReviewsSummary {
  const conditionCounts = countsBy(input.conditions);
  const promo = conditionCounts[CourseCondition.PROMO] ?? 0;
  const regular = conditionCounts[CourseCondition.REGULAR] ?? 0;
  const libre = conditionCounts[CourseCondition.LIBRE] ?? 0;
  const resultsAnswered = promo + regular + libre;

  const difficultyCounts = countsBy(input.difficulties);
  const difficultyAnswered = sumOf(DIFFICULTY_ORDER, difficultyCounts);

  return {
    count: input.total,
    recommendation: {
      // Recomendación shows from a single reseña, always with its count.
      average:
        input.recommendationCount >= 1 && input.recommendationAverage !== null
          ? roundToDecimal(input.recommendationAverage)
          : null,
      count: input.recommendationCount,
    },
    results: {
      answered: resultsAnswered,
      unanswered: input.total - resultsAnswered,
      promo,
      regular,
      libre,
      percents:
        resultsAnswered >= MIN_FOR_PERCENT
          ? {
              promo: percentOf(promo, resultsAnswered),
              regular: percentOf(regular, resultsAnswered),
              libre: percentOf(libre, resultsAnswered),
            }
          : null,
    },
    difficulty: {
      answered: difficultyAnswered,
      unanswered: input.total - difficultyAnswered,
      counts: zeroFilled(DIFFICULTY_ORDER, difficultyCounts),
      top: topChoice(DIFFICULTY_ORDER, difficultyCounts)?.value ?? null,
    },
  };
}

export interface ExamsSummary {
  count: number;
  outcomes: {
    answered: number;
    undeclared: number;
    aprobado: number;
    desaprobado: number;
    percent: number | null;
  };
  formats: {
    counts: Record<ExamFormat, number>;
    top: ExamFormat | null;
  };
  theory: { average: number | null; count: number };
  practice: { average: number | null; count: number };
  topSession: { session: ExamSession; count: number } | null;
  grade: { average: number | null; count: number };
}

export function summarizeExams(input: {
  total: number;
  outcomes: readonly GroupCount<ExamOutcome>[];
  formats: readonly GroupCount<ExamFormat>[];
  sessions: readonly GroupCount<ExamSession>[];
  theory: { average: number | null; count: number };
  practice: { average: number | null; count: number };
  grade: { average: number | null; count: number };
}): ExamsSummary {
  const outcomeCounts = countsBy(input.outcomes);
  const aprobado = outcomeCounts[ExamOutcome.APROBADO] ?? 0;
  const desaprobado = outcomeCounts[ExamOutcome.DESAPROBADO] ?? 0;
  const outcomesAnswered = aprobado + desaprobado;

  const formatCounts = countsBy(input.formats);
  const sessionCounts = countsBy(input.sessions);
  const sessionTop = topChoice(REMEMBERED_SESSION_ORDER, sessionCounts);

  return {
    count: input.total,
    outcomes: {
      answered: outcomesAnswered,
      undeclared: input.total - outcomesAnswered,
      aprobado,
      desaprobado,
      percent:
        outcomesAnswered >= MIN_FOR_PERCENT
          ? percentOf(aprobado, outcomesAnswered)
          : null,
    },
    formats: {
      counts: zeroFilled(FORMAT_ORDER, formatCounts),
      top: topChoice(FORMAT_ORDER, formatCounts)?.value ?? null,
    },
    theory: gatedAverage(input.theory, MIN_FOR_AVERAGE),
    practice: gatedAverage(input.practice, MIN_FOR_AVERAGE),
    topSession: sessionTop
      ? { session: sessionTop.value, count: sessionTop.count }
      : null,
    grade: gatedAverage(input.grade, MIN_FOR_GRADE),
  };
}

/** «% promocionó» for a most-commented card (reseñas with explicit resultado). */
export function promotionSummary(
  conditions: readonly GroupCount<CourseCondition>[],
): { percent: number | null; promoted: number; answered: number } {
  const counts = countsBy(conditions);
  const promoted = counts[CourseCondition.PROMO] ?? 0;
  const answered =
    promoted +
    (counts[CourseCondition.REGULAR] ?? 0) +
    (counts[CourseCondition.LIBRE] ?? 0);
  return {
    percent: answered >= MIN_FOR_PERCENT ? percentOf(promoted, answered) : null,
    promoted,
    answered,
  };
}

/** «aprobaron X de Y» for a most-commented card (finales with explicit outcome). */
export function approvalSummary(outcomes: readonly GroupCount<ExamOutcome>[]): {
  percent: number | null;
  approved: number;
  answered: number;
} {
  const counts = countsBy(outcomes);
  const approved = counts[ExamOutcome.APROBADO] ?? 0;
  const answered = approved + (counts[ExamOutcome.DESAPROBADO] ?? 0);
  return {
    percent: answered >= MIN_FOR_PERCENT ? percentOf(approved, answered) : null,
    approved,
    answered,
  };
}

/** The most-chosen dificultad across the entries in scope, or null under the minimum. */
export function topDifficulty(
  difficulties: readonly GroupCount<CommunityDifficulty>[],
): CommunityDifficulty | null {
  return topChoice(DIFFICULTY_ORDER, countsBy(difficulties))?.value ?? null;
}
