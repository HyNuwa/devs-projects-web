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
 * Percentages and the grade averages (nota promedio, nota de promoción) need
 * 5; most-chosen values, the theory/practice averages and the medians of
 * preparación, profesores en la mesa and tiempo need 3; a tema needs 2
 * finales; the recomendación average shows from 1.
 */
export const MIN_FOR_PERCENT = 5;
export const MIN_FOR_TOP = 3;
export const MIN_FOR_AVERAGE = 3;
export const MIN_FOR_GRADE = 5;
export const MIN_FOR_MEDIAN = 3;
export const MIN_TOPIC_FINALES = 2;

/** «Temas que más toman» in the materia summary. */
export const SUMMARY_TOPICS_LIMIT = 5;

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

/** One groupBy bucket of a numeric fact; `value: null` is undeclared. */
export type NumberCount = { value: number | null; count: number };

/** A tema mentioned by `count` different public finales. */
export type TopicCount = { topic: string; count: number };

export type MedianFigure = { median: number | null; count: number };

function declared(distribution: readonly NumberCount[]) {
  return distribution.filter(
    (bucket): bucket is { value: number; count: number } =>
      bucket.value !== null && bucket.count > 0,
  );
}

/**
 * The median of a value→count distribution. For an even count it takes the
 * lower middle value, so the median is always a value someone declared.
 */
export function medianOf(distribution: readonly NumberCount[]): number | null {
  const buckets = declared(distribution).sort((a, b) => a.value - b.value);
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  if (total === 0) return null;
  let position = Math.floor((total - 1) / 2);
  for (const bucket of buckets) {
    if (position < bucket.count) return bucket.value;
    position -= bucket.count;
  }
  return null;
}

export function gatedMedian(
  distribution: readonly NumberCount[],
  minimum = MIN_FOR_MEDIAN,
): MedianFigure {
  const count = declared(distribution).reduce((sum, b) => sum + b.count, 0);
  return {
    median: count >= minimum ? medianOf(distribution) : null,
    count,
  };
}

function averageOf(distribution: readonly NumberCount[]): {
  average: number | null;
  count: number;
} {
  const buckets = declared(distribution);
  const count = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const total = buckets.reduce((sum, b) => sum + b.value * b.count, 0);
  return { average: count === 0 ? null : total / count, count };
}

/**
 * «Unas N horas de estudio en total»: an estimate from the two preparation
 * facts of one final, never stored; null unless both were declared.
 */
export function estimatedStudyHours(
  leadDays: number | null,
  dailyMinutes: number | null,
): number | null {
  if (leadDays === null || dailyMinutes === null) return null;
  return Math.round((leadDays * dailyMinutes) / 60);
}

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
  /** «la informaron `informed` de `promoted`», with the average from 5. */
  promotionGrade: {
    average: number | null;
    informed: number;
    promoted: number;
  };
}

export function summarizeReviews(input: {
  total: number;
  recommendationAverage: number | null;
  recommendationCount: number;
  conditions: readonly GroupCount<CourseCondition>[];
  difficulties: readonly GroupCount<CommunityDifficulty>[];
  /** Notas de promoción of the reseñas with resultado Promoción. */
  promotionGrades: readonly NumberCount[];
}): ReviewsSummary {
  const conditionCounts = countsBy(input.conditions);
  const promo = conditionCounts[CourseCondition.PROMO] ?? 0;
  const regular = conditionCounts[CourseCondition.REGULAR] ?? 0;
  const libre = conditionCounts[CourseCondition.LIBRE] ?? 0;
  const resultsAnswered = promo + regular + libre;

  const difficultyCounts = countsBy(input.difficulties);
  const difficultyAnswered = sumOf(DIFFICULTY_ORDER, difficultyCounts);
  const promotionGrade = gatedAverage(
    averageOf(input.promotionGrades),
    MIN_FOR_GRADE,
  );

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
    promotionGrade: {
      average: promotionGrade.average,
      informed: promotionGrade.count,
      promoted: promo,
    },
  };
}

/** The mesa más comentada among remembered períodos, or null under 3. */
export function topSessionOf(
  sessions: readonly GroupCount<ExamSession>[],
): { session: ExamSession; count: number } | null {
  const top = topChoice(REMEMBERED_SESSION_ORDER, countsBy(sessions));
  return top ? { session: top.value, count: top.count } : null;
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
  /** The mesa más comentada with its profesores and tiempo medians. */
  topSession: {
    session: ExamSession;
    count: number;
    boardSize: MedianFigure;
    duration: MedianFigure;
  } | null;
  grade: { average: number | null; count: number };
  /** «Preparación típica»: lead time in days and time per day in minutes. */
  preparation: { leadDays: MedianFigure; dailyMinutes: MedianFigure };
  /** «Temas que más toman», most mentioned first. */
  topics: TopicCount[];
}

export function summarizeExams(input: {
  total: number;
  outcomes: readonly GroupCount<ExamOutcome>[];
  formats: readonly GroupCount<ExamFormat>[];
  sessions: readonly GroupCount<ExamSession>[];
  theory: { average: number | null; count: number };
  practice: { average: number | null; count: number };
  grade: { average: number | null; count: number };
  /** Profesores en la mesa of the finales of the mesa más comentada. */
  boardSizes: readonly NumberCount[];
  /** Tiempo del examen of the finales of the mesa más comentada. */
  durations: readonly NumberCount[];
  leadDays: readonly NumberCount[];
  dailyMinutes: readonly NumberCount[];
  /** Temas already found in at least MIN_TOPIC_FINALES public finales. */
  topics: readonly TopicCount[];
}): ExamsSummary {
  const outcomeCounts = countsBy(input.outcomes);
  const aprobado = outcomeCounts[ExamOutcome.APROBADO] ?? 0;
  const desaprobado = outcomeCounts[ExamOutcome.DESAPROBADO] ?? 0;
  const outcomesAnswered = aprobado + desaprobado;

  const formatCounts = countsBy(input.formats);
  const sessionTop = topSessionOf(input.sessions);

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
      ? {
          ...sessionTop,
          boardSize: gatedMedian(input.boardSizes),
          duration: gatedMedian(input.durations),
        }
      : null,
    grade: gatedAverage(input.grade, MIN_FOR_GRADE),
    preparation: {
      leadDays: gatedMedian(input.leadDays),
      dailyMinutes: gatedMedian(input.dailyMinutes),
    },
    topics: input.topics
      .filter((topic) => topic.count >= MIN_TOPIC_FINALES)
      .slice(0, SUMMARY_TOPICS_LIMIT),
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

/** A teoría or práctica average for a most-commented card, null under 3. */
export function difficultyAverage(aggregate: {
  average: number | null;
  count: number;
}): { average: number | null; count: number } {
  return gatedAverage(aggregate, MIN_FOR_AVERAGE);
}

/** The most-chosen dificultad across the entries in scope, or null under the minimum. */
export function topDifficulty(
  difficulties: readonly GroupCount<CommunityDifficulty>[],
): CommunityDifficulty | null {
  return topChoice(DIFFICULTY_ORDER, countsBy(difficulties))?.value ?? null;
}
