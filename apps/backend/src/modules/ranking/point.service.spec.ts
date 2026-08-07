import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { PrismaService } from '../../prisma/prisma.service';

type MockFn = jest.Mock;

interface MockTx {
  pointTransaction: { create: MockFn };
  user: { update: MockFn };
}

describe('PointService', () => {
  let service: PointService;
  let prisma: {
    user: { findUnique: MockFn; update: MockFn };
    $transaction: MockFn;
  };
  let tx: MockTx;

  beforeEach(async () => {
    tx = {
      pointTransaction: { create: jest.fn() },
      user: { update: jest.fn() },
    };

    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    prisma.$transaction.mockImplementation(
      async (callback: (t: MockTx) => Promise<unknown>) => callback(tx),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [PointService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PointService>(PointService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('awardPoints', () => {
    it('crea un PointTransaction, incrementa puntos y recalcula el nivel', async () => {
      tx.pointTransaction.create.mockResolvedValue({ id: 'pt-1' });
      tx.user.update
        .mockResolvedValueOnce({ id: 'u1', points: 110, level: 1 })
        .mockResolvedValueOnce({ id: 'u1', points: 110, level: 2 });

      const result = await service.awardPoints(
        'u1',
        10,
        'MATERIAL_CREATED',
        'mat-1',
      );

      expect(tx.pointTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          amount: 10,
          reason: 'MATERIAL_CREATED',
          referenceId: 'mat-1',
        },
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { points: { increment: 10 } },
        select: { id: true, points: true, level: true },
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { level: 2 },
      });
      expect(result).toEqual({ userId: 'u1', points: 110, level: 2 });
    });

    it('no actualiza el nivel si los puntos no cruzan un umbral', async () => {
      tx.pointTransaction.create.mockResolvedValue({ id: 'pt-2' });
      tx.user.update.mockResolvedValueOnce({
        id: 'u1',
        points: 10,
        level: 1,
      });

      const result = await service.awardPoints('u1', 10, 'TEST');

      expect(tx.user.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ userId: 'u1', points: 10, level: 1 });
    });

    it('omite referenceId cuando no se proporciona', async () => {
      tx.pointTransaction.create.mockResolvedValue({ id: 'pt-3' });
      tx.user.update.mockResolvedValueOnce({
        id: 'u1',
        points: 5,
        level: 1,
      });

      await service.awardPoints('u1', 5, 'LOGIN');

      expect(tx.pointTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          amount: 5,
          reason: 'LOGIN',
          referenceId: undefined,
        },
      });
    });
  });

  describe('recalculateLevel', () => {
    it('actualiza el nivel cuando los puntos cruzan un umbral', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        points: 800,
        level: 4,
      });
      prisma.user.update.mockResolvedValue({
        id: 'u1',
        points: 800,
        level: 5,
      });

      const result = await service.recalculateLevel('u1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { level: 5 },
        select: { id: true, points: true, level: true },
      });
      expect(result).toEqual({ id: 'u1', points: 800, level: 5 });
    });

    it('no actualiza el nivel si ya es el correcto', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        points: 800,
        level: 5,
      });

      const result = await service.recalculateLevel('u1');

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'u1', points: 800, level: 5 });
    });

    it('devuelve null si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.recalculateLevel('u1');

      expect(result).toBeNull();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
