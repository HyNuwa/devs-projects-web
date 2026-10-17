import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { rebuildPoints } from '../src/modules/ranking/rebuild-points';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  createE2eApp,
  createSubject,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/** Points are rebuilt with the ledger's rules (openspec reputation/points). */
describe('rebuild-points (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  afterAll(async () => {
    await app.close();
  });

  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

  /**
   * An account with legacy points: a signed final with 4 «Me sirvió» (pioneer of
   * its materia), an anonymous reseña that earned 5 before the ledger, a guía, a
   * confirmed reporte, and a stale total.
   */
  async function legacyAccount() {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const final = await prisma.material.create({
      data: {
        title: `Final ${randomUUID().slice(0, 6)}`,
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        resourceType: 'FINAL',
        createdAt: daysAgo(30),
      },
    });
    for (let i = 0; i < 4; i += 1) {
      const giver = await createUser(prisma);
      await prisma.materialHelpfulness.create({
        data: {
          userId: giver.id,
          materialId: final.id,
          createdAt: daysAgo(20 - i),
        },
      });
    }
    const anonymous = await prisma.courseReview.create({
      data: {
        userId: author.id,
        subjectId,
        recommendation: 2,
        isAnonymous: true,
        createdAt: daysAgo(10),
      },
    });
    const reported = await createUser(prisma);
    const review = await prisma.courseReview.create({
      data: {
        userId: reported.id,
        subjectId,
        recommendation: 1,
        publicationStatus: 'REMOVED',
      },
    });
    const caso = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        targetAuthorId: reported.id,
        status: 'CLOSED',
        decision: 'REMOVE',
        closedAt: daysAgo(5),
      },
    });
    await prisma.report.create({
      data: {
        caseId: caso.id,
        reporterId: author.id,
        reason: 'INSULTOS_O_ACOSO',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        status: 'CONFIRMED',
        createdAt: daysAgo(6),
      },
    });
    await prisma.pointTransaction.createMany({
      data: [
        {
          userId: author.id,
          reason: 'COURSE_REVIEWED',
          amount: 5,
          referenceId: anonymous.id,
          idempotencyKey: `legacy:${randomUUID()}`,
        },
        {
          userId: author.id,
          reason: 'GUIDE_CREATED',
          amount: 15,
          referenceId: randomUUID(),
          idempotencyKey: `legacy:${randomUUID()}`,
        },
        {
          userId: author.id,
          reason: 'LEGACY_ADJUSTMENT',
          amount: 120,
          idempotencyKey: `legacy:${randomUUID()}`,
        },
      ],
    });
    await prisma.user.update({
      where: { id: author.id },
      data: { points: 140, level: 4 },
    });
    return { author, final };
  }

  async function ledgerOf(user: E2eUser) {
    const [account, movements] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { points: true, level: true },
      }),
      prisma.pointTransaction.findMany({
        where: { userId: user.id },
        orderBy: [{ createdAt: 'asc' }, { reason: 'asc' }],
        select: { reason: true, amount: true },
      }),
    ]);
    return { ...account, movements };
  }

  it('changes nothing on a dry run, and reports what it would do', async () => {
    const { author } = await legacyAccount();
    const before = await ledgerOf(author);

    const report = await rebuildPoints(prisma, { userIds: [author.id] });

    expect(await ledgerOf(author)).toEqual(before);
    expect(report).toEqual([
      expect.objectContaining({ userId: author.id, before: 140, after: 36 }),
    ]);
  });

  it('rebuilds an account with the ledger rules when applied', async () => {
    const { author } = await legacyAccount();

    await rebuildPoints(prisma, { userIds: [author.id], apply: true });

    const { points, level, movements } = await ledgerOf(author);
    // 15 (guía kept) + 10 (final) + 4 «Me sirvió» + 5 pioneer + 2 reporte; the
    // anonymous reseña and the legacy adjustment are gone.
    expect(points).toBe(36);
    expect(level).toBe(2);
    expect(movements.map((m) => m.reason).sort()).toEqual([
      'GUIDE_CREATED',
      'HELPFUL_RECEIVED',
      'HELPFUL_RECEIVED',
      'HELPFUL_RECEIVED',
      'HELPFUL_RECEIVED',
      'MATERIAL_PIONEER',
      'MATERIAL_PUBLISHED',
      'REPORT_CONFIRMED',
    ]);
    expect(points).toBe(movements.reduce((sum, m) => sum + m.amount, 0));
  });

  it('gives the same result when applied twice', async () => {
    const { author } = await legacyAccount();

    await rebuildPoints(prisma, { userIds: [author.id], apply: true });
    const first = await ledgerOf(author);
    await rebuildPoints(prisma, { userIds: [author.id], apply: true });

    expect(await ledgerOf(author)).toEqual(first);
  });

  it('counts each «Me sirvió» in its own day, whatever order the materials come in', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const newMaterial = (createdAt: Date) =>
      prisma.material.create({
        data: {
          title: `Apunte ${randomUUID().slice(0, 6)}`,
          fileUrl: 'https://drive.example.com/e2e',
          fileType: 'pdf',
          fileSize: BigInt(1000),
          authorId: author.id,
          subjectId,
          resourceType: 'OTRO',
          createdAt,
        },
      });
    // Older material, marked recently; newer material, marked long ago.
    const older = await newMaterial(daysAgo(60));
    const newer = await newMaterial(daysAgo(50));
    const mark = async (materialId: string, when: Date) => {
      const giver = await createUser(prisma);
      await prisma.materialHelpfulness.create({
        data: { userId: giver.id, materialId, createdAt: when },
      });
    };
    for (let i = 0; i < 20; i += 1) await mark(older.id, daysAgo(2));
    for (let i = 0; i < 5; i += 1) await mark(newer.id, daysAgo(40));

    await rebuildPoints(prisma, { userIds: [author.id], apply: true });

    const helpful = await prisma.pointTransaction.count({
      where: { userId: author.id, reason: 'HELPFUL_RECEIVED' },
    });
    expect(helpful).toBe(25);
  });

  it('keeps the points of content hidden while moderation reviews it', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    await prisma.material.create({
      data: {
        title: 'Resumen oculto mientras se revisa',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        resourceType: 'OTRO',
        publicationStatus: 'HIDDEN',
        hiddenAt: new Date(),
      },
    });

    await rebuildPoints(prisma, { userIds: [author.id], apply: true });

    expect((await ledgerOf(author)).points).toBe(10);
  });

  it('also awards the insignias already met, seasonal ones included, all as seen', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    await prisma.material.create({
      data: {
        title: 'Final con insignia',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId: author.id,
        subjectId,
        resourceType: 'OTRO',
      },
    });
    await prisma.examExperience.create({
      data: {
        userId: author.id,
        subjectId,
        year: 2025,
        session: 'DICIEMBRE',
        format: 'ESCRITO',
        // Shared during the December 2025 mesas.
        createdAt: new Date('2025-12-15T15:00:00.000Z'),
      },
    });

    await rebuildPoints(prisma, { userIds: [author.id], apply: true });

    const rows = await prisma.userBadge.findMany({
      where: { userId: author.id },
      select: { seenAt: true, badge: { select: { slug: true } } },
    });
    const slugs = rows.map((row) => row.badge.slug);
    expect(slugs).toContain('primer-aporte');
    expect(slugs).toContain('mesa-de-diciembre');
    expect(rows.every((row) => row.seenAt !== null)).toBe(true);
  });
});
