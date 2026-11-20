import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const migration = '20261013000000_trust_privileges';
const schemaName = uniqueSchemaName('trust_privileges');

const author = '10000000-0000-4000-8000-000000000001';
const reporter = '10000000-0000-4000-8000-000000000002';
const faculty = '00000000-0000-4000-8000-00000000f001';
const subject = '30000000-0000-4000-8000-000000000001';
const material = '40000000-0000-4000-8000-000000000001';
const caseId = '50000000-0000-4000-8000-000000000001';

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
       VALUES ($1, 'autora', 'a@example.com', 'x', CURRENT_TIMESTAMP),
              ($2, 'reportero', 'r@example.com', 'x', CURRENT_TIMESTAMP)`,
      [author, reporter],
    );
    await client.query(
      `INSERT INTO "subjects" ("id", "faculty_id", "name", "updated_at")
       VALUES ($1, $2, 'Álgebra', CURRENT_TIMESTAMP)`,
      [subject, faculty],
    );
    await client.query(
      `INSERT INTO "materials" ("id", "title", "file_url", "file_type", "file_size",
         "author_id", "subject_id", "resource_type", "updated_at")
       VALUES ($1, 'Final', 'https://x', 'pdf', 10, $2, $3, 'FINAL', CURRENT_TIMESTAMP)`,
      [material, author, subject],
    );
    await client.query(
      `INSERT INTO "moderation_cases" ("id", "kind", "target_type", "material_id")
       VALUES ($1, 'REPORTS', 'MATERIAL', $2)`,
      [caseId, material],
    );
    await client.query(
      `INSERT INTO "reports" ("id", "case_id", "reporter_id", "reason", "target_type", "material_id")
       VALUES (gen_random_uuid(), $1, $2, 'OTRO', 'MATERIAL', $3)`,
      [caseId, reporter, material],
    );
    await applyMigration(client, schemaName, migration);
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('keeps existing reportes non-priority', async () => {
    const { rows } = await client.query<{ priority: boolean }>(
      `SELECT "priority" FROM "reports"`,
    );
    expect(rows).toEqual([{ priority: false }]);
  });

  it('adds CORRECTION_ACCEPTED to the point reasons', async () => {
    const { rows } = await client.query<{ value: string }>(
      `SELECT unnest(enum_range(NULL::"PointReason"))::text AS "value"`,
    );
    expect(rows.map((row) => row.value)).toContain('CORRECTION_ACCEPTED');
  });

  it('adds Lupa right after Ojo atento', async () => {
    const { rows } = await client.query<{ slug: string }>(
      `SELECT "slug" FROM "badges" WHERE "slug" IS NOT NULL ORDER BY "sort_order"`,
    );
    const slugs = rows.map((row) => row.slug);
    expect(slugs.indexOf('lupa')).toBe(slugs.indexOf('ojo-atento') + 1);
    expect(slugs.at(-1)).toBe('primera-camada');
  });

  it('allows one open suggestion per material and field', async () => {
    const insert = (status: string) =>
      sqlErrorCode(
        client,
        `INSERT INTO "correction_suggestions"
           ("id", "material_id", "suggester_id", "field", "current_value", "proposed_value", "status")
         VALUES (gen_random_uuid(), $1, $2, 'RESOURCE_TYPE', 'FINAL', 'PARCIAL', $3::"CorrectionStatus")`,
        [material, reporter, status],
      );

    await client.query(
      `INSERT INTO "correction_suggestions"
         ("id", "material_id", "suggester_id", "field", "current_value", "proposed_value")
       VALUES (gen_random_uuid(), $1, $2, 'RESOURCE_TYPE', 'FINAL', 'PARCIAL')`,
      [material, reporter],
    );

    expect(await insert('OPEN')).toBe('23505');
    expect(await insert('REJECTED')).toBeUndefined();
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "correction_suggestions"
           ("id", "material_id", "suggester_id", "field", "current_value", "proposed_value")
         VALUES (gen_random_uuid(), $1, $2, 'ACADEMIC_YEAR', NULL, '2024')`,
        [material, reporter],
      ),
    ).toBeUndefined();
  });
});
