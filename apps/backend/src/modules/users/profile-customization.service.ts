import { BadRequestException, Injectable } from '@nestjs/common';

import type { BadgeRarity, BadgeTier } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { BADGE_CATALOG } from '../ranking/badges/badge-catalog';
import {
  type PinType,
  type ReplaceProfileCustomizationDto,
} from './dto/replace-profile-customization.dto';
import {
  canPickBadge,
  findOption,
  isUnlocked,
  MAX_FEATURED,
  pinLimit,
  PROFILE_OPTIONS,
  type ProfileOptionKind,
  TITLE_LEVEL,
  unlockLabel,
  type UnlockState,
} from './profile-options';

export type ProfilePin = { type: PinType; id: string };

export type ProfileChoices = {
  avatarCat: string | null;
  accent: string | null;
  background: string | null;
  frame: string | null;
  banner: string | null;
  theme: string | null;
  titleBadge: string | null;
  featuredBadges: string[];
  pinned: ProfilePin[];
  showLevelAndBadges: boolean;
};

export type PublicBadge = {
  slug: string;
  name: string;
  rarity: BadgeRarity | null;
  tier: BadgeTier | null;
  edition: number;
};

export type ContributionItem = {
  type: PinType;
  id: string;
  title: string;
  subject: { code: string | null; name: string };
  createdAt: Date;
  /** Materials only, so the page can open the preview; null otherwise. */
  fileType: string | null;
  academicYear: number | null;
};

export const DEFAULT_CHOICES: ProfileChoices = {
  avatarCat: null,
  accent: null,
  background: null,
  frame: null,
  banner: null,
  theme: null,
  titleBadge: null,
  featuredBadges: [],
  pinned: [],
  showLevelAndBadges: true,
};

const OPTION_FIELDS: [keyof ProfileChoices, ProfileOptionKind][] = [
  ['avatarCat', 'cat'],
  ['accent', 'accent'],
  ['background', 'background'],
  ['frame', 'frame'],
  ['banner', 'banner'],
  ['theme', 'theme'],
];

/** One message for every pin that cannot be pinned: it never tells whose it is. */
const PIN_REJECTED = 'Ese aporte no se puede fijar.';

const subjectSelect = { select: { code: true, name: true } } as const;

/**
 * Perfil público choices (openspec reputation/profile-customization): what the
 * student may pick, the server-side validation, and the read-time view of what
 * is still valid, shared with the public profile.
 */
@Injectable()
export class ProfileCustomizationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Stored choices, or the defaults when the account never saved any. */
  async choicesOf(userId: string): Promise<ProfileChoices> {
    const row = await this.prisma.profileCustomization.findUnique({
      where: { userId },
    });
    if (!row) return { ...DEFAULT_CHOICES };
    return {
      avatarCat: row.avatarCat,
      accent: row.accent,
      background: row.background,
      frame: row.frame,
      banner: row.banner,
      theme: row.theme,
      titleBadge: row.titleBadge,
      featuredBadges: row.featuredBadges,
      pinned: Array.isArray(row.pinned) ? (row.pinned as ProfilePin[]) : [],
      showLevelAndBadges: row.showLevelAndBadges,
    };
  }

  /**
   * Insignias the account holds that may be shown publicly, one per slug (the
   * latest edición), in catalog order. Never «Ojo atento».
   */
  async heldPublicBadges(userId: string): Promise<Map<string, PublicBadge>> {
    const rows = await this.prisma.userBadge.findMany({
      where: {
        userId,
        badge: { slug: { in: BADGE_CATALOG.map((badge) => badge.slug) } },
      },
      orderBy: [{ badge: { sortOrder: 'asc' } }, { edition: 'desc' }],
      select: {
        tier: true,
        edition: true,
        badge: { select: { slug: true, name: true, rarity: true } },
      },
    });
    const held = new Map<string, PublicBadge>();
    for (const row of rows) {
      const slug = row.badge.slug;
      if (!slug || !canPickBadge(slug) || held.has(slug)) continue;
      held.set(slug, {
        slug,
        name: row.badge.name,
        rarity: row.badge.rarity,
        tier: row.tier,
        edition: row.edition,
      });
    }
    return held;
  }

  /**
   * The pins that are still the account's own, published, not deleted and
   * signed, in the chosen order. Anything else is dropped silently, and comes
   * back if the content is restored.
   */
  async resolvePins(
    userId: string,
    pins: ProfilePin[],
  ): Promise<ContributionItem[]> {
    const ids = (type: PinType) =>
      pins.filter((pin) => pin.type === type).map((pin) => pin.id);
    const [materials, reviews, exams] = await Promise.all([
      this.prisma.material.findMany({
        where: {
          id: { in: ids('MATERIAL') },
          authorId: userId,
          publicationStatus: 'PUBLISHED',
          isDeleted: false,
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          fileType: true,
          academicYear: true,
          subject: subjectSelect,
        },
      }),
      this.prisma.courseReview.findMany({
        where: {
          id: { in: ids('COURSE_REVIEW') },
          userId,
          publicationStatus: 'PUBLISHED',
          isAnonymous: false,
        },
        select: { id: true, createdAt: true, subject: subjectSelect },
      }),
      this.prisma.examExperience.findMany({
        where: {
          id: { in: ids('EXAM_EXPERIENCE') },
          userId,
          publicationStatus: 'PUBLISHED',
          isAnonymous: false,
        },
        select: { id: true, createdAt: true, subject: subjectSelect },
      }),
    ]);
    const found = new Map<string, ContributionItem>();
    for (const row of materials) {
      found.set(`MATERIAL:${row.id}`, {
        type: 'MATERIAL',
        id: row.id,
        title: row.title,
        subject: row.subject,
        createdAt: row.createdAt,
        fileType: row.fileType,
        academicYear: row.academicYear,
      });
    }
    for (const [type, rows] of [
      ['COURSE_REVIEW', reviews],
      ['EXAM_EXPERIENCE', exams],
    ] as const) {
      for (const row of rows) {
        found.set(`${type}:${row.id}`, {
          type,
          id: row.id,
          title: row.subject.name,
          subject: row.subject,
          createdAt: row.createdAt,
          fileType: null,
          academicYear: null,
        });
      }
    }
    return pins.flatMap((pin) => found.get(`${pin.type}:${pin.id}`) ?? []);
  }

  /** The editor's view: choices, every option with its lock, and the limits. */
  async mine(userId: string) {
    const state = await this.unlockState(userId);
    const stored = await this.choicesOf(userId);
    // Titles for the pins that still show, so the editor can name them.
    const pinnedItems = (await this.resolvePins(userId, stored.pinned)).slice(
      0,
      pinLimit(state.maxLevel),
    );
    return {
      choices: this.effective(stored, state, pinnedItems),
      options: PROFILE_OPTIONS.map((option) => ({
        id: option.id,
        kind: option.kind,
        label: option.label,
        unlocked: isUnlocked(option, state),
        unlockLabel: unlockLabel(option),
      })),
      limits: {
        pins: pinLimit(state.maxLevel),
        featured: MAX_FEATURED,
        titleUnlocked: state.maxLevel >= TITLE_LEVEL,
      },
      eligibleBadges: [...state.publicBadges.values()],
      pinnedItems,
    };
  }

  /**
   * The stored choices without what no longer holds (a lost insignia, a
   * retired pin, an option above a rebuilt nivel), so the editor shows what
   * the perfil público shows and saving it back is accepted.
   */
  private effective(
    stored: ProfileChoices,
    state: UnlockState & { publicBadges: Map<string, PublicBadge> },
    pinnedItems: ContributionItem[],
  ): ProfileChoices {
    const unlocked = (id: string | null) => {
      const option = id === null ? undefined : findOption(id);
      return option && isUnlocked(option, state) ? option.id : null;
    };
    const held = (slug: string) => state.publicBadges.has(slug);
    return {
      avatarCat: unlocked(stored.avatarCat),
      accent: unlocked(stored.accent),
      background: unlocked(stored.background),
      frame: unlocked(stored.frame),
      banner: unlocked(stored.banner),
      theme: unlocked(stored.theme),
      titleBadge:
        stored.titleBadge !== null &&
        state.maxLevel >= TITLE_LEVEL &&
        held(stored.titleBadge)
          ? stored.titleBadge
          : null,
      featuredBadges: stored.featuredBadges.filter(held).slice(0, MAX_FEATURED),
      pinned: pinnedItems.map(({ type, id }) => ({ type, id })),
      showLevelAndBadges: stored.showLevelAndBadges,
    };
  }

  /** Replaces every choice, or rejects the whole request and changes nothing. */
  async replace(userId: string, dto: ReplaceProfileCustomizationDto) {
    const state = await this.unlockState(userId);
    const choices: ProfileChoices = {
      avatarCat: dto.avatarCat ?? null,
      accent: dto.accent ?? null,
      background: dto.background ?? null,
      frame: dto.frame ?? null,
      banner: dto.banner ?? null,
      theme: dto.theme ?? null,
      titleBadge: dto.titleBadge ?? null,
      featuredBadges: dto.featuredBadges,
      pinned: dto.pinned.map(({ type, id }) => ({ type, id })),
      showLevelAndBadges: dto.showLevelAndBadges,
    };

    for (const [field, kind] of OPTION_FIELDS) {
      const id = choices[field] as string | null;
      if (id === null) continue;
      const option = findOption(id);
      if (!option || option.kind !== kind) {
        throw new BadRequestException('Esa opción no existe.');
      }
      if (!isUnlocked(option, state)) {
        throw new BadRequestException('Todavía no desbloqueaste esa opción.');
      }
    }

    if (choices.titleBadge !== null) {
      if (state.maxLevel < TITLE_LEVEL) {
        throw new BadRequestException(
          `El título se desbloquea en el nivel ${TITLE_LEVEL}.`,
        );
      }
      if (!state.publicBadges.has(choices.titleBadge)) {
        throw new BadRequestException('Solo podés elegir insignias que tenés.');
      }
    }

    const featured = choices.featuredBadges;
    if (featured.length > MAX_FEATURED) {
      throw new BadRequestException(
        `Podés destacar hasta ${MAX_FEATURED} insignias.`,
      );
    }
    if (new Set(featured).size !== featured.length) {
      throw new BadRequestException('No repitas insignias.');
    }
    if (featured.some((slug) => !state.publicBadges.has(slug))) {
      throw new BadRequestException('Solo podés elegir insignias que tenés.');
    }

    const pins = choices.pinned;
    const limit = pinLimit(state.maxLevel);
    if (pins.length > limit) {
      throw new BadRequestException(
        limit === 0
          ? 'Fijar aportes se desbloquea en el nivel 2.'
          : `Tu nivel permite fijar hasta ${limit} ${limit === 1 ? 'aporte' : 'aportes'}.`,
      );
    }
    if (
      new Set(pins.map((pin) => `${pin.type}:${pin.id}`)).size !== pins.length
    ) {
      throw new BadRequestException('No repitas aportes.');
    }
    if ((await this.resolvePins(userId, pins)).length !== pins.length) {
      throw new BadRequestException(PIN_REJECTED);
    }

    const data = { ...choices, pinned: pins };
    await this.prisma.profileCustomization.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return this.mine(userId);
  }

  /**
   * Nivel máximo alcanzado and the held insignias as last evaluated. «Tu
   * progreso» and the public profile evaluate on read, and a lost insignia's
   * choices fall back on read anyway, so writes do not evaluate again.
   */
  private async unlockState(
    userId: string,
  ): Promise<UnlockState & { publicBadges: Map<string, PublicBadge> }> {
    const [{ maxLevel }, publicBadges] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { maxLevel: true },
      }),
      this.heldPublicBadges(userId),
    ]);
    return {
      maxLevel,
      heldBadges: new Set(publicBadges.keys()),
      publicBadges,
    };
  }
}
