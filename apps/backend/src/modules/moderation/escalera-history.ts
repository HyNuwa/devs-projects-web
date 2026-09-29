import type { Prisma } from '../../generated/prisma';
import type { SanctionHistory } from './escalera';

type Client = Pick<Prisma.TransactionClient, 'moderationCase' | 'sanction'>;

export type EscaleraHistory = SanctionHistory & { lastWarning: Date | null };

export function emptyHistory(): EscaleraHistory {
  return {
    retiros: [],
    warnings: [],
    mutes: [],
    suspensions: [],
    lastWarning: null,
  };
}

/**
 * The escalera inputs of several accounts at once: retiros por normas not undone,
 * and sanciones not voided by an appeal (anonymous content included).
 */
export async function loadHistories(client: Client, userIds: string[]) {
  const [retiros, sanctions] = await Promise.all([
    client.moderationCase.findMany({
      where: {
        targetAuthorId: { in: userIds },
        decision: 'REMOVE',
        revertedAt: null,
        closedAt: { not: null },
      },
      select: { targetAuthorId: true, closedAt: true },
    }),
    client.sanction.findMany({
      where: { userId: { in: userIds }, voidedAt: null },
      select: { userId: true, type: true, startsAt: true },
    }),
  ]);
  const map = new Map<string, EscaleraHistory>();
  const of = (id: string) => {
    if (!map.has(id)) map.set(id, emptyHistory());
    return map.get(id)!;
  };
  for (const retiro of retiros) {
    of(retiro.targetAuthorId!).retiros.push(retiro.closedAt!);
  }
  for (const sanction of sanctions) {
    const history = of(sanction.userId);
    if (sanction.type === 'WARNING') {
      history.warnings.push(sanction.startsAt);
      if (
        !history.lastWarning ||
        sanction.startsAt.getTime() > history.lastWarning.getTime()
      ) {
        history.lastWarning = sanction.startsAt;
      }
    }
    if (sanction.type === 'MUTE') history.mutes.push(sanction.startsAt);
    if (sanction.type === 'SUSPENSION') {
      history.suspensions.push(sanction.startsAt);
    }
  }
  return map;
}
