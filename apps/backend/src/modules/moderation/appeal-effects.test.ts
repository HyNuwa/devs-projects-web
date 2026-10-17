import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service';
import { MaterialsService } from '../materials/materials.service';
import { PointService } from '../ranking/point.service';
import { DecisionsService } from './decisions.service';
import { SanctionsService } from './sanctions.service';

const NOW = new Date('2026-09-30T12:00:00.000Z');
const inDays = (days: number) =>
  new Date(NOW.getTime() + days * 24 * 3_600_000);

function prismaDouble() {
  const prisma = {
    moderationCase: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'case-1',
        targetType: 'MATERIAL',
        materialId: 'mat-1',
        courseReviewId: null,
        examExperienceId: null,
        revertedAt: null,
      }),
      // The appealed caso is the content's latest one.
      findFirst: vi.fn().mockResolvedValue({ id: 'case-1' }),
      update: vi.fn(),
    },
    material: {
      findUnique: vi.fn().mockResolvedValue({
        authorId: 'author-1',
        title: 'Resumen de lógica',
        subjectId: 'sub-1',
        isDeleted: false,
        publicationStatus: 'REMOVED',
        hiddenAt: null,
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    sanction: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    user: { update: vi.fn() },
    subject: { update: vi.fn() },
    moderationEvent: { create: vi.fn() },
  };
  return prisma;
}

describe('an accepted appeal of a retiro', () => {
  let prisma: ReturnType<typeof prismaDouble>;
  let decisions: DecisionsService;
  const points = { awardFor: vi.fn(), revertFor: vi.fn() };

  beforeEach(async () => {
    vi.useFakeTimers().setSystemTime(NOW);
    vi.clearAllMocks();
    prisma = prismaDouble();
    const moduleRef = await Test.createTestingModule({
      providers: [
        DecisionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PointService, useValue: points },
        { provide: MaterialsService, useValue: {} },
        { provide: SanctionsService, useValue: {} },
      ],
    }).compile();
    decisions = moduleRef.get(DecisionsService);
  });

  const restore = () =>
    decisions.restoreFromAppeal(prisma as never, {
      caseId: 'case-1',
      appealId: 'appeal-1',
      actorId: 'mod-2',
      reason: 'Cubren unidades distintas.',
    });

  it('publishes the content again from its retired state', async () => {
    await restore();

    expect(prisma.material.updateMany).toHaveBeenCalledWith({
      where: { id: 'mat-1', publicationStatus: 'REMOVED' },
      data: {
        publicationStatus: 'PUBLISHED',
        statusChangedAt: NOW,
        hiddenAt: null,
        authorFacingReason: null,
      },
    });
  });

  it('re-awards its points, even if the author has an active sanción', async () => {
    await restore();

    expect(points.awardFor).toHaveBeenCalledWith(prisma, {
      userId: 'author-1',
      amount: 10,
      reason: 'MATERIAL_PUBLISHED',
      referenceId: 'mat-1',
    });
    expect(prisma.subject.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { materialCount: { increment: 1 } },
    });
  });

  it('stops the retiro counting for the escalera and voids the advertencia given with it', async () => {
    await restore();

    expect(prisma.moderationCase.update).toHaveBeenCalledWith({
      where: { id: 'case-1' },
      data: { revertedAt: NOW },
    });
    expect(prisma.sanction.updateMany).toHaveBeenCalledWith({
      where: { caseId: 'case-1', type: 'WARNING', voidedAt: null },
      data: { voidedAt: NOW, voidedByAppealId: 'appeal-1' },
    });
    expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'mod-2',
        action: 'RESTORED',
        caseId: 'case-1',
      }),
    });
  });

  it('refuses when the content is no longer retired', async () => {
    prisma.material.updateMany.mockResolvedValue({ count: 0 });

    await expect(restore()).rejects.toBeInstanceOf(ConflictException);
    expect(points.awardFor).not.toHaveBeenCalled();
  });
});

describe('an accepted appeal of a sanción', () => {
  let prisma: ReturnType<typeof prismaDouble>;
  let sanctions: SanctionsService;

  beforeEach(async () => {
    vi.useFakeTimers().setSystemTime(NOW);
    prisma = prismaDouble();
    prisma.sanction.updateMany.mockResolvedValue({ count: 1 });
    const moduleRef = await Test.createTestingModule({
      providers: [
        SanctionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    sanctions = moduleRef.get(SanctionsService);
  });

  const voidIt = () =>
    sanctions.voidByAppeal(prisma as never, {
      sanctionId: 'sanction-1',
      appealId: 'appeal-1',
    });

  it('lifts an active silenciamiento immediately', async () => {
    prisma.sanction.findUnique.mockResolvedValue({
      id: 'sanction-1',
      userId: 'user-1',
      type: 'MUTE',
      endsAt: inDays(3),
      liftedAt: null,
    });

    await voidIt();

    expect(prisma.sanction.updateMany).toHaveBeenCalledWith({
      where: { id: 'sanction-1', voidedAt: null },
      data: { voidedAt: NOW, voidedByAppealId: 'appeal-1' },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({ isMuted: false, mutedUntil: null }),
    });
  });

  it('lifts an active suspensión immediately', async () => {
    prisma.sanction.findUnique.mockResolvedValue({
      id: 'sanction-1',
      userId: 'user-1',
      type: 'SUSPENSION',
      endsAt: null,
      liftedAt: null,
    });

    await voidIt();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({ isBanned: false, bannedUntil: null }),
    });
  });

  it('voids a sanción that already ended, so it stops counting', async () => {
    prisma.sanction.findUnique.mockResolvedValue({
      id: 'sanction-1',
      userId: 'user-1',
      type: 'MUTE',
      endsAt: inDays(-2),
      liftedAt: null,
    });

    await voidIt();

    expect(prisma.sanction.updateMany).toHaveBeenCalled();
    // The cache is rebuilt from what is still in force: nothing here.
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({ isMuted: false, isBanned: false }),
    });
  });
});
