import { createHash } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicationPolicy } from '../moderation/publication-policy.service';
import { PointService } from '../ranking/point.service';
import { MaterialsService } from './materials.service';

describe('MaterialsService.create (publicación inmediata)', () => {
  let service: MaterialsService;

  const prisma = {
    material: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    subject: { findUnique: jest.fn(), update: jest.fn() },
    subjectProfessor: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const storage = { stage: jest.fn(), publish: jest.fn(), discard: jest.fn() };
  const pointService = { awardFor: jest.fn() };
  const policy = { priorReviewFor: jest.fn(), openPriorReview: jest.fn() };

  const content = Buffer.from('%PDF parcial resuelto');
  const file = {
    originalname: 'parcial.pdf',
    mimetype: 'application/pdf',
    size: content.length,
    buffer: content,
  } as Express.Multer.File;
  const hash = createHash('sha256').update(content).digest('hex');
  const dto = {
    title: 'Parcial 1 resuelto',
    subjectId: 'sub-1',
    resourceType: 'PARCIAL' as const,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.subject.findUnique.mockResolvedValue({ id: 'sub-1' });
    prisma.material.findFirst.mockResolvedValue(null);
    storage.discard.mockResolvedValue(undefined);
    prisma.material.findMany.mockResolvedValue([]);
    prisma.material.create.mockImplementation(async ({ data }) => ({
      id: 'mat-1',
      ...data,
    }));
    prisma.$transaction.mockImplementation(
      async (work: (tx: typeof prisma) => unknown) => work(prisma),
    );
    storage.stage.mockResolvedValue({
      stagedPath: '/staging/p.pdf',
      fileType: 'pdf',
      fileSize: content.length,
      thumbnailUrl: null,
    });
    storage.publish.mockResolvedValue({
      fileUrl: 'https://drive/p',
      driveFileId: 'drive-1',
      drivePreviewUrl: 'https://drive/p/preview',
      driveDownloadUrl: 'https://drive/p/download',
    });
    policy.priorReviewFor.mockResolvedValue(null);
    policy.openPriorReview.mockResolvedValue({ id: 'case-1' });

    const moduleRef = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'FILE_STORAGE', useValue: storage },
        { provide: PointService, useValue: pointService },
        { provide: PublicationPolicy, useValue: policy },
      ],
    }).compile();
    service = moduleRef.get(MaterialsService);
  });

  it('publishes an established student’s material immediately, with its file and points', async () => {
    const result = await service.create(dto, file, 'user-1');

    expect(result.outcome).toBe('PUBLISHED');
    expect(storage.publish).toHaveBeenCalledWith('/staging/p.pdf', {
      fileType: 'pdf',
    });
    expect(prisma.material.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicationStatus: 'PUBLISHED',
          fileHash: hash,
          fileUrl: 'https://drive/p',
          driveFileId: 'drive-1',
          stagedFilePath: null,
        }),
      }),
    );
    expect(pointService.awardFor).toHaveBeenCalledWith(prisma, {
      userId: 'user-1',
      amount: 10,
      reason: 'MATERIAL_PUBLISHED',
      referenceId: 'mat-1',
    });
    expect(prisma.subject.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { materialCount: { increment: 1 } },
    });
  });

  it('holds a new account’s material for revisión previa without publishing or points', async () => {
    policy.priorReviewFor.mockResolvedValue('NEW_ACCOUNT');

    const result = await service.create(dto, file, 'user-1');

    expect(result).toEqual(
      expect.objectContaining({
        outcome: 'PENDING_REVIEW',
        reason: 'NEW_ACCOUNT',
      }),
    );
    expect(storage.publish).not.toHaveBeenCalled();
    expect(prisma.material.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicationStatus: 'PENDING_REVIEW',
          stagedFilePath: '/staging/p.pdf',
          fileHash: hash,
        }),
      }),
    );
    expect(policy.openPriorReview).toHaveBeenCalledWith(
      prisma,
      { type: 'MATERIAL', id: 'mat-1' },
      'user-1',
      'NEW_ACCOUNT',
      'Parcial 1 resuelto',
    );
    expect(pointService.awardFor).not.toHaveBeenCalled();
  });

  it('refuses an exact duplicate in the same materia and points to the existing material', async () => {
    prisma.material.findFirst.mockResolvedValue({
      id: 'existing-7',
      publicationStatus: 'PUBLISHED',
      hiddenAt: null,
    });

    const error = await service
      .create(dto, file, 'user-1')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toEqual(
      expect.objectContaining({
        code: 'DUPLICATE_MATERIAL',
        materialId: 'existing-7',
      }),
    );
    expect(prisma.material.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          subjectId: 'sub-1',
          fileHash: hash,
          isDeleted: false,
          publicationStatus: { in: ['PUBLISHED', 'PENDING_REVIEW', 'HIDDEN'] },
        }),
      }),
    );
    expect(storage.stage).not.toHaveBeenCalled();
  });

  it('refuses a duplicate of a copy that is not public without revealing which one', async () => {
    prisma.material.findFirst.mockResolvedValue({
      id: 'pending-3',
      publicationStatus: 'PENDING_REVIEW',
      hiddenAt: null,
    });

    const error = await service
      .create(dto, file, 'user-1')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ConflictException);
    const body = (error as ConflictException).getResponse() as Record<
      string,
      unknown
    >;
    expect(body).toEqual(
      expect.objectContaining({ code: 'DUPLICATE_MATERIAL', visible: false }),
    );
    expect(body).not.toHaveProperty('materialId');
    expect(body.message).not.toContain('publicado');
  });

  it('refuses the eleventh upload within 24 hours, retrying when the oldest leaves the window', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-29T12:00:00.000Z'));
    // The ten most recent uploads, newest first: the oldest was 23 hours ago.
    prisma.material.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => ({
        createdAt: new Date(
          Date.parse('2026-09-29T12:00:00.000Z') - (index * 23 * 3_600_000) / 9,
        ),
      })),
    );

    const error = await service
      .create(dto, file, 'user-1')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
    expect((error as HttpException).getResponse()).toEqual(
      expect.objectContaining({
        code: 'UPLOAD_LIMIT',
        retryAt: '2026-09-29T13:00:00.000Z',
      }),
    );
    expect(prisma.material.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    );
    expect(storage.stage).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('refuses an empty file before storing anything', async () => {
    const empty = {
      ...file,
      size: 0,
      buffer: Buffer.alloc(0),
    } as Express.Multer.File;

    await expect(service.create(dto, empty, 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(storage.stage).not.toHaveBeenCalled();
  });

  it('creates nothing and discards the staged file when Drive fails', async () => {
    storage.publish.mockRejectedValue(new Error('Drive caído'));

    await expect(service.create(dto, file, 'user-1')).rejects.toThrow();
    expect(storage.discard).toHaveBeenCalledWith('/staging/p.pdf');
    expect(prisma.material.create).not.toHaveBeenCalled();
    expect(pointService.awardFor).not.toHaveBeenCalled();
  });
});
