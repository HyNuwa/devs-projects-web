import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { BADGE_CATALOG } from './badge-catalog';

/** The rows the badges migration inserts, read from its SQL. */
function migrationRows() {
  const sql = readFileSync(
    join(
      __dirname,
      '../../../../prisma/migrations/20261010000000_badges/migration.sql',
    ),
    'utf8',
  );
  const row =
    /\(gen_random_uuid\(\), '([^']+)', '([^']+)', '([^']+)', '([^']+)', '([A-Z_]+)', (\d+)\)/g;
  return [...sql.matchAll(row)].map(
    ([, slug, name, description, imageUrl, rarity, order]) => ({
      slug,
      name,
      description,
      imageUrl,
      rarity,
      sortOrder: Number(order),
    }),
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
