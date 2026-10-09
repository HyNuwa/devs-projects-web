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
const REFUSAL =
  'Reportaste contenido de esta cuenta: lo resuelve otra persona de moderación';

/**
 * Sanctioning from Usuarios, with no caso, still respects the conflict of
 * interest of having reported the account's content (openspec moderation/sanctions).
 */
describe('conflict of interest when sanctioning from Usuarios (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let moderator: E2eUser;
  let subjectId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    moderator = await createUser(prisma, 'MODERATOR');
    ({ id: subjectId } = await createSubject(prisma));
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (path: string, body: object) =>
    request(app.getHttpServer())
      .post(`/api/v1/moderation${path}`)
      .set('Authorization', bearer(app, moderator))
      .send(body);

  async function reportMaterial(author: E2eUser, daysAgo: number) {
    const material = await prisma.material.create({
      data: {
        title: 'Material e2e',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
      },
    });
    const caso = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: author.id,
      },
    });
    await prisma.report.create({
      data: {
        caseId: caso.id,
        reporterId: moderator.id,
        reason: 'SPAM_O_REPETIDO',
        targetType: 'MATERIAL',
        materialId: material.id,
        createdAt: new Date(Date.now() - daysAgo * DAY),
      },
    });
  }

  async function reportAnonymousReview(author: E2eUser) {
    const review = await prisma.courseReview.create({
      data: {
        userId: author.id,
        subjectId,
        recommendation: 2,
        isAnonymous: true,
        comment: 'Reseña e2e',
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
    await prisma.report.create({
      data: {
        caseId: caso.id,
        reporterId: moderator.id,
        reason: 'INSULTOS_O_ACOSO',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
      },
    });
  }

  function expectConflict(response: request.Response) {
    expect(response.status).toBe(403);
    expect(response.body).toEqual(
      expect.objectContaining({
        code: 'CONFLICT_OF_INTEREST',
        message: REFUSAL,
      }),
    );
  }

  it('refuses warning, silencing and proposing after reporting the account’s material', async () => {
    const author = await createUser(prisma);
    await reportMaterial(author, 10);

    expectConflict(
      await post(`/users/${author.id}/warn`, { reason: 'Advertencia.' }),
    );
    expectConflict(
      await post(`/users/${author.id}/mute`, { reason: 'Silencio.' }),
    );
    expectConflict(
      await post(`/users/${author.id}/suspension-proposals`, {
        reason: 'Propuesta.',
        duration: '30_DAYS',
      }),
    );
    expect(await prisma.sanction.count({ where: { userId: author.id } })).toBe(
      0,
    );
  });

  it('refuses any request that names a caso, the same way for its author and for another account', async () => {
    const author = await createUser(prisma);
    const other = await createUser(prisma);
    // A caso about the author's anonymous reseña that the moderator did not report.
    const review = await prisma.courseReview.create({
      data: {
        userId: author.id,
        subjectId,
        recommendation: 2,
        isAnonymous: true,
        comment: 'Reseña e2e',
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
    const observable = (response: request.Response) => {
      const { timestamp, path, ...body } = response.body as Record<
        string,
        unknown
      >;
      expect(typeof timestamp).toBe('string');
      expect(typeof path).toBe('string');
      return { status: response.status, body };
    };
    const attempts = (account: E2eUser) => [
      post(`/users/${account.id}/warn`, {
        reason: 'Advertencia.',
        caseId: caso.id,
      }),
      post(`/users/${account.id}/mute`, {
        reason: 'Silencio.',
        caseId: caso.id,
      }),
      post(`/users/${account.id}/suspension-proposals`, {
        reason: 'Propuesta.',
        duration: '30_DAYS',
        caseId: caso.id,
      }),
    ];

    const forAuthor = await Promise.all(attempts(author));
    const forOther = await Promise.all(attempts(other));

    expect(forAuthor.map(observable)).toEqual(forOther.map(observable));
    for (const response of forAuthor) {
      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: ['property caseId should not exist'],
        }),
      );
    }
    const accounts = { userId: { in: [author.id, other.id] } };
    expect(await prisma.sanction.count({ where: accounts })).toBe(0);
    expect(await prisma.suspensionProposal.count({ where: accounts })).toBe(0);
    expect(
      await prisma.moderationEvent.count({
        where: { targetUserId: { in: [author.id, other.id] } },
      }),
    ).toBe(0);
  });

  it('does not let a report on anonymous content block, so it reveals nothing', async () => {
    const author = await createUser(prisma);
    await reportAnonymousReview(author);

    await post(`/users/${author.id}/warn`, { reason: 'Advertencia.' }).expect(
      201,
    );
  });

  it('forgets reports older than 90 days', async () => {
    const author = await createUser(prisma);
    await reportMaterial(author, 91);

    await post(`/users/${author.id}/warn`, { reason: 'Advertencia.' }).expect(
      201,
    );
  });
});
