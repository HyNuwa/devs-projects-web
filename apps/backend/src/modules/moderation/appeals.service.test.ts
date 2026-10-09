import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service';
import { AppealsService } from './appeals.service';
import { DecisionsService } from './decisions.service';
import { SanctionsService } from './sanctions.service';

const NOW = new Date('2026-09-30T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 3_600_000);

const retiroCase = (overrides: Record<string, unknown> = {}) => ({
  id: 'case-1',
  decision: 'REMOVE',
  closedAt: daysAgo(3),
  revertedAt: null,
  targetAuthorId: 'author-1',
  decidedById: 'mod-1',
  targetType: 'COURSE_REVIEW',
  materialId: null,
  courseReviewId: 'rev-1',
  examExperienceId: null,
  appeal: null,
  ...overrides,
});

describe('AppealsService.file', () => {
  let service: AppealsService;
  const prisma = {
    $transaction: vi.fn(),
    moderationCase: { findUnique: vi.fn() },
    sanction: { findUnique: vi.fn() },
    appeal: { create: vi.fn().mockResolvedValue({ id: 'appeal-1' }) },
    moderationEvent: { create: vi.fn() },
  };

  beforeEach(async () => {
    vi.useFakeTimers().setSystemTime(NOW);
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
    prisma.moderationCase.findUnique.mockResolvedValue(retiroCase());
    const moduleRef = await Test.createTestingModule({
      providers: [
        AppealsService,
        { provide: PrismaService, useValue: prisma },
        { provide: DecisionsService, useValue: {} },
        { provide: SanctionsService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(AppealsService);
  });

  it('files an appeal of a retiro, remembering who decided it', async () => {
    await service.file(
      'author-1',
      { kind: 'RETIRO', caseId: 'case-1' },
      '  No es lo que dicen.  ',
    );

    expect(prisma.appeal.create).toHaveBeenCalledWith({
      data: {
        appellantId: 'author-1',
        kind: 'RETIRO',
        caseId: 'case-1',
        explanation: 'No es lo que dicen.',
        decidedById: 'mod-1',
      },
    });
    // With the content columns, 2a's masking keeps an anonymous appellant hidden.
    expect(prisma.moderationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'author-1',
        action: 'APPEAL_FILED',
        targetUserId: 'author-1',
        caseId: 'case-1',
        courseReviewId: 'rev-1',
      }),
    });
  });

  it('files an appeal of a sanción', async () => {
    prisma.sanction.findUnique.mockResolvedValue({
      id: 'sanction-1',
      userId: 'author-1',
      startsAt: daysAgo(1),
      voidedAt: null,
      appliedById: 'admin-1',
      caseId: null,
      case: null,
      appeal: null,
    });

    await service.file(
      'author-1',
      { kind: 'SANCTION', sanctionId: 'sanction-1' },
      'Fue un error.',
    );

    expect(prisma.appeal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind: 'SANCTION',
        sanctionId: 'sanction-1',
        decidedById: 'admin-1',
      }),
    });
  });

  it('refuses an empty explanation', async () => {
    await expect(
      service.file('author-1', { kind: 'RETIRO', caseId: 'case-1' }, '  '),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not reveal someone else’s decisions', async () => {
    await expect(
      service.file('other', { kind: 'RETIRO', caseId: 'case-1' }, 'x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses a second appeal', async () => {
    prisma.moderationCase.findUnique.mockResolvedValue(
      retiroCase({ appeal: { id: 'appeal-0' } }),
    );

    await expect(
      service.file('author-1', { kind: 'RETIRO', caseId: 'case-1' }, 'x'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'ALREADY_APPEALED' }),
    });
  });

  it('refuses an appeal after 14 days', async () => {
    prisma.moderationCase.findUnique.mockResolvedValue(
      retiroCase({ closedAt: daysAgo(15) }),
    );

    await expect(
      service.file('author-1', { kind: 'RETIRO', caseId: 'case-1' }, 'x'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'WINDOW_CLOSED' }),
    });
  });

  it('points a revisión previa rejection to editing and resubmitting', async () => {
    prisma.moderationCase.findUnique.mockResolvedValue(
      retiroCase({ decision: 'REJECT' }),
    );

    const error = await service
      .file('author-1', { kind: 'RETIRO', caseId: 'case-1' }, 'x')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toEqual(
      expect.objectContaining({
        code: 'NOT_APPEALABLE',
        message: expect.stringContaining('reenviar'),
      }),
    );
  });
});
