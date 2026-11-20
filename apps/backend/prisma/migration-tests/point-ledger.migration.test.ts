import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const migration = '20261009000000_point_ledger';
const schemaName = uniqueSchemaName('point_ledger');

const userId = '10000000-0000-4000-8000-000000000001';

/** Free-text reasons written before the ledger, and the movimiento each becomes. */
const legacyRows = [
  ['MATERIAL_APPROVED', 10, 'MATERIAL_PUBLISHED'],
  ['MATERIAL_PUBLISHED', 10, 'MATERIAL_PUBLISHED'],
  ['MATERIAL_PUBLISHED_REVERTED', -10, 'MATERIAL_PUBLISHED'],
  ['COURSE_REVIEWED', 5, 'COURSE_REVIEWED'],
  ['COURSE_REVIEWED_REVERTED', -5, 'COURSE_REVIEWED'],
  ['EXAM_EXPERIENCE_SHARED', 5, 'EXAM_EXPERIENCE_SHARED'],
  ['GUIDE_CREATED', 15, 'GUIDE_CREATED'],
  ['SEED', 120, 'LEGACY_ADJUSTMENT'],
] as const;

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
    for (const [index, [reason, amount]] of legacyRows.entries()) {
      await client.query(
        `INSERT INTO "point_transactions" ("id", "user_id", "amount", "reason", "reference_id")
         VALUES ($1, $2, $3, $4, 'ref')`,
        [`30000000-0000-4000-8000-00000000000${index}`, userId, amount, reason],
      );
    }
    await applyMigration(client, schemaName, migration);
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('turns every free-text reason into a ledger reason and keeps every row', async () => {
    const { rows } = await client.query<{ reason: string; amount: number }>(
      `SELECT "reason"::text AS "reason", "amount" FROM "point_transactions" ORDER BY "id"`,
    );

    expect(rows).toEqual(
      legacyRows.map(([, amount, reason]) => ({ reason, amount })),
    );
  });

  it('gives legacy rows a unique idempotency key and no reversal link', async () => {
    const { rows } = await client.query<{
      id: string;
      idempotency_key: string;
      reverses_id: string | null;
    }>(
      `SELECT "id", "idempotency_key", "reverses_id" FROM "point_transactions" ORDER BY "id"`,
    );

    for (const row of rows) {
      expect(row.idempotency_key).toBe(`legacy:${row.id}`);
      expect(row.reverses_id).toBeNull();
    }
  });

  it('refuses a repeated idempotency key and a second reversal of one movimiento', async () => {
    const insert = `INSERT INTO "point_transactions"
      ("id", "user_id", "amount", "reason", "reference_id", "idempotency_key", "reverses_id")
      VALUES (gen_random_uuid(), $1, $2, 'MATERIAL_PUBLISHED', 'm1', $3, $4)`;
    const original = '30000000-0000-4000-8000-000000000001';

    expect(
      await sqlErrorCode(client, insert, [
        userId,
        10,
        `legacy:${original}`,
        null,
      ]),
    ).toBe('23505');

    await client.query('SAVEPOINT reversal');
    await client.query(insert, [userId, -10, 'reversal-1', original]);
    expect(
      await sqlErrorCode(client, insert, [userId, -10, 'reversal-2', original]),
    ).toBe('23505');
    await client.query('ROLLBACK TO SAVEPOINT reversal');
  });
});
