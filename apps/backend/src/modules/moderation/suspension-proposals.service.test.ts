import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { PointService } from '../ranking/point.service';
import { SanctionsService } from './sanctions.service';
import { SuspensionProposalsService } from './suspension-proposals.service';

const NOW = new Date('2026-09-30T12:00:00.000Z');
const mod = { id: 'mod-1', role: 'MODERATOR' } as const;
const admin = { id: 'admin-1', role: 'ADMIN' } as const;

function prismaDouble() {
  const prisma = {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        isBanned: false,
        bannedUntil: null,
      }),
    },
    suspensionProposal: {
      create: vi.fn().mockResolvedValue({ id: 'proposal-1' }),
      findUnique: vi.fn().mockResolvedValue({
        id: 'proposal-1',
        userId: 'user-1',
        status: 'PENDING',
        durationDays: 30,
        caseId: null,
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn(),
    },
    moderationEvent: { create: vi.fn() },
    moderationCase: {
      create: vi.fn().mockResolvedValue({ id: 'case-new' }),
    },
    report: { findFirst: vi.fn().mockResolvedValue(null) },
    material: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    courseReview: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    examExperience: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    subject: { update: vi.fn() },
  };
  prisma.$transaction.mockImplementation(
    async (work: (tx: typeof prisma) => unknown) => work(prisma),
  );
  return prisma;
}

describe('SuspensionProposalsService', () => {
  let prisma: ReturnType<typeof prismaDouble>;
  let service: SuspensionProposalsService;
  const sanctions = { suspend: vi.fn() };
  const points = { revertFor: vi.fn() };

  beforeEach(async () => {
    vi.useFakeTimers().setSystemTime(NOW);
    vi.clearAllMocks();
    prisma = prismaDouble();
    sanctions.suspend.mockResolvedValue({ id: 'sanction-1' });
    const moduleRef = await Test.createTestingModule({
      providers: [
        SuspensionProposalsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SanctionsService, useValue: sanctions },
        { provide: PointService, useValue: points },
      ],
    }).compile();
    service = moduleRef.get(SuspensionProposalsService);
  });

  describe('propose', () => {
    it('records a proposal and its event without restricting the account', async () => {
      await service.propose(mod, 'user-1', 'Reincide con spam', 30);

      expect(prisma.suspensionProposal.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          proposedById: 'mod-1',
          reason: 'Reincide con spam',
          durationDays: 30,
          caseId: null,
        },
      });
      expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: 'mod-1',
          action: 'SUSPENSION_PROPOSED',
          targetUserId: 'user-1',
        }),
      });
      expect(sanctions.suspend).not.toHaveBeenCalled();
    });

    it('refuses a second pending proposal for the same account', async () => {
      prisma.suspensionProposal.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.propose(mod, 'user-1', 'Reincide', 30),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses an invalid duration or an empty reason', async () => {
      await expect(
        service.propose(mod, 'user-1', 'x', 12 as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.propose(mod, 'user-1', ' ', 30),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('confirm', () => {
    it('lets only admins decide a proposal', async () => {
      await expect(
        service.confirm(mod, 'proposal-1', { reason: 'Ok' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('suspends with the proposed duration inside the same transaction', async () => {
      await service.confirm(admin, 'proposal-1', { reason: 'Reincidencia' });

      expect(prisma.suspensionProposal.updateMany).toHaveBeenCalledWith({
        where: { id: 'proposal-1', status: 'PENDING' },
        data: expect.objectContaining({
          status: 'CONFIRMED',
          decidedById: 'admin-1',
          decisionReason: 'Reincidencia',
          decidedAt: NOW,
        }),
      });
      expect(sanctions.suspend).toHaveBeenCalledWith(
        admin,
        'user-1',
        'Reincidencia',
        30,
        { tx: prisma, caseId: undefined },
      );
      expect(prisma.suspensionProposal.update).toHaveBeenCalledWith({
        where: { id: 'proposal-1' },
        data: { sanctionId: 'sanction-1' },
      });
    });

    it('lets the admin change the duration', async () => {
      await service.confirm(admin, 'proposal-1', {
        reason: 'Permanente',
        durationDays: null,
      });

      expect(sanctions.suspend).toHaveBeenCalledWith(
        admin,
        'user-1',
        'Permanente',
        null,
        expect.anything(),
      );
    });

    it('refuses a proposal someone already decided', async () => {
      prisma.suspensionProposal.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.confirm(admin, 'proposal-1', { reason: 'Ok' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(sanctions.suspend).not.toHaveBeenCalled();
    });

    it('retires every published contribution through its own closed caso and reverts its points', async () => {
      prisma.material.findMany.mockResolvedValue([
        { id: 'mat-1', title: 'Curso pago', subjectId: 'sub-1' },
      ]);
      prisma.courseReview.findMany.mockResolvedValue([
        { id: 'rev-1', subjectId: 'sub-2' },
      ]);

      await service.confirm(admin, 'proposal-1', {
        reason: 'Spam',
        retireContributions: true,
      });

      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            authorId: 'user-1',
            publicationStatus: 'PUBLISHED',
            isDeleted: false,
          },
        }),
      );
      expect(prisma.material.updateMany).toHaveBeenCalledWith({
        where: { id: 'mat-1', publicationStatus: 'PUBLISHED' },
        data: expect.objectContaining({
          publicationStatus: 'REMOVED',
          authorFacingReason: 'Spam',
        }),
      });
      expect(prisma.moderationCase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          kind: 'REPORTS',
          status: 'CLOSED',
          decision: 'REMOVE',
          materialId: 'mat-1',
          targetAuthorId: 'user-1',
          decidedById: 'admin-1',
          decisionReason: 'Spam',
        }),
      });
      expect(points.revertFor).toHaveBeenCalledWith(prisma, 'mat-1');
      expect(points.revertFor).toHaveBeenCalledWith(prisma, 'rev-1');
      expect(prisma.subject.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { materialCount: { decrement: 1 } },
      });
      expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'REMOVED',
          materialId: 'mat-1',
          caseId: 'case-new',
        }),
      });
    });
  });

  describe('reject', () => {
    it('closes the proposal with a reason and leaves the account alone', async () => {
      await service.reject(admin, 'proposal-1', 'No alcanza para suspender');

      expect(prisma.suspensionProposal.updateMany).toHaveBeenCalledWith({
        where: { id: 'proposal-1', status: 'PENDING' },
        data: expect.objectContaining({
          status: 'REJECTED',
          decisionReason: 'No alcanza para suspender',
        }),
      });
      expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'SUSPENSION_REJECTED' }),
      });
      expect(sanctions.suspend).not.toHaveBeenCalled();
    });

    it('requires a reason', async () => {
      await expect(
        service.reject(admin, 'proposal-1', ''),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it('lets an admin suspend directly and retire the contributions in one step', async () => {
    prisma.material.findMany.mockResolvedValue([
      { id: 'mat-1', title: 'Curso pago', subjectId: 'sub-1' },
    ]);

    await service.suspendDirectly(
      admin,
      'user-1',
      'Cuenta de spam',
      null,
      true,
    );

    expect(sanctions.suspend).toHaveBeenCalledWith(
      admin,
      'user-1',
      'Cuenta de spam',
      null,
      { tx: prisma },
    );
    expect(points.revertFor).toHaveBeenCalledWith(prisma, 'mat-1');
  });
});
