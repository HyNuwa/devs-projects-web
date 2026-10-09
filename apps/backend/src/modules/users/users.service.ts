import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { excludePassword } from '../auth/exclude-password';
import { BADGE_CATALOG } from '../ranking/badges/badge-catalog';
import { BadgeService } from '../ranking/badges/badge.service';
import { levelForPoints } from '../ranking/rpg-levels';

/** Catalog insignias shown publicly: never «Ojo atento», which is about reporting. */
const PUBLIC_BADGES = BADGE_CATALOG.map((badge) => badge.slug).filter(
  (slug) => slug !== 'ojo-atento',
);
const PUBLIC_EVALUATION_TTL_MS = 60_000;

@Injectable()
export class UsersService {
  private readonly publicEvaluations = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private badges: BadgeService,
  ) {}

  /**
   * Another account's profile: only what is public. Email, sanción state and
   * activity timestamps stay with the account and moderation, and so does the
   * exact points total: a jump of 2 when a reporte is confirmed would tell the
   * retired author who reported them (README_PUNTOS_E_INSIGNIAS §8).
   */
  async publicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        points: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { points, ...profile } = user;
    return {
      ...profile,
      level: levelForPoints(points),
      badges: await this.publicBadges(id),
    };
  }

  /**
   * Earned insignias without dates (a date could match a retiro), and never
   * «Ojo atento»: it is about reporting, which stays anonymous.
   */
  private async publicBadges(userId: string) {
    // Each view would otherwise lock and recompute another account; a short
    // per-instance pause is enough, since the owner's «Tu progreso» always does.
    const evaluatedAt = this.publicEvaluations.get(userId) ?? 0;
    if (Date.now() - evaluatedAt > PUBLIC_EVALUATION_TTL_MS) {
      await this.badges.evaluate(userId);
      this.publicEvaluations.set(userId, Date.now());
      if (this.publicEvaluations.size > 5_000) this.publicEvaluations.clear();
    }
    const rows = await this.prisma.userBadge.findMany({
      where: {
        userId,
        badge: { slug: { in: PUBLIC_BADGES } },
      },
      orderBy: [{ badge: { sortOrder: 'asc' } }, { edition: 'asc' }],
      select: {
        tier: true,
        edition: true,
        badge: { select: { slug: true, name: true, rarity: true } },
      },
    });
    return rows.map((row) => ({
      slug: row.badge.slug,
      name: row.badge.name,
      rarity: row.badge.rarity,
      tier: row.tier,
      edition: row.edition,
    }));
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return excludePassword(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
      },
    });

    return excludePassword(user);
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return excludePassword(user);
  }
}
