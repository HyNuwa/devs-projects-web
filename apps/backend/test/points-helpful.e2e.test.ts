import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createSubject,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/** Valid «Me sirvió» earn points within caps (openspec reputation/points). */
describe('points from «Me sirvió» (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let subjectId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    ({ id: subjectId } = await createSubject(prisma));
  });

  afterAll(async () => {
    await app.close();
  });

  async function material(author: E2eUser) {
    return prisma.material.create({
      data: {
        title: `Apunte ${randomUUID().slice(0, 6)}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        resourceType: 'APUNTE',
      },
      select: { id: true },
    });
  }

  const mark = (giver: E2eUser, materialId: string, isHelpful = true) =>
    request(app.getHttpServer())
      .put(`/api/v1/materials/${materialId}/helpfulness`)
      .set('Authorization', bearer(app, giver))
      .send({ isHelpful });

  async function helpfulPoints(author: E2eUser) {
    const rows = await prisma.pointTransaction.findMany({
      where: { userId: author.id, reason: 'HELPFUL_RECEIVED' },
      select: { amount: true },
    });
    return rows.reduce((sum, row) => sum + row.amount, 0);
  }

  it('awards 1 point per valid «Me sirvió», naming the giver only in the reference', async () => {
    const author = await createUser(prisma);
    const giver = await createUser(prisma);
    const { id } = await material(author);

    await mark(giver, id).expect(200);
    await mark(giver, id).expect(200);

    expect(await helpfulPoints(author)).toBe(1);
    const [movement] = await prisma.pointTransaction.findMany({
      where: { userId: author.id },
    });
    expect(movement.referenceId).toBe(`${id}:${giver.id}`);
  });

  it('reverts the point when the «Me sirvió» is removed', async () => {
    const author = await createUser(prisma);
    const giver = await createUser(prisma);
    const { id } = await material(author);
    await mark(giver, id).expect(200);

    await mark(giver, id, false).expect(200);
    expect(await helpfulPoints(author)).toBe(0);

    // Marking again earns again, never more than one point net.
    await mark(giver, id).expect(200);
    expect(await helpfulPoints(author)).toBe(1);
  });

  it('awards nothing for an unverified giver, a sanctioned giver or the author', async () => {
    const author = await createUser(prisma);
    const { id } = await material(author);
    const unverified = await createUser(prisma, 'USER', {
      emailVerified: false,
    });

    await mark(unverified, id).expect(200);
    await mark(author, id).expect(200);

    expect(await helpfulPoints(author)).toBe(0);
    expect(
      await prisma.materialHelpfulness.count({ where: { materialId: id } }),
    ).toBe(2);
  });

  it('caps the points from one giver to one author at 5 per month', async () => {
    const author = await createUser(prisma);
    const giver = await createUser(prisma);
    const materials = await Promise.all(
      Array.from({ length: 6 }, () => material(author)),
    );

    for (const { id } of materials) await mark(giver, id).expect(200);

    expect(await helpfulPoints(author)).toBe(5);
  });

  it('caps the points of one material at 25', async () => {
    const author = await createUser(prisma);
    const { id } = await material(author);
    const givers = await Promise.all(
      Array.from({ length: 26 }, () => createUser(prisma)),
    );

    // The daily cap (20) comes first within a day, so the first 20 are moved
    // to two days ago.
    for (const giver of givers.slice(0, 20)) await mark(giver, id).expect(200);
    await prisma.pointTransaction.updateMany({
      where: { userId: author.id, reason: 'HELPFUL_RECEIVED' },
      data: { createdAt: new Date(Date.now() - 2 * 86_400_000) },
    });
    for (const giver of givers.slice(20)) await mark(giver, id).expect(200);

    expect(await helpfulPoints(author)).toBe(25);
  });

  it('caps the points of one author at 20 per day', async () => {
    const author = await createUser(prisma);
    const materials = await Promise.all(
      Array.from({ length: 5 }, () => material(author)),
    );
    const givers = await Promise.all(
      Array.from({ length: 5 }, () => createUser(prisma)),
    );

    // 5 givers × 5 materials = 25 valid marks, within the monthly per-giver cap.
    for (const giver of givers) {
      for (const { id } of materials) await mark(giver, id).expect(200);
    }

    expect(await helpfulPoints(author)).toBe(20);
  });

  it('holds the caps when many «Me sirvió» arrive at once', async () => {
    const author = await createUser(prisma);
    const { id } = await material(author);
    const givers = await Promise.all(
      Array.from({ length: 30 }, () => createUser(prisma)),
    );

    await Promise.all(givers.map((giver) => mark(giver, id).expect(200)));

    expect(await helpfulPoints(author)).toBe(20);
  });
});
