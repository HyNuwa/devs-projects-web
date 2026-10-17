import { describe, expect, it } from 'vitest';

import {
  courseReviewRelatedSchema,
  discoveryCourseReviewSchema,
  discoveryExamExperienceSchema,
  examExperienceRelatedSchema,
  experiencesOverviewSchema,
  serializeExperiencesOverviewQuery,
  subjectExperiencesSummarySchema,
} from './experiences-client';

const review = {
  id: 'review-1',
  subject: {
    id: 'subject-1',
    code: 'S2-14',
    name: 'Algoritmos',
    href: '/materias/S2-14',
  },
  author: { username: 'Anónimo' },
  academicYear: 2025,
  shift: 'TARDE',
  condition: 'PROMO',
  attempt: 'PRIMERA_CURSADA',
  difficulty: 'ALTA',
  recommendation: 4,
  professor: null,
  professorName: 'A. Gómez',
  excerpt: 'Largos pero justos.',
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-01T12:00:00.000Z',
};

const exam = {
  id: 'exam-1',
  subject: {
    id: 'subject-1',
    code: 'S2-14',
    name: 'Algoritmos',
    href: '/materias/S2-14',
  },
  author: {
    id: 'user-1',
    username: 'luciana',
    avatarUrl: 'https://cdn.example.com/pic.png',
    avatarCat: 'crema',
  },
  year: 2025,
  session: 'NO_RECUERDO',
  format: 'ESCRITO',
  difficulty: 'ALTA',
  outcome: 'APROBADO',
  grade: 7,
  excerpt: 'Tres problemas y una pregunta de teoría.',
  createdAt: '2026-08-02T12:00:00.000Z',
  updatedAt: '2026-08-02T12:00:00.000Z',
};

describe('experiences-client schemas', () => {
  it('parses the overview fixture', () => {
    const overview = {
      scope: { facultyId: 'fac-1', careerId: null, year: null, kind: null },
      mostCommented: {
        window: 'LAST_120_DAYS',
        items: [
          {
            subject: { id: 'subject-1', code: 'S2-14', name: 'Algoritmos' },
            placement: {
              careerId: 'career-1',
              careerName: 'Ing. Informática',
              year: 2,
              semester: 1,
            },
            recentCount: 8,
            total: 15,
            latestAt: '2026-08-02T12:00:00.000Z',
            promotion: { percent: 60, promoted: 3, answered: 5 },
            approval: { percent: null, approved: 1, answered: 2 },
            topDifficulty: 'ALTA',
          },
          {
            subject: { id: 'subject-2', code: null, name: 'Electiva' },
            placement: null,
            recentCount: 3,
            total: 4,
            latestAt: null,
            promotion: { percent: null, promoted: 0, answered: 0 },
            approval: { percent: null, approved: 0, answered: 0 },
            topDifficulty: null,
          },
        ],
      },
      recent: [
        { kind: 'review', review },
        { kind: 'exam', exam },
      ],
    };

    const parsed = experiencesOverviewSchema.parse(overview);
    expect(parsed.mostCommented.items[0].placement?.careerName).toBe('Ing. Informática');
    expect(parsed.recent[1].kind).toBe('exam');
  });

  it('parses the summary fixture', () => {
    const summary = {
      subject: { id: 'subject-1', code: 'S2-14', name: 'Algoritmos' },
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
        formats: { counts: { ESCRITO: 4, ORAL: 2, MIXTO: 1 }, top: 'ESCRITO' },
        theory: { average: 3.4, count: 9 },
        practice: { average: 2.8, count: 8 },
        topSession: { session: 'DICIEMBRE', count: 9 },
        grade: { average: 6.4, count: 15 },
      },
    };

    const parsed = subjectExperiencesSummarySchema.parse(summary);
    expect(parsed.reviews.results.percents?.regular).toBe(45);
    expect(parsed.exams.topSession?.session).toBe('DICIEMBRE');
  });

  it('parses the related fixtures', () => {
    expect(
      courseReviewRelatedSchema.parse({
        sharedContext: { professor: { name: 'A. Gómez' }, shift: 'TARDE' },
        items: [review],
      }).items[0].id,
    ).toBe('review-1');
    expect(
      courseReviewRelatedSchema.parse({ sharedContext: null, items: [] }).sharedContext,
    ).toBeNull();
    expect(
      examExperienceRelatedSchema.parse({
        sharedContext: { format: 'ESCRITO' },
        items: [exam],
      }).sharedContext.format,
    ).toBe('ESCRITO');
  });

  it('rejects malformed entries', () => {
    expect(discoveryCourseReviewSchema.safeParse({ ...review, shift: 'MADRUGADA' }).success).toBe(
      false,
    );
    expect(discoveryExamExperienceSchema.safeParse({ ...exam, grade: 12 }).success).toBe(false);
    expect(experiencesOverviewSchema.safeParse({ scope: null }).success).toBe(false);
  });

  it('serializes the overview query', () => {
    expect(
      serializeExperiencesOverviewQuery({
        facultyId: '20000000-0000-4000-8000-000000000001',
        careerId: '20000000-0000-4000-8000-000000000002',
        year: 3,
        kind: 'exams',
      }).toString(),
    ).toBe(
      'facultyId=20000000-0000-4000-8000-000000000001&careerId=20000000-0000-4000-8000-000000000002&year=3&kind=exams',
    );
    expect(serializeExperiencesOverviewQuery({}).toString()).toBe('');
    expect(() => serializeExperiencesOverviewQuery({ kind: 'todo' } as never)).toThrow();
  });
});
