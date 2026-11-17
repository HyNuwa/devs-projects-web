import { describe, expect, it } from 'vitest';

import {
  estimateStudyHours,
  formatBoardSize,
  formatDailyStudy,
  formatExamDuration,
  formatLeadTime,
  formatMesa,
  formatPromotionGradeSummary,
  formatPreparation,
  formatResultWithGrade,
  formatStudyEstimate,
  formatTheoryPractice,
  formatTheoryPracticeAverages,
  formatTopSessionSentence,
  formatTypicalPreparation,
} from './format';

describe('experience display formatting', () => {
  it('reads a lead time in its largest whole unit', () => {
    expect(formatLeadTime(21)).toBe('3 semanas');
    expect(formatLeadTime(7)).toBe('1 semana');
    expect(formatLeadTime(60)).toBe('2 meses');
    expect(formatLeadTime(30)).toBe('1 mes');
    expect(formatLeadTime(5)).toBe('5 días');
    expect(formatLeadTime(1)).toBe('1 día');
  });

  it('reads the tiempo del examen in hours and minutes', () => {
    expect(formatExamDuration(180)).toBe('3 horas');
    expect(formatExamDuration(60)).toBe('1 hora');
    expect(formatExamDuration(90)).toBe('1 h 30 min');
    expect(formatExamDuration(45)).toBe('45 min');
  });

  it('reads the time per day compactly', () => {
    expect(formatDailyStudy(60)).toBe('1 h por día');
    expect(formatDailyStudy(90)).toBe('1 h 30 min por día');
    expect(formatDailyStudy(30)).toBe('30 min por día');
  });

  it('estimates the total study hours only with both preparation facts', () => {
    expect(estimateStudyHours(21, 60)).toBe(21);
    expect(estimateStudyHours(10, 90)).toBe(15);
    expect(estimateStudyHours(21, undefined)).toBeNull();
    expect(estimateStudyHours(null, 60)).toBeNull();
    expect(formatStudyEstimate(21)).toBe('Unas 21 horas de estudio en total');
    expect(formatStudyEstimate(1)).toBe('Una hora de estudio en total');
  });

  it('builds the preparation sentence from whichever facts exist', () => {
    expect(formatPreparation(21, 60)).toBe('Preparación: 3 semanas, 1 h por día');
    expect(formatPreparation(21, undefined)).toBe('Preparación: 3 semanas');
    expect(formatPreparation(undefined, 90)).toBe('Preparación: 1 h 30 min por día');
    expect(formatPreparation(undefined, undefined)).toBeNull();
  });

  it('builds the mesa sentence from whichever facts exist', () => {
    expect(formatBoardSize(3)).toBe('3 profesores');
    expect(formatBoardSize(1)).toBe('1 profesor');
    expect(formatMesa(3, 180)).toBe('Mesa de 3 profesores · 3 horas');
    expect(formatMesa(1, undefined)).toBe('Mesa de 1 profesor');
    expect(formatMesa(undefined, 45)).toBe('Tiempo del examen: 45 min');
    expect(formatMesa(undefined, undefined)).toBeNull();
  });

  it('reads teoría and práctica independently', () => {
    expect(formatTheoryPractice(4, 3)).toBe('Teoría 4/5 · Práctica 3/5');
    expect(formatTheoryPractice(4, undefined)).toBe('Teoría 4/5');
    expect(formatTheoryPractice(undefined, 2)).toBe('Práctica 2/5');
    expect(formatTheoryPractice(undefined, undefined)).toBeNull();
  });

  it('appends a declared grade to a result, including 0', () => {
    expect(formatResultWithGrade('Promoción', 9)).toBe('Promoción · 9');
    expect(formatResultWithGrade('Desaprobado', 0)).toBe('Desaprobado · 0');
    expect(formatResultWithGrade('Promoción', null)).toBe('Promoción');
    expect(formatResultWithGrade('Aprobado', undefined)).toBe('Aprobado');
  });
});

describe('materia summary sentences', () => {
  it('reads the nota de promoción with its average only from enough grades', () => {
    expect(formatPromotionGradeSummary({ average: 8.2, informed: 9, promoted: 11 })).toBe(
      'Nota de promoción · 8,2 / 10 promedio · la informaron 9 de 11',
    );
    expect(formatPromotionGradeSummary({ average: null, informed: 4, promoted: 6 })).toBe(
      'Nota de promoción · la informaron 4 de 6',
    );
    expect(formatPromotionGradeSummary({ average: null, informed: 0, promoted: 3 })).toBe(
      'Nota de promoción · la informaron 0 de 3',
    );
    expect(formatPromotionGradeSummary({ average: null, informed: 0, promoted: 0 })).toBeNull();
  });

  it('reads the mesa más comentada with whichever medians cleared their minimum', () => {
    const mesa = {
      boardSize: { median: 3, count: 4 },
      count: 9,
      duration: { median: 180, count: 3 },
      session: 'DICIEMBRE' as const,
    };
    expect(formatTopSessionSentence(mesa)).toBe(
      'La mesa más comentada es diciembre (9): suele haber 3 profesores y 3 horas',
    );
    expect(formatTopSessionSentence({ ...mesa, duration: { median: null, count: 2 } })).toBe(
      'La mesa más comentada es diciembre (9): suele haber 3 profesores',
    );
    expect(formatTopSessionSentence({ ...mesa, boardSize: { median: null, count: 1 } })).toBe(
      'La mesa más comentada es diciembre (9): suele durar 3 horas',
    );
    expect(
      formatTopSessionSentence({
        ...mesa,
        boardSize: { median: null, count: 1 },
        duration: { median: null, count: 0 },
      }),
    ).toBe('La mesa más comentada es diciembre (9)');
  });

  it('reads the preparación típica from the medians that cleared their minimum', () => {
    expect(
      formatTypicalPreparation({
        dailyMinutes: { median: 60, count: 3 },
        leadDays: { median: 21, count: 5 },
      }),
    ).toBe('3 semanas antes, 1 h por día');
    expect(
      formatTypicalPreparation({
        dailyMinutes: { median: null, count: 2 },
        leadDays: { median: 60, count: 3 },
      }),
    ).toBe('2 meses antes');
    expect(
      formatTypicalPreparation({
        dailyMinutes: { median: null, count: 0 },
        leadDays: { median: null, count: 0 },
      }),
    ).toBeNull();
  });
});

describe('«Solo finales» card averages', () => {
  it('reads teoría and práctica averages, each omitted below its minimum', () => {
    expect(
      formatTheoryPracticeAverages({ average: 3.4, count: 4 }, { average: 2.8, count: 3 }),
    ).toBe('Teoría 3,4 · Práctica 2,8');
    expect(
      formatTheoryPracticeAverages({ average: 4, count: 4 }, { average: null, count: 2 }),
    ).toBe('Teoría 4,0');
    expect(formatTheoryPracticeAverages(undefined, { average: 3, count: 3 })).toBe('Práctica 3,0');
    expect(formatTheoryPracticeAverages({ average: null, count: 1 }, undefined)).toBeNull();
  });
});
