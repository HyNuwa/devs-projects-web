import type { ReportReason } from '../../generated/prisma';

// Thresholds from docs/README_MODERACION.md §3.3 and §4.4.
const NEW_ACCOUNT_DAYS = 7;
const RECENT_REMOVAL_DAYS = 90;
const HIDE_WINDOW_HOURS = 48;
const HIDE_REPORTER_THRESHOLD = 3;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type PriorReviewReason =
  'NEW_ACCOUNT' | 'UNVERIFIED_EMAIL' | 'RECENT_REMOVAL';

type Account = { createdAt: Date; emailVerified: boolean };

function olderThan(date: Date, days: number, now: Date) {
  return now.getTime() - date.getTime() > days * DAY_MS;
}

/** Why a contribution must wait for revisión previa, or null to publish immediately. */
export function priorReviewReason(
  author: Account & { lastRemovalAt: Date | null },
  now: Date,
): PriorReviewReason | null {
  if (!olderThan(author.createdAt, NEW_ACCOUNT_DAYS, now)) return 'NEW_ACCOUNT';
  if (!author.emailVerified) return 'UNVERIFIED_EMAIL';
  if (
    author.lastRemovalAt &&
    !olderThan(author.lastRemovalAt, RECENT_REMOVAL_DAYS, now)
  ) {
    return 'RECENT_REMOVAL';
  }
  return null;
}

/** Only verified accounts older than 7 days can trigger ocultamiento preventivo. */
export function isQualifiedReporter(reporter: Account, now: Date) {
  return (
    reporter.emailVerified &&
    olderThan(reporter.createdAt, NEW_ACCOUNT_DAYS, now)
  );
}

export type OpenReport = {
  reporterId: string;
  reason: ReportReason;
  createdAt: Date;
  qualified: boolean;
};

export type HideDecision = 'HIDE' | 'HIGH_PRIORITY' | 'NONE';

/** Evaluates a caso's open reportes (including the one just filed). */
export function hideDecision(reports: OpenReport[], now: Date): HideDecision {
  const qualified = reports.filter((report) => report.qualified);

  if (qualified.some((report) => report.reason === 'DATOS_PERSONALES'))
    return 'HIDE';

  const recentReporters = new Set(
    qualified
      .filter(
        (report) =>
          now.getTime() - report.createdAt.getTime() <=
          HIDE_WINDOW_HOURS * HOUR_MS,
      )
      .map((report) => report.reporterId),
  );
  if (recentReporters.size >= HIDE_REPORTER_THRESHOLD) return 'HIDE';

  if (reports.some((report) => report.reason === 'DATOS_PERSONALES'))
    return 'HIGH_PRIORITY';
  return 'NONE';
}
