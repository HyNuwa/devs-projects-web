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

/** Confirmed reportes earn points (openspec reputation/points). */
describe('points for confirmed reportes (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let moderator: E2eUser;
  let reviewer: E2eUser;
  let subjectId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    moderator = await createUser(prisma, 'ADMIN');
    reviewer = await createUser(prisma, 'ADMIN');
    ({ id: subjectId } = await createSubject(prisma));
  });

  afterAll(async () => {
    await app.close();
  });

  /** A reseña reported by `reporters`, with its open caso. */
  async function reportedReview(reporters: E2eUser[], isAnonymous = false) {
    const author = await createUser(prisma);
    const review = await prisma.courseReview.create({
      data: {
        userId: author.id,
        subjectId,
        recommendation: 1,
        isAnonymous,
        comment: 'Reseña reportada e2e',
      },
    });
    const caso = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        targetAuthorId: author.id,
      },
    });
    for (const reporter of reporters) {
      await prisma.report.create({
        data: {
          caseId: caso.id,
          reporterId: reporter.id,
          reason: 'INSULTOS_O_ACOSO',
          targetType: 'COURSE_REVIEW',
          courseReviewId: review.id,
        },
      });
    }
    return { author, caso };
  }

  const decide = (
    caseId: string,
    decision: 'REMOVE' | 'RESTORE' | 'KEEP_VISIBLE',
    by = moderator,
  ) =>
    request(app.getHttpServer())
      .post(`/api/v1/moderation/cases/${caseId}/decision`)
      .set('Authorization', bearer(app, by))
      .send({ decision, reason: 'Decisión e2e con su motivo.' })
      .expect(201);

  async function reportPoints(user: E2eUser) {
    const rows = await prisma.pointTransaction.findMany({
      where: { userId: user.id, reason: 'REPORT_CONFIRMED' },
      select: { amount: true },
    });
    return rows.reduce((sum, row) => sum + row.amount, 0);
  }

  it('awards 2 to each reporter when the reported content is retired', async () => {
    const reporters = [await createUser(prisma), await createUser(prisma)];
    const { caso } = await reportedReview(reporters);

    await decide(caso.id, 'REMOVE');

    for (const reporter of reporters) {
      expect(await reportPoints(reporter)).toBe(2);
    }
  });

  it('awards nothing when the content is kept', async () => {
    const reporter = await createUser(prisma);
    const { caso } = await reportedReview([reporter]);

    await decide(caso.id, 'KEEP_VISIBLE');

    expect(await reportPoints(reporter)).toBe(0);
  });

  it('awards it for anonymous content too, and moves nothing for its author', async () => {
    const reporter = await createUser(prisma);
    const { author, caso } = await reportedReview([reporter], true);

    await decide(caso.id, 'REMOVE');

    expect(await reportPoints(reporter)).toBe(2);
    expect(
      await prisma.pointTransaction.count({ where: { userId: author.id } }),
    ).toBe(0);
  });

  it('caps the points from confirmed reportes at 10 per week', async () => {
    const reporter = await createUser(prisma);
    for (let i = 0; i < 6; i += 1) {
      const { caso } = await reportedReview([reporter]);
      await decide(caso.id, 'REMOVE');
    }

    expect(await reportPoints(reporter)).toBe(10);
  });

  it('reverts the points when the retiro is restored', async () => {
    const reporter = await createUser(prisma);
    const { caso } = await reportedReview([reporter]);
    await decide(caso.id, 'REMOVE');

    await decide(caso.id, 'RESTORE', reviewer);

    expect(await reportPoints(reporter)).toBe(0);
  });

  it('reverts the points when the retiro is overturned on appeal', async () => {
    const reporter = await createUser(prisma);
    const { author, caso } = await reportedReview([reporter]);
    await decide(caso.id, 'REMOVE');

    await request(app.getHttpServer())
      .post('/api/v1/me/appeals')
      .set('Authorization', bearer(app, author))
      .send({
        kind: 'RETIRO',
        caseId: caso.id,
        explanation: 'No insulté a nadie en la reseña.',
      })
      .expect(201);
    const appeal = await prisma.appeal.findUniqueOrThrow({
      where: { caseId: caso.id },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/moderation/appeals/${appeal.id}/answer`)
      .set('Authorization', bearer(app, reviewer))
      .send({ accept: true, answer: 'Se restituye la reseña.' })
      .expect(201);

    expect(await reportPoints(reporter)).toBe(0);
  });
});
