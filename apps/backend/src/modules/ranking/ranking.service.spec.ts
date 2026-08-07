import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { PrismaService } from '../../prisma/prisma.service';

type MockFn = jest.Mock;

describe('RankingService', () => {
  let service: RankingService;
  let prisma: {
    user: { findMany: MockFn; count: MockFn; findUnique: MockFn };
    $transaction: MockFn;
    $queryRaw: MockFn;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RankingService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<RankingService>(RankingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalLeaderboard', () => {
    it('ordena por puntos desc, excluye baneados y pagina', async () => {
      const users = [{ id: 'u1', points: 100, level: 2 }];
      prisma.user.findMany.mockResolvedValue(users);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.getGlobalLeaderboard(1, 10);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isBanned: false },
          skip: 0,
          take: 10,
          orderBy: { points: 'desc' },
          select: expect.objectContaining({
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            points: true,
            level: true,
          }),
        }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { isBanned: false },
      });
      expect(result).toEqual({
        data: users,
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('usa valores por defecto de página y límite', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.getGlobalLeaderboard();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });
  });

  describe('getWeeklyLeaderboard', () => {
    it('devuelve el leaderboard global con etiqueta de periodo weekly', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await service.getWeeklyLeaderboard(1, 10);

      expect(result.period).toBe('weekly');
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe('getMonthlyLeaderboard', () => {
    it('devuelve el leaderboard global con etiqueta de periodo monthly', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await service.getMonthlyLeaderboard(1, 10);

      expect(result.period).toBe('monthly');
    });
  });

  describe('getUserRank', () => {
    it('calcula el rango contando usuarios con más puntos', async () => {
      prisma.user.findUnique.mockResolvedValue({ points: 100, level: 2 });
      prisma.$queryRaw.mockResolvedValue([{ count: 3 }]);
      prisma.user.count.mockResolvedValue(10);

      const result = await service.getUserRank('u1');

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual({
        rank: 4,
        totalUsers: 10,
        points: 100,
        level: 2,
      });
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserRank('u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getLevelInfo', () => {
    it('devuelve nivel actual y puntos para el siguiente nivel', async () => {
      prisma.user.findUnique.mockResolvedValue({ points: 100, level: 2 });

      const result = await service.getLevelInfo('u1');

      expect(result).toEqual({
        level: 2,
        levelName: 'Aprendiz',
        points: 100,
        pointsToNext: 50,
        nextLevel: 3,
        nextLevelName: 'Explorador',
      });
    });

    it('devuelve null para el siguiente nivel si está en el máximo', async () => {
      prisma.user.findUnique.mockResolvedValue({ points: 15000, level: 10 });

      const result = await service.getLevelInfo('u1');

      expect(result).toEqual({
        level: 10,
        levelName: 'Leyenda Eterna',
        points: 15000,
        pointsToNext: null,
        nextLevel: null,
        nextLevelName: null,
      });
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getLevelInfo('u1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getLevelThresholds', () => {
    it('devuelve la tabla RPG completa', async () => {
      const result = await service.getLevelThresholds();

      expect(result).toHaveLength(10);
      expect(result[0]).toEqual({
        level: 1,
        name: 'Viajero Novato',
        points: 0,
      });
      expect(result[9]).toEqual({
        level: 10,
        name: 'Leyenda Eterna',
        points: 12000,
      });
    });
  });
});
