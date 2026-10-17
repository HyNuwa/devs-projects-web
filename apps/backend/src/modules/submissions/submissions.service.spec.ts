import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { SubmissionsService } from './submissions.service';

describe('SubmissionsService.list', () => {
  let service: SubmissionsService;

  const prisma = {
    material: { findMany: jest.fn() },
    courseReview: { findMany: jest.fn() },
    examExperience: { findMany: jest.fn() },
    moderationCase: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const subject = { id: 'sub-1', code: 'ED-01', name: 'Estructura de Datos' };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.material.findMany.mockResolvedValue([
      {
        id: 'mat-1',
        title: 'Parcial 1',
        subject,
        publicationStatus: 'REJECTED',
        authorFacingReason: 'Tapá los DNI y volvé a enviarlo.',
        statusChangedAt: new Date('2026-09-20T10:00:00.000Z'),
        createdAt: new Date('2026-09-18T10:00:00.000Z'),
      },
    ]);
    prisma.courseReview.findMany.mockResolvedValue([
      {
        id: 'rev-1',
        isAnonymous: true,
        subject,
        publicationStatus: 'REMOVED',
        authorFacingReason: 'Ataca a una persona.',
        statusChangedAt: new Date('2026-09-25T10:00:00.000Z'),
        createdAt: new Date('2026-09-24T10:00:00.000Z'),
      },
    ]);
    prisma.examExperience.findMany.mockResolvedValue([
      {
        id: 'exam-1',
        isAnonymous: false,
        subject,
        publicationStatus: 'HIDDEN',
        authorFacingReason: null,
        statusChangedAt: new Date('2026-09-27T10:00:00.000Z'),
        createdAt: new Date('2026-09-26T10:00:00.000Z'),
      },
    ]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(SubmissionsService);
  });

  it('lists every contribution of the author, newest first, anonymous ones included', async () => {
    const result = await service.list('user-1');

    expect(result.map((item) => [item.type, item.id, item.status])).toEqual([
      ['EXAM_EXPERIENCE', 'exam-1', 'HIDDEN'],
      ['COURSE_REVIEW', 'rev-1', 'REMOVED'],
      ['MATERIAL', 'mat-1', 'REJECTED'],
    ]);
    expect(prisma.material.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          authorId: 'user-1',
          isDeleted: false,
        }),
      }),
    );
    for (const model of [prisma.courseReview, prisma.examExperience]) {
      expect(model.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    }
  });

  it('shows the author-facing reason and date and offers resubmission only when rejected', async () => {
    const result = await service.list('user-1');
    const material = result.find((item) => item.id === 'mat-1')!;
    const review = result.find((item) => item.id === 'rev-1')!;

    expect(material).toEqual(
      expect.objectContaining({
        title: 'Parcial 1',
        subject,
        reason: 'Tapá los DNI y volvé a enviarlo.',
        statusChangedAt: new Date('2026-09-20T10:00:00.000Z'),
        canResubmit: true,
      }),
    );
    expect(review).toEqual(
      expect.objectContaining({
        title: 'Reseña de cursada',
        isAnonymous: true,
        canResubmit: false,
      }),
    );
  });

  it('never exposes who decided or who reported', async () => {
    const result = await service.list('user-1');

    for (const item of result) {
      expect(Object.keys(item)).not.toEqual(
        expect.arrayContaining([
          'decidedBy',
          'moderator',
          'reporter',
          'reports',
        ]),
      );
    }
  });
});
