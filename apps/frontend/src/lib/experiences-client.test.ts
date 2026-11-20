import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { summaryFixture } from '@/test/experiences';

import {
  courseReviewRelatedSchema,
  discoveryCourseReviewSchema,
  discoveryExamExperienceSchema,
  examExperienceRelatedSchema,
  experiencesOverviewSchema,
  getSubjectExamTopics,
  serializeExperiencesOverviewQuery,
  subjectExamTopicsSchema,
  subjectExperiencesSummarySchema,
} from './experiences-client';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }));

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
  promotionGrade: 9,
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
  difficultyTheory: 4,
  difficultyPractice: 3,
  boardSize: 3,
  durationMinutes: 180,
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
    const recentReview = parsed.recent[0];
    const recentExam = parsed.recent[1];
    expect(recentReview.kind === 'review' && recentReview.review.promotionGrade).toBe(9);
    expect(recentExam.kind === 'exam' && recentExam.exam).toMatchObject({
      boardSize: 3,
      difficultyPractice: 3,
      difficultyTheory: 4,
      durationMinutes: 180,
    });
  });

  it('parses a «Solo finales» overview card with theory and practice and no verbal dificultad', () => {
    const parsed = experiencesOverviewSchema.parse({
      scope: { facultyId: 'fac-1', careerId: null, year: null, kind: 'exams' },
      mostCommented: {
        window: 'LAST_120_DAYS',
        items: [
          {
            subject: { id: 'subject-1', code: 'S2-14', name: 'Algoritmos' },
            placement: null,
            recentCount: 8,
            total: 15,
            latestAt: '2026-08-02T12:00:00.000Z',
            promotion: { percent: null, promoted: 0, answered: 0 },
            approval: { percent: 60, approved: 3, answered: 5 },
            theory: { average: 3.4, count: 4 },
            practice: { average: null, count: 2 },
          },
        ],
      },
      recent: [],
    });

    const item = parsed.mostCommented.items[0];
    expect(item.theory).toEqual({ average: 3.4, count: 4 });
    expect(item.practice).toEqual({ average: null, count: 2 });
    expect(item.topDifficulty).toBeUndefined();
  });

  it('keeps a reseña without a declared nota de promoción valid', () => {
    expect(
      discoveryCourseReviewSchema.parse({ ...review, promotionGrade: null }).promotionGrade,
    ).toBeNull();
    expect(discoveryCourseReviewSchema.safeParse({ ...review, promotionGrade: 11 }).success).toBe(
      false,
    );
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
        formats: { counts: { ESCRITO: 4, ORAL: 2, MIXTO: 1 }, top: 'ESCRITO' },
        theory: { average: 3.4, count: 9 },
        practice: { average: 2.8, count: 8 },
        topSession: {
          session: 'DICIEMBRE',
          count: 9,
          boardSize: { median: 3, count: 4 },
          duration: { median: null, count: 2 },
        },
        grade: { average: 6.4, count: 15 },
        preparation: {
          leadDays: { median: 21, count: 5 },
          dailyMinutes: { median: 60, count: 3 },
        },
        topics: [
          { topic: 'Integrales dobles', count: 6 },
          { topic: 'Teorema de Green', count: 2 },
        ],
      },
    };

    const parsed = subjectExperiencesSummarySchema.parse(summary);
    expect(parsed.reviews.results.percents?.regular).toBe(45);
    expect(parsed.exams.topSession?.session).toBe('DICIEMBRE');
    expect(parsed.reviews.promotionGrade).toEqual({ average: 8.2, informed: 9, promoted: 11 });
    expect(parsed.exams.topSession?.boardSize).toEqual({ median: 3, count: 4 });
    expect(parsed.exams.topSession?.duration).toEqual({ median: null, count: 2 });
    expect(parsed.exams.preparation.leadDays.median).toBe(21);
    expect(parsed.exams.topics.map(({ topic }) => topic)).toEqual([
      'Integrales dobles',
      'Teorema de Green',
    ]);
    expect(
      subjectExperiencesSummarySchema.safeParse({
        ...summary,
        exams: { ...summary.exams, preparation: undefined },
      }).success,
    ).toBe(false);
  });

  it('keeps the shared summary fixture in the API shape', () => {
    expect(subjectExperiencesSummarySchema.parse(summaryFixture)).toEqual(summaryFixture);
  });

  it('parses the exam topics fixture', () => {
    expect(
      subjectExamTopicsSchema.parse({ topics: [{ topic: 'Series de Fourier', count: 2 }] }).topics,
    ).toEqual([{ topic: 'Series de Fourier', count: 2 }]);
    expect(subjectExamTopicsSchema.safeParse({ topics: [{ topic: 'X' }] }).success).toBe(false);
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

describe('getSubjectExamTopics', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('reads the public topic suggestions of a materia', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { topics: [{ topic: 'Integrales dobles', count: 3 }] },
    });

    await expect(getSubjectExamTopics('AM 2')).resolves.toEqual({
      topics: [{ topic: 'Integrales dobles', count: 3 }],
    });
    expect(api.get).toHaveBeenCalledWith('/discovery/subjects/AM%202/exam-topics', {
      skipAuthRedirect: true,
    });
  });
});
