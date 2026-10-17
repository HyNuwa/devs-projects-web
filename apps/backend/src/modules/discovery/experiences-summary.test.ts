import { describe, expect, it } from 'vitest';

import {
  approvalSummary,
  MIN_FOR_AVERAGE,
  MIN_FOR_GRADE,
  MIN_FOR_PERCENT,
  MIN_FOR_TOP,
  promotionSummary,
  summarizeExams,
  summarizeReviews,
  topDifficulty,
  type GroupCount,
} from './experiences-summary';

const conditions = (
  entries: [string | null, number][],
): GroupCount<'PROMO' | 'REGULAR' | 'LIBRE' | 'PREFIERO_NO_RESPONDER'>[] =>
  entries.map(([value, count]) => ({
    value: value as
      'PROMO' | 'REGULAR' | 'LIBRE' | 'PREFIERO_NO_RESPONDER' | null,
    count,
  }));

const outcomes = (
  entries: [string | null, number][],
): GroupCount<'APROBADO' | 'DESAPROBADO' | 'PREFIERO_NO_DECIR'>[] =>
  entries.map(([value, count]) => ({
    value: value as 'APROBADO' | 'DESAPROBADO' | 'PREFIERO_NO_DECIR' | null,
    count,
  }));

const examsBase = {
  total: 0,
  outcomes: [] as ReturnType<typeof outcomes>,
  formats: [] as GroupCount<'ESCRITO' | 'ORAL' | 'MIXTO'>[],
  sessions: [] as GroupCount<
    | 'DICIEMBRE'
    | 'JULIO'
    | 'MARZO'
    | 'FEBRERO_MARZO'
    | 'ESPECIAL'
    | 'NO_RECUERDO'
  >[],
  theory: { average: null as number | null, count: 0 },
  practice: { average: null as number | null, count: 0 },
  grade: { average: null as number | null, count: 0 },
};

const reviewsBase = {
  total: 0,
  recommendationAverage: null as number | null,
  recommendationCount: 0,
  conditions: [] as ReturnType<typeof conditions>,
  difficulties: [] as GroupCount<
    'MUY_BAJA' | 'BAJA' | 'MEDIA' | 'ALTA' | 'MUY_ALTA'
  >[],
};

describe('experiences-summary thresholds', () => {
  it('exports the mínimo de muestra constants', () => {
    expect([
      MIN_FOR_PERCENT,
      MIN_FOR_TOP,
      MIN_FOR_AVERAGE,
      MIN_FOR_GRADE,
    ]).toEqual([5, 3, 3, 5]);
  });

  it('keeps result percents null under 5 answers and exposes them from 5', () => {
    const under = summarizeReviews({
      ...reviewsBase,
      total: 4,
      conditions: conditions([
        ['PROMO', 2],
        ['REGULAR', 1],
        ['LIBRE', 1],
      ]),
    });
    expect(under.results).toEqual({
      answered: 4,
      unanswered: 0,
      promo: 2,
      regular: 1,
      libre: 1,
      percents: null,
    });

    const enough = summarizeReviews({
      ...reviewsBase,
      total: 6,
      conditions: conditions([
        ['PROMO', 3],
        ['REGULAR', 1],
        ['LIBRE', 1],
        ['PREFIERO_NO_RESPONDER', 1],
      ]),
    });
    expect(enough.results).toEqual({
      answered: 5,
      unanswered: 1,
      promo: 3,
      regular: 1,
      libre: 1,
      percents: { promo: 60, regular: 20, libre: 20 },
    });
  });

  it('counts PREFIERO_NO_RESPONDER as unanswered in results', () => {
    const summary = summarizeReviews({
      ...reviewsBase,
      total: 3,
      conditions: conditions([
        ['PROMO', 1],
        ['PREFIERO_NO_RESPONDER', 2],
      ]),
    });
    expect(summary.results.answered).toBe(1);
    expect(summary.results.unanswered).toBe(2);
    expect(summary.results.percents).toBeNull();
  });

  it('keeps approval percent null under 5 and counts PREFIERO_NO_DECIR and null as undeclared', () => {
    const summary = summarizeExams({
      ...examsBase,
      total: 6,
      outcomes: outcomes([
        ['APROBADO', 2],
        ['DESAPROBADO', 2],
        ['PREFIERO_NO_DECIR', 1],
        [null, 1],
      ]),
    });
    expect(summary.outcomes).toEqual({
      answered: 4,
      undeclared: 2,
      aprobado: 2,
      desaprobado: 2,
      percent: null,
    });

    const enough = summarizeExams({
      ...examsBase,
      total: 7,
      outcomes: outcomes([
        ['APROBADO', 4],
        ['DESAPROBADO', 1],
        ['PREFIERO_NO_DECIR', 2],
      ]),
    });
    expect(enough.outcomes).toEqual({
      answered: 5,
      undeclared: 2,
      aprobado: 4,
      desaprobado: 1,
      percent: 80,
    });
  });

  it('keeps top difficulty null under 3 answers and breaks ties by enum order', () => {
    const under = summarizeReviews({
      ...reviewsBase,
      total: 2,
      difficulties: [
        { value: 'ALTA', count: 1 },
        { value: 'MUY_ALTA', count: 1 },
      ],
    });
    expect(under.difficulty.top).toBeNull();
    expect(under.difficulty.answered).toBe(2);
    expect(under.difficulty.unanswered).toBe(0);
    expect(under.difficulty.counts).toEqual({
      MUY_BAJA: 0,
      BAJA: 0,
      MEDIA: 0,
      ALTA: 1,
      MUY_ALTA: 1,
    });

    const tied = summarizeReviews({
      ...reviewsBase,
      total: 6,
      difficulties: [
        { value: 'MUY_ALTA', count: 2 },
        { value: 'ALTA', count: 2 },
        { value: null, count: 2 },
      ],
    });
    expect(tied.difficulty.answered).toBe(4);
    expect(tied.difficulty.unanswered).toBe(2);
    expect(tied.difficulty.top).toBe('ALTA');
  });

  it('keeps format top null under 3 and lets NO_RECUERDO never win the session', () => {
    const formats = (entries: [string | null, number][]) =>
      entries.map(([value, count]) => ({
        value: value as 'ESCRITO' | 'ORAL' | 'MIXTO' | null,
        count,
      }));
    const sessions = (entries: [string | null, number][]) =>
      entries.map(([value, count]) => ({
        value: value as
          | 'DICIEMBRE'
          | 'JULIO'
          | 'MARZO'
          | 'FEBRERO_MARZO'
          | 'ESPECIAL'
          | 'NO_RECUERDO'
          | null,
        count,
      }));

    const under = summarizeExams({
      ...examsBase,
      total: 2,
      formats: formats([
        ['ESCRITO', 1],
        ['ORAL', 1],
      ]),
    });
    expect(under.formats.top).toBeNull();

    const summary = summarizeExams({
      ...examsBase,
      total: 9,
      formats: formats([
        ['ORAL', 4],
        ['ESCRITO', 5],
      ]),
      sessions: sessions([
        ['NO_RECUERDO', 7],
        ['JULIO', 2],
      ]),
    });
    expect(summary.formats).toEqual({
      counts: { ESCRITO: 5, ORAL: 4, MIXTO: 0 },
      top: 'ESCRITO',
    });
    // NO_RECUERDO dominates but is not an answer: 2 remembered < 3, so no top.
    expect(summary.topSession).toBeNull();

    const remembered = summarizeExams({
      ...examsBase,
      total: 10,
      sessions: sessions([
        ['NO_RECUERDO', 6],
        ['DICIEMBRE', 2],
        ['JULIO', 2],
      ]),
    });
    expect(remembered.topSession).toEqual({ session: 'DICIEMBRE', count: 2 });
  });

  it('gates theory and practice averages at 3 answers and the grade at 5', () => {
    const summary = summarizeExams({
      ...examsBase,
      total: 5,
      theory: { average: 4, count: 2 },
      practice: { average: 3, count: 3 },
      grade: { average: 7, count: 4 },
    });
    expect(summary.theory).toEqual({ average: null, count: 2 });
    expect(summary.practice).toEqual({ average: 3, count: 3 });
    expect(summary.grade).toEqual({ average: null, count: 4 });

    const enough = summarizeExams({
      ...examsBase,
      total: 5,
      grade: { average: 7.24, count: 5 },
    });
    expect(enough.grade).toEqual({ average: 7.2, count: 5 });
  });

  it('shows the recomendación average from one review and rounds to one decimal', () => {
    const one = summarizeReviews({
      ...reviewsBase,
      total: 1,
      recommendationAverage: 4,
      recommendationCount: 1,
    });
    expect(one.recommendation).toEqual({ average: 4, count: 1 });

    const none = summarizeReviews({ ...reviewsBase });
    expect(none.recommendation).toEqual({ average: null, count: 0 });

    const rounded = summarizeReviews({
      ...reviewsBase,
      total: 3,
      recommendationAverage: 3.6666666667,
      recommendationCount: 3,
    });
    expect(rounded.recommendation.average).toBe(3.7);
  });

  it('summarizes promotion and approval for the overview cards', () => {
    expect(
      promotionSummary(
        conditions([
          ['PROMO', 2],
          ['REGULAR', 1],
          ['LIBRE', 1],
          ['PREFIERO_NO_RESPONDER', 3],
        ]),
      ),
    ).toEqual({ percent: null, promoted: 2, answered: 4 });

    expect(
      promotionSummary(
        conditions([
          ['PROMO', 4],
          ['REGULAR', 1],
        ]),
      ),
    ).toEqual({ percent: 80, promoted: 4, answered: 5 });

    expect(
      approvalSummary(
        outcomes([
          ['APROBADO', 3],
          ['DESAPROBADO', 2],
          ['PREFIERO_NO_DECIR', 4],
        ]),
      ),
    ).toEqual({ percent: 60, approved: 3, answered: 5 });
  });

  it('returns a merged top difficulty for overview cards under the same minimum', () => {
    expect(
      topDifficulty([
        { value: 'ALTA', count: 2 },
        { value: null, count: 5 },
      ]),
    ).toBeNull();
    expect(
      topDifficulty([
        { value: 'ALTA', count: 2 },
        { value: 'MEDIA', count: 1 },
        { value: null, count: 5 },
      ]),
    ).toBe('ALTA');
  });
});
