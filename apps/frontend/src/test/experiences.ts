import type { SubjectExperiencesSummary } from '@/lib/experiences-client';

/** Frozen synthetic summary for 06 · Análisis Matemático II (34 reviews, 24 exams). */
export const summaryFixture = {
  subject: {
    id: '50000000-0000-4000-8000-000000000001',
    code: '06',
    name: 'Análisis Matemático II',
  },
  reviews: {
    count: 34,
    recommendation: { average: 3.9, count: 34 },
    results: {
      answered: 29,
      unanswered: 5,
      promo: 11,
      regular: 13,
      libre: 5,
      percents: { promo: 38, regular: 45, libre: 17 },
    },
    difficulty: {
      answered: 31,
      unanswered: 3,
      counts: { MUY_BAJA: 1, BAJA: 4, MEDIA: 9, ALTA: 13, MUY_ALTA: 4 },
      top: 'ALTA',
    },
    promotionGrade: { average: 8.2, informed: 9, promoted: 11 },
  },
  exams: {
    count: 24,
    outcomes: {
      answered: 22,
      undeclared: 2,
      aprobado: 15,
      desaprobado: 7,
      percent: 68,
    },
    formats: { counts: { ESCRITO: 14, ORAL: 6, MIXTO: 4 }, top: 'ESCRITO' },
    theory: { average: 3.4, count: 9 },
    practice: { average: 2.8, count: 8 },
    topSession: {
      session: 'DICIEMBRE',
      count: 9,
      boardSize: { median: 3, count: 4 },
      duration: { median: 180, count: 3 },
    },
    grade: { average: 6.4, count: 15 },
    preparation: {
      leadDays: { median: 21, count: 5 },
      dailyMinutes: { median: 60, count: 3 },
    },
    topics: [
      { topic: 'Integrales dobles', count: 6 },
      { topic: 'Teorema de Green', count: 4 },
      { topic: 'Series de Fourier', count: 2 },
    ],
  },
} as SubjectExperiencesSummary;
