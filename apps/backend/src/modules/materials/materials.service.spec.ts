import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PointService } from '../ranking/point.service';
import { Role } from '../auth/dto/auth-response.dto';

describe('MaterialsService', () => {
  let service: MaterialsService;

  const prisma = {
    material: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    materialRating: {
      upsert: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    subject: {
      update: jest.fn(),
    },
    moderationLog: {
      create: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };

  const storage = {
    stage: jest.fn(),
    publish: jest.fn(),
    discard: jest.fn(),
  };

  const pointService = {
    awardPoints: jest.fn(),
  };

  const mockFile = {
    originalname: 'apuntes.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('contenido de prueba'),
  } as Express.Multer.File;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'FILE_STORAGE', useValue: storage },
        { provide: PointService, useValue: pointService },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
  });

  describe('create', () => {
    it('hace staging del archivo y crea el material en PENDING sin puntos', async () => {
      storage.stage.mockResolvedValue({
        stagedPath: '/tmp/staging/abc.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        thumbnailUrl: null,
      });
      prisma.material.create.mockResolvedValue({ id: 'mat-1' });

      const dto = { title: 'Apuntes de Cálculo', subjectId: 'sub-1' };
      const result = await service.create(dto, mockFile, 'user-1');

      expect(storage.stage).toHaveBeenCalledWith(mockFile);
      expect(prisma.material.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Apuntes de Cálculo',
            fileType: 'pdf',
            fileSize: BigInt(1024),
            authorId: 'user-1',
            subjectId: 'sub-1',
            moderationStatus: 'PENDING',
            stagedFilePath: '/tmp/staging/abc.pdf',
          }),
        }),
      );
      // No se otorgan puntos al crear.
      expect(pointService.awardPoints).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'mat-1' });
    });
  });

  describe('findAll', () => {
    it('solo devuelve materiales aprobados y no eliminados', async () => {
      prisma.material.findMany.mockResolvedValue([{ id: 'mat-1' }]);
      prisma.material.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeleted: false,
            moderationStatus: 'APPROVED',
          }),
        }),
      );
      expect(result.meta.total).toBe(1);
    });
  });

  describe('approve', () => {
    it('publica el archivo, marca aprobado y otorga puntos al autor', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        subjectId: 'sub-1',
        fileType: 'pdf',
        stagedFilePath: '/tmp/staging/abc.pdf',
        moderationStatus: 'PENDING',
        isDeleted: false,
      });
      storage.publish.mockResolvedValue({
        fileUrl: '/uploads/materials/final.pdf',
        driveFileId: 'drive-1',
        drivePreviewUrl: 'https://drive.google.com/file/d/drive-1/preview',
        driveDownloadUrl:
          'https://drive.google.com/uc?id=drive-1&export=download',
      });
      prisma.material.update.mockResolvedValue({ id: 'mat-1' });
      prisma.material.findFirst.mockResolvedValue({ id: 'mat-1' });
      prisma.subject.update.mockResolvedValue({ id: 'sub-1' });
      prisma.moderationLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await service.approve('mat-1', 'mod-1');

      expect(storage.publish).toHaveBeenCalledWith('/tmp/staging/abc.pdf', {
        fileType: 'pdf',
      });
      expect(prisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moderationStatus: 'APPROVED',
            isApproved: true,
            driveFileId: 'drive-1',
            stagedFilePath: null,
          }),
        }),
      );
      expect(pointService.awardPoints).toHaveBeenCalledWith(
        'user-1',
        10,
        'MATERIAL_APPROVED',
        'mat-1',
      );
      expect(result).toEqual({ id: 'mat-1' });
    });
  });

  describe('reject', () => {
    it('descarta el staging, marca rechazado con motivo y no otorga puntos', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        subjectId: 'sub-1',
        stagedFilePath: '/tmp/staging/abc.pdf',
        moderationStatus: 'PENDING',
        isDeleted: false,
      });
      prisma.material.update.mockResolvedValue({ id: 'mat-1' });
      prisma.moderationLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await service.reject('mat-1', 'mod-1', {
        reason: 'Contenido duplicado',
      });

      expect(storage.discard).toHaveBeenCalledWith('/tmp/staging/abc.pdf');
      expect(prisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moderationStatus: 'REJECTED',
            moderationReason: 'Contenido duplicado',
            stagedFilePath: null,
          }),
        }),
      );
      expect(pointService.awardPoints).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'mat-1' });
    });
  });

  describe('findById', () => {
    it('lanza NotFoundException si el material no está aprobado', async () => {
      prisma.material.findFirst.mockResolvedValue(null);

      await expect(service.findById('mat-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('lanza ForbiddenException si no es el autor', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'otro-user',
        isDeleted: false,
      });

      await expect(
        service.update('mat-1', { title: 'Nuevo' }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('permite al moderador eliminar un material ajeno', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        isDeleted: false,
      });
      prisma.material.update.mockResolvedValue({ id: 'mat-1' });

      const result = await service.remove('mat-1', 'mod-1', Role.MODERATOR);

      expect(prisma.material.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { isDeleted: true },
      });
      expect(result).toEqual({ id: 'mat-1' });
    });
  });
});
