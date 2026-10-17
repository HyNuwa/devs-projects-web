import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const migration = '20261012000000_profile_customization';
const schemaName = uniqueSchemaName('profile_customization');

const novice = '10000000-0000-4000-8000-000000000001';
const veteran = '10000000-0000-4000-8000-000000000002';

describe.skipIf(!databaseUrl)(`migration ${migration}`, () => {
  const client = new Client({ connectionString: databaseUrl });

  beforeAll(async () => {
    await client.connect();
    await client.query('BEGIN');
    await applyMigrationsBefore(client, schemaName, migration);
    await client.query(
      `INSERT INTO "users" ("id", "username", "email", "password_hash", "points", "level", "updated_at")
       VALUES ($1, 'novata', 'n@example.com', 'x', 10, 1, CURRENT_TIMESTAMP),
              ($2, 'veterana', 'v@example.com', 'x', 600, 5, CURRENT_TIMESTAMP)`,
      [novice, veteran],
    );
    await applyMigration(client, schemaName, migration);
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('starts every nivel máximo alcanzado at the current nivel', async () => {
    const { rows } = await client.query<{
      username: string;
      max_level: number;
    }>(`SELECT "username", "max_level" FROM "users" ORDER BY "username"`);

    expect(rows).toEqual([
      { username: 'novata', max_level: 1 },
      { username: 'veterana', max_level: 5 },
    ]);
  });

  it('creates profile customizations with their defaults', async () => {
    await client.query(
      `INSERT INTO "profile_customizations" ("user_id", "updated_at")
       VALUES ($1, CURRENT_TIMESTAMP)`,
      [veteran],
    );
    const { rows } = await client.query<{
      featured_badges: string[];
      pinned: unknown;
      show_level_and_badges: boolean;
      avatar_cat: string | null;
    }>(
      `SELECT "featured_badges", "pinned", "show_level_and_badges", "avatar_cat"
       FROM "profile_customizations" WHERE "user_id" = $1`,
      [veteran],
    );

    expect(rows[0]).toEqual({
      featured_badges: [],
      pinned: [],
      show_level_and_badges: true,
      avatar_cat: null,
    });
  });

  it('deletes the customization with its account', async () => {
    await client.query(`DELETE FROM "users" WHERE "id" = $1`, [veteran]);
    const { rowCount } = await client.query(
      `SELECT 1 FROM "profile_customizations" WHERE "user_id" = $1`,
      [veteran],
    );

    expect(rowCount).toBe(0);
  });
});
