import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { levelForPoints } from './rpg-levels';

@Injectable()
export class PointService {
  constructor(private prisma: PrismaService) {}

  /**
   * Otorga puntos a un usuario de forma atómica:
   * 1. Crea un PointTransaction.
   * 2. Incrementa User.points.
   * 3. Recalcula el nivel según la tabla RPG.
   */
  async awardPoints(
    userId: string,
    amount: number,
    reason: string,
    referenceId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.pointTransaction.create({
        data: {
          userId,
          amount,
          reason,
          referenceId,
        },
      });

      const updated = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: amount } },
        select: { id: true, points: true, level: true },
      });

      const newLevel = levelForPoints(updated.points);
      if (newLevel !== updated.level) {
        await tx.user.update({
          where: { id: userId },
          data: { level: newLevel },
        });
      }

      return {
        userId: updated.id,
        points: updated.points,
        level: newLevel,
      };
    });
  }

  /**
   * Otorga los puntos de un aporte dentro de la transacción de quien llama, una sola
   * vez por `referenceId`: si el aporte ya tiene puntos vigentes, no hace nada.
   */
  async awardFor(
    tx: Prisma.TransactionClient,
    award: {
      userId: string;
      amount: number;
      reason: string;
      referenceId: string;
    },
  ) {
    if ((await this.netFor(tx, award.referenceId)) > 0) return;

    await tx.pointTransaction.create({ data: award });
    await this.applyDelta(tx, award.userId, award.amount);
  }

  /**
   * Revierte los puntos vigentes de un aporte (por ejemplo, al retirarlo). Si no hay
   * puntos vigentes, no hace nada.
   */
  async revertFor(tx: Prisma.TransactionClient, referenceId: string) {
    const net = await this.netFor(tx, referenceId);
    if (net <= 0) return;

    const original = await tx.pointTransaction.findFirst({
      where: { referenceId, amount: { gt: 0 } },
      select: { userId: true, reason: true },
    });
    if (!original) return;

    await tx.pointTransaction.create({
      data: {
        userId: original.userId,
        amount: -net,
        reason: `${original.reason}_REVERTED`,
        referenceId,
      },
    });
    await this.applyDelta(tx, original.userId, -net);
  }

  private async netFor(tx: Prisma.TransactionClient, referenceId: string) {
    const { _sum } = await tx.pointTransaction.aggregate({
      where: { referenceId },
      _sum: { amount: true },
    });
    return _sum.amount ?? 0;
  }

  private async applyDelta(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
  ) {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { points: { increment: amount } },
      select: { id: true, points: true, level: true },
    });
    const newLevel = levelForPoints(Math.max(updated.points, 0));
    if (newLevel !== updated.level) {
      await tx.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }
  }

  /**
   * Recalcula el nivel de un usuario a partir de sus puntos actuales.
   * Actualiza User.level únicamente si cambió.
   */
  async recalculateLevel(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, points: true, level: true },
    });

    if (!user) {
      return null;
    }

    const newLevel = levelForPoints(user.points);
    if (newLevel === user.level) {
      return user;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
      select: { id: true, points: true, level: true },
    });
  }
}
