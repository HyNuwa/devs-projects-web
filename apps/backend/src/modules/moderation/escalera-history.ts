import type { Prisma, Role } from '../../generated/prisma';
import type { SanctionHistory } from './escalera';

type Client = Pick<Prisma.TransactionClient, 'moderationCase' | 'sanction'>;

export type EscaleraHistory = SanctionHistory & { lastWarning: Date | null };

/**
 * Whether an account's history counts what came from anonymous content. A
 * MODERATOR's views never do: deciding an anonymous caso and then looking at an
 * account would show who wrote it (openspec moderation/sanctions, «Usuarios tab»).
 */
export type AnonymousHistory = 'include' | 'exclude';

export function anonymousHistoryFor(role: Role): AnonymousHistory {
  return role === 'ADMIN' || role === 'SUPERADMIN' ? 'include' : 'exclude';
}

/** Casos whose content is not anonymous: a material, or a signed reseña or experiencia. */
export const SIGNED_CASE: Prisma.ModerationCaseWhereInput = {
  OR: [
    { materialId: { not: null } },
    { courseReview: { is: { isAnonymous: false } } },
    { examExperience: { is: { isAnonymous: false } } },
  ],
};

/** Sanciones not from a caso about anonymous content. */
export const SIGNED_SANCTION: Prisma.SanctionWhereInput = {
  OR: [{ caseId: null }, { case: { is: SIGNED_CASE } }],
};

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
 * and sanciones not voided by an appeal. Anonymous content counts unless
 * `anonymous: 'exclude'`; decisions always count it.
 */
export async function loadHistories(
  client: Client,
  userIds: string[],
  options: { anonymous?: AnonymousHistory } = {},
) {
  const exclude = options.anonymous === 'exclude';
  const [retiros, sanctions] = await Promise.all([
    client.moderationCase.findMany({
      where: {
        targetAuthorId: { in: userIds },
        decision: 'REMOVE',
        revertedAt: null,
        closedAt: { not: null },
        ...(exclude ? SIGNED_CASE : {}),
      },
      select: { targetAuthorId: true, closedAt: true },
    }),
    client.sanction.findMany({
      where: {
        userId: { in: userIds },
        voidedAt: null,
        ...(exclude ? SIGNED_SANCTION : {}),
      },
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
