import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service';
import { AppealsService } from './appeals.service';
import { DecisionsService } from './decisions.service';
import { SanctionsService } from './sanctions.service';

const NOW = new Date('2026-09-30T12:00:00.000Z');
const reviewer = { id: 'mod-2', role: 'MODERATOR' } as const;

const retiroAppeal = {
  id: 'appeal-1',
  kind: 'RETIRO',
  status: 'PENDING',
  caseId: 'case-1',
  sanctionId: null,
  decidedById: 'mod-1',
  appellant: { id: 'author-1', role: 'USER' },
  sanction: null,
  case: {
    targetType: 'MATERIAL',
    materialId: 'mat-1',
    courseReviewId: null,
    examExperienceId: null,
  },
};

describe('AppealsService.answer', () => {
  let service: AppealsService;
  const decisions = { restoreFromAppeal: vi.fn() };
  const sanctions = { voidByAppeal: vi.fn() };
  const prisma = {
    $transaction: vi.fn(),
    appeal: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    moderationEvent: { create: vi.fn() },
  };

  beforeEach(async () => {
    vi.useFakeTimers().setSystemTime(NOW);
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
    prisma.appeal.findUnique.mockResolvedValue(retiroAppeal);
    prisma.appeal.updateMany.mockResolvedValue({ count: 1 });
    const moduleRef = await Test.createTestingModule({
      providers: [
        AppealsService,
        { provide: PrismaService, useValue: prisma },
        { provide: DecisionsService, useValue: decisions },
        { provide: SanctionsService, useValue: sanctions },
      ],
    }).compile();
    service = moduleRef.get(AppealsService);
  });

  it('accepting an appeal of a retiro undoes it and records the answer', async () => {
    await service.answer(reviewer, 'appeal-1', {
      accept: true,
      answer: 'Tenés razón: cubren unidades distintas.',
    });

    expect(prisma.appeal.updateMany).toHaveBeenCalledWith({
      where: { id: 'appeal-1', status: 'PENDING' },
      data: {
        status: 'ACCEPTED',
        reviewerId: 'mod-2',
        answer: 'Tenés razón: cubren unidades distintas.',
        answeredAt: NOW,
      },
    });
    expect(decisions.restoreFromAppeal).toHaveBeenCalledWith(prisma, {
      caseId: 'case-1',
      appealId: 'appeal-1',
      actorId: 'mod-2',
      reason: 'Tenés razón: cubren unidades distintas.',
    });
    expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'mod-2',
        action: 'APPEAL_ACCEPTED',
        targetUserId: 'author-1',
        caseId: 'case-1',
        materialId: 'mat-1',
      }),
    });
  });

  it('accepting an appeal of a sanción voids it', async () => {
    prisma.appeal.findUnique.mockResolvedValue({
      ...retiroAppeal,
      kind: 'SANCTION',
      caseId: null,
      sanctionId: 'sanction-1',
      sanction: { type: 'MUTE', case: null },
      case: null,
    });

    await service.answer(reviewer, 'appeal-1', {
      accept: true,
      answer: 'La guía era suya.',
    });

    expect(sanctions.voidByAppeal).toHaveBeenCalledWith(prisma, {
      sanctionId: 'sanction-1',
      appealId: 'appeal-1',
    });
    expect(decisions.restoreFromAppeal).not.toHaveBeenCalled();
  });

  it('rejecting keeps the decision unchanged', async () => {
    await service.answer(reviewer, 'appeal-1', {
      accept: false,
      answer: 'Es el mismo contenido.',
    });

    expect(prisma.appeal.updateMany).toHaveBeenCalledWith({
      where: { id: 'appeal-1', status: 'PENDING' },
      data: expect.objectContaining({ status: 'REJECTED' }),
    });
    expect(decisions.restoreFromAppeal).not.toHaveBeenCalled();
    expect(sanctions.voidByAppeal).not.toHaveBeenCalled();
    expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'APPEAL_REJECTED' }),
    });
  });

  it('requires a reason', async () => {
    await expect(
      service.answer(reviewer, 'appeal-1', { accept: true, answer: ' ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('never lets the decider answer', async () => {
    await expect(
      service.answer({ id: 'mod-1', role: 'MODERATOR' }, 'appeal-1', {
        accept: true,
        answer: 'x',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('keeps appeals of suspensiones for admins', async () => {
    prisma.appeal.findUnique.mockResolvedValue({
      ...retiroAppeal,
      kind: 'SANCTION',
      caseId: null,
      sanctionId: 'sanction-1',
      sanction: { type: 'SUSPENSION', case: null },
      case: null,
    });

    await expect(
      service.answer(reviewer, 'appeal-1', { accept: true, answer: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a second answer, even from a concurrent reviewer', async () => {
    prisma.appeal.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.answer(reviewer, 'appeal-1', { accept: true, answer: 'x' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(decisions.restoreFromAppeal).not.toHaveBeenCalled();
  });
});
