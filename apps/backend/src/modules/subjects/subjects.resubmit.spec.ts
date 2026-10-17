import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicationPolicy } from '../moderation/publication-policy.service';
import { PointService } from '../ranking/point.service';
import { SubjectsService } from './subjects.service';

describe('SubjectsService resubmission of rejected reseñas and experiencias', () => {
  let service: SubjectsService;

  const prisma = {
    courseReview: { findUnique: jest.fn(), update: jest.fn() },
    examExperience: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  const policy = { priorReviewFor: jest.fn(), openPriorReview: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.courseReview.findUnique.mockResolvedValue({
      id: 'rev-1',
      userId: 'user-1',
      publicationStatus: 'REJECTED',
    });
    prisma.examExperience.findUnique.mockResolvedValue({
      id: 'exam-1',
      userId: 'user-1',
      publicationStatus: 'REJECTED',
    });
    prisma.courseReview.update.mockResolvedValue({ id: 'rev-1' });
    prisma.examExperience.update.mockResolvedValue({ id: 'exam-1' });
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PointService, useValue: { awardFor: jest.fn() } },
        { provide: PublicationPolicy, useValue: policy },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback: unknown) => fallback },
        },
      ],
    }).compile();
    service = moduleRef.get(SubjectsService);
  });

  it('returns a rejected reseña to revisión previa with a new caso', async () => {
    await service.resubmitReview('rev-1', 'user-1');

    expect(prisma.courseReview.update).toHaveBeenCalledWith({
      where: { id: 'rev-1' },
      data: {
        publicationStatus: 'PENDING_REVIEW',
        statusChangedAt: expect.any(Date),
        authorFacingReason: null,
      },
    });
    expect(policy.openPriorReview).toHaveBeenCalledWith(
      prisma,
      { type: 'COURSE_REVIEW', id: 'rev-1' },
      'user-1',
      'RESUBMITTED',
      'Reseña de cursada',
      'RESUBMITTED',
    );
  });

  it('returns a rejected experiencia to revisión previa with a new caso', async () => {
    await service.resubmitExam('exam-1', 'user-1');

    expect(policy.openPriorReview).toHaveBeenCalledWith(
      prisma,
      { type: 'EXAM_EXPERIENCE', id: 'exam-1' },
      'user-1',
      'RESUBMITTED',
      'Experiencia de final',
      'RESUBMITTED',
    );
  });

  it('refuses another user', async () => {
    await expect(
      service.resubmitReview('rev-1', 'intruso'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses content that is not rejected', async () => {
    prisma.examExperience.findUnique.mockResolvedValue({
      id: 'exam-1',
      userId: 'user-1',
      publicationStatus: 'REMOVED',
    });

    await expect(
      service.resubmitExam('exam-1', 'user-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(policy.openPriorReview).not.toHaveBeenCalled();
  });
});
