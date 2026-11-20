import { BadRequestException } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma';

type Tx = Prisma.TransactionClient;

/**
 * Replaces the facultades a moderator covers and records the change, with the
 * facultades before and after, as a MODERATOR_SCOPE_CHANGED event that only
 * admins see (openspec moderation/scope, «Assigning facultades»). Nothing is
 * recorded when nothing changes.
 */
export async function setModeratorFaculties(
  tx: Tx,
  input: { actorId: string; userId: string; facultyIds: string[] },
) {
  const after = [...new Set(input.facultyIds)].sort();
  if (after.length > 0) {
    const known = await tx.faculty.count({ where: { id: { in: after } } });
    if (known !== after.length) {
      throw new BadRequestException({
        code: 'UNKNOWN_FACULTY',
        message: 'Alguna de las facultades no existe.',
      });
    }
  }
  const before = (
    await tx.moderatorScope.findMany({
      where: { userId: input.userId },
      select: { facultyId: true },
    })
  )
    .map((row) => row.facultyId)
    .sort();
  if (before.join() === after.join()) return after;

  await tx.moderatorScope.deleteMany({ where: { userId: input.userId } });
  if (after.length > 0) {
    await tx.moderatorScope.createMany({
      data: after.map((facultyId) => ({ userId: input.userId, facultyId })),
    });
  }
  await tx.moderationEvent.create({
    data: {
      actorId: input.actorId,
      action: 'MODERATOR_SCOPE_CHANGED',
      targetUserId: input.userId,
      metadata: { before, after },
    },
  });
  return after;
}

/** Promoting needs at least one facultad, whichever route makes the moderator. */
export function requireFaculties(facultyIds: string[] | undefined) {
  if (!facultyIds || facultyIds.length === 0) {
    throw new BadRequestException({
      code: 'FACULTIES_REQUIRED',
      message: 'Elegí al menos una facultad para la moderadora.',
    });
  }
  return facultyIds;
}
