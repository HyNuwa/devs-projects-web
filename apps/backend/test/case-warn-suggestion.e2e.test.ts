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
});
