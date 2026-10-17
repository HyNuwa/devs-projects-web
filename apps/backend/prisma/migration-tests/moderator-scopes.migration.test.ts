import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const migration = '20261014000000_moderator_scopes';
const schemaName = uniqueSchemaName('moderator_scopes');

const university = '00000000-0000-4000-8000-00000000a001';
const faculty = '00000000-0000-4000-8000-00000000f001';
const moderator = '10000000-0000-4000-8000-000000000001';
const career = '20000000-0000-4000-8000-000000000001';

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
      `INSERT INTO "users" ("id", "username", "email", "password_hash", "role", "updated_at")
       VALUES ($1, 'mod', 'm@example.com', 'x', 'MODERATOR', CURRENT_TIMESTAMP)`,
      [moderator],
    );
    await client.query(
      `INSERT INTO "careers" ("id", "faculty_id", "name", "code", "updated_at")
       VALUES ($1, $2, 'Ingeniería Informática', 'II', CURRENT_TIMESTAMP)`,
      [career, faculty],
    );
    await client.query(
      `INSERT INTO "study_plans" ("id", "career_id", "name", "code", "duration", "updated_at")
       VALUES (gen_random_uuid(), $1, 'Plan 2023', 'II-2023', 5, CURRENT_TIMESTAMP)`,
      [career],
    );
    await client.query(
      `INSERT INTO "subjects" ("id", "faculty_id", "code", "name", "updated_at")
       VALUES (gen_random_uuid(), $1, 'AM1', 'Análisis I', CURRENT_TIMESTAMP)`,
      [faculty],
    );
    await applyMigration(client, schemaName, migration);
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('rejects a repeated materia code and accepts several without one', async () => {
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "subjects" ("id", "faculty_id", "code", "name", "updated_at")
         VALUES (gen_random_uuid(), $1, 'AM1', 'Otra', CURRENT_TIMESTAMP)`,
        [faculty],
      ),
    ).toBe('23505');
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "subjects" ("id", "faculty_id", "code", "name", "updated_at")
         VALUES (gen_random_uuid(), $1, NULL, 'Sin código 1', CURRENT_TIMESTAMP),
                (gen_random_uuid(), $1, NULL, 'Sin código 2', CURRENT_TIMESTAMP)`,
        [faculty],
      ),
    ).toBeUndefined();
  });

  it('rejects a second plan for a carrera', async () => {
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "study_plans" ("id", "career_id", "name", "code", "duration", "updated_at")
         VALUES (gen_random_uuid(), $1, 'Plan 2030', 'II-2030', 5, CURRENT_TIMESTAMP)`,
        [career],
      ),
    ).toBe('23505');
  });

  it('accepts only https plan links', async () => {
    expect(
      await sqlErrorCode(
        client,
        `UPDATE "careers" SET "plan_url" = 'http://x.edu.ar/plan' WHERE "id" = $1`,
        [career],
      ),
    ).toBe('23514');
    expect(
      await sqlErrorCode(
        client,
        `UPDATE "careers" SET "plan_url" = 'https://x.edu.ar/plan' WHERE "id" = $1`,
        [career],
      ),
    ).toBeUndefined();
  });

  it('rejects slugs that differ only by case', async () => {
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "universities" ("id", "name", "short_name", "updated_at")
         VALUES (gen_random_uuid(), 'Otra Jujuy', 'unju', CURRENT_TIMESTAMP)`,
      ),
    ).toBe('23505');
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "faculties" ("id", "university_id", "name", "short_name", "updated_at")
         VALUES (gen_random_uuid(), $1, 'Otra Ingeniería', 'fi', CURRENT_TIMESTAMP)`,
        [university],
      ),
    ).toBe('23505');
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "careers" ("id", "faculty_id", "name", "code", "updated_at")
         VALUES (gen_random_uuid(), $1, 'Otra', 'ii', CURRENT_TIMESTAMP)`,
        [faculty],
      ),
    ).toBe('23505');
  });

  it('cascades scopes with the user and protects the facultad', async () => {
    await client.query(
      `INSERT INTO "moderator_scopes" ("user_id", "faculty_id") VALUES ($1, $2)`,
      [moderator, faculty],
    );
    expect(
      await sqlErrorCode(client, `DELETE FROM "faculties" WHERE "id" = $1`, [
        faculty,
      ]),
    ).toBe('23503');
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "moderator_scopes" ("user_id", "faculty_id") VALUES ($1, $2)`,
        [moderator, faculty],
      ),
    ).toBe('23505');

    await client.query('SAVEPOINT cascade');
    await client.query(`DELETE FROM "users" WHERE "id" = $1`, [moderator]);
    const { rows } = await client.query(`SELECT 1 FROM "moderator_scopes"`);
    expect(rows).toHaveLength(0);
    await client.query('ROLLBACK TO SAVEPOINT cascade');
  });

  it('adds MODERATOR_SCOPE_CHANGED to the history actions', async () => {
    const { rows } = await client.query<{ value: string }>(
      `SELECT unnest(enum_range(NULL::"ModerationEventAction"))::text AS "value"`,
    );
    expect(rows.map((row) => row.value)).toContain('MODERATOR_SCOPE_CHANGED');
  });
});
