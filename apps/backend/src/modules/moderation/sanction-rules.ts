import type { ModerationDecision, Role } from '../../generated/prisma';

/** Appeals are accepted this long after the decision. */
export const APPEAL_WINDOW_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

const RANK: Record<Role, number> = {
  VISITOR: -1,
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  SUPERADMIN: 3,
};

type Account = { id: string; role: Role };

export type SanctionAction =
  | 'WARN'
  | 'MUTE'
  | 'UNMUTE'
  | 'PROPOSE_SUSPENSION'
  | 'SUSPEND'
  | 'DECIDE_PROPOSAL'
  | 'LIFT_SUSPENSION';

/** Suspending, deciding proposals and lifting a suspensión early need an admin. */
const ADMIN_ACTIONS: ReadonlySet<SanctionAction> = new Set([
  'SUSPEND',
  'DECIDE_PROPOSAL',
  'LIFT_SUSPENSION',
]);

export type Permission<Reason extends string> =
  { allowed: true } | { allowed: false; reason: Reason };

/**
 * Who can sanction whom (docs/README_MODERACION.md §8): never yourself, only
 * accounts below your role, never from a caso you reported.
 */
export function canSanction(
  actor: Account,
  target: Account,
  action: SanctionAction,
  options: { reportedInCase?: boolean } = {},
): Permission<'SELF' | 'ROLE' | 'REPORTED_CASE'> {
  if (actor.id === target.id) return { allowed: false, reason: 'SELF' };
  const minimum = ADMIN_ACTIONS.has(action) ? RANK.ADMIN : RANK.MODERATOR;
  if (RANK[actor.role] < minimum || RANK[actor.role] <= RANK[target.role]) {
    return { allowed: false, reason: 'ROLE' };
  }
  if (options.reportedInCase) {
    return { allowed: false, reason: 'REPORTED_CASE' };
  }
  return { allowed: true };
}

export type AppealTarget =
  | {
      kind: 'CASE';
      decision: ModerationDecision | null;
      decidedAt: Date;
      revertedAt: Date | null;
    }
  | { kind: 'SANCTION'; decidedAt: Date; voidedAt: Date | null };

/**
 * Whether an account can appeal a decision (docs/README_MODERACION.md §7): only
 * its own retiros and sanciones, once, within 14 days, while still in force.
 */
export function canAppeal(
  input: { target: AppealTarget; isOwner: boolean; alreadyAppealed: boolean },
  now: Date,
):
  | { allowed: true; deadline: Date }
  | {
      allowed: false;
      reason:
        'NOT_OWNER' | 'NOT_APPEALABLE' | 'ALREADY_APPEALED' | 'WINDOW_CLOSED';
    } {
  const { target } = input;
  if (!input.isOwner) return { allowed: false, reason: 'NOT_OWNER' };
  const undone =
    target.kind === 'CASE'
      ? target.decision !== 'REMOVE' || target.revertedAt !== null
      : target.voidedAt !== null;
  if (undone) return { allowed: false, reason: 'NOT_APPEALABLE' };
  if (input.alreadyAppealed) {
    return { allowed: false, reason: 'ALREADY_APPEALED' };
  }
  const deadline = new Date(
    target.decidedAt.getTime() + APPEAL_WINDOW_DAYS * DAY_MS,
  );
  if (now.getTime() > deadline.getTime()) {
    return { allowed: false, reason: 'WINDOW_CLOSED' };
  }
  return { allowed: true, deadline };
}

/**
 * Whether `viewer` may answer an appeal: someone other than the decider and the
 * appellant, with a role above the appellant's. Suspensiones and retiros of
 * anonymous content need an admin: if moderators answered anonymous-content
 * appeals from students but not from staff, which ones they could answer would
 * reveal that the author is staff.
 */
type AnonymityOf = {
  courseReview?: { isAnonymous: boolean } | null;
  examExperience?: { isAnonymous: boolean } | null;
} | null;

/** Whether a caso is about an anonymous reseña or experiencia. */
export function isAnonymousCase(moderationCase: AnonymityOf | undefined) {
  return Boolean(
    moderationCase?.courseReview?.isAnonymous ||
    moderationCase?.examExperience?.isAnonymous,
  );
}

/**
 * An appeal about anonymous content: of a retiro of anonymous content, or of a
 * sanción from a caso about it. Only admins answer those (openspec moderation/appeals).
 */
export function isAppealAboutAnonymousContent(appeal: {
  kind: 'RETIRO' | 'SANCTION';
  case?: AnonymityOf;
  sanction?: { case?: AnonymityOf } | null;
}) {
  return appeal.kind === 'RETIRO'
    ? isAnonymousCase(appeal.case)
    : isAnonymousCase(appeal.sanction?.case);
}

export function canReview(
  viewer: Account,
  appeal: {
    appellant: Account;
    decidedById: string;
    suspension: boolean;
    anonymousContent: boolean;
  },
): boolean {
  if (viewer.id === appeal.decidedById || viewer.id === appeal.appellant.id) {
    return false;
  }
  const minimum =
    appeal.suspension || appeal.anonymousContent ? RANK.ADMIN : RANK.MODERATOR;
  return (
    RANK[viewer.role] >= minimum &&
    RANK[viewer.role] > RANK[appeal.appellant.role]
  );
}
