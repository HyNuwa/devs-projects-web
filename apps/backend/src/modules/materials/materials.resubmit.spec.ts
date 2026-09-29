import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicationPolicy } from '../moderation/publication-policy.service';
import { PointService } from '../ranking/point.service';
import { MaterialsService } from './materials.service';

describe('MaterialsService.resubmit (corregir y reenviar)', () => {
  let service: MaterialsService;

  const prisma = {
    material: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const storage = { stage: jest.fn(), publish: jest.fn(), discard: jest.fn() };
  const policy = { priorReviewFor: jest.fn(), openPriorReview: jest.fn() };

  const rejected = {
    id: 'mat-1',
    title: 'Final sin tachar',
    authorId: 'user-1',
    subjectId: 'sub-1',
    isDeleted: false,
    publicationStatus: 'REJECTED',
    stagedFilePath: '/staging/old.pdf',
  };
  const newFile = {
    originalname: 'final.pdf',
    mimetype: 'application/pdf',
    size: 12,
    buffer: Buffer.from('final tapado'),
  } as Express.Multer.File;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.material.findUnique.mockResolvedValue(rejected);
    prisma.material.findFirst.mockResolvedValue(null);
    storage.discard.mockResolvedValue(undefined);
    prisma.material.update.mockImplementation(async ({ data }) => ({
      ...rejected,
      ...data,
    }));
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
    storage.stage.mockResolvedValue({
      stagedPath: '/staging/new.pdf',
      fileType: 'pdf',
      fileSize: 12,
      thumbnailUrl: null,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'FILE_STORAGE', useValue: storage },
        { provide: PointService, useValue: { awardFor: jest.fn() } },
        { provide: PublicationPolicy, useValue: policy },
      ],
    }).compile();
    service = moduleRef.get(MaterialsService);
  });

  it('returns a rejected material to revisión previa and opens a new caso', async () => {
    await service.resubmit('mat-1', 'user-1');

    expect(prisma.material.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'mat-1' },
        data: expect.objectContaining({
          publicationStatus: 'PENDING_REVIEW',
          authorFacingReason: null,
          statusChangedAt: expect.any(Date),
        }),
      }),
    );
    expect(policy.openPriorReview).toHaveBeenCalledWith(
      prisma,
      { type: 'MATERIAL', id: 'mat-1' },
      'user-1',
      'RESUBMITTED',
      'Final sin tachar',
      'RESUBMITTED',
    );
    expect(storage.stage).not.toHaveBeenCalled();
  });

  it('replaces the staged file when the author sends a corrected one', async () => {
    await service.resubmit('mat-1', 'user-1', newFile);

    expect(storage.stage).toHaveBeenCalledWith(newFile);
    expect(prisma.material.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stagedFilePath: '/staging/new.pdf',
          fileHash: expect.stringMatching(/^[0-9a-f]{64}$/),
        }),
      }),
    );
    expect(storage.discard).toHaveBeenCalledWith('/staging/old.pdf');
  });

  it('refuses a replacement file that duplicates another material of the materia', async () => {
    prisma.material.findFirst.mockResolvedValue({ id: 'other-4' });

    await expect(
      service.resubmit('mat-1', 'user-1', newFile),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.material.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { not: 'mat-1' } }),
      }),
    );
    expect(prisma.material.update).not.toHaveBeenCalled();
  });

  it('refuses another user', async () => {
    await expect(service.resubmit('mat-1', 'intruso')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('refuses content that is not rejected', async () => {
    prisma.material.findUnique.mockResolvedValue({
      ...rejected,
      publicationStatus: 'PUBLISHED',
    });

    await expect(service.resubmit('mat-1', 'user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('refuses a deleted material', async () => {
    prisma.material.findUnique.mockResolvedValue({
      ...rejected,
      isDeleted: true,
    });

    await expect(service.resubmit('mat-1', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
