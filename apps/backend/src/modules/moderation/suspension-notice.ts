import { ForbiddenException } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma';
import { canAppeal } from './sanction-rules';
import { isSuspended } from './sanctions.service';

type Client = Pick<Prisma.TransactionClient, 'sanction'>;

/**
 * What a suspended account is told when it tries to sign in: why, until when,
 * and whether it can still appeal (openspec moderation/sanctions and appeals).
 */
export async function suspensionNotice(
  client: Client,
  account: { id: string; isBanned: boolean; bannedUntil: Date | null },
  now = new Date(),
) {
  if (!isSuspended(account, now)) return null;
  const sanction = await client.sanction.findFirst({
    where: {
      userId: account.id,
      type: 'SUSPENSION',
      liftedAt: null,
      voidedAt: null,
    },
    orderBy: { startsAt: 'desc' },
    select: {
      id: true,
      reason: true,
      startsAt: true,
      // The answer, never who gave it.
      appeal: { select: { id: true, status: true, answer: true } },
    },
  });
  const appeal = sanction
    ? canAppeal(
        {
          target: {
            kind: 'SANCTION',
            decidedAt: sanction.startsAt,
            voidedAt: null,
          },
          isOwner: true,
          alreadyAppealed: sanction.appeal !== null,
        },
        now,
      )
    : null;
  return {
    code: 'ACCOUNT_SUSPENDED' as const,
    message: 'Tu cuenta está suspendida',
    reason: sanction?.reason ?? null,
    until: account.bannedUntil?.toISOString() ?? null,
    sanctionId: sanction?.id ?? null,
    appealable: appeal?.allowed ?? false,
    appealDeadline:
      appeal?.allowed === true ? appeal.deadline.toISOString() : null,
    appealStatus: sanction?.appeal?.status ?? null,
    appealAnswer: sanction?.appeal?.answer ?? null,
  };
}

/** Refuses a suspended account with its notice; returns quietly otherwise. */
export async function assertNotSuspended(
  client: Client,
  account: { id: string; isBanned: boolean; bannedUntil: Date | null },
) {
  const notice = await suspensionNotice(client, account);
  if (notice) throw new ForbiddenException(notice);
}
