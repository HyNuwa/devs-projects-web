import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service';
import { MaterialsService } from '../materials/materials.service';
import { PointService } from '../ranking/point.service';
import { DecisionsService } from './decisions.service';
import { SanctionsService } from './sanctions.service';

const mod = { id: 'mod-1', role: 'MODERATOR' } as const;

describe('«Retirar» with «Advertir también»', () => {
  const sanctions = { warn: vi.fn() };
  let prisma: ReturnType<typeof prismaDouble>;
  let service: DecisionsService;

  function prismaDouble() {
    const double = {
      $transaction: vi.fn(),
      moderationCase: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'case-1',
          kind: 'REPORTS',
          status: 'OPEN',
          decision: null,
          targetType: 'COURSE_REVIEW',
          materialId: null,
          courseReviewId: 'rev-1',
          examExperienceId: null,
          reports: [{ reporterId: 'reporter-1' }],
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      courseReview: {
        findUnique: vi.fn().mockResolvedValue({
          userId: 'author-2',
          subjectId: 'sub-1',
          isAnonymous: true,
          publicationStatus: 'HIDDEN',
          hiddenAt: new Date(),
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      report: { updateMany: vi.fn() },
      moderationEvent: { create: vi.fn() },
      subject: { update: vi.fn() },
      user: { findUnique: vi.fn().mockResolvedValue({ role: 'USER' }) },
    };
    double.$transaction.mockImplementation(
      async (work: (tx: typeof double) => unknown) => work(double),
    );
    return double;
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma = prismaDouble();
    const moduleRef = await Test.createTestingModule({
      providers: [
        DecisionsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: PointService,
          useValue: { awardFor: vi.fn(), revertFor: vi.fn() },
        },
        { provide: MaterialsService, useValue: {} },
        { provide: SanctionsService, useValue: sanctions },
      ],
    }).compile();
    service = moduleRef.get(DecisionsService);
  });

  it('warns the author, even anonymous, with the retiro reason inside the same transaction', async () => {
    await service.decide('case-1', mod, {
      decision: 'REMOVE',
      reason: 'Insultos a una docente.',
      warn: true,
    });

    expect(sanctions.warn).toHaveBeenCalledWith(
      mod,
      'author-2',
      'Insultos a una docente.',
      { caseId: 'case-1', tx: prisma, decidingCase: true },
    );
  });

  it('still retires, without warning and without an error, when the author is staff', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'MODERATOR' });

    await expect(
      service.decide('case-1', mod, {
        decision: 'REMOVE',
        reason: 'Insultos',
        warn: true,
      }),
    ).resolves.toEqual(expect.objectContaining({ status: 'REMOVED' }));

    expect(sanctions.warn).not.toHaveBeenCalled();
  });

  it('retires without warning when the moderator leaves it unchecked', async () => {
    await service.decide('case-1', mod, {
      decision: 'REMOVE',
      reason: 'Insultos',
      warn: false,
    });

    expect(sanctions.warn).not.toHaveBeenCalled();
  });

  it('ignores the option on decisions other than «Retirar»', async () => {
    await service.decide('case-1', mod, {
      decision: 'KEEP_VISIBLE',
      warn: true,
    });

    expect(sanctions.warn).not.toHaveBeenCalled();
  });
});
