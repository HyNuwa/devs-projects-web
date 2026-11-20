import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const migration = '20261010000000_badges';
const schemaName = uniqueSchemaName('badges');

const userId = '10000000-0000-4000-8000-000000000001';
const legacyBadge = '20000000-0000-4000-8000-000000000001';

async function sqlErrorCode(client: Client, sql: string, values: unknown[]) {
  await client.query('SAVEPOINT attempt');
  try {
    await client.query(sql, values);
    return undefined;
  } catch (error) {
    return (error as { code?: string }).code;
  } finally {
    await client.query('ROLLBACK TO SAVEPOINT attempt');
  }
}

describe.skipIf(!databaseUrl)(`migration ${migration}`, () => {
  const client = new Client({ connectionString: databaseUrl });

  beforeAll(async () => {
    await client.connect();
    await client.query('BEGIN');
    await applyMigrationsBefore(client, schemaName, migration);
    await client.query(
      `INSERT INTO "users" ("id", "username", "email", "password_hash", "updated_at")
       VALUES ($1, 'autora', 'a@example.com', 'x', CURRENT_TIMESTAMP)`,
      [userId],
    );
    await client.query(
      `INSERT INTO "badges" ("id", "name", "description", "image_url")
       VALUES ($1, 'Vieja', 'Una insignia anterior', '/vieja.png')`,
      [legacyBadge],
    );
    await client.query(
      `INSERT INTO "user_badges" ("id", "user_id", "badge_id")
       VALUES (gen_random_uuid(), $1, $2)`,
      [userId, legacyBadge],
    );
    await applyMigration(client, schemaName, migration);
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('inserts the 17 insignias of the catalog, in order', async () => {
    const { rows } = await client.query<{
      slug: string;
      rarity: string;
      image_url: string;
    }>(
      `SELECT "slug", "rarity"::text AS "rarity", "image_url" FROM "badges"
       WHERE "slug" NOT LIKE 'legacy-%' ORDER BY "sort_order"`,
    );

    expect(rows.map((row) => row.slug)).toEqual([
      'primer-aporte',
      'primer-me-sirvio',
      'salvavidas',
      'trotamaterias',
      'primera-huella',
      'primera-luz',
      'kit-completo',
      'archivo-historico',
      'puente',
      'constante',
      'voz-de-la-cursada',
      'contexto-completo',
      'cronista-de-mesas',
      'mesa-de-diciembre',
      'temporada-de-finales',
      'ojo-atento',
      'primera-camada',
    ]);
    expect(rows.find((row) => row.slug === 'mesa-de-diciembre')?.rarity).toBe(
      'TEMPORADA',
    );
    expect(rows[0].image_url).toBe('/assets/insignias/gema/primer-aporte.svg');
  });

  it('keeps earlier insignias and their holders, with a legacy slug and edition 0', async () => {
    const { rows } = await client.query<{ slug: string; edition: number }>(
      `SELECT b."slug", ub."edition" FROM "user_badges" ub
       JOIN "badges" b ON b."id" = ub."badge_id"`,
    );

    expect(rows).toEqual([{ slug: `legacy-${legacyBadge}`, edition: 0 }]);
  });

  it('allows one row per insignia and edición, not two of the same edición', async () => {
    const insert = `INSERT INTO "user_badges" ("id", "user_id", "badge_id", "edition")
      VALUES (gen_random_uuid(), $1, (SELECT "id" FROM "badges" WHERE "slug" = 'mesa-de-diciembre'), $2)`;

    await client.query('SAVEPOINT editions');
    await client.query(insert, [userId, 2025]);
    await client.query(insert, [userId, 2026]);
    expect(await sqlErrorCode(client, insert, [userId, 2026])).toBe('23505');
    await client.query('ROLLBACK TO SAVEPOINT editions');
  });
});
