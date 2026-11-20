import type { Prisma } from '../../generated/prisma';
import { isGone, isObsolete } from './correction-values';

/**
 * Closes the open suggestions of a material that no longer apply, because a
 * field changed or the material was retired or deleted. Listings also filter
 * on read, so this only keeps stored statuses current; it runs inside the
 * caller's transaction after the change.
 */
export async function closeObsolete(
  tx: Prisma.TransactionClient,
  materialId: string,
) {
  const open = await tx.correctionSuggestion.findMany({
    where: { materialId, status: 'OPEN' },
    select: { id: true, field: true, currentValue: true },
  });
  // Most materials have none: skip reading the material then.
  if (open.length === 0) return;
  const material = await tx.material.findUnique({
    where: { id: materialId },
    select: {
      subjectId: true,
      resourceType: true,
      academicYear: true,
      professorId: true,
      publicationStatus: true,
      isDeleted: true,
    },
  });
  if (!material) return;
  const gone = isGone(material);
  const stale = open.filter((suggestion) => isObsolete(suggestion, material));
  if (stale.length === 0) return;
  await tx.correctionSuggestion.updateMany({
    where: { id: { in: stale.map((suggestion) => suggestion.id) } },
    data: {
      status: 'CLOSED',
      closedReason: gone ? 'MATERIAL_GONE' : 'FIELD_CHANGED',
      decidedAt: new Date(),
    },
  });
}
