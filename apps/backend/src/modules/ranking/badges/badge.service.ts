import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { BadgeTier } from '../../../generated/prisma';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  BADGE_CATALOG,
  type BadgeState,
  evaluateBadges,
} from './badge-catalog';
import { founderWindow } from './badge-calendar';
import { loadBadgeSnapshot } from './badge-snapshot';

const TIER_ORDER: BadgeTier[] = ['BRONCE', 'PLATA', 'ORO'];
const tierRank = (tier: BadgeTier | null) =>
  tier === null ? -1 : TIER_ORDER.indexOf(tier);

export type EvaluateOptions = {
  /**
   * Retroactive awarding (rebuild-points): new rows and raised grados are stored
   * as seen, so a deploy does not animate dozens of gems.
   */
  retroactive?: boolean;
};

/**
 * Insignias, evaluated when read (openspec reputation/badges): «Tu progreso»,
 * the public profile and the rebuild call `evaluate`, which recomputes every
 * criterion from the account's current data and brings its `UserBadge` rows in
 * line: new ones unseen, a changed grado unseen again, lost ones deleted.
 */
@Injectable()
export class BadgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async evaluate(
    userId: string,
    options: EvaluateOptions = {},
  ): Promise<BadgeState[]> {
    return this.prisma.$transaction(
      async (tx) => {
        // Concurrent reads of the same account must not insert twice.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`badges:${userId}`}))`;
        const states = evaluateBadges(await loadBadgeSnapshot(tx, userId), {
          founder: founderWindow({
            start: this.config.get<string>('FOUNDER_WINDOW_START'),
            end: this.config.get<string>('FOUNDER_WINDOW_END'),
          }),
        });

        const catalog = await tx.badge.findMany({
          where: { slug: { in: BADGE_CATALOG.map((badge) => badge.slug) } },
          select: { id: true, slug: true },
        });
        const idOf = new Map(catalog.map((badge) => [badge.slug, badge.id]));
        const existing = await tx.userBadge.findMany({
          where: { userId, badgeId: { in: catalog.map((badge) => badge.id) } },
          select: { id: true, badgeId: true, edition: true, tier: true },
        });

        const wanted = new Map<string, BadgeTier | null>();
        for (const state of states) {
          const badgeId = idOf.get(state.slug);
          if (!badgeId) continue;
          for (const { edition, tier } of state.earned) {
            wanted.set(`${badgeId}:${edition}`, tier);
          }
        }

        const now = new Date();
        for (const row of existing) {
          const key = `${row.badgeId}:${row.edition}`;
          if (!wanted.has(key)) {
            await tx.userBadge.delete({ where: { id: row.id } });
            continue;
          }
          const tier = wanted.get(key)!;
          if (tier !== row.tier) {
            // A higher grado is news: it is dated now and plays its entrada. A
            // lower one changes quietly, keeping its date and seen state.
            const raised = tierRank(tier) > tierRank(row.tier);
            await tx.userBadge.update({
              where: { id: row.id },
              data: raised
                ? {
                    tier,
                    tierUpdatedAt: now,
                    seenAt: options.retroactive ? now : null,
                  }
                : { tier },
            });
          }
          wanted.delete(key);
        }
        for (const [key, tier] of wanted) {
          const [badgeId, edition] = key.split(':');
          await tx.userBadge.create({
            data: {
              userId,
              badgeId,
              edition: Number(edition),
              tier,
              earnedAt: now,
              seenAt: options.retroactive ? now : null,
            },
          });
        }
        return states;
      },
      { timeout: 30_000 },
    );
  }
}
