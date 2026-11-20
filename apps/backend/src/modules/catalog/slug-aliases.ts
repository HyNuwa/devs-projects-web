import type { CatalogSlugKind, Prisma } from '../../generated/prisma';

type Db = Pick<Prisma.TransactionClient, 'catalogSlugAlias'>;

/**
 * Old slugs of renamed entities keep redirecting to the current address
 * (openspec academic-structure/catalog-editing, «Old slugs keep working»).
 * `parentId` is the universidad of a facultad and the facultad of a carrera;
 * universidades and materias have none.
 */
export async function resolveAlias(
  db: Db,
  kind: CatalogSlugKind,
  parentId: string | null,
  slug: string,
) {
  const alias = await db.catalogSlugAlias.findFirst({
    where: { kind, parentId, slug: slug.toLowerCase() },
    select: { targetId: true },
  });
  return alias?.targetId ?? null;
}

/**
 * Called on every create and rename. The new slug takes over any alias in the
 * same place (renaming back drops the entity's own alias), and the previous
 * slug becomes an alias unless only its case changed.
 */
export async function recordSlugChange(
  db: Db,
  kind: CatalogSlugKind,
  targetId: string,
  parentId: string | null,
  previous: string | null | undefined,
  next: string | null | undefined,
) {
  if (!next) return;
  const nextSlug = next.toLowerCase();
  await db.catalogSlugAlias.deleteMany({
    where: { kind, parentId, slug: nextSlug },
  });
  if (previous && previous.toLowerCase() !== nextSlug) {
    await db.catalogSlugAlias.create({
      data: { kind, parentId, slug: previous.toLowerCase(), targetId },
    });
  }
}
