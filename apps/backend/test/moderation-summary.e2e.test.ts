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

type Summary = {
  overdueCases: number;
  openCases: number;
  pendingAppeals: number;
  pendingProposals: number | null;
};

describe('moderation queue deadlines and panel summary (e2e)', () => {
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

  const summary = async (user: E2eUser) =>
    (await get(user, '/summary')).body as Summary;

  /** A material hidden `hoursAgo` with its open caso. */
  async function hiddenCaso(hoursAgo: number) {
    const author = await createUser(prisma);
    const hiddenAt = new Date(Date.now() - hoursAgo * 3_600_000);
    const material = await prisma.material.create({
      data: {
        title: 'Oculto e2e',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        publicationStatus: 'HIDDEN',
        hiddenAt,
      },
    });
    return prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: author.id,
        openedAt: hiddenAt,
      },
    });
  }

  it('puts hidden content unreviewed for 48 hours in Vencidos and counts it', async () => {
    const before = await summary(admin);
    const late = await hiddenCaso(50);
    const recent = await hiddenCaso(2);

    const { body } = await get(moderator, '/cases');
    const ids = (group: Array<{ caseId: string }>) =>
      group.map((entry) => entry.caseId);
    expect(ids(body.vencidos)).toContain(late.id);
    expect(ids(body.hidden)).toContain(recent.id);
    expect(ids(body.hidden)).not.toContain(late.id);

    const after = await summary(admin);
    expect(after.overdueCases).toBe(before.overdueCases + 1);
    expect(after.openCases).toBe(before.openCases + 2);
  });

  it('counts the appeals each viewer may answer', async () => {
    const decider = await createUser(prisma, 'MODERATOR');
    const student = await createUser(prisma);
    const before = await summary(moderator);
    const sanction = await prisma.sanction.create({
      data: {
        userId: student.id,
        type: 'WARNING',
        reason: 'x',
        appliedById: decider.id,
      },
    });
    await prisma.appeal.create({
      data: {
        appellantId: student.id,
        kind: 'SANCTION',
        sanctionId: sanction.id,
        explanation: 'y',
        decidedById: decider.id,
      },
    });

    expect((await summary(moderator)).pendingAppeals).toBe(
      before.pendingAppeals + 1,
    );
    expect((await summary(decider)).pendingAppeals).toBe(before.pendingAppeals);
  });

  it('counts pending suspension proposals only for admins', async () => {
    const student = await createUser(prisma);
    const before = await summary(admin);
    await request(app.getHttpServer())
      .post(`/api/v1/moderation/users/${student.id}/suspension-proposals`)
      .set('Authorization', bearer(app, moderator))
      .send({ reason: 'Reincide', duration: '7_DAYS' })
      .expect(201);

    expect((await summary(admin)).pendingProposals).toBe(
      (before.pendingProposals ?? 0) + 1,
    );
    expect((await summary(moderator)).pendingProposals).toBeNull();
  });
});
