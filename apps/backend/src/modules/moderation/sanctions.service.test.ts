import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service';
import { SanctionsService } from './sanctions.service';

const NOW = new Date('2026-09-30T12:00:00.000Z');
const inDays = (days: number) =>
  new Date(NOW.getTime() + days * 24 * 3_600_000);

const mod = { id: 'mod-1', role: 'MODERATOR' } as const;
const admin = { id: 'admin-1', role: 'ADMIN' } as const;

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
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    },
    moderationEvent: { create: vi.fn() },
    moderationCase: { findUnique: vi.fn() },
    report: { findFirst: vi.fn().mockResolvedValue(null) },
    refreshToken: { deleteMany: vi.fn() },
  };
  prisma.$transaction.mockImplementation(
    async (work: (tx: typeof prisma) => unknown) => work(prisma),
  );
  return prisma;
}

describe('SanctionsService', () => {
  let prisma: ReturnType<typeof prismaDouble>;
  let service: SanctionsService;

  beforeEach(async () => {
    vi.useFakeTimers().setSystemTime(NOW);
    prisma = prismaDouble();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SanctionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(SanctionsService);
  });

  describe('warn', () => {
    it('records an advertencia with its event and no restriction', async () => {
      await service.warn(mod, 'user-1', '  Insultos a una docente. ');

      expect(prisma.sanction.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'WARNING',
          reason: 'Insultos a una docente.',
          startsAt: NOW,
          endsAt: null,
          appliedById: 'mod-1',
          caseId: null,
        },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: 'mod-1',
          action: 'WARNED',
          targetUserId: 'user-1',
          reason: 'Insultos a una docente.',
        }),
      });
    });

    it('links a caso and its content so anonymous authors stay masked in history', async () => {
      prisma.moderationCase.findUnique.mockResolvedValue({
        id: 'case-1',
        targetType: 'COURSE_REVIEW',
        materialId: null,
        courseReviewId: 'rev-1',
        examExperienceId: null,
        targetAuthorId: 'user-1',
      });

      await service.warn(mod, 'user-1', 'Insultos', { caseId: 'case-1' });

      expect(prisma.sanction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ caseId: 'case-1' }),
      });
      expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          caseId: 'case-1',
          targetType: 'COURSE_REVIEW',
          courseReviewId: 'rev-1',
        }),
      });
    });

    it('refuses warning from a caso the moderator reported', async () => {
      prisma.moderationCase.findUnique.mockResolvedValue({
        id: 'case-1',
        targetType: 'MATERIAL',
        materialId: 'mat-1',
        courseReviewId: null,
        examExperienceId: null,
        targetAuthorId: 'user-1',
      });
      prisma.report.findFirst.mockResolvedValue({ id: 'report-1' });

      await expect(
        service.warn(mod, 'user-1', 'Spam', { caseId: 'case-1' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.sanction.create).not.toHaveBeenCalled();
    });

    it('uses the caller’s transaction when given one', async () => {
      const tx = prismaDouble();

      await service.warn(mod, 'user-1', 'Insultos', { tx: tx as never });

      expect(tx.sanction.create).toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  it('refuses any sanción without a reason', async () => {
    await expect(service.mute(mod, 'user-1', '   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.sanction.create).not.toHaveBeenCalled();
  });

  it('refuses a moderator sanctioning another moderator', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'mod-2',
      role: 'MODERATOR',
      mutedUntil: null,
      isBanned: false,
      bannedUntil: null,
    });

    await expect(service.mute(mod, 'mod-2', 'x')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  describe('mute', () => {
    it('silences for exactly 7 days and caches it on the account in the same transaction', async () => {
      prisma.sanction.findMany.mockResolvedValue([
        { type: 'MUTE', endsAt: inDays(7) },
      ]);
      await service.mute(mod, 'user-1', 'Segundo retiro en 90 días');

      expect(prisma.sanction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'MUTE',
          startsAt: NOW,
          endsAt: inDays(7),
        }),
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ isMuted: true, mutedUntil: inDays(7) }),
      });
      expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'MUTED',
          metadata: { endsAt: inDays(7).toISOString() },
        }),
      });
    });

    it('refuses silencing an account that is already silenced', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        mutedUntil: inDays(3),
        isBanned: false,
        bannedUntil: null,
      });

      await expect(service.mute(mod, 'user-1', 'x')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('unmute', () => {
    it('lifts the active silenciamiento and clears the cache', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        mutedUntil: inDays(3),
        isBanned: false,
        bannedUntil: null,
      });
      prisma.sanction.findFirst.mockResolvedValue({ id: 'sanction-7' });

      await service.unmute(mod, 'user-1', 'Se aclaró el malentendido');

      expect(prisma.sanction.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          type: 'MUTE',
          liftedAt: null,
          voidedAt: null,
          endsAt: { gt: NOW },
        },
        select: { id: true },
      });
      expect(prisma.sanction.update).toHaveBeenCalledWith({
        where: { id: 'sanction-7' },
        data: {
          liftedAt: NOW,
          liftedById: 'mod-1',
          liftReason: 'Se aclaró el malentendido',
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ isMuted: false, mutedUntil: null }),
      });
      expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'SANCTION_LIFTED',
          metadata: { sanctionId: 'sanction-7', type: 'MUTE' },
        }),
      });
    });

    it('refuses when the account is not silenced', async () => {
      prisma.sanction.findFirst.mockResolvedValue(null);

      await expect(service.unmute(mod, 'user-1', 'x')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('suspend', () => {
    it('lets only admins suspend', async () => {
      await expect(
        service.suspend(mod, 'user-1', 'Spam', 30),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('suspends for 30 days, caches it and ends every session', async () => {
      prisma.sanction.findMany.mockResolvedValue([
        { type: 'SUSPENSION', endsAt: inDays(30) },
      ]);
      await service.suspend(admin, 'user-1', 'Tercer retiro', 30);

      expect(prisma.sanction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'SUSPENSION',
          endsAt: inDays(30),
          appliedById: 'admin-1',
        }),
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          isBanned: true,
          bannedUntil: inDays(30),
        }),
      });
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'SUSPENDED' }),
      });
    });

    it('suspends permanently with no end date', async () => {
      prisma.sanction.findMany.mockResolvedValue([
        { type: 'SUSPENSION', endsAt: null },
      ]);
      await service.suspend(admin, 'user-1', 'Cuenta falsa', null);

      expect(prisma.sanction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'SUSPENSION', endsAt: null }),
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ isBanned: true, bannedUntil: null }),
      });
    });

    it('only accepts 7 days, 30 days or permanent', async () => {
      await expect(
        service.suspend(admin, 'user-1', 'x', 12 as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('liftSuspension', () => {
    it('lets an admin lift an active suspensión early', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        mutedUntil: null,
        isBanned: true,
        bannedUntil: inDays(20),
      });
      prisma.sanction.findFirst.mockResolvedValue({ id: 'sanction-9' });

      await service.liftSuspension(admin, 'user-1', 'Se revisó el caso');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ isBanned: false, bannedUntil: null }),
      });
      expect(prisma.sanction.update).toHaveBeenCalledWith({
        where: { id: 'sanction-9' },
        data: expect.objectContaining({ liftedAt: NOW, liftedById: 'admin-1' }),
      });
    });

    it('does not let a moderator lift a suspensión', async () => {
      await expect(
        service.liftSuspension(mod, 'user-1', 'x'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('two sanciones at once', () => {
    it('locks the account row before reading its status', async () => {
      await service.mute(mod, 'user-1', 'Segundo retiro');

      expect(prisma.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
        prisma.user.findUnique.mock.invocationCallOrder[0],
      );
    });

    it('keeps the account silenced when lifting one of two active silenciamientos', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        mutedUntil: inDays(5),
        isBanned: false,
        bannedUntil: null,
      });
      prisma.sanction.findFirst.mockResolvedValue({ id: 'sanction-7' });
      // After lifting sanction-7, another silenciamiento is still in force.
      prisma.sanction.findMany.mockResolvedValue([
        { type: 'MUTE', endsAt: inDays(5) },
      ]);

      await service.unmute(mod, 'user-1', 'Se aclaró');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ isMuted: true, mutedUntil: inDays(5) }),
      });
    });
  });
});
