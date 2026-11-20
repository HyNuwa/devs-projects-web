import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const migration = '20261020000000_optativas_and_plan_reading';
const schemaName = uniqueSchemaName('optativas');

const faculty = '00000000-0000-4000-8000-00000000f001';
const career = '20000000-0000-4000-8000-000000000001';
const plan = '30000000-0000-4000-8000-000000000001';
const placed = '40000000-0000-4000-8000-000000000001';
const optativa = '40000000-0000-4000-8000-000000000002';

async function sqlErrorCode(
  client: Client,
  sql: string,
  values: unknown[] = [],
) {
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
      `INSERT INTO "careers" ("id", "faculty_id", "name", "code", "updated_at")
       VALUES ($1, $2, 'Ingeniería Informática', 'II', CURRENT_TIMESTAMP)`,
      [career, faculty],
    );
    await client.query(
      `INSERT INTO "study_plans" ("id", "career_id", "name", "code", "duration", "updated_at")
       VALUES ($1, $2, 'Plan 2023', 'II-2023', 5, CURRENT_TIMESTAMP)`,
      [plan, career],
    );
    await client.query(
      `INSERT INTO "subjects" ("id", "faculty_id", "code", "name", "updated_at")
       VALUES ($1, $3, 'unju-fi-algebra', 'Álgebra', CURRENT_TIMESTAMP),
              ($2, $3, 'unju-fi-robotica', 'Robótica', CURRENT_TIMESTAMP)`,
      [placed, optativa, faculty],
    );
    await client.query(
      `INSERT INTO "study_plan_subjects" ("id", "study_plan_id", "subject_id", "year", "semester")
       VALUES (gen_random_uuid(), $1, $2, 1, 2)`,
      [plan, placed],
    );
    await applyMigration(client, schemaName, migration);
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('keeps existing placements as they were', async () => {
    const { rows } = await client.query<{ year: number; semester: number }>(
      `SELECT "year", "semester" FROM "study_plan_subjects" WHERE "subject_id" = $1`,
      [placed],
    );
    expect(rows[0]).toEqual({ year: 1, semester: 2 });
  });

  it('accepts an optativa with neither año nor cuatrimestre', async () => {
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "study_plan_subjects" ("id", "study_plan_id", "subject_id", "year", "semester", "credits")
         VALUES (gen_random_uuid(), $1, $2, NULL, NULL, 6)`,
        [plan, optativa],
      ),
    ).toBeUndefined();
  });

  it('rejects a placement with only one of año and cuatrimestre', async () => {
    const insert = (year: number | null, semester: number | null) =>
      sqlErrorCode(
        client,
        `INSERT INTO "study_plan_subjects" ("id", "study_plan_id", "subject_id", "year", "semester")
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [plan, optativa, year, semester],
      );
    expect(await insert(null, 1)).toBe('23514');
    expect(await insert(2, null)).toBe('23514');
    expect(await insert(2, 3)).toBe('23514');
  });

  it('adds the lectura del plan history action', async () => {
    const { rows } = await client.query<{ value: string }>(
      `SELECT unnest(enum_range(NULL::"ModerationEventAction"))::text AS "value"`,
    );
    expect(rows.map((row) => row.value)).toContain('CATALOG_PLAN_READ');
  });
});
