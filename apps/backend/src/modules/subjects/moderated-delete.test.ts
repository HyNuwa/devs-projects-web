import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicationPolicy } from '../moderation/publication-policy.service';
import { PointService } from '../ranking/point.service';
import { SubjectsService } from './subjects.service';

describe('authors cannot delete content under moderation', () => {
  const prisma = {
    courseReview: { findUnique: vi.fn(), delete: vi.fn() },
    examExperience: { findUnique: vi.fn(), delete: vi.fn() },
  };
  let service: SubjectsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SubjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PointService, useValue: {} },
        { provide: ConfigService, useValue: { get: vi.fn() } },
        { provide: PublicationPolicy, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(SubjectsService);
  });

  it.each(['REMOVED', 'HIDDEN'])(
    'keeps a %s reseña, so its retiro keeps counting and its caso stays open',
    async (publicationStatus) => {
      prisma.courseReview.findUnique.mockResolvedValue({
        id: 'rev-1',
        userId: 'user-1',
        publicationStatus,
      });

      const error = await service
        .deleteReview('rev-1', 'user-1')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual(
        expect.objectContaining({ code: 'MODERATED_CONTENT' }),
      );
      expect(prisma.courseReview.delete).not.toHaveBeenCalled();
    },
  );

  it('keeps a retired experiencia', async () => {
    prisma.examExperience.findUnique.mockResolvedValue({
      id: 'exam-1',
      userId: 'user-1',
      publicationStatus: 'REMOVED',
    });

    await expect(service.deleteExam('exam-1', 'user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.examExperience.delete).not.toHaveBeenCalled();
  });

  it('still deletes a published reseña', async () => {
    prisma.courseReview.findUnique.mockResolvedValue({
      id: 'rev-1',
      userId: 'user-1',
      publicationStatus: 'PUBLISHED',
    });

    await service.deleteReview('rev-1', 'user-1');

    expect(prisma.courseReview.delete).toHaveBeenCalledWith({
      where: { id: 'rev-1' },
    });
  });
});
