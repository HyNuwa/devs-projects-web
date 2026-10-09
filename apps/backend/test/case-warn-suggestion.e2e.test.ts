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

describe('«Advertir también» suggestion on a caso (e2e)', () => {
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

  async function caso(author: E2eUser, closedDaysAgo?: number) {
    const material = await prisma.material.create({
      data: {
        title: 'Caso e2e',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        publicationStatus:
          closedDaysAgo === undefined ? 'PUBLISHED' : 'REMOVED',
      },
    });
    return prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: author.id,
        ...(closedDaysAgo === undefined
          ? {}
          : {
              status: 'CLOSED',
              closedAt: new Date(Date.now() - closedDaysAgo * 24 * 3_600_000),
              decision: 'REMOVE',
              decidedById: moderator.id,
              decisionReason: 'x',
            }),
      },
    });
  }

  const detail = async (caseId: string) =>
    (
      await request(app.getHttpServer())
        .get(`/api/v1/moderation/cases/${caseId}`)
        .set('Authorization', bearer(app, moderator))
        .expect(200)
    ).body as { warnSuggested: boolean };

  it('suggests warning when this retiro would be the author’s first in 90 days', async () => {
    const author = await createUser(prisma);
    const open = await caso(author);

    expect((await detail(open.id)).warnSuggested).toBe(true);
  });

  it('does not suggest warning when the author already has a recent retiro', async () => {
    const author = await createUser(prisma);
    await caso(author, 10);
    const open = await caso(author);

    expect((await detail(open.id)).warnSuggested).toBe(false);
  });

  it('never preselects it on an anonymous reseña, whose author’s record it would reveal', async () => {
    const author = await createUser(prisma);
    const review = await prisma.courseReview.create({
      data: {
        userId: author.id,
        subjectId,
        recommendation: 2,
        isAnonymous: true,
        comment: 'Reseña anónima e2e',
      },
    });
    const open = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        targetAuthorId: author.id,
      },
    });

    // No retiros: on signed content this would be preselected.
    expect((await detail(open.id)).warnSuggested).toBe(false);

    // Checking it anyway warns the hidden author, without showing the account.
    const decided = await request(app.getHttpServer())
      .post(`/api/v1/moderation/cases/${open.id}/decision`)
      .set('Authorization', bearer(app, moderator))
      .send({ decision: 'REMOVE', reason: 'Insultos', warn: true })
      .expect(201);
    expect(JSON.stringify(decided.body)).not.toContain(author.id);
    expect(
      await prisma.sanction.count({
        where: { userId: author.id, caseId: open.id, type: 'WARNING' },
      }),
    ).toBe(1);
  });

  it('a signed caso shows a moderator the same author before and after retiring their anonymous reseña', async () => {
    const admin = await createUser(prisma, 'ADMIN');
    const author = await createUser(prisma);
    const signed = await caso(author);
    const review = await prisma.courseReview.create({
      data: {
        userId: author.id,
        subjectId,
        recommendation: 2,
        isAnonymous: true,
        comment: 'Reseña anónima e2e',
      },
    });
    const anonymous = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        targetAuthorId: author.id,
      },
    });
    const view = async (viewer: E2eUser) => {
      const { body } = await request(app.getHttpServer())
        .get(`/api/v1/moderation/cases/${signed.id}`)
        .set('Authorization', bearer(app, viewer))
        .expect(200);
      return {
        warnSuggested: body.warnSuggested as boolean,
        author: body.author as Record<string, unknown>,
      };
    };
    const before = await view(moderator);
    expect(before).toEqual(
      expect.objectContaining({
        warnSuggested: true,
        author: expect.objectContaining({ removalsLast90Days: 0 }),
      }),
    );

    await request(app.getHttpServer())
      .post(`/api/v1/moderation/cases/${anonymous.id}/decision`)
      .set('Authorization', bearer(app, moderator))
      .send({ decision: 'REMOVE', reason: 'Insultos', warn: true })
      .expect(201);

    expect(await view(moderator)).toEqual(before);
    expect(await view(admin)).toEqual(
      expect.objectContaining({
        warnSuggested: false,
        author: expect.objectContaining({ removalsLast90Days: 1 }),
      }),
    );
  });

  it('does not suggest warning an author the viewer may not sanction', async () => {
    const staffAuthor = await createUser(prisma, 'MODERATOR');
    const open = await caso(staffAuthor);

    expect((await detail(open.id)).warnSuggested).toBe(false);
  });
});
