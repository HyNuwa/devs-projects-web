import type { PrismaClient, Prisma } from '../../generated/prisma';
import { ConfigService } from '@nestjs/config';

import type { PrismaService } from '../../prisma/prisma.service';
import { BadgeService } from './badges/badge.service';
import { ContributionPoints } from './contribution-points';
import { HelpfulPoints } from './helpful-points';
import { PioneerBonus } from './pioneer-bonus';
import { PointLedger } from './point-ledger';
import { levelForPoints } from './rpg-levels';

type Tx = Prisma.TransactionClient;

export type RebuildRow = { userId: string; before: number; after: number };

class DryRun extends Error {}

const REPORT_POINTS = 2;

/**
 * Rebuilds accounts' movimientos, points and level from their current published
 * (or hidden while moderation reviews it, which keeps its points)
 * content, «Me sirvió» and confirmed reportes, with the ledger's rules
 * (openspec reputation/points). Legacy guía points are kept. A dry run (the
 * default) rolls each account back and only reports. Applied, it also awards
 * the insignias each account already meets (openspec reputation/badges).
 *
 * Each account is rebuilt on its own: every rule and cap is about the account
 * that earns, so other accounts are never touched.
 */
export async function rebuildPoints(
  prisma: PrismaClient,
  options: { userIds?: string[]; apply?: boolean } = {},
): Promise<RebuildRow[]> {
  const ledger = new PointLedger();
  const pioneer = new PioneerBonus(ledger);
  const helpful = new HelpfulPoints(ledger, pioneer);
  const contributions = new ContributionPoints(ledger, pioneer, helpful);
  const badges = new BadgeService(
    prisma as unknown as PrismaService,
    new ConfigService(),
  );

  const userIds =
    options.userIds ??
    (
      await prisma.user.findMany({
        select: { id: true },
        orderBy: { id: 'asc' },
      })
    ).map((user) => user.id);

  const report: RebuildRow[] = [];
  for (const userId of userIds) {
    try {
      await prisma.$transaction(
        async (tx) => {
          const before = await pointsOf(tx, userId);
          await rebuildAccount(tx, userId, ledger, contributions);
          report.push({ userId, before, after: await pointsOf(tx, userId) });
          if (!options.apply) throw new DryRun();
        },
        { timeout: 120_000 },
      );
    } catch (error) {
      if (!(error instanceof DryRun)) throw error;
    }
    // Insignias already met are awarded too, as seen and without seasonal ones.
    if (options.apply) await badges.evaluate(userId, { retroactive: true });
  }
  return report;
}

async function pointsOf(tx: Tx, userId: string) {
  const { points } = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    select: { points: true },
  });
  return points;
}

async function rebuildAccount(
  tx: Tx,
  userId: string,
  ledger: PointLedger,
  contributions: ContributionPoints,
) {
  // Guías are out of the product but keep the points they gave (§9.3).
  await tx.pointTransaction.deleteMany({
    where: { userId, reason: { not: 'GUIDE_CREATED' } },
  });
  const { _sum } = await tx.pointTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  const kept = _sum.amount ?? 0;
  await tx.user.update({
    where: { id: userId },
    data: { points: kept, level: levelForPoints(kept) },
  });

  const [materials, reviews, exams, reports] = await Promise.all([
    tx.material.findMany({
      where: {
        authorId: userId,
        publicationStatus: { in: ['PUBLISHED', 'HIDDEN'] },
        isDeleted: false,
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true },
    }),
    tx.courseReview.findMany({
      where: {
        userId,
        publicationStatus: { in: ['PUBLISHED', 'HIDDEN'] },
        isAnonymous: false,
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true },
    }),
    tx.examExperience.findMany({
      where: {
        userId,
        publicationStatus: { in: ['PUBLISHED', 'HIDDEN'] },
        isAnonymous: false,
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true },
    }),
    tx.report.findMany({
      where: {
        reporterId: userId,
        status: 'CONFIRMED',
        case: { decision: 'REMOVE', revertedAt: null },
      },
      distinct: ['caseId'],
      select: { caseId: true, case: { select: { closedAt: true } } },
    }),
  ]);

  // Materials replay their «Me sirvió» and pioneer bonus on publication.
  for (const material of materials) {
    await contributions.published(
      tx,
      {
        type: 'MATERIAL',
        id: material.id,
        authorId: userId,
        isAnonymous: false,
      },
      { replayAt: material.createdAt },
    );
  }
  for (const review of reviews) {
    await contributions.published(
      tx,
      {
        type: 'COURSE_REVIEW',
        id: review.id,
        authorId: userId,
        isAnonymous: false,
      },
      { replayAt: review.createdAt },
    );
  }
  for (const exam of exams) {
    await contributions.published(
      tx,
      {
        type: 'EXAM_EXPERIENCE',
        id: exam.id,
        authorId: userId,
        isAnonymous: false,
      },
      { replayAt: exam.createdAt },
    );
  }
  const confirmed = [...reports].sort(
    (a, b) =>
      (a.case.closedAt?.getTime() ?? 0) - (b.case.closedAt?.getTime() ?? 0),
  );
  for (const { caseId, case: caso } of confirmed) {
    await ledger.award(tx, {
      userId,
      reason: 'REPORT_CONFIRMED',
      referenceId: `${caseId}:${userId}`,
      amount: REPORT_POINTS,
      replayAt: caso.closedAt ?? new Date(),
    });
  }
}
