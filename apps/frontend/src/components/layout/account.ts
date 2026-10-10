import { Inbox, LogOut, Shield, TrendingUp, UserRound, type LucideIcon } from 'lucide-react';

import type { Role, User } from '@/types/auth';

export type AccountMenuItem = {
  id: 'perfil' | 'progreso' | 'envios' | 'moderacion' | 'salir';
  label: string;
  icon: LucideIcon;
} & ({ href: string; action?: never } | { action: 'logout'; href?: never });

const moderatorRoles: readonly Role[] = ['MODERATOR', 'ADMIN', 'SUPERADMIN'];

// The mochila, Mis aportes and Configuración entries from the canvas are added
// by the changes that build those pages (Tu progreso: change puntos-libro).
export function accountMenuItems(user: Pick<User, 'role'>): AccountMenuItem[] {
  return [
    { id: 'perfil', label: 'Mi perfil', href: '/profile/me', icon: UserRound },
    { id: 'progreso', label: 'Tu progreso', href: '/mi-espacio/progreso', icon: TrendingUp },
    { id: 'envios', label: 'Mis envíos', href: '/profile/me#mis-envios', icon: Inbox },
    ...(moderatorRoles.includes(user.role)
      ? [{ id: 'moderacion', label: 'Moderación', href: '/admin', icon: Shield } as const]
      : []),
    { id: 'salir', label: 'Cerrar sesión', action: 'logout', icon: LogOut },
  ];
}

export const defaultAvatars = [
  '/avatars/birrete.webp',
  '/avatars/crema.webp',
  '/avatars/guino.webp',
  '/avatars/max.webp',
] as const;

/** A stable default cat for users without an avatar image (FNV-1a over the id). */
export function defaultAvatarFor(userId: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return defaultAvatars[(hash >>> 0) % defaultAvatars.length];
}

/** The nivel-9 cat is the crema cat with a subtle animation (README_PUNTOS_E_INSIGNIAS §4). */
const ANIMATED_CAT = 'gato-animado';

export function isAnimatedCat(avatarCat: string | null | undefined) {
  return avatarCat === ANIMATED_CAT;
}

/**
 * The avatar to draw (openspec reputation/profile-customization): the chosen
 * cat, else the uploaded photo, else the cat assigned by id.
 */
export function avatarSrc(user: {
  id: string;
  avatarUrl: string | null;
  avatarCat?: string | null;
}): string {
  if (user.avatarCat) {
    return `/avatars/${isAnimatedCat(user.avatarCat) ? 'crema' : user.avatarCat}.webp`;
  }
  return user.avatarUrl ?? defaultAvatarFor(user.id);
}
