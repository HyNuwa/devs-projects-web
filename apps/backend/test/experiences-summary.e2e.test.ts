import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createUser, type E2eUser } from './support/e2e-app';

/** Materia summary (openspec academic-community/experiences). */
describe('Experiencias: materia summary (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let author: E2eUser;
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toUpperCase();
  const code = `EXP-${tag}`;
  const otherCode = `EXP-O${tag}`;
  const richCode = `EXP-R${tag}`;
  const sparseCode = `EXP-S${tag}`;
  let subjectId: string;
  let otherSubjectId: string;
  let richSubjectId: string;
  let sparseSubjectId: string;
  const reviewIds: string[] = [];
  const examIds: string[] = [];

  const review = (subjectId: string, data: Record<string, unknown> = {}) =>
    prisma.courseReview
      .create({
        data: {
          userId: author.id,
          subjectId,
          recommendation: 4,
          ...data,
        },
        select: { id: true },
      })
      .then((r) => reviewIds.push(r.id));

  const exam = (subjectId: string, data: Record<string, unknown> = {}) =>
    prisma.examExperience
      .create({
        data: {
          userId: author.id,
          subjectId,
          year: 2025,
          format: 'ESCRITO',
          ...data,
        },
        select: { id: true },
      })
      .then((e) => examIds.push(e.id));

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    author = await createUser(prisma, 'USER');
    ({ id: subjectId } = await prisma.subject.create({
      data: {
        facultyId: '00000000-0000-4000-8000-00000000f001',
        code,
        name: `Materia resumen ${tag}`,
      },
      select: { id: true },
    }));
    ({ id: otherSubjectId } = await prisma.subject.create({
      data: {
        facultyId: '00000000-0000-4000-8000-00000000f001',
        code: otherCode,
        name: `Materia moderada ${tag}`,
      },
      select: { id: true },
    }));

    // Reseñas: 5 with an explicit resultado (3 promo, 2 regular) + 1 anonymous
    // that preferred not to answer; 5 declared a dificultad (3 ALTA, 2 MEDIA).
    await review(subjectId, {
      condition: 'PROMO',
      difficulty: 'ALTA',
      recommendation: 5,
    });
    await review(subjectId, {
      condition: 'PROMO',
      difficulty: 'ALTA',
      recommendation: 4,
    });
    await review(subjectId, {
      condition: 'PROMO',
      difficulty: 'MEDIA',
      recommendation: 4,
    });
    await review(subjectId, {
      condition: 'REGULAR',
      difficulty: 'MEDIA',
      recommendation: 3,
    });
    await review(subjectId, {
      condition: 'REGULAR',
      difficulty: null,
      recommendation: 5,
    });
    await review(subjectId, {
      condition: 'PREFIERO_NO_RESPONDER',
      difficulty: 'ALTA',
      recommendation: 4,
      isAnonymous: true,
    });

    // Finales: 5 with explicit outcome (3 aprobado, 2 desaprobado) carrying a
    // grade; a PREFIERO_NO_DECIR and an undeclared one — the schema keeps
    // grades off non-explicit outcomes, so those two carry none.
    await exam(subjectId, {
      outcome: 'APROBADO',
      grade: 8,
      format: 'ESCRITO',
      session: 'DICIEMBRE',
      difficultyTheory: 4,
      difficultyPractice: 3,
    });
    await exam(subjectId, {
      outcome: 'APROBADO',
      grade: 6,
      format: 'ORAL',
      session: 'DICIEMBRE',
      difficultyTheory: 3,
      difficultyPractice: 4,
    });
    await exam(subjectId, {
      outcome: 'DESAPROBADO',
      grade: 2,
      format: 'ESCRITO',
      session: 'JULIO',
      difficultyTheory: 5,
      difficultyPractice: 5,
    });
    await exam(subjectId, {
      outcome: 'APROBADO',
      grade: 7,
      format: 'MIXTO',
      session: 'NO_RECUERDO',
    });
    await exam(subjectId, {
      outcome: 'DESAPROBADO',
      grade: 4,
      format: 'ESCRITO',
      session: 'MARZO',
    });
    await exam(subjectId, {
      outcome: 'PREFIERO_NO_DECIR',
      format: 'ORAL',
      session: 'DICIEMBRE',
    });
    await exam(subjectId, {
      outcome: null,
      format: 'ESCRITO',
      session: 'NO_RECUERDO',
    });

    // A second materia whose entries are all out of public view except one.
    await review(otherSubjectId, { recommendation: 5 });
    await review(otherSubjectId, { publicationStatus: 'PENDING_REVIEW' });
    await review(otherSubjectId, {
      publicationStatus: 'HIDDEN',
      hiddenAt: new Date(Date.now() - 86_400_000),
    });
    await exam(otherSubjectId, { publicationStatus: 'REMOVED' });

    ({ id: richSubjectId } = await prisma.subject.create({
      data: {
        facultyId: '00000000-0000-4000-8000-00000000f001',
        code: richCode,
        name: `Materia hechos nuevos ${tag}`,
      },
      select: { id: true },
    }));
    ({ id: sparseSubjectId } = await prisma.subject.create({
      data: {
        facultyId: '00000000-0000-4000-8000-00000000f001',
        code: sparseCode,
        name: `Materia pocos hechos ${tag}`,
      },
      select: { id: true },
    }));

    // Rich materia: 7 reseñas with Promoción, 6 of them with a nota (7, 8, 8,
    // 9, 9, 10 → 8.5). A Regular one carrying a nota and a retired Promoción
    // one never count.
    for (const promotionGrade of [7, 8, 8, 9, 9, 10, null]) {
      await review(richSubjectId, { condition: 'PROMO', promotionGrade });
    }
    await review(richSubjectId, { condition: 'REGULAR', promotionGrade: 2 });
    await review(richSubjectId, {
      condition: 'PROMO',
      promotionGrade: 1,
      publicationStatus: 'REMOVED',
    });

    // Rich finales: diciembre (4 public) is the mesa más comentada; julio's
    // professors and times would move both medians if they were counted.
    await exam(richSubjectId, {
      session: 'DICIEMBRE',
      boardSize: 3,
      durationMinutes: 180,
      prepLeadDays: 7,
      prepDailyMinutes: 60,
      topics: ['Integrales dobles', 'Derivadas', 'Limites'],
    });
    await exam(richSubjectId, {
      session: 'DICIEMBRE',
      boardSize: 3,
      durationMinutes: 120,
      prepLeadDays: 14,
      prepDailyMinutes: 60,
      topics: ['integrales dobles', 'Derivadas', 'Matrices'],
    });
    await exam(richSubjectId, {
      session: 'DICIEMBRE',
      boardSize: 2,
      durationMinutes: 180,
      prepLeadDays: 21,
      prepDailyMinutes: 90,
      topics: ['INTEGRALES DOBLES', 'Limites', 'Matrices', 'Series de Fourier'],
      isAnonymous: true,
    });
    await exam(richSubjectId, {
      session: 'DICIEMBRE',
      prepLeadDays: 21,
      topics: ['Series de Fourier', 'Teorema de Green', 'Truco del profe'],
    });
    await exam(richSubjectId, {
      session: 'JULIO',
      boardSize: 1,
      durationMinutes: 30,
      prepLeadDays: 60,
      topics: ['Teorema de Green', 'Vectores', 'Retirado'],
    });
    await exam(richSubjectId, {
      session: 'JULIO',
      boardSize: 1,
      durationMinutes: 30,
      topics: ['Vectores', 'Oculto'],
    });
    await exam(richSubjectId, {
      session: 'DICIEMBRE',
      boardSize: 9,
      durationMinutes: 400,
      prepLeadDays: 300,
      prepDailyMinutes: 900,
      topics: ['Retirado', 'Truco del profe'],
      publicationStatus: 'REMOVED',
    });
    await exam(richSubjectId, {
      session: 'DICIEMBRE',
      boardSize: 9,
      topics: ['Oculto'],
      publicationStatus: 'HIDDEN',
      hiddenAt: new Date(),
    });

    // Sparse materia: every new fact stays under its minimum except the mesa's
    // professors (3 answers).
    for (const promotionGrade of [8, 8, 9, 9, null, null]) {
      await review(sparseSubjectId, { condition: 'PROMO', promotionGrade });
    }
    await exam(sparseSubjectId, {
      session: 'DICIEMBRE',
      boardSize: 3,
      durationMinutes: 180,
      prepLeadDays: 21,
      topics: ['Series de Fourier'],
    });
    await exam(sparseSubjectId, {
      session: 'DICIEMBRE',
      boardSize: 3,
      durationMinutes: 180,
      prepLeadDays: 21,
    });
    await exam(sparseSubjectId, { session: 'DICIEMBRE', boardSize: 4 });
  });

  afterAll(async () => {
    await prisma.courseReview.deleteMany({ where: { id: { in: reviewIds } } });
    await prisma.examExperience.deleteMany({ where: { id: { in: examIds } } });
    await prisma.subject.deleteMany({
      where: {
        id: { in: [subjectId, otherSubjectId, richSubjectId, sparseSubjectId] },
      },
    });
    await prisma.user.delete({ where: { id: author.id } });
    await app.close();
  });

  it('returns the full summary over every public experiencia, anonymous included', async () => {
    const res = await http()
      .get(`/api/v1/discovery/subjects/${code}/experiences-summary`)
      .expect(200);

    expect(res.body).toEqual({
      subject: { id: subjectId, code, name: `Materia resumen ${tag}` },
      reviews: {
        count: 6,
        recommendation: { average: 4.2, count: 6 },
        results: {
          answered: 5,
          unanswered: 1,
          promo: 3,
          regular: 2,
          libre: 0,
          percents: { promo: 60, regular: 40, libre: 0 },
        },
        difficulty: {
          answered: 5,
          unanswered: 1,
          counts: { MUY_BAJA: 0, BAJA: 0, MEDIA: 2, ALTA: 3, MUY_ALTA: 0 },
          top: 'ALTA',
        },
        // Facts not yet collected: «la informaron 0 de 3».
        promotionGrade: { average: null, informed: 0, promoted: 3 },
      },
      exams: {
        count: 7,
        outcomes: {
          answered: 5,
          undeclared: 2,
          aprobado: 3,
          desaprobado: 2,
          percent: 60,
        },
        formats: {
          counts: { ESCRITO: 4, ORAL: 2, MIXTO: 1 },
          top: 'ESCRITO',
        },
        theory: { average: 4, count: 3 },
        practice: { average: 4, count: 3 },
        topSession: {
          session: 'DICIEMBRE',
          count: 3,
          boardSize: { median: null, count: 0 },
          duration: { median: null, count: 0 },
        },
        grade: { average: 5.4, count: 5 },
        preparation: {
          leadDays: { median: null, count: 0 },
          dailyMinutes: { median: null, count: 0 },
        },
        topics: [],
      },
    });
  });

  it('reports the nota de promoción over the reseñas with Promoción, averaging from five', async () => {
    const rich = await http()
      .get(`/api/v1/discovery/subjects/${richCode}/experiences-summary`)
      .expect(200);
    expect(rich.body.reviews.results).toMatchObject({ promo: 7, regular: 1 });
    expect(rich.body.reviews.promotionGrade).toEqual({
      average: 8.5,
      informed: 6,
      promoted: 7,
    });

    const sparse = await http()
      .get(`/api/v1/discovery/subjects/${sparseCode}/experiences-summary`)
      .expect(200);
    // «la informaron 4 de 6» with no average.
    expect(sparse.body.reviews.promotionGrade).toEqual({
      average: null,
      informed: 4,
      promoted: 6,
    });
  });

  it('limits the professors and duration medians to the mesa más comentada', async () => {
    const rich = await http()
      .get(`/api/v1/discovery/subjects/${richCode}/experiences-summary`)
      .expect(200);
    expect(rich.body.exams.topSession).toEqual({
      session: 'DICIEMBRE',
      count: 4,
      boardSize: { median: 3, count: 3 },
      duration: { median: 180, count: 3 },
    });

    const sparse = await http()
      .get(`/api/v1/discovery/subjects/${sparseCode}/experiences-summary`)
      .expect(200);
    // Two durations: the sentence keeps the professors and drops the hours.
    expect(sparse.body.exams.topSession).toEqual({
      session: 'DICIEMBRE',
      count: 3,
      boardSize: { median: 3, count: 3 },
      duration: { median: null, count: 2 },
    });
  });

  it('summarizes the preparación típica as medians from three answers each', async () => {
    const rich = await http()
      .get(`/api/v1/discovery/subjects/${richCode}/experiences-summary`)
      .expect(200);
    // 7, 14, 21, 21, 60 days → 21; 60, 60, 90 minutes → 60.
    expect(rich.body.exams.preparation).toEqual({
      leadDays: { median: 21, count: 5 },
      dailyMinutes: { median: 60, count: 3 },
    });

    const sparse = await http()
      .get(`/api/v1/discovery/subjects/${sparseCode}/experiences-summary`)
      .expect(200);
    expect(sparse.body.exams.preparation).toEqual({
      leadDays: { median: null, count: 2 },
      dailyMinutes: { median: null, count: 0 },
    });
  });

  it('lists up to five temas found in two public finales, ignoring case', async () => {
    const rich = await http()
      .get(`/api/v1/discovery/subjects/${richCode}/experiences-summary`)
      .expect(200);
    const topics = rich.body.exams.topics as {
      topic: string;
      count: number;
    }[];
    expect(
      topics.map(({ topic, count }) => [topic.toLowerCase(), count]),
    ).toEqual([
      ['integrales dobles', 3],
      ['derivadas', 2],
      ['limites', 2],
      ['matrices', 2],
      ['series de fourier', 2],
    ]);
    // One-off, retired and recently hidden mentions never reach two finales.
    const names = topics.map((t) => t.topic.toLowerCase());
    for (const absent of ['truco del profe', 'retirado', 'oculto']) {
      expect(names).not.toContain(absent);
    }

    const sparse = await http()
      .get(`/api/v1/discovery/subjects/${sparseCode}/experiences-summary`)
      .expect(200);
    expect(sparse.body.exams.topics).toEqual([]);
  });

  it('does not count pending, hidden-in-window or removed entries', async () => {
    const res = await http()
      .get(`/api/v1/discovery/subjects/${otherCode}/experiences-summary`)
      .expect(200);

    expect(res.body.reviews.count).toBe(1);
    expect(res.body.exams.count).toBe(0);
    expect(res.body.reviews.recommendation).toEqual({
      average: 5,
      count: 1,
    });
    expect(res.body.exams.topSession).toBeNull();
  });

  it('answers 404 for an unknown code', async () => {
    const res = await http()
      .get('/api/v1/discovery/subjects/NOPE-000/experiences-summary')
      .expect(404);
    expect(res.body.message).toBe('Materia no encontrada');
  });
});
