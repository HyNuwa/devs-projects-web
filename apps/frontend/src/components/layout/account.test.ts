import { describe, expect, it } from 'vitest';

import type { Role } from '@/types/auth';

import { accountMenuItems, defaultAvatarFor, defaultAvatars } from './account';

const labelsFor = (role: Role) => accountMenuItems({ role }).map(({ label }) => label);

describe('accountMenuItems', () => {
  it('gives students their profile, submissions and sign-out', () => {
    expect(labelsFor('USER')).toEqual(['Mi perfil', 'Mis envíos', 'Cerrar sesión']);
  });

  it.each(['MODERATOR', 'ADMIN', 'SUPERADMIN'] as const)('adds Moderación for %s', (role) => {
    expect(labelsFor(role)).toEqual(['Mi perfil', 'Mis envíos', 'Moderación', 'Cerrar sesión']);
  });

  it('links each entry to its page and marks sign-out as an action', () => {
    expect(accountMenuItems({ role: 'ADMIN' })).toEqual([
      expect.objectContaining({ label: 'Mi perfil', href: '/profile/me' }),
      expect.objectContaining({ label: 'Mis envíos', href: '/profile/me#mis-envios' }),
      expect.objectContaining({ label: 'Moderación', href: '/admin' }),
      expect.objectContaining({ label: 'Cerrar sesión', action: 'logout' }),
    ]);
  });
});

describe('defaultAvatarFor', () => {
  it('always gives the same user the same cat', () => {
    expect(defaultAvatarFor('cm1a2b3c4')).toBe(defaultAvatarFor('cm1a2b3c4'));
  });

  it('spreads users across every default cat', () => {
    const used = new Set(
      Array.from({ length: 60 }, (_, index) => defaultAvatarFor(`user-${index}`)),
    );

    expect(used).toEqual(new Set(defaultAvatars));
  });

  it('serves the cats from public/avatars', () => {
    expect(defaultAvatars).toEqual([
      '/avatars/birrete.webp',
      '/avatars/crema.webp',
      '/avatars/guino.webp',
      '/avatars/max.webp',
    ]);
  });
});
