import { Injectable } from '@nestjs/common';
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
