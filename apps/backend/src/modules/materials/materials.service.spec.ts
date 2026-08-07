import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { MaterialStorageService } from './material-storage.service';
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
    $executeRaw: jest.fn(),
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };

  const storage = {
    save: jest.fn(),
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
        { provide: MaterialStorageService, useValue: storage },
        { provide: PointService, useValue: pointService },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
  });

  describe('create', () => {
    it('guarda el archivo, crea el material e incrementa el contador de la materia', async () => {
      storage.save.mockResolvedValue({
        fileUrl: '/uploads/materials/abc.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        thumbnailUrl: null,
      });
      prisma.material.create.mockResolvedValue({ id: 'mat-1' });
      prisma.subject.update.mockResolvedValue({ id: 'sub-1' });

      const dto = { title: 'Apuntes de Cálculo', subjectId: 'sub-1' };
      const result = await service.create(dto, mockFile, 'user-1');

      expect(storage.save).toHaveBeenCalledWith(mockFile);
      expect(prisma.material.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Apuntes de Cálculo',
            fileUrl: '/uploads/materials/abc.pdf',
            fileType: 'pdf',
            fileSize: BigInt(1024),
            authorId: 'user-1',
            subjectId: 'sub-1',
          }),
        }),
      );
      expect(prisma.subject.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { materialCount: { increment: 1 } },
      });
      expect(pointService.awardPoints).toHaveBeenCalledWith(
        'user-1',
        10,
        'MATERIAL_CREATED',
        'mat-1',
      );
      expect(result).toEqual({ id: 'mat-1' });
    });
  });

  describe('findAll', () => {
    it('pagina y filtra excluyendo materiales eliminados', async () => {
      prisma.material.findMany.mockResolvedValue([{ id: 'mat-1' }]);
      prisma.material.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDeleted: false },
          skip: 0,
          take: 10,
        }),
      );
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('aplica filtro por subjectId y búsqueda por título', async () => {
      prisma.material.findMany.mockResolvedValue([]);
      prisma.material.count.mockResolvedValue(0);

      await service.findAll({ subjectId: 'sub-1', search: 'cálculo' });

      expect(prisma.material.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isDeleted: false,
            subjectId: 'sub-1',
            title: { contains: 'cálculo', mode: 'insensitive' },
          },
        }),
      );
    });
  });

  describe('findById', () => {
    it('devuelve el material si existe', async () => {
      prisma.material.findFirst.mockResolvedValue({ id: 'mat-1' });

      const result = await service.findById('mat-1');

      expect(prisma.material.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'mat-1', isDeleted: false } }),
      );
      expect(result).toEqual({ id: 'mat-1' });
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.material.findFirst.mockResolvedValue(null);

      await expect(service.findById('mat-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('actualiza el material si el usuario es el autor', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        isDeleted: false,
      });
      prisma.material.update.mockResolvedValue({ id: 'mat-1' });

      const result = await service.update(
        'mat-1',
        { title: 'Nuevo título' },
        'user-1',
      );

      expect(prisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'mat-1' },
          data: expect.objectContaining({ title: 'Nuevo título' }),
        }),
      );
      expect(result).toEqual({ id: 'mat-1' });
    });

    it('lanza ForbiddenException si el usuario no es el autor', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        isDeleted: false,
      });

      await expect(
        service.update('mat-1', { title: 'Nuevo' }, 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lanza NotFoundException si el material no existe', async () => {
      prisma.material.findUnique.mockResolvedValue(null);

      await expect(
        service.update('mat-1', { title: 'Nuevo' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('hace soft delete si el usuario es el autor', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        isDeleted: false,
      });
      prisma.material.update.mockResolvedValue({
        id: 'mat-1',
        isDeleted: true,
      });

      const result = await service.remove('mat-1', 'user-1', Role.USER);

      expect(prisma.material.update).toHaveBeenCalledWith({
        where: { id: 'mat-1' },
        data: { isDeleted: true },
      });
      expect(result).toEqual({ id: 'mat-1', isDeleted: true });
    });

    it('permite eliminar a moderadores aunque no sean el autor', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        isDeleted: false,
      });
      prisma.material.update.mockResolvedValue({
        id: 'mat-1',
        isDeleted: true,
      });

      await expect(
        service.remove('mat-1', 'user-2', Role.ADMIN),
      ).resolves.toBeDefined();
      await expect(
        service.remove('mat-1', 'user-2', Role.MODERATOR),
      ).resolves.toBeDefined();
      await expect(
        service.remove('mat-1', 'user-2', Role.SUPERADMIN),
      ).resolves.toBeDefined();
    });

    it('lanza ForbiddenException si no es autor ni moderador', async () => {
      prisma.material.findUnique.mockResolvedValue({
        id: 'mat-1',
        authorId: 'user-1',
        isDeleted: false,
      });

      await expect(
        service.remove('mat-1', 'user-2', Role.USER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('download', () => {
    it('incrementa el contador de descargas y devuelve el material', async () => {
      prisma.material.findFirst.mockResolvedValue({
        id: 'mat-1',
        fileUrl: '/uploads/materials/abc.pdf',
      });
      prisma.$executeRaw.mockResolvedValue(1);

      const result = await service.download('mat-1');

      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(result.fileUrl).toBe('/uploads/materials/abc.pdf');
    });

    it('lanza NotFoundException si el material no existe', async () => {
      prisma.material.findFirst.mockResolvedValue(null);

      await expect(service.download('mat-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('rate', () => {
    it('hace upsert de la calificación y recalcula el promedio', async () => {
      prisma.material.findFirst.mockResolvedValue({
        id: 'mat-1',
        isDeleted: false,
      });
      prisma.materialRating.upsert.mockResolvedValue({});
      prisma.materialRating.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: 2,
      });
      prisma.material.update.mockResolvedValue({
        id: 'mat-1',
        avgRating: 4.5,
        ratingCount: 2,
      });

      const result = await service.rate('mat-1', 'user-1', { rating: 5 });

      expect(prisma.materialRating.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_materialId: { userId: 'user-1', materialId: 'mat-1' },
          },
          create: expect.objectContaining({ rating: 5 }),
        }),
      );
      expect(prisma.materialRating.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { materialId: 'mat-1' },
          _avg: { rating: true },
        }),
      );
      expect(prisma.material.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ avgRating: 4.5, ratingCount: 2 }),
        }),
      );
      expect(result).toEqual({ id: 'mat-1', avgRating: 4.5, ratingCount: 2 });
    });
  });

  describe('getRatings', () => {
    it('devuelve calificaciones paginadas con información del usuario', async () => {
      prisma.materialRating.findMany.mockResolvedValue([
        { id: 'r-1', user: { id: 'user-1' } },
      ]);
      prisma.materialRating.count.mockResolvedValue(1);

      const result = await service.getRatings('mat-1', { page: 1, limit: 10 });

      expect(prisma.materialRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { materialId: 'mat-1' },
          skip: 0,
          take: 10,
        }),
      );
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });
});
