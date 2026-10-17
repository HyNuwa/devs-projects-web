import { Prisma, type PublicationStatus } from '../../generated/prisma';

/** Hidden content nobody reviewed within this window becomes visible again. */
export const HIDDEN_REVIEW_WINDOW_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

type Publishable = {
  publicationStatus: PublicationStatus;
  hiddenAt: Date | null;
};

function hiddenCutoff(now: Date) {
  return new Date(now.getTime() - HIDDEN_REVIEW_WINDOW_DAYS * DAY_MS);
}

export function isOverdueHidden(record: Publishable, now: Date) {
  return (
    record.publicationStatus === 'HIDDEN' &&
    record.hiddenAt !== null &&
    record.hiddenAt < hiddenCutoff(now)
  );
}

export function isPubliclyVisible(record: Publishable, now: Date) {
  return (
    record.publicationStatus === 'PUBLISHED' || isOverdueHidden(record, now)
  );
}

/**
 * Prisma `where` fragment for every public read of materials, reseñas and experiencias.
 * Keep it in sync with `isPubliclyVisible` and `publicVisibilitySql`.
 */
export function publicVisibility(now: Date) {
  return {
    OR: [
      { publicationStatus: 'PUBLISHED' as const },
      {
        publicationStatus: 'HIDDEN' as const,
        hiddenAt: { lt: hiddenCutoff(now) },
      },
    ],
  };
}

/**
 * Raw SQL twin of `publicVisibility` for the table aliased `m`, for queries
 * Prisma cannot express (the material ranking). Keep all three in sync.
 */
export function publicVisibilitySql(now: Date): Prisma.Sql {
  return Prisma.sql`(m.publication_status = 'PUBLISHED' OR (m.publication_status = 'HIDDEN' AND m.hidden_at < ${hiddenCutoff(now)}))`;
}
