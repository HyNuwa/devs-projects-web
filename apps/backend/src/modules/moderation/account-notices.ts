import type { Prisma } from '../../generated/prisma';
import { canAppeal } from './sanction-rules';
import { isSuspended } from './sanctions.service';

type Client = Pick<Prisma.TransactionClient, 'sanction'>;
type Account = {
  id: string;
  isBanned: boolean;
  bannedUntil: Date | null;
  mutedUntil: Date | null;
};

const noticeSelect = {
  id: true,
  type: true,
  reason: true,
  startsAt: true,
  endsAt: true,
  appeal: { select: { id: true, status: true } },
} as const;

/** How a sanción is shown to its account: never who applied it. */
function describe(
  sanction: {
    id: string;
    type: string;
    reason: string;
    startsAt: Date;
    endsAt: Date | null;
    appeal: { id: string; status: string } | null;
  },
  now: Date,
) {
  const appeal = canAppeal(
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
  );
  return {
    id: sanction.id,
    type: sanction.type,
    reason: sanction.reason,
    since: sanction.startsAt.toISOString(),
    until: sanction.endsAt?.toISOString() ?? null,
    appealable: appeal.allowed,
    appealDeadline: appeal.allowed ? appeal.deadline.toISOString() : null,
    appealStatus: sanction.appeal?.status ?? null,
  };
}

/**
 * The active restriction (silenciamiento or suspensión) and an advertencia not yet
 * seen, for the shell notice (openspec moderation/sanctions, «The account knows
 * its sanction»).
 */
export async function accountNotices(
  client: Client,
  account: Account,
  now = new Date(),
) {
  const suspended = isSuspended(account, now);
  const muted =
    account.mutedUntil !== null && account.mutedUntil.getTime() > now.getTime();

  const [active, warning] = await Promise.all([
    suspended || muted
      ? client.sanction.findFirst({
          where: {
            userId: account.id,
            type: suspended ? 'SUSPENSION' : 'MUTE',
            liftedAt: null,
            voidedAt: null,
          },
          orderBy: { startsAt: 'desc' },
          select: noticeSelect,
        })
      : null,
    client.sanction.findFirst({
      where: {
        userId: account.id,
        type: 'WARNING',
        seenAt: null,
        voidedAt: null,
      },
      orderBy: { startsAt: 'desc' },
      select: noticeSelect,
    }),
  ]);

  return {
    restriction: active ? describe(active, now) : null,
    unseenWarning: warning ? describe(warning, now) : null,
  };
}
