import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProfessorsService } from './professors.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PointService } from '../ranking/point.service';

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
  professorReview: {
    upsert: MockFn;
    aggregate: MockFn;
    findMany: MockFn;
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
  const pointService = {
    awardPoints: jest.fn(),
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
      professorReview: {
        upsert: jest.fn(),
        aggregate: jest.fn(),
        findMany: jest.fn(),
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
        { provide: PointService, useValue: pointService },
      ],
    }).compile();

    service = module.get<ProfessorsService>(ProfessorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated professors with meta', async () => {
      const professors = [{ id: 'p1', name: 'Prof A' }];
      prisma.$transaction.mockResolvedValue([professors, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(prisma.professor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 10,
          orderBy: { name: 'asc' },
          include: { _count: { select: { reviews: true } } },
        }),
      );
      expect(prisma.professor.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        data: professors,
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('filters by subjectId via SubjectProfessor', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ page: 2, limit: 5, subjectId: 'sub-1' });

      expect(prisma.professor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { subjects: { some: { subjectId: 'sub-1' } } },
          skip: 5,
          take: 5,
        }),
      );
      expect(prisma.professor.count).toHaveBeenCalledWith({
        where: { subjects: { some: { subjectId: 'sub-1' } } },
      });
    });

    it('uses default page and limit when not provided', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(prisma.professor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });
  });

  describe('findById', () => {
    it('returns professor with reviews and computed avgRating', async () => {
      const professor = {
        id: 'p1',
        name: 'Prof A',
        subjects: [],
        reviews: [{ id: 'r1' }],
        _count: { reviews: 1 },
      };
      prisma.professor.findUnique.mockResolvedValue(professor);
      prisma.professorReview.aggregate.mockResolvedValue({
        _avg: { value: 4.5 },
      });

      const result = await service.findById('p1');

      expect(prisma.professor.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          include: expect.objectContaining({
            subjects: { include: { subject: true } },
            reviews: expect.objectContaining({ take: 10 }),
            _count: { select: { reviews: true } },
          }),
        }),
      );
      expect(prisma.professorReview.aggregate).toHaveBeenCalledWith({
        where: { professorId: 'p1' },
        _avg: { value: true },
      });
      expect(result).toEqual({ ...professor, avgRating: 4.5 });
    });

    it('throws NotFoundException when professor does not exist', async () => {
      prisma.professor.findUnique.mockResolvedValue(null);

      await expect(service.findById('p1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates professor and links subject when subjectId is provided', async () => {
      const created = { id: 'p1', name: 'Prof A' };
      prisma.professor.create.mockResolvedValue(created);
      prisma.subjectProfessor.create.mockResolvedValue({ id: 'sp1' });
      prisma.professor.findUnique.mockResolvedValue({
        ...created,
        subjects: [],
        reviews: [],
        _count: { reviews: 0 },
      });
      prisma.professorReview.aggregate.mockResolvedValue({
        _avg: { value: null },
      });

      const result = await service.create({
        name: 'Prof A',
        bio: 'Bio',
        subjectId: 'sub-1',
      });

      expect(prisma.professor.create).toHaveBeenCalledWith({
        data: { name: 'Prof A', bio: 'Bio' },
      });
      expect(prisma.subjectProfessor.create).toHaveBeenCalledWith({
        data: { professorId: 'p1', subjectId: 'sub-1' },
      });
      expect(result).toBeDefined();
    });

    it('does not link subject when subjectId is not provided', async () => {
      const created = { id: 'p1', name: 'Prof A' };
      prisma.professor.create.mockResolvedValue(created);
      prisma.professor.findUnique.mockResolvedValue({
        ...created,
        subjects: [],
        reviews: [],
        _count: { reviews: 0 },
      });
      prisma.professorReview.aggregate.mockResolvedValue({
        _avg: { value: null },
      });

      await service.create({ name: 'Prof A' });

      expect(prisma.subjectProfessor.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates professor fields', async () => {
      const existing = { id: 'p1', name: 'Prof A' };
      prisma.professor.findUnique.mockResolvedValue(existing);
      prisma.professor.update.mockResolvedValue({
        ...existing,
        name: 'Prof B',
      });
      prisma.professorReview.aggregate.mockResolvedValue({
        _avg: { value: null },
      });

      const result = await service.update('p1', { name: 'Prof B' });

      expect(prisma.professor.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { name: 'Prof B', bio: undefined },
      });
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when professor does not exist', async () => {
      prisma.professor.findUnique.mockResolvedValue(null);

      await expect(service.update('p1', { name: 'Prof B' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes professor and returns confirmation', async () => {
      prisma.professor.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.professorReview.aggregate.mockResolvedValue({
        _avg: { value: null },
      });
      prisma.professor.delete.mockResolvedValue({ id: 'p1' });

      const result = await service.remove('p1');

      expect(prisma.professor.delete).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
      expect(result).toEqual({ message: 'Profesor eliminado correctamente' });
    });

    it('throws NotFoundException when professor does not exist', async () => {
      prisma.professor.findUnique.mockResolvedValue(null);

      await expect(service.remove('p1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('evaluate', () => {
    it('upserts review and recalculates avgRating', async () => {
      prisma.professor.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Prof A',
        subjects: [],
        reviews: [],
        _count: { reviews: 1 },
      });
      prisma.professorReview.upsert.mockResolvedValue({ id: 'r1' });
      prisma.professorReview.aggregate.mockResolvedValue({
        _avg: { value: 4.5 },
      });

      const result = await service.evaluate('p1', 'u1', {
        value: 5,
        description: 'Excelente',
      });

      expect(prisma.professorReview.upsert).toHaveBeenCalledWith({
        where: {
          userId_professorId: { userId: 'u1', professorId: 'p1' },
        },
        create: {
          userId: 'u1',
          professorId: 'p1',
          value: 5,
          description: 'Excelente',
        },
        update: { value: 5, description: 'Excelente' },
      });
      expect(pointService.awardPoints).toHaveBeenCalledWith(
        'u1',
        5,
        'PROFESSOR_EVALUATED',
        'p1',
      );
      expect(result.avgRating).toBe(4.5);
    });

    it('throws NotFoundException when professor does not exist', async () => {
      prisma.professor.findUnique.mockResolvedValue(null);

      await expect(service.evaluate('p1', 'u1', { value: 5 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getReviews', () => {
    it('returns paginated reviews with user info', async () => {
      prisma.professor.findUnique.mockResolvedValue({ id: 'p1' });
      const reviews = [{ id: 'r1', user: { id: 'u1', username: 'user1' } }];
      prisma.$transaction.mockResolvedValue([reviews, 1]);

      const result = await service.getReviews('p1', { page: 1, limit: 10 });

      expect(prisma.professorReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { professorId: 'p1' },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        }),
      );
      expect(result).toEqual({
        data: reviews,
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('throws NotFoundException when professor does not exist', async () => {
      prisma.professor.findUnique.mockResolvedValue(null);

      await expect(service.getReviews('p1', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
