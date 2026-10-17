import { isSanctioned, type SanctionState } from './point-ledger';

export type HelpfulGiver = SanctionState & { emailVerified: boolean };

/** Fields of a giver that decide whether their «Me sirvió» is valid. */
export const helpfulGiverSelect = {
  emailVerified: true,
  mutedUntil: true,
  isBanned: true,
  bannedUntil: true,
} as const;

/**
 * Whether a «Me sirvió» is valid (README_PUNTOS_E_INSIGNIAS §3.2): its giver has
 * a verified email and no active sanción, and is not the material's author. The
 * material being `Publicado` is checked by the caller. Points, the pioneer bonus
 * and insignias all use this one rule.
 */
export function isValidHelpful(
  giver: HelpfulGiver,
  giverId: string,
  authorId: string,
  now: Date,
  options: { ignoreSanction?: boolean } = {},
) {
  return (
    giverId !== authorId &&
    giver.emailVerified &&
    (options.ignoreSanction === true || !isSanctioned(giver, now))
  );
}
