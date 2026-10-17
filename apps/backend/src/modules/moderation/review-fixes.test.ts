import { BadRequestException, type Provider, type Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service';
import { MaterialsService } from '../materials/materials.service';
import { PointService } from '../ranking/point.service';
import { DecisionsService } from './decisions.service';
import { SanctionsService } from './sanctions.service';
import { SuspensionProposalsService } from './suspension-proposals.service';

const NOW = new Date('2026-09-30T12:00:00.000Z');
const admin = { id: 'admin-1', role: 'ADMIN' } as const;
const mod = { id: 'mod-1', role: 'MODERATOR' } as const;

function prismaDouble() {
  const prisma = {
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        mutedUntil: null,
        isBanned: false,
        bannedUntil: null,
      }),
      update: vi.fn(),
    },
    sanction: {
      create: vi.fn().mockResolvedValue({ id: 'sanction-1' }),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn(),
    },
    suspensionProposal: { create: vi.fn().mockResolvedValue({ id: 'p-1' }) },
    moderationEvent: { create: vi.fn() },
    moderationCase: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'case-new' }),
      update: vi.fn(),
    },
    report: { findFirst: vi.fn().mockResolvedValue(null) },
    refreshToken: { deleteMany: vi.fn() },
    material: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    courseReview: { findMany: vi.fn().mockResolvedValue([]) },
    examExperience: { findMany: vi.fn().mockResolvedValue([]) },
    subject: { update: vi.fn() },
  };
  prisma.$transaction.mockImplementation(
    async (work: (tx: typeof prisma) => unknown) => work(prisma),
  );
  return prisma;
}

describe('findings of the code review', () => {
  let prisma: ReturnType<typeof prismaDouble>;

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(NOW);
    prisma = prismaDouble();
  });

  async function build<T>(service: Type<T>, extra: Provider[] = []) {
    const moduleRef = await Test.createTestingModule({
      providers: [
        service,
        { provide: PrismaService, useValue: prisma },
        ...extra,
      ],
    }).compile();
    return moduleRef.get(service);
  }

  it('dates the retiros of a direct suspension before it, so it counts as applied', async () => {
    const sanctions = {
      // The suspensión is created a moment later than the call.
      suspend: vi.fn().mockImplementation(async () => {
        vi.setSystemTime(new Date(NOW.getTime() + 1000));
        return { id: 'sanction-1' };
      }),
    };
    prisma.material.findMany.mockResolvedValue([
      { id: 'mat-1', title: 'Curso pago', subjectId: 'sub-1' },
    ]);
    const service = await build(SuspensionProposalsService, [
      { provide: SanctionsService, useValue: sanctions },
      { provide: PointService, useValue: { revertFor: vi.fn() } },
    ]);

    await service.suspendDirectly(admin, 'user-1', 'Spam', null, true);

    expect(prisma.moderationCase.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ closedAt: NOW }),
    });
  });

  it('refuses linking a sanción to a caso about another account', async () => {
    prisma.moderationCase.findUnique.mockResolvedValue({
      id: 'case-1',
      targetType: 'MATERIAL',
      materialId: 'mat-1',
      courseReviewId: null,
      examExperienceId: null,
      targetAuthorId: 'someone-else',
    });
    const service = await build(SanctionsService);

    await expect(
      service.warn(mod, 'user-1', 'x', { caseId: 'case-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.sanction.create).not.toHaveBeenCalled();
  });

  it('records a proposal from Usuarios without any caso, so it never tests who wrote one', async () => {
    const service = await build(SuspensionProposalsService, [
      { provide: SanctionsService, useValue: {} },
      { provide: PointService, useValue: {} },
    ]);

    await service.propose(mod, 'user-1', 'Reincide', 30);

    expect(prisma.moderationCase.findUnique).not.toHaveBeenCalled();
    const [{ data: proposal }] = prisma.suspensionProposal.create.mock
      .calls[0] as [{ data: Record<string, unknown> }];
    expect(proposal.caseId ?? null).toBeNull();
    const [{ data: event }] = prisma.moderationEvent.create.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(event).toEqual(
      expect.objectContaining({ action: 'SUSPENSION_PROPOSED' }),
    );
    expect(event.caseId ?? null).toBeNull();
    expect(event.courseReviewId ?? null).toBeNull();
  });

  describe('accepting an appeal of a retiro that is no longer in force', () => {
    const points = { awardFor: vi.fn() };

    async function decisions() {
      return build(DecisionsService, [
        { provide: PointService, useValue: points },
        { provide: MaterialsService, useValue: {} },
        { provide: SanctionsService, useValue: {} },
      ]);
    }

    it('does nothing to the content when the retiro was already restored', async () => {
      prisma.moderationCase.findUnique.mockResolvedValue({
        id: 'case-1',
        targetType: 'MATERIAL',
        materialId: 'mat-1',
        courseReviewId: null,
        examExperienceId: null,
        revertedAt: new Date('2026-09-29T00:00:00.000Z'),
      });

      await expect(
        (await decisions()).restoreFromAppeal(prisma as never, {
          caseId: 'case-1',
          appealId: 'appeal-1',
          actorId: 'mod-2',
          reason: 'Ok',
        }),
      ).resolves.toBeUndefined();
      expect(prisma.material.updateMany).not.toHaveBeenCalled();
      expect(points.awardFor).not.toHaveBeenCalled();
    });

    it('stops the old retiro counting without undoing a newer caso', async () => {
      prisma.moderationCase.findUnique.mockResolvedValue({
        id: 'case-1',
        targetType: 'MATERIAL',
        materialId: 'mat-1',
        courseReviewId: null,
        examExperienceId: null,
        revertedAt: null,
      });
      prisma.moderationCase.findFirst.mockResolvedValue({ id: 'case-newer' });
      prisma.material.findUnique.mockResolvedValue({
        authorId: 'author-1',
        title: 'Resumen',
        subjectId: 'sub-1',
        isDeleted: false,
        publicationStatus: 'REMOVED',
        hiddenAt: null,
      });

      await (
        await decisions()
      ).restoreFromAppeal(prisma, {
        caseId: 'case-1',
        appealId: 'appeal-1',
        actorId: 'mod-2',
        reason: 'Ok',
      });

      expect(prisma.moderationCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { revertedAt: NOW },
      });
      expect(prisma.material.updateMany).not.toHaveBeenCalled();
      expect(points.awardFor).not.toHaveBeenCalled();
    });
  });
});
