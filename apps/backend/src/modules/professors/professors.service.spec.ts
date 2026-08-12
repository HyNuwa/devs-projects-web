import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProfessorsService } from './professors.service';
import { PrismaService } from '../../prisma/prisma.service';

type MockFn = jest.Mock;

interface MockPrisma {
  professor: {
    findMany: MockFn;
    findUnique: MockFn;
    create: MockFn;
    update: MockFn;
    delete: MockFn;
    count: MockFn;
  };
  subjectProfessor: {
    create: MockFn;
  };
  $transaction: MockFn;
}

describe('ProfessorsService', () => {
  let service: ProfessorsService;
  let prisma: MockPrisma;

  const mockProfessor = {
    id: 'prof-1',
    name: 'Dr. Juan Pérez',
    bio: 'Docente de Sistemas',
    subjects: [{ subject: { id: 'sub-1', name: 'Bases de Datos' } }],
  };

  beforeEach(async () => {
    prisma = {
      professor: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      subjectProfessor: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessorsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProfessorsService>(ProfessorsService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('devuelve lista paginada de profesores con sus materias', async () => {
      prisma.$transaction.mockResolvedValue([[mockProfessor], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockProfessor]);
      expect(result.meta.total).toBe(1);
      expect(prisma.professor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { subjects: { include: { subject: true } } },
        }),
      );
    });

    it('filtra por materia cuando se pasa subjectId', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10, subjectId: 'sub-1' });

      expect(prisma.professor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { subjects: { some: { subjectId: 'sub-1' } } },
        }),
      );
    });
  });

  describe('findById', () => {
    it('devuelve el profesor con sus materias', async () => {
      prisma.professor.findUnique.mockResolvedValue(mockProfessor);

      const result = await service.findById('prof-1');

      expect(result).toEqual(mockProfessor);
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.professor.findUnique.mockResolvedValue(null);

      await expect(service.findById('prof-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('crea el profesor y lo vincula a la materia', async () => {
      prisma.professor.create.mockResolvedValue({ id: 'prof-1' });
      prisma.professor.findUnique.mockResolvedValue(mockProfessor);

      const result = await service.create({
        name: 'Dr. Juan Pérez',
        bio: 'Docente',
        subjectId: 'sub-1',
      });

      expect(prisma.subjectProfessor.create).toHaveBeenCalledWith({
        data: { professorId: 'prof-1', subjectId: 'sub-1' },
      });
      expect(result).toEqual(mockProfessor);
    });
  });

  describe('update', () => {
    it('actualiza el profesor', async () => {
      prisma.professor.findUnique.mockResolvedValue(mockProfessor);
      prisma.professor.update.mockResolvedValue(mockProfessor);

      const result = await service.update('prof-1', {
        name: 'Dr. Juan Pérez',
        bio: 'Nueva bio',
      });

      expect(prisma.professor.update).toHaveBeenCalled();
      expect(result).toEqual(mockProfessor);
    });
  });

  describe('remove', () => {
    it('elimina el profesor', async () => {
      prisma.professor.findUnique.mockResolvedValue(mockProfessor);
      prisma.professor.delete.mockResolvedValue({ id: 'prof-1' });

      const result = await service.remove('prof-1');

      expect(result).toEqual({ message: 'Profesor eliminado correctamente' });
    });
  });
});
