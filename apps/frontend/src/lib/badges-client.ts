import { api } from '@/lib/api';

export type BadgeRarity = 'COMUN' | 'RARA' | 'TEMPORADA' | 'EDICION_UNICA';
export type BadgeTier = 'BRONCE' | 'PLATA' | 'ORO';

export type EarnedBadge = {
  slug: string;
  name: string;
  rarity: BadgeRarity;
  tier: BadgeTier | null;
  /** 0 unless seasonal: the year or the exam period (YYYYMM). */
  edition: number;
  earnedAt: string;
  /** False until the account sees it: then it plays its entrada animation once. */
  seen: boolean;
};

export type MyBadges = {
  earned: EarnedBadge[];
  pending: { slug: string; name: string; rarity: BadgeRarity; description: string }[];
  closest: {
    slug: string;
    name: string;
    tier: BadgeTier | null;
    current: number;
    target: number;
    missing: string;
  }[];
};

/** «Tu progreso» insignias: evaluated by the API when read. */
export async function getMyBadges(): Promise<MyBadges> {
  return (await api.get<MyBadges>('/me/badges')).data;
}

/** Marks as seen the insignias the page showed, so their entrada plays once. */
export async function markBadgesSeen(badges: { slug: string; edition: number }[]): Promise<void> {
  await api.post('/me/badges/seen', { badges });
}
