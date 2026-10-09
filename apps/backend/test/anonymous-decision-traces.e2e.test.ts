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

/**
 * Deciding a caso about anonymous content leaves no account-level trace a
 * moderator can compare before and after: points, level, the account row, or a
 * history entry that exists only for some authors (openspec moderation/sanctions).
 */
describe('decisions on anonymous content leave no trace of the author (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let moderator: E2eUser;
  let otherModerator: E2eUser;
  let admin: E2eUser;
  let subjectId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    moderator = await createUser(prisma, 'MODERATOR');
    otherModerator = await createUser(prisma, 'MODERATOR');
    admin = await createUser(prisma, 'ADMIN');
    ({ id: subjectId } = await createSubject(prisma));
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (user: E2eUser) => ({
    get: (path: string) =>
      request(app.getHttpServer())
        .get(`/api/v1${path}`)
        .set('Authorization', bearer(app, user))
        .expect(200),
    post: (path: string, body: object) =>
      request(app.getHttpServer())
        .post(`/api/v1${path}`)
        .set('Authorization', bearer(app, user))
        .send(body),
  });

  /** An anonymous reseña by `author` that earned its points, with an open caso. */
  async function anonymousReview(author: E2eUser) {
    const review = await prisma.courseReview.create({
      data: {
        userId: author.id,
        subjectId,
        recommendation: 2,
        isAnonymous: true,
        comment: 'Reseña anónima e2e',
      },
    });
    await prisma.pointTransaction.create({
      data: {
        userId: author.id,
        amount: 5,
        reason: 'COURSE_REVIEWED',
        referenceId: review.id,
      },
    });
    await prisma.user.update({
      where: { id: author.id },
      data: { points: { increment: 5 } },
    });
    const moderationCase = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        targetAuthorId: author.id,
      },
    });
    return { review, moderationCase };
  }

  const account = (user: E2eUser) =>
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { points: true, level: true, updatedAt: true },
    });

  it('retiring and restoring an anonymous reseña moves no points of its author', async () => {
    const author = await createUser(prisma);
    const { review, moderationCase } = await anonymousReview(author);
    const before = await account(author);
    const ranking = async () =>
      (await request(app.getHttpServer()).get('/api/v1/ranking').expect(200))
        .body as unknown;
    const rankingBefore = await ranking();

    await as(moderator)
      .post(`/moderation/cases/${moderationCase.id}/decision`, {
        decision: 'REMOVE',
        reason: 'Insultos',
        warn: true,
      })
      .expect(201);
    expect(await account(author)).toEqual(before);
    expect(await ranking()).toEqual(rankingBefore);

    await as(otherModerator)
      .post(`/moderation/cases/${moderationCase.id}/decision`, {
        decision: 'RESTORE',
        reason: 'No había insultos',
      })
      .expect(201);
    expect(await account(author)).toEqual(before);
    expect(
      await prisma.pointTransaction.count({
        where: { referenceId: review.id },
      }),
    ).toBe(1);
  });

  it('an accepted appeal of an anonymous retiro moves no points either', async () => {
    const author = await createUser(prisma);
    const { moderationCase } = await anonymousReview(author);
    await as(moderator)
      .post(`/moderation/cases/${moderationCase.id}/decision`, {
        decision: 'REMOVE',
        reason: 'Insultos',
      })
      .expect(201);
    const before = await account(author);
    await as(author)
      .post('/me/appeals', {
        kind: 'RETIRO',
        caseId: moderationCase.id,
        explanation: 'No insulté a nadie.',
      })
      .expect(201);
    const appeal = await prisma.appeal.findUniqueOrThrow({
      where: { caseId: moderationCase.id },
    });

    await as(admin)
      .post(`/moderation/appeals/${appeal.id}/answer`, {
        accept: true,
        answer: 'Se restituye.',
      })
      .expect(201);

    expect(await account(author)).toEqual(before);
  });

  it('a moderator’s history is the same whether «Advertir también» warned the hidden author or not', async () => {
    const student = await createUser(prisma);
    const staff = await createUser(prisma, 'MODERATOR');
    const studentCase = (await anonymousReview(student)).moderationCase;
    const staffCase = (await anonymousReview(staff)).moderationCase;
    for (const moderationCase of [studentCase, staffCase]) {
      await as(moderator)
        .post(`/moderation/cases/${moderationCase.id}/decision`, {
          decision: 'REMOVE',
          reason: 'Insultos',
          warn: true,
        })
        .expect(201);
    }
    // The student was warned; the staff author could not be, silently.
    expect(
      await prisma.sanction.count({ where: { caseId: studentCase.id } }),
    ).toBe(1);
    expect(
      await prisma.sanction.count({ where: { caseId: staffCase.id } }),
    ).toBe(0);
    const warnedEvent = await prisma.moderationEvent.findFirstOrThrow({
      where: { caseId: studentCase.id, action: 'WARNED' },
    });

    const ids = (body: { items: Array<{ id: string }> }) =>
      body.items.map((item) => item.id);
    for (const viewer of [moderator, otherModerator]) {
      for (const query of ['', '?action=WARNED', `?actorId=${moderator.id}`]) {
        const { body } = await as(viewer).get(`/moderation/history${query}`);
        expect(ids(body)).not.toContain(warnedEvent.id);
      }
    }
    const forAdmin = await as(admin).get('/moderation/history?action=WARNED');
    expect(ids(forAdmin.body)).toContain(warnedEvent.id);
  });
});
