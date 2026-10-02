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

  it('refuses it too when a different caso about the account is named', async () => {
    const author = await createUser(prisma);
    await reportMaterial(author, 10);
    // A caso about the account that the moderator did not report.
    const material = await prisma.material.create({
      data: {
        title: 'Otro material e2e',
        fileUrl: 'https://drive.example.com/e2e-otro',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
      },
    });
    const other = await prisma.moderationCase.create({
      data: {
        kind: 'PRIOR_REVIEW',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: author.id,
      },
    });

    expectConflict(
      await post(`/users/${author.id}/warn`, {
        reason: 'Advertencia.',
        caseId: other.id,
      }),
    );
    expectConflict(
      await post(`/users/${author.id}/mute`, {
        reason: 'Silencio.',
        caseId: other.id,
      }),
    );
    expectConflict(
      await post(`/users/${author.id}/suspension-proposals`, {
        reason: 'Propuesta.',
        duration: '30_DAYS',
        caseId: other.id,
      }),
    );
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
