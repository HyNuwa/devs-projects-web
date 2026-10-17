import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service';
import { MaterialsService } from '../materials/materials.service';
import { PointService } from '../ranking/point.service';
import { DecisionsService } from './decisions.service';
import { PublicationPolicy } from './publication-policy.service';
import { ReportsService } from './reports.service';
import { SanctionsService } from './sanctions.service';

const NOW = new Date('2026-09-30T12:00:00.000Z');

/** A Prisma double whose writes report one affected row. */
function prismaDouble() {
  const prisma = {
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
    material: {
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    courseReview: {
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    examExperience: { findUnique: vi.fn(), updateMany: vi.fn() },
    report: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn(),
    },
    moderationCase: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'case-1', highPriority: false }),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    moderationEvent: { create: vi.fn() },
    subject: { update: vi.fn() },
  };
  prisma.$transaction.mockImplementation(
    async (work: (tx: typeof prisma) => unknown) => work(prisma),
  );
  return prisma;
}

describe('casos remember the author of their target', () => {
  let prisma: ReturnType<typeof prismaDouble>;

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(NOW);
    prisma = prismaDouble();
  });

  it('when the first reporte opens a caso, including on anonymous content', async () => {
    prisma.courseReview.findUnique.mockResolvedValue({
      userId: 'author-2',
      subjectId: 'sub-1',
      isAnonymous: true,
      publicationStatus: 'PUBLISHED',
      hiddenAt: null,
    });
    prisma.moderationCase.findFirst.mockResolvedValue(null);
    const moduleRef = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    await moduleRef.get(ReportsService).file('reporter-1', {
      targetType: 'COURSE_REVIEW',
      targetId: 'rev-1',
      reason: 'INSULTOS_O_ACOSO',
    } as never);

    expect(prisma.moderationCase.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind: 'REPORTS',
        courseReviewId: 'rev-1',
        targetAuthorId: 'author-2',
      }),
    });
  });

  it('when revisión previa opens a caso', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PublicationPolicy,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    await moduleRef
      .get(PublicationPolicy)
      .openPriorReview(
        prisma as never,
        { type: 'MATERIAL', id: 'mat-1' },
        'author-1',
        'NEW_ACCOUNT',
        'Parcial 1',
      );

    expect(prisma.moderationCase.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind: 'PRIOR_REVIEW',
        materialId: 'mat-1',
        targetAuthorId: 'author-1',
      }),
    });
  });
});

describe('a restore marks the retiro as reverted', () => {
  it('stamps revertedAt on the retiro caso it restores through', async () => {
    vi.useFakeTimers().setSystemTime(NOW);
    const prisma = prismaDouble();
    prisma.moderationCase.findUnique.mockResolvedValue({
      id: 'case-1',
      kind: 'REPORTS',
      status: 'CLOSED',
      decision: 'REMOVE',
      targetType: 'MATERIAL',
      materialId: 'mat-1',
      courseReviewId: null,
      examExperienceId: null,
      reports: [],
    });
    prisma.moderationCase.findFirst.mockResolvedValue({ id: 'case-1' });
    prisma.material.findUnique.mockResolvedValue({
      authorId: 'author-1',
      title: 'Parcial 1',
      subjectId: 'sub-1',
      isDeleted: false,
      publicationStatus: 'REMOVED',
      hiddenAt: null,
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        DecisionsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: PointService,
          useValue: { awardFor: vi.fn(), revertFor: vi.fn() },
        },
        { provide: MaterialsService, useValue: {} },
        { provide: SanctionsService, useValue: { warn: vi.fn() } },
      ],
    }).compile();

    await moduleRef.get(DecisionsService).decide(
      'case-1',
      { id: 'mod-1', role: 'MODERATOR' },
      {
        decision: 'RESTORE',
        reason: 'Error de moderación',
      },
    );

    expect(prisma.moderationCase.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { revertedAt: NOW },
    });
  });
});
