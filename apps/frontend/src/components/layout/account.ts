import { Inbox, LogOut, Shield, UserRound, type LucideIcon } from 'lucide-react';

import type { Role, User } from '@/types/auth';

export type AccountMenuItem = {
  id: 'perfil' | 'envios' | 'moderacion' | 'salir';
  label: string;
  icon: LucideIcon;
} & ({ href: string; action?: never } | { action: 'logout'; href?: never });

const moderatorRoles: readonly Role[] = ['MODERATOR', 'ADMIN', 'SUPERADMIN'];

// The mochila, Mis aportes and Configuración entries from the canvas are added
// by the changes that build those pages.
export function accountMenuItems(user: Pick<User, 'role'>): AccountMenuItem[] {
  return [
    { id: 'perfil', label: 'Mi perfil', href: '/profile/me', icon: UserRound },
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
