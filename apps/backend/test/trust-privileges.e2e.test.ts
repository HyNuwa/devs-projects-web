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

type Privileges = {
  suggestCorrections: { active: boolean; missing: unknown[] };
  priorityReports: { active: boolean; missing: unknown[] };
  standing: { good: boolean; until: string | null; permanent: boolean };
};

const DAY = 86_400_000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);

/** «Tu progreso» privileges (openspec reputation/trust-privileges). */
describe('GET /users/me/privileges (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  afterAll(async () => {
    await app.close();
  });

  const privileges = async (user: E2eUser) =>
    (
      await request(app.getHttpServer())
        .get('/api/v1/users/me/privileges')
        .set('Authorization', bearer(app, user))
        .expect(200)
    ).body as Privileges;

  /** A reported material whose caso can carry reportes and decisions. */
  async function reportedCase(authorId: string) {
    const { id: subjectId } = await createSubject(prisma);
    const material = await prisma.material.create({
      data: {
        title: `Material ${randomUUID().slice(0, 6)}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId,
        subjectId,
        resourceType: 'OTRO',
      },
    });
    const caso = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: authorId,
      },
    });
    return { material, caso };
  }

  async function resolvedReports(
    reporterId: string,
    confirmed: number,
    dismissed: number,
  ) {
    const author = await createUser(prisma);
    for (const status of [
      ...Array<'CONFIRMED'>(confirmed).fill('CONFIRMED'),
      ...Array<'DISMISSED'>(dismissed).fill('DISMISSED'),
    ]) {
      const { material, caso } = await reportedCase(author.id);
      await prisma.report.create({
        data: {
          caseId: caso.id,
          reporterId,
          reason: 'OTRO',
          targetType: 'MATERIAL',
          materialId: material.id,
          status,
          resolvedAt: daysAgo(5),
        },
      });
    }
  }

  it('shows Sugerir correcciones active at nivel máximo alcanzado 3', async () => {
    const user = await createUser(prisma, 'USER', { maxLevel: 3 });

    const body = await privileges(user);

    expect(body.suggestCorrections).toEqual({ active: true, missing: [] });
    expect(body.standing).toEqual({
      good: true,
      until: null,
      permanent: false,
    });
  });

  it('says how many niveles are missing', async () => {
    const user = await createUser(prisma, 'USER', { maxLevel: 2 });

    expect((await privileges(user)).suggestCorrections).toEqual({
      active: false,
      missing: [{ kind: 'LEVEL', needed: 3, current: 2 }],
    });
  });

  it('says the precision is missing', async () => {
    const user = await createUser(prisma, 'USER', { maxLevel: 1 });
    await resolvedReports(user.id, 5, 4);

    expect((await privileges(user)).priorityReports).toEqual({
      active: false,
      missing: [{ kind: 'PRECISION', needed: 70, current: 56 }],
    });
  });

  it('dates the return of good standing after a silenciamiento', async () => {
    const user = await createUser(prisma, 'USER', { maxLevel: 4 });
    const moderator = await createUser(prisma, 'MODERATOR');
    const ended = daysAgo(60);
    await prisma.sanction.create({
      data: {
        userId: user.id,
        type: 'MUTE',
        reason: 'Insultos',
        startsAt: daysAgo(67),
        endsAt: ended,
        appliedById: moderator.id,
      },
    });

    const body = await privileges(user);

    expect(body.standing.good).toBe(false);
    expect(new Date(body.standing.until!).getTime()).toBe(
      ended.getTime() + 90 * DAY,
    );
    expect(body.suggestCorrections.active).toBe(false);
  });

  it('counts a retiro of anonymous content', async () => {
    const user = await createUser(prisma, 'USER', { maxLevel: 4 });
    const { id: subjectId } = await createSubject(prisma);
    const review = await prisma.courseReview.create({
      data: {
        userId: user.id,
        subjectId,
        recommendation: 1,
        isAnonymous: true,
        publicationStatus: 'REMOVED',
      },
    });
    await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        targetAuthorId: user.id,
        status: 'CLOSED',
        decision: 'REMOVE',
        closedAt: daysAgo(10),
      },
    });

    expect((await privileges(user)).standing.good).toBe(false);
  });

  it('never tells the account whether it may moderate', async () => {
    const user = await createUser(prisma, 'USER', { maxLevel: 7 });

    const body = await privileges(user);

    expect(Object.keys(body).sort()).toEqual([
      'priorityReports',
      'standing',
      'suggestCorrections',
    ]);
    expect(JSON.stringify(body)).not.toMatch(/moder|elegib|eligib/i);
  });

  it('requires a session', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/me/privileges')
      .expect(401);
  });
});
