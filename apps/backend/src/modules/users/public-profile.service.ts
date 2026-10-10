import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { BadgeService } from '../ranking/badges/badge.service';
import { BADGE_CATALOG } from '../ranking/badges/badge-catalog';
import { levelForPoints, RPG_LEVELS } from '../ranking/rpg-levels';
import type { PinType } from './dto/replace-profile-customization.dto';
import {
  type ContributionItem,
  ProfileCustomizationService,
  type PublicBadge,
} from './profile-customization.service';
import { findOption, isUnlocked } from './profile-options';

/** Catalog insignias shown publicly: never «Ojo atento», which is about reporting. */
const PUBLIC_BADGES = BADGE_CATALOG.map((badge) => badge.slug).filter(
  (slug) => slug !== 'ojo-atento',
);
const PUBLIC_EVALUATION_TTL_MS = 60_000;
export const CONTRIBUTIONS_PAGE_SIZE = 20;
const ARGENTINA_OFFSET_MS = 3 * 3_600_000;

const accountSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  points: true,
  maxLevel: true,
  createdAt: true,
} as const;

/**
 * The perfil público (openspec reputation/public-profile): one projection for
 * every public entry point. It never reads sanción state, so a sanción changes
 * nothing here, and it never returns the exact points total: a jump of 2 when a
 * reporte is confirmed would tell the retired author who reported them.
 */
@Injectable()
export class PublicProfileService {
  private readonly publicEvaluations = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly badges: BadgeService,
    private readonly customization: ProfileCustomizationService,
  ) {}

  async byUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: accountSelect,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.build(user);
  }

  async byId(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: accountSelect,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.build(user);
  }

  /**
   * The account's published materials and signed reseñas and experiencias,
   * newest first. Anonymous, deleted and not-published entries never appear.
   */
  async contributions(username: string, page = 1) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const offset = (page - 1) * CONTRIBUTIONS_PAGE_SIZE;
    // One row more than the page tells whether there is a next one.
    const rows = await this.prisma.$queryRaw<
      {
        type: PinType;
        id: string;
        title: string;
        subjectCode: string | null;
        subjectName: string;
        createdAt: Date;
        fileType: string | null;
        academicYear: number | null;
      }[]
    >(Prisma.sql`
      SELECT * FROM (
        SELECT 'MATERIAL' AS "type", m."id", m."title", s."code" AS "subjectCode",
               s."name" AS "subjectName", m."created_at" AS "createdAt",
               m."file_type" AS "fileType", m."academic_year" AS "academicYear"
        FROM "materials" m JOIN "subjects" s ON s."id" = m."subject_id"
        WHERE m."author_id" = ${user.id}::uuid
          AND m."publication_status" = 'PUBLISHED' AND m."is_deleted" = false
        UNION ALL
        SELECT 'COURSE_REVIEW', r."id", s."name", s."code", s."name", r."created_at",
               NULL, NULL
        FROM "course_reviews" r JOIN "subjects" s ON s."id" = r."subject_id"
        WHERE r."user_id" = ${user.id}::uuid
          AND r."publication_status" = 'PUBLISHED' AND r."is_anonymous" = false
        UNION ALL
        SELECT 'EXAM_EXPERIENCE', e."id", s."name", s."code", s."name", e."created_at",
               NULL, NULL
        FROM "exam_experiences" e JOIN "subjects" s ON s."id" = e."subject_id"
        WHERE e."user_id" = ${user.id}::uuid
          AND e."publication_status" = 'PUBLISHED' AND e."is_anonymous" = false
      ) AS "contributions"
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT ${CONTRIBUTIONS_PAGE_SIZE + 1} OFFSET ${offset}`);
    const items: ContributionItem[] = rows
      .slice(0, CONTRIBUTIONS_PAGE_SIZE)
      .map((row) => ({
        type: row.type,
        id: row.id,
        title: row.title,
        subject: { code: row.subjectCode, name: row.subjectName },
        createdAt: row.createdAt,
        fileType: row.fileType,
        academicYear: row.academicYear,
      }));
    return { items, page, hasMore: rows.length > CONTRIBUTIONS_PAGE_SIZE };
  }

  private async build(user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    points: number;
    maxLevel: number;
    createdAt: Date;
  }) {
    await this.evaluateBadges(user.id);
    const [choices, held, grid] = await Promise.all([
      this.customization.choicesOf(user.id),
      this.customization.heldPublicBadges(user.id),
      this.badgeGrid(user.id),
    ]);
    const state = { maxLevel: user.maxLevel, heldBadges: new Set(held.keys()) };
    // A choice whose unlock was lost (only the insignia frame can be) is not shown.
    const unlocked = (id: string | null) => {
      const option = id === null ? undefined : findOption(id);
      return option && isUnlocked(option, state) ? option.id : null;
    };
    const shown = choices.showLevelAndBadges;
    const level = levelForPoints(user.points);

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      // Month and year in Argentina time (UTC-3), like the ledger's caps.
      memberSince: new Date(user.createdAt.getTime() - ARGENTINA_OFFSET_MS)
        .toISOString()
        .slice(0, 7),
      avatarUrl: user.avatarUrl,
      avatarCat: unlocked(choices.avatarCat),
      customization: {
        accent: unlocked(choices.accent),
        background: unlocked(choices.background),
        frame: unlocked(choices.frame),
        banner: unlocked(choices.banner),
        theme: unlocked(choices.theme),
      },
      level: shown
        ? {
            number: level,
            name: RPG_LEVELS.find((entry) => entry.level === level)?.name ?? '',
          }
        : null,
      title:
        shown && choices.titleBadge !== null
          ? (held.get(choices.titleBadge) ?? null)
          : null,
      featured: shown
        ? choices.featuredBadges.flatMap((slug) => held.get(slug) ?? [])
        : [],
      badges: shown ? grid : [],
      pinned: await this.customization.resolvePins(user.id, choices.pinned),
    };
  }

  /**
   * Earned insignias with grado and edición, without dates (a date could match
   * a retiro), and never «Ojo atento».
   */
  private async badgeGrid(userId: string): Promise<PublicBadge[]> {
    const rows = await this.prisma.userBadge.findMany({
      where: { userId, badge: { slug: { in: PUBLIC_BADGES } } },
      orderBy: [{ badge: { sortOrder: 'asc' } }, { edition: 'asc' }],
      select: {
        tier: true,
        edition: true,
        badge: { select: { slug: true, name: true, rarity: true } },
      },
    });
    return rows.map((row) => ({
      slug: row.badge.slug ?? '',
      name: row.badge.name,
      rarity: row.badge.rarity,
      tier: row.tier,
      edition: row.edition,
    }));
  }

  // Each view would otherwise lock and recompute another account; a short
  // per-instance pause is enough, since the owner's «Tu progreso» always does.
  private async evaluateBadges(userId: string) {
    const evaluatedAt = this.publicEvaluations.get(userId) ?? 0;
    if (Date.now() - evaluatedAt <= PUBLIC_EVALUATION_TTL_MS) return;
    await this.badges.evaluate(userId);
    this.publicEvaluations.set(userId, Date.now());
    if (this.publicEvaluations.size > 5_000) this.publicEvaluations.clear();
  }
}
