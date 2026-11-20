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

type QueueGroups = { reported: { caseId: string }[] };

/** Reportes prioritarios (openspec reputation/trust-privileges). */
describe('priority reportes (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function material(authorId: string) {
    const { id: subjectId } = await createSubject(prisma);
    return prisma.material.create({
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
  }

  /** Reportes resolved 5 days ago, on other materials. */
  async function history(
    reporterId: string,
    confirmed: number,
    dismissed: number,
  ) {
    const author = await createUser(prisma);
    const statuses = [
      ...Array<'CONFIRMED'>(confirmed).fill('CONFIRMED'),
      ...Array<'DISMISSED'>(dismissed).fill('DISMISSED'),
    ];
    for (const status of statuses) {
      const target = await material(author.id);
      const caso = await prisma.moderationCase.create({
        data: {
          kind: 'REPORTS',
          targetType: 'MATERIAL',
          materialId: target.id,
          targetAuthorId: author.id,
          status: 'CLOSED',
          closedAt: new Date(Date.now() - 5 * 86_400_000),
        },
      });
      await prisma.report.create({
        data: {
          caseId: caso.id,
          reporterId,
          reason: 'OTRO',
          targetType: 'MATERIAL',
          materialId: target.id,
          status,
          resolvedAt: new Date(Date.now() - 5 * 86_400_000),
        },
      });
    }
  }

  const report = (user: E2eUser, targetId: string) =>
    http()
      .post('/api/v1/reports')
      .set('Authorization', bearer(app, user))
      .send({ targetType: 'MATERIAL', targetId, reason: 'NO_RELACIONADO' })
      .expect(202);

  const storedReport = (reporterId: string, materialId: string) =>
    prisma.report.findFirstOrThrow({ where: { reporterId, materialId } });

  it('flags the reporte of a precise reporter in good standing', async () => {
    const reporter = await createUser(prisma);
    await history(reporter.id, 6, 2);
    const author = await createUser(prisma);
    const target = await material(author.id);

    await report(reporter, target.id);

    expect((await storedReport(reporter.id, target.id)).priority).toBe(true);
  });

  it('does not flag an imprecise reporter or one out of good standing', async () => {
    const imprecise = await createUser(prisma);
    await history(imprecise.id, 5, 4);
    const sanctioned = await createUser(prisma);
    await history(sanctioned.id, 9, 0);
    const moderator = await createUser(prisma, 'MODERATOR');
    await prisma.sanction.create({
      data: {
        userId: sanctioned.id,
        type: 'MUTE',
        reason: 'Insultos',
        startsAt: new Date(Date.now() - 20 * 86_400_000),
        endsAt: new Date(Date.now() - 13 * 86_400_000),
        appliedById: moderator.id,
      },
    });
    const author = await createUser(prisma);
    const target = await material(author.id);

    await report(imprecise, target.id);
    await report(sanctioned, target.id);

    expect((await storedReport(imprecise.id, target.id)).priority).toBe(false);
    expect((await storedReport(sanctioned.id, target.id)).priority).toBe(false);
  });

  it('keeps the flag when the reporter loses the privilege later', async () => {
    const reporter = await createUser(prisma);
    await history(reporter.id, 5, 0);
    const author = await createUser(prisma);
    const target = await material(author.id);
    await report(reporter, target.id);

    await history(reporter.id, 0, 6);

    expect((await storedReport(reporter.id, target.id)).priority).toBe(true);
  });

  it('orders the queue by it and never shows reporters or the flag', async () => {
    const moderator = await createUser(prisma, 'MODERATOR');
    const precise = await createUser(prisma);
    await history(precise.id, 6, 0);
    const plain = await createUser(prisma);
    const author = await createUser(prisma);
    const first = await material(author.id);
    const second = await material(author.id);
    await report(plain, first.id);
    await report(precise, second.id);
    const cases = await prisma.moderationCase.findMany({
      where: { materialId: { in: [first.id, second.id] }, status: 'OPEN' },
      select: { id: true, materialId: true },
    });
    const caseOf = (materialId: string) =>
      cases.find((entry) => entry.materialId === materialId)!.id;

    const { body } = await http()
      .get('/api/v1/moderation/cases')
      .set('Authorization', bearer(app, moderator))
      .expect(200);
    const order = (body as QueueGroups).reported.map((entry) => entry.caseId);

    expect(order.indexOf(caseOf(second.id))).toBeLessThan(
      order.indexOf(caseOf(first.id)),
    );
    const { body: detail } = await http()
      .get(`/api/v1/moderation/cases/${caseOf(second.id)}`)
      .set('Authorization', bearer(app, moderator))
      .expect(200);
    const raw = JSON.stringify(detail);
    expect(raw).not.toContain(precise.id);
    expect(raw).not.toMatch(/"priority"|priorityReport/);
  });
});
