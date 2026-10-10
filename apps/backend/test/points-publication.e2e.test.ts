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

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const COMMENT =
  'La cursada fue ordenada y los parciales se parecían a la práctica.';

/** Contributions earn their points when published (openspec reputation/points). */
describe('points on publication (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    admin = await createUser(prisma, 'ADMIN');
  });

  afterAll(async () => {
    await app.close();
  });

  async function subject() {
    const code = `E2E${randomUUID().slice(0, 6)}`;
    const created = await prisma.subject.create({
      data: { facultyId: FI_UNJU_FACULTY_ID, name: `Materia ${code}`, code },
      select: { id: true },
    });
    return { id: created.id, code };
  }

  const http = (user: E2eUser) => ({
    upload: (subjectId: string) =>
      request(app.getHttpServer())
        .post('/api/v1/materials')
        .set('Authorization', bearer(app, user))
        .field('title', `Parcial ${randomUUID().slice(0, 6)}`)
        .field('subjectId', subjectId)
        .field('resourceType', 'PARCIAL')
        .attach('file', PDF, {
          filename: 'parcial.pdf',
          contentType: 'application/pdf',
        }),
    review: (code: string, body: Record<string, unknown> = {}) =>
      request(app.getHttpServer())
        .post(`/api/v1/subjects/${code}/reviews`)
        .set('Authorization', bearer(app, user))
        .send({
          academicYear: 2025,
          condition: 'REGULAR',
          attempt: 'PRIMERA_CURSADA',
          recommendation: 4,
          comment: COMMENT,
          ...body,
        }),
    editReview: (id: string, body: Record<string, unknown>) =>
      request(app.getHttpServer())
        .put(`/api/v1/subjects/reviews/${id}`)
        .set('Authorization', bearer(app, user))
        .send({
          academicYear: 2025,
          condition: 'REGULAR',
          attempt: 'PRIMERA_CURSADA',
          recommendation: 3,
          comment: `${COMMENT} Editada.`,
          ...body,
        }),
    exam: (code: string, body: Record<string, unknown> = {}) =>
      request(app.getHttpServer())
        .post(`/api/v1/subjects/${code}/exams`)
        .set('Authorization', bearer(app, user))
        .send({
          year: 2025,
          session: 'DICIEMBRE',
          format: 'ESCRITO',
          comment: COMMENT,
          ...body,
        }),
  });

  async function ledgerOf(user: E2eUser) {
    const [account, movements] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { points: true },
      }),
      prisma.pointTransaction.findMany({
        where: { userId: user.id },
        select: { reason: true, amount: true, referenceId: true },
      }),
    ]);
    return { points: account.points, movements };
  }

  it('awards 10 once when a material is published on upload', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await subject();

    const { body } = await http(author).upload(subjectId).expect(201);

    expect(await ledgerOf(author)).toEqual({
      points: 10,
      movements: [
        {
          reason: 'MATERIAL_PUBLISHED',
          amount: 10,
          referenceId: body.material.id,
        },
      ],
    });
  });

  it('awards a material in revisión previa only when a moderator approves it', async () => {
    const author = await createUser(prisma, 'USER', { createdAt: new Date() });
    const { id: subjectId } = await subject();
    const { body } = await http(author).upload(subjectId).expect(201);
    expect((await ledgerOf(author)).points).toBe(0);

    const caso = await prisma.moderationCase.findFirstOrThrow({
      where: { materialId: body.material.id },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/moderation/cases/${caso.id}/decision`)
      .set('Authorization', bearer(app, admin))
      .send({ decision: 'APPROVE' })
      .expect(201);

    expect((await ledgerOf(author)).points).toBe(10);
  });

  it('awards 5 for a signed reseña and a signed experiencia', async () => {
    const author = await createUser(prisma);
    const { code } = await subject();

    await http(author).review(code).expect(201);
    await http(author).exam(code).expect(201);

    const { points, movements } = await ledgerOf(author);
    expect(points).toBe(10);
    expect(movements.map((m) => m.reason).sort()).toEqual([
      'COURSE_REVIEWED',
      'EXAM_EXPERIENCE_SHARED',
    ]);
  });

  it('awards nothing for anonymous reseñas and experiencias', async () => {
    const author = await createUser(prisma);
    const { code } = await subject();

    await http(author).review(code, { isAnonymous: true }).expect(201);
    await http(author).exam(code, { isAnonymous: true }).expect(201);

    expect(await ledgerOf(author)).toEqual({ points: 0, movements: [] });
  });

  it('keeps the anonymity chosen at publishing when the entry is edited', async () => {
    const author = await createUser(prisma);
    const { code } = await subject();
    const anonymous = (
      await http(author).review(code, { isAnonymous: true }).expect(201)
    ).body.review;
    const { code: otherCode } = await subject();
    const signed = (await http(author).review(otherCode).expect(201)).body
      .review;

    await http(author)
      .editReview(anonymous.id, { isAnonymous: false })
      .expect(200);
    await http(author).editReview(signed.id, { isAnonymous: true }).expect(200);

    const stored = await prisma.courseReview.findMany({
      where: { id: { in: [anonymous.id, signed.id] } },
      select: { id: true, isAnonymous: true, recommendation: true },
    });
    expect(stored).toEqual(
      expect.arrayContaining([
        { id: anonymous.id, isAnonymous: true, recommendation: 3 },
        { id: signed.id, isAnonymous: false, recommendation: 3 },
      ]),
    );
    expect((await ledgerOf(author)).points).toBe(5);
  });

  it('keeps one reseña with points per period when an edit moves a reseña into an awarded period', async () => {
    const author = await createUser(prisma);
    const { code } = await subject();
    const first = (
      await http(author).review(code, { academicYear: 2024 }).expect(201)
    ).body.review;
    await http(author).editReview(first.id, { academicYear: 2023 }).expect(200);
    const second = (
      await http(author).review(code, { academicYear: 2024 }).expect(201)
    ).body.review;
    expect((await ledgerOf(author)).points).toBe(10);

    await http(author)
      .editReview(second.id, { academicYear: 2023 })
      .expect(200);

    expect((await ledgerOf(author)).points).toBe(5);
  });
});
