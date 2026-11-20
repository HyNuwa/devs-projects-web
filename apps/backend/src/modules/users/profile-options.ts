import { BADGE_CATALOG } from '../ranking/badges/badge-catalog';

/**
 * Perfil público options and what unlocks them (openspec
 * reputation/profile-customization, README_PUNTOS_E_INSIGNIAS §4). The server
 * is the only place that decides unlocks; the frontend maps ids to CSS and art.
 */
export type ProfileOptionKind =
  'cat' | 'accent' | 'background' | 'frame' | 'banner' | 'theme';

export type ProfileOptionUnlock = { level: number } | { badge: string };

export type ProfileOption = {
  id: string;
  kind: ProfileOptionKind;
  label: string;
  unlock: ProfileOptionUnlock;
};

const byLevel = (
  level: number,
  kind: ProfileOptionKind,
  options: [id: string, label: string][],
): ProfileOption[] =>
  options.map(([id, label]) => ({ id, kind, label, unlock: { level } }));

export const PROFILE_OPTIONS: readonly ProfileOption[] = [
  ...byLevel(1, 'cat', [
    ['birrete', 'Gato con birrete'],
    ['crema', 'Gato crema'],
    ['guino', 'Gato guiñando'],
    ['max', 'Max'],
  ]),
  ...byLevel(2, 'cat', [
    ['gato-lentes', 'Gato con lentes'],
    ['gato-bufanda', 'Gato con bufanda'],
    ['gato-lapiz', 'Gato con lápiz'],
    ['gato-mate', 'Gato matero'],
  ]),
  ...byLevel(3, 'accent', [
    ['menta', 'Menta'],
    ['coral', 'Coral'],
    ['cielo', 'Cielo'],
    ['ambar', 'Ámbar'],
    ['lavanda', 'Lavanda'],
    ['pizarra', 'Pizarra'],
  ]),
  ...byLevel(4, 'background', [
    ['cuadriculado', 'Cuadriculado'],
    ['hoja', 'Hoja de apuntes'],
    ['pixel', 'Pixel'],
  ]),
  ...byLevel(5, 'frame', [['marco-clasico', 'Marco clásico']]),
  ...byLevel(5, 'banner', [
    ['banner-biblioteca', 'Biblioteca'],
    ['banner-pasillo', 'Pasillo de la facultad'],
    ['banner-atardecer', 'Atardecer en el campus'],
  ]),
  ...byLevel(7, 'cat', [
    ['gato-pixel', 'Gato pixel'],
    ['gato-dorado', 'Gato dorado'],
    ['gato-nocturno', 'Gato nocturno'],
  ]),
  ...byLevel(8, 'theme', [['faro', 'Faro de la carrera']]),
  ...byLevel(9, 'cat', [['gato-animado', 'Gato animado']]),
  ...byLevel(10, 'frame', [['marco-legendario', 'Marco legendario']]),
  {
    id: 'marco-salvavidas',
    kind: 'frame',
    label: 'Marco Salvavidas',
    unlock: { badge: 'salvavidas' },
  },
];

/** The título opens at nivel 6; insignias destacadas at any nivel. */
export const TITLE_LEVEL = 6;
export const MAX_FEATURED = 3;

/** «Ojo atento» is about reporting, which stays anonymous. */
const PRIVATE_BADGES = new Set(['ojo-atento']);

export type UnlockState = { maxLevel: number; heldBadges: Set<string> };

export function findOption(id: string): ProfileOption | undefined {
  return PROFILE_OPTIONS.find((option) => option.id === id);
}

export function isUnlocked(option: ProfileOption, state: UnlockState) {
  return 'level' in option.unlock
    ? state.maxLevel >= option.unlock.level
    : state.heldBadges.has(option.unlock.badge);
}

export function unlockLabel(option: ProfileOption) {
  if ('level' in option.unlock) return `Nv. ${option.unlock.level}`;
  const { badge } = option.unlock;
  const name = BADGE_CATALOG.find((entry) => entry.slug === badge)?.name;
  return `Insignia ${name ?? badge}`;
}

/** Aportes fijados: 1 from nivel 2, up to 3 from nivel 3. */
export function pinLimit(maxLevel: number) {
  if (maxLevel >= 3) return 3;
  return maxLevel >= 2 ? 1 : 0;
}

/** Whether an insignia may be shown as título or destacada at all. */
export function canPickBadge(slug: string) {
  return !PRIVATE_BADGES.has(slug);
}

/**
 * The chosen cat if it is still unlocked. Cats unlock only by nivel, and only
 * a points rebuild lowers the nivel máximo alcanzado.
 */
export function effectiveAvatarCat(avatarCat: string | null, maxLevel: number) {
  const option = avatarCat === null ? undefined : findOption(avatarCat);
  return option?.kind === 'cat' &&
    isUnlocked(option, { maxLevel, heldBadges: new Set() })
    ? option.id
    : null;
}
