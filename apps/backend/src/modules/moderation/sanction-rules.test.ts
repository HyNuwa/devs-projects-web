import { describe, expect, it } from 'vitest';

import { canAppeal, canReview, canSanction } from './sanction-rules';

const user = { id: 'user-1', role: 'USER' } as const;
const mod = { id: 'mod-1', role: 'MODERATOR' } as const;
const otherMod = { id: 'mod-2', role: 'MODERATOR' } as const;
const admin = { id: 'admin-1', role: 'ADMIN' } as const;
const superadmin = { id: 'super-1', role: 'SUPERADMIN' } as const;

const now = new Date('2026-09-30T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 3_600_000);

describe('canSanction', () => {
  it('lets a moderator warn, silence and unmute a student, and propose a suspensión', () => {
    for (const action of [
      'WARN',
      'MUTE',
      'UNMUTE',
      'PROPOSE_SUSPENSION',
    ] as const) {
      expect(canSanction(mod, user, action)).toEqual({ allowed: true });
    }
  });

  it('keeps suspending, confirming and lifting suspensiones for admins', () => {
    for (const action of [
      'SUSPEND',
      'DECIDE_PROPOSAL',
      'LIFT_SUSPENSION',
    ] as const) {
      expect(canSanction(mod, user, action)).toEqual({
        allowed: false,
        reason: 'ROLE',
      });
      expect(canSanction(admin, user, action)).toEqual({ allowed: true });
    }
  });

  it('refuses sanctioning your own account', () => {
    expect(canSanction(admin, admin, 'WARN')).toEqual({
      allowed: false,
      reason: 'SELF',
    });
  });

  it('only sanctions accounts below your role', () => {
    expect(canSanction(mod, otherMod, 'MUTE')).toEqual({
      allowed: false,
      reason: 'ROLE',
    });
    expect(canSanction(admin, mod, 'MUTE')).toEqual({ allowed: true });
    expect(
      canSanction(admin, { id: 'admin-2', role: 'ADMIN' }, 'MUTE'),
    ).toEqual({ allowed: false, reason: 'ROLE' });
    expect(canSanction(superadmin, admin, 'SUSPEND')).toEqual({
      allowed: true,
    });
  });

  it('refuses a student acting as moderation', () => {
    expect(canSanction(user, { id: 'user-2', role: 'USER' }, 'WARN')).toEqual({
      allowed: false,
      reason: 'ROLE',
    });
  });

  it('refuses sanctioning from a caso you reported', () => {
    expect(canSanction(mod, user, 'WARN', { reportedInCase: true })).toEqual({
      allowed: false,
      reason: 'REPORTED_CASE',
    });
  });
});

describe('canAppeal', () => {
  const retiro = {
    kind: 'CASE' as const,
    decision: 'REMOVE' as const,
    decidedAt: daysAgo(3),
    revertedAt: null,
  };
  const mute = {
    kind: 'SANCTION' as const,
    decidedAt: daysAgo(3),
    voidedAt: null,
  };

  it('allows the owner to appeal a retiro or a sanción within 14 days', () => {
    expect(
      canAppeal({ target: retiro, isOwner: true, alreadyAppealed: false }, now),
    ).toEqual({
      allowed: true,
      deadline: new Date(daysAgo(3).getTime() + 14 * 24 * 3_600_000),
    });
    expect(
      canAppeal({ target: mute, isOwner: true, alreadyAppealed: false }, now),
    ).toMatchObject({ allowed: true });
  });

  it('refuses someone else’s decision', () => {
    expect(
      canAppeal(
        { target: retiro, isOwner: false, alreadyAppealed: false },
        now,
      ),
    ).toEqual({ allowed: false, reason: 'NOT_OWNER' });
  });

  it('refuses a second appeal', () => {
    expect(
      canAppeal({ target: retiro, isOwner: true, alreadyAppealed: true }, now),
    ).toEqual({ allowed: false, reason: 'ALREADY_APPEALED' });
  });

  it('refuses after 14 days', () => {
    expect(
      canAppeal(
        {
          target: { ...retiro, decidedAt: daysAgo(15) },
          isOwner: true,
          alreadyAppealed: false,
        },
        now,
      ),
    ).toEqual({ allowed: false, reason: 'WINDOW_CLOSED' });
  });

  it('refuses decisions that are not appealable', () => {
    for (const decision of [
      'REJECT',
      'KEEP_VISIBLE',
      'APPROVE',
      'RESTORE',
    ] as const) {
      expect(
        canAppeal(
          {
            target: { ...retiro, decision },
            isOwner: true,
            alreadyAppealed: false,
          },
          now,
        ),
      ).toEqual({ allowed: false, reason: 'NOT_APPEALABLE' });
    }
  });

  it('refuses a retiro already undone and a sanción already voided', () => {
    expect(
      canAppeal(
        {
          target: { ...retiro, revertedAt: daysAgo(1) },
          isOwner: true,
          alreadyAppealed: false,
        },
        now,
      ),
    ).toEqual({ allowed: false, reason: 'NOT_APPEALABLE' });
    expect(
      canAppeal(
        {
          target: { ...mute, voidedAt: daysAgo(1) },
          isOwner: true,
          alreadyAppealed: false,
        },
        now,
      ),
    ).toEqual({ allowed: false, reason: 'NOT_APPEALABLE' });
  });
});

describe('canReview', () => {
  const appeal = {
    appellant: user,
    decidedById: mod.id,
    suspension: false,
    anonymousContent: false,
  };

  it('lets a moderator other than the decider review it', () => {
    expect(canReview(otherMod, appeal)).toBe(true);
  });

  it('never lets the decider review their own decision', () => {
    expect(canReview(mod, appeal)).toBe(false);
  });

  it('never lets the appellant review their own appeal', () => {
    expect(
      canReview(otherMod, {
        ...appeal,
        appellant: otherMod,
        decidedById: admin.id,
      }),
    ).toBe(false);
  });

  it('keeps appeals of suspensiones for admins', () => {
    expect(canReview(otherMod, { ...appeal, suspension: true })).toBe(false);
    expect(canReview(admin, { ...appeal, suspension: true })).toBe(true);
  });

  it('keeps appeals about anonymous content for admins, whoever appeals', () => {
    const anonymous = { ...appeal, anonymousContent: true };
    expect(canReview(otherMod, anonymous)).toBe(false);
    expect(canReview(admin, anonymous)).toBe(true);
    expect(canReview(superadmin, anonymous)).toBe(true);

    const byModerator = {
      ...anonymous,
      appellant: { id: 'mod-3', role: 'MODERATOR' },
    } as const;
    expect(canReview(otherMod, byModerator)).toBe(false);
    expect(canReview(admin, byModerator)).toBe(true);
  });

  it('needs a role above the appellant, so moderators do not review each other', () => {
    expect(
      canReview(otherMod, {
        ...appeal,
        appellant: { id: 'mod-3', role: 'MODERATOR' },
        decidedById: admin.id,
      }),
    ).toBe(false);
    expect(
      canReview(superadmin, {
        ...appeal,
        appellant: { id: 'mod-3', role: 'MODERATOR' },
        decidedById: admin.id,
      }),
    ).toBe(true);
  });

  it('refuses students', () => {
    expect(canReview({ id: 'user-9', role: 'USER' }, appeal)).toBe(false);
  });
});
