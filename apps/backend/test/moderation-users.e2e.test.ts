import type { NestExpressApplication } from '@nestjs/platform-express';
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

const DAY = 24 * 3_600_000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);

describe('Usuarios tab (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let moderator: E2eUser;
  let admin: E2eUser;
  let subjectId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    moderator = await createUser(prisma, 'MODERATOR');
    admin = await createUser(prisma, 'ADMIN');
    ({ id: subjectId } = await createSubject(prisma));
  });

  afterAll(async () => {
    await app.close();
  });

  const get = (user: E2eUser, path: string) =>
    request(app.getHttpServer())
      .get(`/api/v1/moderation${path}`)
      .set('Authorization', bearer(app, user))
      .expect(200);

  /** A material by `author` retired `days` ago through a closed caso. */
  async function retiredMaterial(author: E2eUser, days: number) {
    const material = await prisma.material.create({
      data: {
        title: `Retirado ${days}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        publicationStatus: 'REMOVED',
      },
    });
    return prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: author.id,
        status: 'CLOSED',
        openedAt: daysAgo(days + 1),
        closedAt: daysAgo(days),
        decision: 'REMOVE',
        decidedById: admin.id,
        decisionReason: 'Copia',
      },
    });
  }

  it('shows the file of an account with two retiros: suggested step and allowed actions', async () => {
    const student = await createUser(prisma);
    const first = await retiredMaterial(student, 40);
    await retiredMaterial(student, 2);
    await prisma.sanction.create({
      data: {
        userId: student.id,
        type: 'WARNING',
        reason: 'Primer retiro',
        startsAt: daysAgo(40),
        appliedById: admin.id,
        caseId: first.id,
      },
    });

    const { body } = await get(moderator, `/users/${student.id}`);

    expect(body).toEqual(
      expect.objectContaining({
        id: student.id,
        emailVerified: true,
        suggestedStep: 'MUTE',
        counts: expect.objectContaining({ retiros90d: 2 }),
        reportPrecision: null,
        status: expect.objectContaining({ kind: 'WARNED' }),
      }),
    );
    expect(body.emailMasked).toMatch(/^e••••@devsproject\.test$/);
    expect(body.actions).toEqual(
      expect.arrayContaining(['WARN', 'MUTE', 'PROPOSE_SUSPENSION']),
    );
    expect(body.actions).not.toContain('SUSPEND');
    expect(body).not.toHaveProperty('email');
  });

  it('shows report precision only with at least 5 resolved reportes', async () => {
    const reporter = await createUser(prisma);
    const author = await createUser(prisma);
    for (const [index, status] of [
      'CONFIRMED',
      'CONFIRMED',
      'CONFIRMED',
      'CONFIRMED',
      'DISMISSED',
    ].entries()) {
      const moderationCase = await retiredMaterial(author, 10 + index);
      await prisma.report.create({
        data: {
          caseId: moderationCase.id,
          reporterId: reporter.id,
          reason: 'SPAM_O_REPETIDO',
          status: status as 'CONFIRMED',
          targetType: 'MATERIAL',
          materialId: moderationCase.materialId,
          resolvedAt: daysAgo(1),
        },
      });
    }

    const { body } = await get(moderator, `/users/${reporter.id}`);

    expect(body.reportPrecision).toBeCloseTo(0.8);
  });

  it('never links an account to its anonymous entries', async () => {
    const student = await createUser(prisma);
    const review = await prisma.courseReview.create({
      data: {
        userId: student.id,
        subjectId,
        recommendation: 1,
        isAnonymous: true,
        comment: 'Anónima e2e',
        publicationStatus: 'REMOVED',
      },
    });
    const anonymousCase = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        targetAuthorId: student.id,
        status: 'CLOSED',
        closedAt: daysAgo(1),
        decision: 'REMOVE',
        decidedById: admin.id,
        decisionReason: 'Insultos',
      },
    });
    await prisma.sanction.create({
      data: {
        userId: student.id,
        type: 'WARNING',
        reason: 'Insultos',
        appliedById: admin.id,
        caseId: anonymousCase.id,
      },
    });

    const { body } = await get(moderator, `/users/${student.id}`);

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(anonymousCase.id);
    expect(serialized).not.toContain(review.id);
    expect(body.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'SANCTION',
          kind: 'WARNING',
          anonymousCase: true,
        }),
      ]),
    );
  });

  it('filters the list and finds accounts by username', async () => {
    const suggested = await createUser(prisma);
    await retiredMaterial(suggested, 1);
    const silenced = await createUser(prisma, 'USER', {
      isMuted: true,
      mutedUntil: new Date(Date.now() + 3 * DAY),
    });
    await prisma.sanction.create({
      data: {
        userId: silenced.id,
        type: 'MUTE',
        reason: 'x',
        endsAt: new Date(Date.now() + 3 * DAY),
        appliedById: admin.id,
      },
    });

    const ids = (body: { users: Array<{ id: string }> }) =>
      body.users.map((user) => user.id);
    expect(
      ids((await get(moderator, '/users?filter=suggested')).body),
    ).toContain(suggested.id);
    expect(
      ids((await get(moderator, '/users?filter=sanctioned')).body),
    ).toContain(silenced.id);
    const found = await prisma.user.findUniqueOrThrow({
      where: { id: silenced.id },
    });
    expect(
      ids(
        (await get(moderator, `/users?q=${found.username.slice(0, 10)}`)).body,
      ),
    ).toContain(silenced.id);
  });

  it('lists pending suspension proposals only for admins', async () => {
    const student = await createUser(prisma);
    await request(app.getHttpServer())
      .post(`/api/v1/moderation/users/${student.id}/suspension-proposals`)
      .set('Authorization', bearer(app, moderator))
      .send({ reason: 'Reincide', duration: '30_DAYS' })
      .expect(201);

    const forAdmin = (await get(admin, '/users?filter=suggested')).body;
    expect(forAdmin.proposals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user: expect.objectContaining({ id: student.id }),
          reason: 'Reincide',
          durationDays: 30,
        }),
      ]),
    );
    expect(
      (await get(moderator, '/users?filter=suggested')).body.proposals,
    ).toBeNull();
  });
});
