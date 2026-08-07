import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GuidesService } from './guides.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PointService } from '../ranking/point.service';
import { Role } from '../auth/dto/auth-response.dto';

describe('GuidesService', () => {
  let service: GuidesService;

  const prisma = {
    guide: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    guideStep: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const pointService = {
    awardPoints: jest.fn(),
  };

  const mockGuide = {
    id: 'guide-1',
    authorId: 'user-1',
    title: 'Mi Guía',
    description: null,
    content: 'Contenido',
    viewCount: 0,
    isPublished: true,
    isDeleted: false,
    slug: 'mi-guia',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockStep = {
    id: 'step-1',
    guideId: 'guide-1',
    title: 'Paso 1',
    content: 'Contenido del paso',
    stepOrder: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuidesService,
        { provide: PrismaService, useValue: prisma },
        { provide: PointService, useValue: pointService },
      ],
    }).compile();

    service = module.get<GuidesService>(GuidesService);
  });

  describe('create', () => {
    it('genera slug desde el título y crea la guía', async () => {
      prisma.guide.findUnique.mockResolvedValue(null);
      prisma.guide.create.mockResolvedValue(mockGuide);

      const result = await service.create(
        { title: 'Mi Guía', content: 'Contenido' },
        'user-1',
      );

      expect(prisma.guide.findUnique).toHaveBeenCalledWith({
        where: { slug: 'mi-guia' },
        select: { id: true },
      });
      expect(prisma.guide.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Mi Guía',
          slug: 'mi-guia',
          authorId: 'user-1',
          content: 'Contenido',
        }),
      });
      expect(pointService.awardPoints).toHaveBeenCalledWith(
        'user-1',
        15,
        'GUIDE_CREATED',
        'guide-1',
      );
      expect(result).toEqual(mockGuide);
    });

    it('agrega sufijo aleatorio si el slug ya existe', async () => {
      prisma.guide.findUnique.mockResolvedValue({ id: 'existing' });
      prisma.guide.create.mockResolvedValue(mockGuide);

      await service.create({ title: 'Mi Guía' }, 'user-1');

      const createCall = prisma.guide.create.mock.calls[0][0];
      expect(createCall.data.slug).toMatch(/^mi-guia-[a-z0-9]+$/);
    });

    it('usa contenido vacío por defecto si no se provee', async () => {
      prisma.guide.findUnique.mockResolvedValue(null);
      prisma.guide.create.mockResolvedValue(mockGuide);

      await service.create({ title: 'Mi Guía' }, 'user-1');

      const createCall = prisma.guide.create.mock.calls[0][0];
      expect(createCall.data.content).toBe('');
      expect(createCall.data.isPublished).toBe(true);
    });
  });

  describe('findAll', () => {
    it('retorna datos paginados excluyendo guías eliminadas', async () => {
      prisma.guide.findMany.mockResolvedValue([mockGuide]);
      prisma.guide.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(prisma.guide.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDeleted: false },
          skip: 0,
          take: 10,
          include: expect.objectContaining({
            author: expect.objectContaining({
              select: expect.objectContaining({ username: true }),
            }),
            _count: { select: { steps: true } },
          }),
        }),
      );
      expect(result).toEqual({
        data: [mockGuide],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('aplica valores por defecto cuando no hay query', async () => {
      prisma.guide.findMany.mockResolvedValue([]);
      prisma.guide.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(prisma.guide.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe('findBySlug', () => {
    it('incrementa viewCount y retorna con pasos ordenados', async () => {
      prisma.guide.findUnique
        .mockResolvedValueOnce(mockGuide)
        .mockResolvedValueOnce({ ...mockGuide, steps: [mockStep] });
      prisma.guide.update.mockResolvedValue({ ...mockGuide, viewCount: 1 });

      const result = await service.findBySlug('mi-guia');

      expect(prisma.guide.update).toHaveBeenCalledWith({
        where: { id: 'guide-1' },
        data: { viewCount: { increment: 1 } },
      });
      expect(prisma.guide.findUnique).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { id: 'guide-1' },
          include: expect.objectContaining({
            steps: { orderBy: { stepOrder: 'asc' } },
          }),
        }),
      );
      expect(result).toEqual({ ...mockGuide, steps: [mockStep] });
    });

    it('lanza NotFoundException si la guía no existe', async () => {
      prisma.guide.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza NotFoundException si la guía está eliminada', async () => {
      prisma.guide.findUnique.mockResolvedValue({
        ...mockGuide,
        isDeleted: true,
      });

      await expect(service.findBySlug('mi-guia')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('actualiza y regenera slug si cambia el título', async () => {
      prisma.guide.findUnique
        .mockResolvedValueOnce(mockGuide)
        .mockResolvedValueOnce(null);
      prisma.guide.update.mockResolvedValue({
        ...mockGuide,
        title: 'Nuevo Título',
        slug: 'nuevo-titulo',
      });

      const result = await service.update(
        'guide-1',
        { title: 'Nuevo Título' },
        'user-1',
      );

      expect(prisma.guide.update).toHaveBeenCalledWith({
        where: { id: 'guide-1' },
        data: expect.objectContaining({
          title: 'Nuevo Título',
          slug: 'nuevo-titulo',
        }),
      });
      expect(result.slug).toBe('nuevo-titulo');
    });

    it('no regenera slug si el título no cambia', async () => {
      prisma.guide.findUnique.mockResolvedValue(mockGuide);
      prisma.guide.update.mockResolvedValue(mockGuide);

      await service.update('guide-1', { description: 'Nueva desc' }, 'user-1');

      const updateCall = prisma.guide.update.mock.calls[0][0];
      expect(updateCall.data.slug).toBeUndefined();
    });

    it('lanza ForbiddenException si no es el autor', async () => {
      prisma.guide.findUnique.mockResolvedValue({
        ...mockGuide,
        authorId: 'other-user',
      });

      await expect(
        service.update('guide-1', { title: 'X' }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lanza NotFoundException si la guía no existe', async () => {
      prisma.guide.findUnique.mockResolvedValue(null);

      await expect(
        service.update('guide-1', { title: 'X' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-delete si es el autor', async () => {
      prisma.guide.findUnique.mockResolvedValue(mockGuide);
      prisma.guide.update.mockResolvedValue({ ...mockGuide, isDeleted: true });

      const result = await service.remove('guide-1', 'user-1', Role.USER);

      expect(prisma.guide.update).toHaveBeenCalledWith({
        where: { id: 'guide-1' },
        data: { isDeleted: true },
      });
      expect(result.isDeleted).toBe(true);
    });

    it('permite eliminar a moderadores aunque no sean autores', async () => {
      prisma.guide.findUnique.mockResolvedValue({
        ...mockGuide,
        authorId: 'other-user',
      });
      prisma.guide.update.mockResolvedValue({ ...mockGuide, isDeleted: true });

      const result = await service.remove(
        'guide-1',
        'moderator-1',
        Role.MODERATOR,
      );

      expect(result.isDeleted).toBe(true);
    });

    it('lanza ForbiddenException si no es autor ni moderador', async () => {
      prisma.guide.findUnique.mockResolvedValue({
        ...mockGuide,
        authorId: 'other-user',
      });

      await expect(
        service.remove('guide-1', 'user-1', Role.USER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addStep', () => {
    it('asigna el siguiente stepOrder si no se provee', async () => {
      prisma.guide.findUnique.mockResolvedValue(mockGuide);
      prisma.guideStep.findFirst.mockResolvedValue({ stepOrder: 2 });
      prisma.guideStep.create.mockResolvedValue({ ...mockStep, stepOrder: 3 });

      const result = await service.addStep(
        'guide-1',
        { title: 'Paso 3', content: 'Contenido' },
        'user-1',
      );

      expect(prisma.guideStep.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          guideId: 'guide-1',
          stepOrder: 3,
        }),
      });
      expect(result.stepOrder).toBe(3);
    });

    it('usa stepOrder 1 si la guía no tiene pasos', async () => {
      prisma.guide.findUnique.mockResolvedValue(mockGuide);
      prisma.guideStep.findFirst.mockResolvedValue(null);
      prisma.guideStep.create.mockResolvedValue({ ...mockStep, stepOrder: 1 });

      await service.addStep(
        'guide-1',
        { title: 'Paso 1', content: 'Contenido' },
        'user-1',
      );

      const createCall = prisma.guideStep.create.mock.calls[0][0];
      expect(createCall.data.stepOrder).toBe(1);
    });

    it('respeta el stepOrder explícito del DTO', async () => {
      prisma.guide.findUnique.mockResolvedValue(mockGuide);
      prisma.guideStep.create.mockResolvedValue({ ...mockStep, stepOrder: 5 });

      await service.addStep(
        'guide-1',
        { title: 'Paso', content: 'Contenido', stepOrder: 5 },
        'user-1',
      );

      expect(prisma.guideStep.findFirst).not.toHaveBeenCalled();
      const createCall = prisma.guideStep.create.mock.calls[0][0];
      expect(createCall.data.stepOrder).toBe(5);
    });

    it('lanza ForbiddenException si no es el autor', async () => {
      prisma.guide.findUnique.mockResolvedValue({
        ...mockGuide,
        authorId: 'other-user',
      });

      await expect(
        service.addStep('guide-1', { title: 'Paso', content: 'X' }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStep', () => {
    it('actualiza el paso si es el autor', async () => {
      prisma.guideStep.findUnique.mockResolvedValue({
        ...mockStep,
        guide: { authorId: 'user-1', isDeleted: false },
      });
      prisma.guideStep.update.mockResolvedValue({
        ...mockStep,
        title: 'Paso actualizado',
      });

      const result = await service.updateStep(
        'step-1',
        { title: 'Paso actualizado' },
        'user-1',
      );

      expect(prisma.guideStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: expect.objectContaining({ title: 'Paso actualizado' }),
      });
      expect(result.title).toBe('Paso actualizado');
    });

    it('lanza ForbiddenException si no es el autor de la guía', async () => {
      prisma.guideStep.findUnique.mockResolvedValue({
        ...mockStep,
        guide: { authorId: 'other-user', isDeleted: false },
      });

      await expect(
        service.updateStep('step-1', { title: 'X' }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeStep', () => {
    it('elimina el paso y reordena los siguientes', async () => {
      prisma.guideStep.findUnique.mockResolvedValue({
        ...mockStep,
        stepOrder: 2,
        guide: { authorId: 'user-1', isDeleted: false },
      });
      prisma.guideStep.delete.mockResolvedValue(mockStep);
      prisma.guideStep.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.removeStep('step-1', 'user-1');

      expect(prisma.guideStep.delete).toHaveBeenCalledWith({
        where: { id: 'step-1' },
      });
      expect(prisma.guideStep.updateMany).toHaveBeenCalledWith({
        where: {
          guideId: 'guide-1',
          stepOrder: { gt: 2 },
        },
        data: { stepOrder: { decrement: 1 } },
      });
      expect(result).toEqual({ message: 'Paso eliminado correctamente' });
    });

    it('lanza ForbiddenException si no es el autor', async () => {
      prisma.guideStep.findUnique.mockResolvedValue({
        ...mockStep,
        guide: { authorId: 'other-user', isDeleted: false },
      });

      await expect(service.removeStep('step-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
