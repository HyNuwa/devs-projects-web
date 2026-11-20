import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createSubject, createUser } from './support/e2e-app';

type Page = {
  items: { type: string; id: string; title: string }[];
  page: number;
  hasMore: boolean;
};

/** Contributions on the perfil público (openspec reputation/public-profile). */
describe('public profile contributions (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  afterAll(async () => {
    await app.close();
  });

  async function account() {
    const { id } = await createUser(prisma);
    const { username } = await prisma.user.findUniqueOrThrow({
      where: { id },
      select: { username: true },
    });
    return { id, username };
  }

  const at = (minutes: number) => new Date(Date.UTC(2026, 5, 1, 12, minutes));

  const contributions = async (username: string, page = 1) =>
    (
      await request(app.getHttpServer())
        .get(`/api/v1/profiles/${username}/contributions?page=${page}`)
        .expect(200)
    ).body as Page;

  it('lists only published, not deleted and named contributions, newest first', async () => {
    const user = await account();
    const { id: subjectId } = await createSubject(prisma);
    const material = (minutes: number, extra: object = {}) =>
      prisma.material.create({
        data: {
          title: `Apunte ${minutes}`,
          fileUrl: 'https://drive.example.com/e2e',
          fileType: 'pdf',
          fileSize: BigInt(1000),
          authorId: user.id,
          subjectId,
          resourceType: 'APUNTE',
          createdAt: at(minutes),
          ...extra,
        },
        select: { id: true },
      });
    const review = (minutes: number, extra: object = {}) =>
      prisma.courseReview.create({
        data: {
          userId: user.id,
          subjectId,
          recommendation: 4,
          createdAt: at(minutes),
          ...extra,
        },
        select: { id: true },
      });
    const exam = (minutes: number, extra: object = {}) =>
      prisma.examExperience.create({
        data: {
          userId: user.id,
          subjectId,
          year: 2026,
          format: 'ESCRITO',
          createdAt: at(minutes),
          ...extra,
        },
        select: { id: true },
      });

    const shown = [await material(1), await review(2), await exam(3)];
    await material(4, { publicationStatus: 'REMOVED' });
    await material(5, { publicationStatus: 'HIDDEN' });
    await material(6, { publicationStatus: 'PENDING_REVIEW' });
    await material(7, { publicationStatus: 'REJECTED' });
    await material(8, { isDeleted: true });
    await review(9, { isAnonymous: true });
    await exam(10, { isAnonymous: true });
    await review(11, { publicationStatus: 'REMOVED' });

    const body = await contributions(user.username);

    expect(body.items.map((item) => item.id)).toEqual(
      shown.map((item) => item.id).reverse(),
    );
    expect(body.items.map((item) => item.type)).toEqual([
      'EXAM_EXPERIENCE',
      'COURSE_REVIEW',
      'MATERIAL',
    ]);
    expect(body.hasMore).toBe(false);
  });

  it('pages by 20, so 25 contributions leave the 5 oldest on page 2', async () => {
    const user = await account();
    const { id: subjectId } = await createSubject(prisma);
    await prisma.material.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        id: randomUUID(),
        title: `Material ${String(i).padStart(2, '0')}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: user.id,
        subjectId,
        resourceType: 'APUNTE' as const,
        createdAt: at(i),
      })),
    });

    const first = await contributions(user.username, 1);
    const second = await contributions(user.username, 2);

    expect(first.items).toHaveLength(20);
    expect(first.hasMore).toBe(true);
    expect(second.items.map((item) => item.title)).toEqual([
      'Material 04',
      'Material 03',
      'Material 02',
      'Material 01',
      'Material 00',
    ]);
    expect(second).toMatchObject({ page: 2, hasMore: false });
  });

  it('is 404 for an unknown username and 400 for a bad page', async () => {
    const user = await account();
    await request(app.getHttpServer())
      .get('/api/v1/profiles/nadie-existe-123/contributions')
      .expect(404);
    await request(app.getHttpServer())
      .get(`/api/v1/profiles/${user.username}/contributions?page=0`)
      .expect(400);
  });
});
