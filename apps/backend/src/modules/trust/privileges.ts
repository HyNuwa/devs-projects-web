import type { Role } from '../../generated/prisma';
import type { Standing } from './standing';

/** Requirements of README_PUNTOS_E_INSIGNIAS §5. */
export const CORRECTIONS_LEVEL = 3;
export const PRIORITY_MIN_CONFIRMED = 5;
export const PRIORITY_MIN_PRECISION = 70;
export const MODERATE_LEVEL = 6;
export const MODERATE_MIN_MONTHS = 6;
export const MODERATE_MIN_CONFIRMED = 5;
export const MODERATE_MIN_CORRECTIONS = 10;

/** What an account's privileges are computed from. */
export type TrustFacts = {
  role: Role;
  maxLevel: number;
  createdAt: Date;
  standing: Standing;
  /** Reportes resolved in the last 90 days; pending ones never count. */
  recentReports: { confirmed: number; dismissed: number };
  /** Over the account's whole history. */
  confirmedReports: number;
  acceptedCorrections: number;
  now: Date;
};

export type Missing =
  | { kind: 'LEVEL'; needed: number; current: number }
  | { kind: 'CONFIRMED_REPORTS'; needed: number; current: number }
  | { kind: 'PRECISION'; needed: number; current: number }
  | { kind: 'STANDING'; until: Date | null };

export type Privilege = { active: boolean; missing: Missing[] };

const result = (missing: Missing[]): Privilege => ({
  active: missing.length === 0,
  missing,
});

const standingMissing = (facts: TrustFacts): Missing[] =>
  facts.standing.good
    ? []
    : [{ kind: 'STANDING', until: facts.standing.until }];

/** Sugerir correcciones: nivel máximo alcanzado 3 and good standing. */
export function canSuggestCorrections(facts: TrustFacts): Privilege {
  const missing: Missing[] = [];
  if (facts.maxLevel < CORRECTIONS_LEVEL) {
    missing.push({
      kind: 'LEVEL',
      needed: CORRECTIONS_LEVEL,
      current: facts.maxLevel,
    });
  }
  return result([...missing, ...standingMissing(facts)]);
}

/** Reportes prioritarios: 5 confirmed at 70 % or more in 90 days, and good standing. */
export function priorityReporter(facts: TrustFacts): Privilege {
  const { confirmed, dismissed } = facts.recentReports;
  const missing: Missing[] = [];
  if (confirmed < PRIORITY_MIN_CONFIRMED) {
    missing.push({
      kind: 'CONFIRMED_REPORTS',
      needed: PRIORITY_MIN_CONFIRMED,
      current: confirmed,
    });
  } else {
    // Compared exactly (7 of 10 is 70 %); shown rounded (5 of 9 is 56 %).
    const total = confirmed + dismissed;
    if (confirmed * 100 < PRIORITY_MIN_PRECISION * total) {
      missing.push({
        kind: 'PRECISION',
        needed: PRIORITY_MIN_PRECISION,
        current: Math.round((confirmed * 100) / total),
      });
    }
  }
  return result([...missing, ...standingMissing(facts)]);
}

/**
 * Elegible para moderar: a USER at nivel máximo alcanzado 6, older than 6
 * months, with 5 confirmed reportes or 10 accepted corrections, in good
 * standing. Only admins ever see it.
 */
export function eligibleToModerate(facts: TrustFacts) {
  const oldEnough = new Date(facts.now);
  oldEnough.setUTCMonth(oldEnough.getUTCMonth() - MODERATE_MIN_MONTHS);
  return (
    facts.role === 'USER' &&
    facts.maxLevel >= MODERATE_LEVEL &&
    facts.createdAt.getTime() <= oldEnough.getTime() &&
    (facts.confirmedReports >= MODERATE_MIN_CONFIRMED ||
      facts.acceptedCorrections >= MODERATE_MIN_CORRECTIONS) &&
    facts.standing.good
  );
}
