import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { ExamFormat } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicationPolicy } from '../moderation/publication-policy.service';
import { PointService } from '../ranking/point.service';
import { SubjectsService } from './subjects.service';

describe('SubjectsService publication of reseñas and experiencias', () => {
  let service: SubjectsService;

  const prisma = {
    subjectProfessor: { findUnique: jest.fn() },
    courseReview: { create: jest.fn(), findFirst: jest.fn() },
    examExperience: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const pointService = { awardFor: jest.fn() };
  const policy = { priorReviewFor: jest.fn(), openPriorReview: jest.fn() };

  const reviewDto = {
    academicYear: 2025,
    recommendation: 4,
    comment: 'Buena cursada',
  };
  const examDto = { year: 2025, format: ExamFormat.ESCRITO };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.courseReview.findFirst.mockResolvedValue(null);
    prisma.courseReview.create.mockResolvedValue({ id: 'review-1' });
    prisma.examExperience.create.mockResolvedValue({ id: 'exam-1' });
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
    policy.priorReviewFor.mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PointService, useValue: pointService },
        { provide: PublicationPolicy, useValue: policy },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback: unknown) => fallback },
        },
      ],
    }).compile();
    service = moduleRef.get(SubjectsService);
    jest
      .spyOn(service, 'findByCode')
      .mockResolvedValue({ id: 'sub-1' } as never);
  });

  it('publishes a reseña immediately with its 5 points', async () => {
    const result = await service.createReview(
      'ED-01',
      'user-1',
      reviewDto as never,
    );

    expect(result).toEqual({
      review: { id: 'review-1' },
      outcome: 'PUBLISHED',
      reason: null,
    });
    expect(prisma.courseReview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ publicationStatus: 'PUBLISHED' }),
      }),
    );
    expect(pointService.awardFor).toHaveBeenCalledWith(prisma, {
      userId: 'user-1',
      amount: 5,
      reason: 'COURSE_REVIEWED',
      referenceId: 'review-1',
    });
  });

  it('holds a reseña from an unverified account for revisión previa without points', async () => {
    policy.priorReviewFor.mockResolvedValue('UNVERIFIED_EMAIL');

    const result = await service.createReview(
      'ED-01',
      'user-1',
      reviewDto as never,
    );

    expect(result).toEqual({
      review: { id: 'review-1' },
      outcome: 'PENDING_REVIEW',
      reason: 'UNVERIFIED_EMAIL',
    });
    expect(prisma.courseReview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ publicationStatus: 'PENDING_REVIEW' }),
      }),
    );
    expect(policy.openPriorReview).toHaveBeenCalledWith(
      prisma,
      { type: 'COURSE_REVIEW', id: 'review-1' },
      'user-1',
      'UNVERIFIED_EMAIL',
      'Reseña de cursada',
    );
    expect(pointService.awardFor).not.toHaveBeenCalled();
  });

  it('publishes an experiencia de final immediately with its 5 points', async () => {
    const result = await service.createExam(
      'ED-01',
      'user-1',
      examDto as never,
    );

    expect(result).toEqual({
      exam: { id: 'exam-1' },
      outcome: 'PUBLISHED',
      reason: null,
    });
    expect(pointService.awardFor).toHaveBeenCalledWith(prisma, {
      userId: 'user-1',
      amount: 5,
      reason: 'EXAM_EXPERIENCE_SHARED',
      referenceId: 'exam-1',
    });
  });

  it('holds an experiencia from a new account for revisión previa', async () => {
    policy.priorReviewFor.mockResolvedValue('NEW_ACCOUNT');

    const result = await service.createExam(
      'ED-01',
      'user-1',
      examDto as never,
    );

    expect(result.outcome).toBe('PENDING_REVIEW');
    expect(policy.openPriorReview).toHaveBeenCalledWith(
      prisma,
      { type: 'EXAM_EXPERIENCE', id: 'exam-1' },
      'user-1',
      'NEW_ACCOUNT',
      'Experiencia de final',
    );
    expect(pointService.awardFor).not.toHaveBeenCalled();
  });
});
