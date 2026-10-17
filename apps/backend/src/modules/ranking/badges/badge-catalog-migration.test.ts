import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { BADGE_CATALOG } from './badge-catalog';

const MIGRATIONS = join(__dirname, '../../../../prisma/migrations');

/**
 * The catalog rows the migrations leave, read from their SQL: the badges
 * migration, then the ones that add insignias or move them (Lupa, 3c-2).
 */
function migrationRows() {
  const row =
    /\(gen_random_uuid\(\), '([^']+)', '([^']+)', '([^']+)', '([^']+)', '([A-Z_]+)', (\d+)\)/g;
  const bySlug = new Map<string, Record<string, unknown>>();
  for (const migration of [
    '20261010000000_badges',
    '20261013000000_trust_privileges',
  ]) {
    const sql = readFileSync(
      join(MIGRATIONS, migration, 'migration.sql'),
      'utf8',
    );
    for (const [
      ,
      slug,
      name,
      description,
      imageUrl,
      rarity,
      order,
    ] of sql.matchAll(row)) {
      bySlug.set(slug, {
        slug,
        name,
        description,
        imageUrl,
        rarity,
        sortOrder: Number(order),
      });
    }
    for (const [, order, slug] of sql.matchAll(
      /UPDATE "badges" SET "sort_order" = (\d+) WHERE "slug" = '([^']+)'/g,
    )) {
      const entry = bySlug.get(slug);
      if (entry) entry.sortOrder = Number(order);
    }
  }
  return [...bySlug.values()].sort(
    (a, b) => (a.sortOrder as number) - (b.sortOrder as number),
  );
}

describe('the badge catalog and its migration', () => {
  it('insert the same insignias, names, descriptions, rarities, order and images', () => {
    expect(migrationRows()).toEqual(
      BADGE_CATALOG.map((badge, index) => ({
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        imageUrl: `/assets/insignias/gema/${badge.slug}.svg`,
        rarity: badge.rarity,
        sortOrder: index + 1,
      })),
    );
  });
});
