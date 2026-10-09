import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

const COMMENT =
  'La cursada fue ordenada y los parciales se parecían a la práctica.';

/** Retired and deleted contributions lose their points (openspec reputation/points). */
describe('point reversals and restores (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let moderator: E2eUser;
  let reviewer: E2eUser;
  let subjectId: string;
  let subjectCode: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    moderator = await createUser(prisma, 'ADMIN');
    reviewer = await createUser(prisma, 'ADMIN');
    subjectCode = `E2E${randomUUID().slice(0, 6)}`;
    ({ id: subjectId } = await prisma.subject.create({
      data: { name: `Materia ${subjectCode}`, code: subjectCode },
      select: { id: true },
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (user: E2eUser) => ({
    post: (path: string, body: object = {}) =>
      request(app.getHttpServer())
        .post(`/api/v1${path}`)
        .set('Authorization', bearer(app, user))
        .send(body),
    put: (path: string, body: object) =>
      request(app.getHttpServer())
        .put(`/api/v1${path}`)
        .set('Authorization', bearer(app, user))
        .send(body),
    delete: (path: string) =>
      request(app.getHttpServer())
        .delete(`/api/v1${path}`)
        .set('Authorization', bearer(app, user)),
  });

  const points = async (user: E2eUser) =>
    (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).points;

  /** A published material whose author earned 10 points and one per giver. */
  async function helpfulMaterial(author: E2eUser, givers: number) {
    const material = await prisma.material.create({
      data: {
        title: `Resumen ${randomUUID().slice(0, 6)}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        resourceType: 'OTRO',
      },
      select: { id: true },
    });
    await prisma.pointTransaction.create({
      data: {
        userId: author.id,
        reason: 'MATERIAL_PUBLISHED',
        amount: 10,
        referenceId: material.id,
        idempotencyKey: `MATERIAL_PUBLISHED:${material.id}:0`,
      },
    });
    await prisma.user.update({
      where: { id: author.id },
      data: { points: { increment: 10 } },
    });
    for (let i = 0; i < givers; i += 1) {
      await as(await createUser(prisma))
        .put(`/materials/${material.id}/helpfulness`, { isHelpful: true })
        .expect(200);
    }
    return material;
  }

  async function retire(materialId: string, author: E2eUser) {
    const caso = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId,
        targetAuthorId: author.id,
      },
    });
    await as(moderator)
      .post(`/moderation/cases/${caso.id}/decision`, {
        decision: 'REMOVE',
        reason: 'Datos personales de un docente.',
      })
      .expect(201);
    return caso;
  }

  it('a retiro reverts the material and its «Me sirvió», and a restoration brings them back', async () => {
    const author = await createUser(prisma);
    const { id } = await helpfulMaterial(author, 12);
    expect(await points(author)).toBe(22);

    const caso = await retire(id, author);
    expect(await points(author)).toBe(0);

    await as(reviewer)
      .post(`/moderation/cases/${caso.id}/decision`, {
        decision: 'RESTORE',
        reason: 'No había datos personales.',
      })
      .expect(201);
    expect(await points(author)).toBe(22);
  });

  it('an accepted appeal of a retiro gives the points back', async () => {
    const author = await createUser(prisma);
    const { id } = await helpfulMaterial(author, 3);
    const caso = await retire(id, author);
    expect(await points(author)).toBe(0);

    await as(author)
      .post('/me/appeals', {
        kind: 'RETIRO',
        caseId: caso.id,
        explanation: 'No tiene datos personales.',
      })
      .expect(201);
    const appeal = await prisma.appeal.findUniqueOrThrow({
      where: { caseId: caso.id },
    });
    await as(reviewer)
      .post(`/moderation/appeals/${appeal.id}/answer`, {
        accept: true,
        answer: 'Se restituye: no hay datos personales.',
      })
      .expect(201);

    expect(await points(author)).toBe(13);
  });

  it('an author deleting a material loses its points and its «Me sirvió»', async () => {
    const author = await createUser(prisma);
    const { id } = await helpfulMaterial(author, 4);

    await as(author).delete(`/materials/${id}`).expect(200);

    expect(await points(author)).toBe(0);
  });

  it('an author deleting a signed reseña loses its points', async () => {
    const author = await createUser(prisma);
    const { body } = await as(author)
      .post(`/subjects/${subjectCode}/reviews`, {
        academicYear: 2024,
        condition: 'REGULAR',
        attempt: 'PRIMERA_CURSADA',
        recommendation: 4,
        comment: COMMENT,
      })
      .expect(201);
    expect(await points(author)).toBe(5);

    await as(author).delete(`/subjects/reviews/${body.review.id}`).expect(200);

    expect(await points(author)).toBe(0);
  });

  it('never moves the author’s points for an anonymous reseña, from publication to restoration', async () => {
    const author = await createUser(prisma);
    const { body } = await as(author)
      .post(`/subjects/${subjectCode}/reviews`, {
        academicYear: 2023,
        condition: 'REGULAR',
        attempt: 'PRIMERA_CURSADA',
        recommendation: 2,
        comment: COMMENT,
        isAnonymous: true,
      })
      .expect(201);
    const caso = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: body.review.id,
        targetAuthorId: author.id,
      },
    });

    await as(moderator)
      .post(`/moderation/cases/${caso.id}/decision`, {
        decision: 'REMOVE',
        reason: 'Insultos a una docente.',
      })
      .expect(201);
    await as(reviewer)
      .post(`/moderation/cases/${caso.id}/decision`, {
        decision: 'RESTORE',
        reason: 'Criticaba la cursada, no a la docente.',
      })
      .expect(201);

    expect(await points(author)).toBe(0);
    expect(
      await prisma.pointTransaction.count({ where: { userId: author.id } }),
    ).toBe(0);
  });

  it('an accepted appeal during a silenciamiento gives back the «Me sirvió» points too', async () => {
    const author = await createUser(prisma);
    const { id } = await helpfulMaterial(author, 4);
    const caso = await retire(id, author);
    await as(author)
      .post('/me/appeals', {
        kind: 'RETIRO',
        caseId: caso.id,
        explanation: 'No tiene datos personales.',
      })
      .expect(201);
    await prisma.user.update({
      where: { id: author.id },
      data: {
        isMuted: true,
        mutedUntil: new Date(Date.now() + 3 * 86_400_000),
      },
    });
    const appeal = await prisma.appeal.findUniqueOrThrow({
      where: { caseId: caso.id },
    });

    await as(reviewer)
      .post(`/moderation/appeals/${appeal.id}/answer`, {
        accept: true,
        answer: 'Se restituye: no hay datos personales.',
      })
      .expect(201);

    expect(await points(author)).toBe(14);
  });
});
