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
  let subjectId: string;
  let otherSubjectId: string;
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
  });

  afterAll(async () => {
    await prisma.courseReview.deleteMany({ where: { id: { in: reviewIds } } });
    await prisma.examExperience.deleteMany({ where: { id: { in: examIds } } });
    await prisma.subject.deleteMany({
      where: { id: { in: [subjectId, otherSubjectId] } },
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
        topSession: { session: 'DICIEMBRE', count: 3 },
        grade: { average: 5.4, count: 5 },
      },
    });
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
