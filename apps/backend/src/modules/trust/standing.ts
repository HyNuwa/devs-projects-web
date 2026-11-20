import type { SanctionType } from '../../generated/prisma';

/** Days without sanciones a privilegio de confianza requires. */
export const GOOD_STANDING_DAYS = 90;
const GOOD_STANDING_MS = GOOD_STANDING_DAYS * 86_400_000;

export type StandingSanction = {
  type: SanctionType;
  startsAt: Date;
  /** Null for advertencias and permanent suspensiones. */
  endsAt: Date | null;
  liftedAt: Date | null;
  voidedAt: Date | null;
};

/** A retiro por normas of the account's content, anonymous content included. */
export type StandingRetiro = { closedAt: Date | null; revertedAt: Date | null };

export type Standing = {
  good: boolean;
  /** When good standing comes back; null when it is good or never comes back. */
  until: Date | null;
  permanent: boolean;
};

/**
 * Good standing (openspec reputation/trust-privileges): 90 days since the last
 * silenciamiento, suspensión or retiro por normas ended, and none active.
 * Advertencias, voided sanciones and reverted retiros never count; a permanent
 * suspensión never clears.
 */
export function standing(input: {
  sanctions: StandingSanction[];
  retiros: StandingRetiro[];
  now: Date;
}): Standing {
  const ends: Date[] = [];
  for (const sanction of input.sanctions) {
    if (sanction.type === 'WARNING' || sanction.voidedAt) continue;
    const end = sanction.liftedAt ?? sanction.endsAt;
    if (end === null) return { good: false, until: null, permanent: true };
    ends.push(end);
  }
  for (const retiro of input.retiros) {
    if (retiro.revertedAt || !retiro.closedAt) continue;
    ends.push(retiro.closedAt);
  }
  if (ends.length === 0) return { good: true, until: null, permanent: false };

  const latest = Math.max(...ends.map((end) => end.getTime()));
  const until = latest + GOOD_STANDING_MS;
  return until <= input.now.getTime()
    ? { good: true, until: null, permanent: false }
    : { good: false, until: new Date(until), permanent: false };
}
