import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicationPolicy } from '../moderation/publication-policy.service';
import { PointService } from '../ranking/point.service';
import { SubjectsService } from './subjects.service';

const removedAt = new Date('2026-09-25T10:00:00.000Z');
const owner = {
  id: 'author-1',
  username: 'lucia',
  displayName: null,
  avatarUrl: null,
};

describe('SubjectsService owner management view', () => {
  let service: SubjectsService;

  const prisma = {
    courseReview: { findUnique: jest.fn() },
    examExperience: { findUnique: jest.fn() },
  };

  const entry = (overrides: Record<string, unknown> = {}) => ({
    id: 'rev-1',
    userId: 'author-1',
    subjectId: 'sub-1',
    isAnonymous: true,
    publicationStatus: 'REMOVED',
    authorFacingReason: 'Ataca a una persona.',
    statusChangedAt: removedAt,
    createdAt: new Date('2026-09-20T10:00:00.000Z'),
    updatedAt: new Date('2026-09-20T10:00:00.000Z'),
    user: owner,
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.courseReview.findUnique.mockResolvedValue(entry());
    prisma.examExperience.findUnique.mockResolvedValue(
      entry({
        id: 'exam-1',
        publicationStatus: 'PUBLISHED',
        authorFacingReason: null,
      }),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PointService, useValue: {} },
        { provide: PublicationPolicy, useValue: {} },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback: unknown) => fallback },
        },
      ],
    }).compile();
    service = moduleRef.get(SubjectsService);
  });

  it('shows the owner the status, reason and date of a retired reseña', async () => {
    const view = await service.getReviewManagementView('rev-1', 'author-1');

    expect(view).toEqual(
      expect.objectContaining({
        type: 'COURSE_REVIEW',
        id: 'rev-1',
        isAnonymous: true,
        author: owner,
        moderation: {
          status: 'REMOVED',
          isRemoved: true,
          reason: 'Ataca a una persona.',
          date: removedAt,
        },
      }),
    );
  });

  it('reports a published experiencia without a reason or date', async () => {
    const view = await service.getExamManagementView('exam-1', 'author-1');

    expect(view.moderation).toEqual({
      status: 'PUBLISHED',
      isRemoved: false,
      reason: null,
      date: null,
    });
  });

  it('refuses anyone who is not the author, moderators included', async () => {
    await expect(
      service.getReviewManagementView('rev-1', 'moderator-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 for a missing entry', async () => {
    prisma.courseReview.findUnique.mockResolvedValue(null);

    await expect(
      service.getReviewManagementView('nope', 'author-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
