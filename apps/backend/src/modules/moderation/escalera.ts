/** Retiros, advertencias and silenciamientos count for the escalera this long. */
export const ESCALERA_WINDOW_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

export type SuggestedStep = 'NONE' | 'WARNING' | 'MUTE' | 'PROPOSE_SUSPENSION';

/**
 * Dates of an account's moderation record. The caller leaves out retiros that were
 * restored or overturned on appeal, and sanciones voided by an appeal.
 */
export type SanctionHistory = {
  retiros: Date[];
  warnings: Date[];
  mutes: Date[];
  suspensions: Date[];
};

const LEVEL: Record<SuggestedStep, number> = {
  NONE: 0,
  WARNING: 1,
  MUTE: 2,
  PROPOSE_SUSPENSION: 3,
};

/**
 * The paso sugerido of the escalera (docs/README_MODERACION.md §6.1). It is only a
 * suggestion: moderation decides whether to apply it.
 */
export function suggestedStep(
  history: SanctionHistory,
  now: Date,
): SuggestedStep {
  const since = now.getTime() - ESCALERA_WINDOW_DAYS * DAY_MS;
  const recent = (dates: Date[]) => dates.filter((d) => d.getTime() >= since);

  const retiros = recent(history.retiros).sort(
    (a, b) => a.getTime() - b.getTime(),
  );
  if (retiros.length === 0) return 'NONE';
  const latestRetiro = retiros[retiros.length - 1];

  const step = stepFor(retiros, recent(history.mutes), history.suspensions);

  // Once that step (or a harsher one) was applied for the latest retiro, there is
  // nothing left to suggest until the next retiro.
  const appliedSince = (dates: Date[]) =>
    dates.some((d) => d.getTime() >= latestRetiro.getTime());
  const applied = Math.max(
    appliedSince(history.warnings) ? LEVEL.WARNING : 0,
    appliedSince(history.mutes) ? LEVEL.MUTE : 0,
    appliedSince(history.suspensions) ? LEVEL.PROPOSE_SUSPENSION : 0,
  );
  return applied >= LEVEL[step] ? 'NONE' : step;
}

function stepFor(
  retiros: Date[],
  recentMutes: Date[],
  suspensions: Date[],
): SuggestedStep {
  // A suspensión never stops counting.
  if (suspensions.length > 0) return 'PROPOSE_SUSPENSION';
  const retiroAfterMute = recentMutes.some((mute) =>
    retiros.some((retiro) => retiro.getTime() > mute.getTime()),
  );
  if (retiroAfterMute || retiros.length >= 3) return 'PROPOSE_SUSPENSION';
  return retiros.length === 2 ? 'MUTE' : 'WARNING';
}
