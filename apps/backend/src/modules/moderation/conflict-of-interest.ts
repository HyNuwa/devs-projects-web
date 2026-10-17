import { ForbiddenException } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma';

/** How long a report of an account's content keeps its reporter out (README_MODERACION §8). */
export const COI_WINDOW_DAYS = 90;

const DAY_MS = 24 * 3_600_000;

/**
 * Sanctioning from Usuarios has no caso, so the caso's reporter check does not
 * apply: this one does. Only content published under the account's name
 * counts; a refusal over anonymous content would reveal who wrote it.
 */
export async function assertNoReportConflict(
  tx: Prisma.TransactionClient,
  reporterId: string,
  accountId: string,
  now = new Date(),
) {
  const report = await tx.report.findFirst({
    where: {
      reporterId,
      createdAt: { gte: new Date(now.getTime() - COI_WINDOW_DAYS * DAY_MS) },
      case: { targetAuthorId: accountId },
      OR: [
        { materialId: { not: null } },
        { courseReview: { isAnonymous: false } },
        { examExperience: { isAnonymous: false } },
      ],
    },
    select: { id: true },
  });
  if (report) {
    throw new ForbiddenException({
      code: 'CONFLICT_OF_INTEREST',
      message:
        'Reportaste contenido de esta cuenta: lo resuelve otra persona de moderación',
    });
  }
}
