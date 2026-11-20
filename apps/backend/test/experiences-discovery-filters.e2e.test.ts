import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createUser, type E2eUser } from './support/e2e-app';
import { FI_UNJU_FACULTY_ID } from '../src/modules/institutions/institutions.constants';

type PublicAuthor = {
  id?: string;
  username: string;
  avatarUrl?: string | null;
  avatarCat?: string | null;
};

/** shift/condition filters and the public author shape (openspec academic-community/experiences). */
describe('Discovery: filtros de reseñas y autor público (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let named: E2eUser;
  let anonymous: E2eUser;
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toUpperCase();
  let subjectId: string;
  let namedReviewId: string;
  let anonymousReviewId: string;
  let matchingReviewId: string;
  let namedExamId: string;
  let anonymousExamId: string;
  let factsSubjectId: string;
  let promotedReviewId: string;
  let regularReviewId: string;
  let fullExamId: string;
  let legacyExamId: string;
  const reviewIds: string[] = [];
  const examIds: string[] = [];

  const list = (query = '') =>
    http().get(`/api/v1/discovery/course-reviews${query}`).expect(200);

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    named = await createUser(prisma, 'USER', {
      avatarUrl: 'https://cdn.example.com/pic.png',
    });
    anonymous = await createUser(prisma, 'USER');
    await prisma.profileCustomization.create({
      data: { userId: named.id, avatarCat: 'crema' },
    });
    ({ id: subjectId } = await prisma.subject.create({
      data: { facultyId: FI_UNJU_FACULTY_ID, name: `Materia filtros ${tag}` },
      select: { id: true },
    }));

    const review = async (data: Record<string, unknown>) => {
      const row = await prisma.courseReview.create({
        data: { userId: named.id, subjectId, recommendation: 4, ...data },
        select: { id: true },
      });
      reviewIds.push(row.id);
      return row.id;
    };

    namedReviewId = await review({
      shift: 'TARDE',
      condition: 'PROMO',
      createdAt: new Date(Date.now() - 10 * 60_000),
    });
    anonymousReviewId = await review({
      userId: anonymous.id,
      isAnonymous: true,
      shift: 'MANANA',
      condition: 'LIBRE',
      createdAt: new Date(Date.now() - 20 * 60_000),
    });
    matchingReviewId = await review({
      shift: 'TARDE',
      condition: 'REGULAR',
      createdAt: new Date(Date.now() - 30 * 60_000),
    });

    const exam = await prisma.examExperience.create({
      data: {
        userId: named.id,
        subjectId,
        year: 2025,
        session: 'JULIO',
        format: 'ORAL',
        outcome: 'APROBADO',
        grade: 7,
      },
      select: { id: true },
    });
    namedExamId = exam.id;
    examIds.push(exam.id);
    const anonymousExam = await prisma.examExperience.create({
      data: {
        userId: named.id,
        subjectId,
        year: 2025,
        session: 'JULIO',
        format: 'ORAL',
        isAnonymous: true,
      },
      select: { id: true },
    });
    anonymousExamId = anonymousExam.id;
    examIds.push(anonymousExam.id);
    const gradeless = await prisma.examExperience.create({
      data: {
        userId: named.id,
        subjectId,
        year: 2024,
        session: 'MARZO',
        format: 'ESCRITO',
      },
      select: { id: true },
    });
    examIds.push(gradeless.id);

    // The facts of experiencias-formularios, in a materia of their own.
    ({ id: factsSubjectId } = await prisma.subject.create({
      data: { facultyId: FI_UNJU_FACULTY_ID, name: `Materia hechos ${tag}` },
      select: { id: true },
    }));
    promotedReviewId = await review({
      subjectId: factsSubjectId,
      condition: 'PROMO',
      promotionGrade: 9,
    });
    regularReviewId = await review({
      subjectId: factsSubjectId,
      condition: 'REGULAR',
    });
    const full = await prisma.examExperience.create({
      data: {
        userId: named.id,
        subjectId: factsSubjectId,
        year: 2025,
        session: 'DICIEMBRE',
        format: 'ESCRITO',
        outcome: 'APROBADO',
        grade: 8,
        difficultyTheory: 4,
        difficultyPractice: 3,
        boardSize: 3,
        durationMinutes: 180,
        prepLeadDays: 21,
        prepDailyMinutes: 60,
        topics: ['Integrales dobles', 'Teorema de Green', 'Series de Fourier'],
        createdAt: new Date(Date.now() - 10 * 60_000),
      },
      select: { id: true },
    });
    fullExamId = full.id;
    examIds.push(full.id);
    const legacy = await prisma.examExperience.create({
      data: {
        userId: named.id,
        subjectId: factsSubjectId,
        year: 2023,
        session: 'JULIO',
        format: 'ORAL',
        examDate: new Date('2023-07-14T00:00:00.000Z'),
        shift: 'TARDE',
        difficulty: 'ALTA',
        createdAt: new Date(Date.now() - 20 * 60_000),
      },
      select: { id: true },
    });
    legacyExamId = legacy.id;
    examIds.push(legacy.id);
  });

  afterAll(async () => {
    await prisma.courseReview.deleteMany({ where: { id: { in: reviewIds } } });
    await prisma.examExperience.deleteMany({
      where: { id: { in: examIds } },
    });
    await prisma.subject.deleteMany({
      where: { id: { in: [subjectId, factsSubjectId] } },
    });
    await prisma.profileCustomization.deleteMany({
      where: { userId: named.id },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [named.id, anonymous.id] } },
    });
    await app.close();
  });

  it('filters reseñas by franja and resultado, combined or alone', async () => {
    const byShift = (await list(`?subjectId=${subjectId}&shift=TARDE`))
      .body as {
      data: { id: string }[];
    };
    expect(byShift.data.map((r) => r.id)).toEqual([
      namedReviewId,
      matchingReviewId,
    ]);

    const byCondition = (await list(`?subjectId=${subjectId}&condition=LIBRE`))
      .body as { data: { id: string }[] };
    expect(byCondition.data.map((r) => r.id)).toEqual([anonymousReviewId]);

    const both = (
      await list(`?subjectId=${subjectId}&shift=TARDE&condition=REGULAR`)
    ).body as { data: { id: string }[] };
    expect(both.data.map((r) => r.id)).toEqual([matchingReviewId]);
  });

  it('rejects unknown franja or resultado values with 400', async () => {
    await http()
      .get('/api/v1/discovery/course-reviews?shift=MADRUGADA')
      .expect(400);
    await http()
      .get('/api/v1/discovery/course-reviews?condition=APROBADO')
      .expect(400);
  });

  it('exposes id and avatar for named authors and only «Anónimo» for anonymous ones', async () => {
    const res = await list(`?subjectId=${subjectId}`);
    const items = res.body.data as { id: string; author: PublicAuthor }[];
    const byId = new Map(items.map((item) => [item.id, item]));

    expect(byId.get(namedReviewId)?.author).toEqual({
      id: named.id,
      username: named.email.split('@')[0],
      avatarUrl: 'https://cdn.example.com/pic.png',
      avatarCat: 'crema',
    });
    expect(byId.get(anonymousReviewId)?.author).toEqual({
      username: 'Anónimo',
    });
  });

  it('keeps the same author shape on details and related items', async () => {
    const detail = (
      await http()
        .get(`/api/v1/discovery/course-reviews/${namedReviewId}`)
        .expect(200)
    ).body as { author: PublicAuthor };
    expect(detail.author).toEqual({
      id: named.id,
      username: named.email.split('@')[0],
      avatarUrl: 'https://cdn.example.com/pic.png',
      avatarCat: 'crema',
    });
    const anonymousDetail = (
      await http()
        .get(`/api/v1/discovery/course-reviews/${anonymousReviewId}`)
        .expect(200)
    ).body as { author: PublicAuthor };
    expect(anonymousDetail.author).toEqual({ username: 'Anónimo' });

    // related items share the list shape (TARDE matches the target reseña).
    const related = (
      await http()
        .get(`/api/v1/discovery/course-reviews/${namedReviewId}/related`)
        .expect(200)
    ).body as { items: { id: string; author: PublicAuthor }[] };
    expect(related.items.map((item) => item.id)).toEqual([matchingReviewId]);
    expect(related.items[0].author).toEqual({
      id: named.id,
      username: named.email.split('@')[0],
      avatarUrl: 'https://cdn.example.com/pic.png',
      avatarCat: 'crema',
    });
  });

  it('exposes the same author shape on final lists and details', async () => {
    const listBody = (
      await http()
        .get(`/api/v1/discovery/exam-experiences?subjectId=${subjectId}`)
        .expect(200)
    ).body as { data: { id: string; author: PublicAuthor }[] };
    const listed = listBody.data.find((item) => item.id === namedExamId);
    expect(listed?.author).toEqual({
      id: named.id,
      username: named.email.split('@')[0],
      avatarUrl: 'https://cdn.example.com/pic.png',
      avatarCat: 'crema',
    });

    expect(
      listBody.data.find((item) => item.id === anonymousExamId)?.author,
    ).toEqual({ username: 'Anónimo' });
    const anonymousDetail = (
      await http()
        .get(`/api/v1/discovery/exam-experiences/${anonymousExamId}`)
        .expect(200)
    ).body as { author: PublicAuthor };
    expect(anonymousDetail.author).toEqual({ username: 'Anónimo' });
    const related = (
      await http()
        .get(`/api/v1/discovery/exam-experiences/${namedExamId}/related`)
        .expect(200)
    ).body as { items: { id: string; author: PublicAuthor }[] };
    expect(
      related.items.find((item) => item.id === anonymousExamId)?.author,
    ).toEqual({ username: 'Anónimo' });

    const detail = (
      await http()
        .get(`/api/v1/discovery/exam-experiences/${namedExamId}`)
        .expect(200)
    ).body as { author: PublicAuthor; grade?: number };
    expect(detail.author.id).toBe(named.id);
  });

  it('shows the declared grade and omits it when there is none', async () => {
    const listBody = (
      await http()
        .get(`/api/v1/discovery/exam-experiences?subjectId=${subjectId}`)
        .expect(200)
    ).body as { data: { id: string; grade?: number }[] };
    expect(listBody.data.find((item) => item.id === namedExamId)?.grade).toBe(
      7,
    );
    const gradeless = listBody.data.find((item) => item.id !== namedExamId);
    expect(gradeless).toBeDefined();
    expect(gradeless).not.toHaveProperty('grade');

    const detail = (
      await http()
        .get(`/api/v1/discovery/exam-experiences/${namedExamId}`)
        .expect(200)
    ).body as { grade?: number };
    expect(detail.grade).toBe(7);
  });

  it('carries the nota de promoción on reseña items and details', async () => {
    const items = (await list(`?subjectId=${factsSubjectId}`)).body.data as {
      id: string;
      promotionGrade: number | null;
    }[];
    const byId = new Map(items.map((item) => [item.id, item]));
    expect(byId.get(promotedReviewId)?.promotionGrade).toBe(9);
    expect(byId.get(regularReviewId)?.promotionGrade).toBeNull();

    const detail = (
      await http()
        .get(`/api/v1/discovery/course-reviews/${promotedReviewId}`)
        .expect(200)
    ).body as { promotionGrade: number | null };
    expect(detail.promotionGrade).toBe(9);
  });

  it('carries teoría, práctica, mesa and tiempo on final items, without preparación or temas', async () => {
    const items = (
      await http()
        .get(`/api/v1/discovery/exam-experiences?subjectId=${factsSubjectId}`)
        .expect(200)
    ).body.data as Record<string, unknown>[];
    const full = items.find((item) => item.id === fullExamId);
    expect(full).toMatchObject({
      difficultyTheory: 4,
      difficultyPractice: 3,
      boardSize: 3,
      durationMinutes: 180,
    });
    for (const detailOnly of [
      'topics',
      'prepLeadDays',
      'prepDailyMinutes',
      'estimatedStudyHours',
    ]) {
      expect(full).not.toHaveProperty(detailOnly);
    }
  });

  it('carries every declared fact on the final detail', async () => {
    const detail = (
      await http()
        .get(`/api/v1/discovery/exam-experiences/${fullExamId}`)
        .expect(200)
    ).body as Record<string, unknown>;
    expect(detail).toMatchObject({
      outcome: 'APROBADO',
      grade: 8,
      difficultyTheory: 4,
      difficultyPractice: 3,
      boardSize: 3,
      durationMinutes: 180,
      prepLeadDays: 21,
      prepDailyMinutes: 60,
      estimatedStudyHours: 21,
      topics: ['Integrales dobles', 'Teorema de Green', 'Series de Fourier'],
    });
  });

  it('still returns the legacy date, franja and verbal dificultad, and omits undeclared new facts', async () => {
    const items = (
      await http()
        .get(`/api/v1/discovery/exam-experiences?subjectId=${factsSubjectId}`)
        .expect(200)
    ).body.data as Record<string, unknown>[];
    const legacyItem = items.find((item) => item.id === legacyExamId);
    const legacyDetail = (
      await http()
        .get(`/api/v1/discovery/exam-experiences/${legacyExamId}`)
        .expect(200)
    ).body as Record<string, unknown>;

    for (const legacy of [legacyItem, legacyDetail]) {
      expect(legacy).toMatchObject({
        examDate: '2023-07-14T00:00:00.000Z',
        shift: 'TARDE',
        difficulty: 'ALTA',
      });
      for (const undeclared of [
        'difficultyTheory',
        'difficultyPractice',
        'boardSize',
        'durationMinutes',
        'prepLeadDays',
        'prepDailyMinutes',
        'estimatedStudyHours',
      ]) {
        expect(legacy).not.toHaveProperty(undeclared);
      }
    }
    expect(legacyDetail.topics).toEqual([]);
  });
});
