import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RPG_LEVELS } from './rpg-levels';

const LEADERBOARD_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  points: true,
  level: true,
} as const;

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  async getGlobalLeaderboard(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { isBanned: false };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { points: 'desc' },
        select: LEADERBOARD_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWeeklyLeaderboard(page = 1, limit = 10) {
    const result = await this.getGlobalLeaderboard(page, limit);
    return { ...result, period: 'weekly' };
  }

  async getMonthlyLeaderboard(page = 1, limit = 10) {
    const result = await this.getGlobalLeaderboard(page, limit);
    return { ...result, period: 'monthly' };
  }

  async getUserRank(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, level: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const [rankResult, totalUsers] = await Promise.all([
      this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE is_banned = false AND points > ${user.points}
      `,
      this.prisma.user.count({ where: { isBanned: false } }),
    ]);

    const rank = Number(rankResult[0]?.count ?? 0) + 1;

    return {
      rank,
      totalUsers,
      points: user.points,
      level: user.level,
    };
  }

  async getLevelInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, level: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const current =
      RPG_LEVELS.find((entry) => entry.level === user.level) ?? RPG_LEVELS[0];
    const next =
      RPG_LEVELS.find((entry) => entry.level === user.level + 1) ?? null;

    return {
      level: user.level,
      levelName: current.name,
      points: user.points,
      pointsToNext: next ? Math.max(0, next.points - user.points) : null,
      nextLevel: next ? next.level : null,
      nextLevelName: next ? next.name : null,
    };
  }

  async getLevelThresholds() {
    return RPG_LEVELS.map(({ level, name, points }) => ({
      level,
      name,
      points,
    }));
  }
}
