import { describe, expect, it } from 'vitest';

import {
  canPickBadge,
  findOption,
  isUnlocked,
  MAX_FEATURED,
  PROFILE_OPTIONS,
  pinLimit,
  TITLE_LEVEL,
  unlockLabel,
} from './profile-options';

describe('profile options (reputation/profile-customization)', () => {
  it('has unique ids', () => {
    const ids = PROFILE_OPTIONS.map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('matches the unlock table', () => {
    const count = (kind: string, level: number) =>
      PROFILE_OPTIONS.filter(
        (option) =>
          option.kind === kind &&
          'level' in option.unlock &&
          option.unlock.level === level,
      ).length;

    expect(count('cat', 1)).toBe(4);
    expect(count('cat', 2)).toBe(4);
    expect(count('accent', 3)).toBe(6);
    expect(count('background', 4)).toBe(3);
    expect(count('frame', 5)).toBe(1);
    expect(count('banner', 5)).toBe(3);
    expect(count('cat', 7)).toBe(3);
    expect(count('theme', 8)).toBe(1);
    expect(count('cat', 9)).toBe(1);
    expect(count('frame', 10)).toBe(1);
    expect(findOption('marco-salvavidas')?.unlock).toEqual({
      badge: 'salvavidas',
    });
  });

  it('unlocks level options by nivel máximo alcanzado', () => {
    const banner = findOption('banner-biblioteca')!;

    expect(isUnlocked(banner, { maxLevel: 4, heldBadges: new Set() })).toBe(
      false,
    );
    expect(isUnlocked(banner, { maxLevel: 5, heldBadges: new Set() })).toBe(
      true,
    );
    expect(isUnlocked(banner, { maxLevel: 10, heldBadges: new Set() })).toBe(
      true,
    );
  });

  it('unlocks the Salvavidas frame only while the insignia is held', () => {
    const frame = findOption('marco-salvavidas')!;

    expect(isUnlocked(frame, { maxLevel: 10, heldBadges: new Set() })).toBe(
      false,
    );
    expect(
      isUnlocked(frame, { maxLevel: 1, heldBadges: new Set(['salvavidas']) }),
    ).toBe(true);
  });

  it('labels what unlocks each option', () => {
    expect(unlockLabel(findOption('banner-biblioteca')!)).toBe('Nv. 5');
    expect(unlockLabel(findOption('marco-salvavidas')!)).toBe(
      'Insignia Salvavidas',
    );
  });

  it('allows 0, 1 and 3 aportes fijados at niveles 1, 2 and 3', () => {
    expect([1, 2, 3, 10].map(pinLimit)).toEqual([0, 1, 3, 3]);
  });

  it('opens the título at nivel 6 and destacadas at any nivel, never for Ojo atento', () => {
    expect(TITLE_LEVEL).toBe(6);
    expect(MAX_FEATURED).toBe(3);
    expect(canPickBadge('salvavidas')).toBe(true);
    expect(canPickBadge('ojo-atento')).toBe(false);
  });
});
