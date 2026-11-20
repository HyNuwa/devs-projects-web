import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FI_UNJU_FACULTY_ID } from '../src/modules/institutions/institutions.constants';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

const COMMENT =
  'La mesa tomó integrales dobles y pidió justificar cada paso del desarrollo.';

const exam = {
  year: 2025,
  session: 'DICIEMBRE',
  format: 'ESCRITO',
  outcome: 'APROBADO',
  grade: 7,
  topics: ['Integrales dobles'],
  comment: COMMENT,
};

const review = {
  academicYear: 2025,
  condition: 'PROMO',
  attempt: 'PRIMERA_CURSADA',
  recommendation: 4,
  promotionGrade: 8,
  comment: COMMENT,
};

type PublicEntry = { id: string; userId?: unknown; user: unknown };

/**
 * The materia lists `GET /subjects/:code/reviews` and `/exams` never carry an
 * author identifier for a publicación anónima (CONTEXT.md «Publicación
 * anónima»): no `userId`, and the public author is only «Anónimo».
 */
describe('subjects public lists hide anonymous authors (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let code: string;
  let author: E2eUser;
  const ids: Record<string, string> = {};

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    code = `E2E${randomUUID().slice(0, 6)}`;
    await prisma.subject.create({
      data: { facultyId: FI_UNJU_FACULTY_ID, name: `Materia ${code}`, code },
    });
    author = await createUser(prisma);

    const post = async (path: string, body: Record<string, unknown>) => {
      const { body: created } = await http()
        .post(`/api/v1/subjects/${code}/${path}`)
        .set('Authorization', bearer(app, author))
        .send(body)
        .expect(201);
      expect(created.outcome).toBe('PUBLISHED');
      return (created.exam ?? created.review).id as string;
    };

    ids.anonymousExam = await post('exams', { ...exam, isAnonymous: true });
    ids.signedExam = await post('exams', { ...exam, session: 'JULIO' });
    ids.anonymousReview = await post('reviews', {
      ...review,
      isAnonymous: true,
    });
    ids.signedReview = await post('reviews', {
      ...review,
      academicYear: 2024,
      confirmProbableDuplicate: true,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  function expectNoAuthorIdentifier(entry: PublicEntry) {
    expect(entry).not.toHaveProperty('userId');
    expect(entry.user).toEqual({ username: 'Anónimo' });
    expect(JSON.stringify(entry)).not.toContain(author.id);
  }

  it('lists finales without userId and with no identifier on the anonymous one', async () => {
    const { body } = await http()
      .get(`/api/v1/subjects/${code}/exams`)
      .expect(200);
    const entries = body as PublicEntry[];

    expect(entries.map((e) => e.id).sort()).toEqual(
      [ids.anonymousExam, ids.signedExam].sort(),
    );
    for (const entry of entries) expect(entry).not.toHaveProperty('userId');
    expectNoAuthorIdentifier(entries.find((e) => e.id === ids.anonymousExam)!);
    expect(entries.find((e) => e.id === ids.signedExam)!.user).toMatchObject({
      id: author.id,
    });
  });

  it('lists reseñas without userId and with no identifier on the anonymous one', async () => {
    const { body } = await http()
      .get(`/api/v1/subjects/${code}/reviews`)
      .expect(200);
    const entries = body.reviews as PublicEntry[];

    expect(entries.map((e) => e.id).sort()).toEqual(
      [ids.anonymousReview, ids.signedReview].sort(),
    );
    for (const entry of entries) expect(entry).not.toHaveProperty('userId');
    expectNoAuthorIdentifier(
      entries.find((e) => e.id === ids.anonymousReview)!,
    );
    expect(entries.find((e) => e.id === ids.signedReview)!.user).toMatchObject({
      id: author.id,
    });
  });

  it('keeps the discovery details of the anonymous entries free of the author id', async () => {
    const [examDetail, reviewDetail] = await Promise.all([
      http()
        .get(`/api/v1/discovery/exam-experiences/${ids.anonymousExam}`)
        .expect(200),
      http()
        .get(`/api/v1/discovery/course-reviews/${ids.anonymousReview}`)
        .expect(200),
    ]);

    for (const { body } of [examDetail, reviewDetail]) {
      expect(body.author).toEqual({ username: 'Anónimo' });
      expect(JSON.stringify(body)).not.toContain(author.id);
    }
  });
});
