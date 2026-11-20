import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const migration = '20261015000000_catalog_editing';
const schemaName = uniqueSchemaName('catalog_editing');

const faculty = '00000000-0000-4000-8000-00000000f001';
const student = '10000000-0000-4000-8000-000000000001';
const supporter = '10000000-0000-4000-8000-000000000002';
const career = '20000000-0000-4000-8000-000000000001';
const plan = '30000000-0000-4000-8000-000000000001';
const subject = '40000000-0000-4000-8000-000000000001';
const request = '50000000-0000-4000-8000-000000000001';

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
      `INSERT INTO "users" ("id", "username", "email", "password_hash", "updated_at")
       VALUES ($1, 'ana', 'a@example.com', 'x', CURRENT_TIMESTAMP),
              ($2, 'beto', 'b@example.com', 'x', CURRENT_TIMESTAMP)`,
      [student, supporter],
    );
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
       VALUES ($1, $2, '01', 'Álgebra', CURRENT_TIMESTAMP)`,
      [subject, faculty],
    );
    await client.query(
      `INSERT INTO "study_plan_subjects" ("id", "study_plan_id", "subject_id", "year", "semester")
       VALUES (gen_random_uuid(), $1, $2, 1, 1)`,
      [plan, subject],
    );
    await applyMigration(client, schemaName, migration);
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('publishes existing carreras and starts new ones as borrador', async () => {
    const existing = await client.query<{ status: string }>(
      `SELECT "status"::text FROM "careers" WHERE "id" = $1`,
      [career],
    );
    expect(existing.rows[0].status).toBe('PUBLISHED');

    const created = await client.query<{ status: string }>(
      `INSERT INTO "careers" ("id", "faculty_id", "name", "code", "updated_at")
       VALUES (gen_random_uuid(), $1, 'Licenciatura en Física', 'LF', CURRENT_TIMESTAMP)
       RETURNING "status"::text`,
      [faculty],
    );
    expect(created.rows[0].status).toBe('DRAFT');
  });

  it('accepts anual (0) and both cuatrimestres, and rejects anything else', async () => {
    const insert = (semester: number) =>
      sqlErrorCode(
        client,
        `UPDATE "study_plan_subjects" SET "semester" = $1 WHERE "subject_id" = $2`,
        [semester, subject],
      );
    expect(await insert(0)).toBeUndefined();
    expect(await insert(2)).toBeUndefined();
    expect(await insert(3)).toBe('23514');
  });

  it('accepts 60-character materia codes and keeps the existing ones', async () => {
    const code = 'a'.repeat(60);
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "subjects" ("id", "faculty_id", "code", "name", "updated_at")
         VALUES (gen_random_uuid(), $1, $2, 'Larga', CURRENT_TIMESTAMP)`,
        [faculty, code],
      ),
    ).toBeUndefined();
    const { rows } = await client.query<{ code: string }>(
      `SELECT "code" FROM "subjects" WHERE "id" = $1`,
      [subject],
    );
    expect(rows[0].code).toBe('01');
  });

  it('rejects short names and codes that are not slug-safe', async () => {
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "universities" ("id", "name", "short_name", "updated_at")
         VALUES (gen_random_uuid(), 'Universidad Nueva', 'U N', CURRENT_TIMESTAMP)`,
      ),
    ).toBe('23514');
    expect(
      await sqlErrorCode(
        client,
        `UPDATE "faculties" SET "short_name" = 'FÍ' WHERE "id" = $1`,
        [faculty],
      ),
    ).toBe('23514');
    expect(
      await sqlErrorCode(
        client,
        `UPDATE "careers" SET "code" = 'I I' WHERE "id" = $1`,
        [career],
      ),
    ).toBe('23514');
    expect(
      await sqlErrorCode(
        client,
        `UPDATE "subjects" SET "code" = 'álgebra' WHERE "id" = $1`,
        [subject],
      ),
    ).toBe('23514');
    expect(
      await sqlErrorCode(
        client,
        `UPDATE "subjects" SET "code" = 'unju-fi-algebra-2' WHERE "id" = $1`,
        [subject],
      ),
    ).toBeUndefined();
  });

  it('rejects a repeated alias in the same place', async () => {
    const insert = () =>
      client.query(
        `INSERT INTO "catalog_slug_aliases" ("id", "kind", "parent_id", "slug", "target_id")
         VALUES (gen_random_uuid(), 'CAREER', $1, 'inf', $2)`,
        [faculty, career],
      );
    await client.query('SAVEPOINT alias');
    await insert();
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "catalog_slug_aliases" ("id", "kind", "parent_id", "slug", "target_id")
         VALUES (gen_random_uuid(), 'CAREER', $1, 'inf', gen_random_uuid())`,
        [faculty],
      ),
    ).toBe('23505');
    await client.query(
      `INSERT INTO "catalog_slug_aliases" ("id", "kind", "parent_id", "slug", "target_id")
       VALUES (gen_random_uuid(), 'UNIVERSITY', NULL, 'unjujuy', gen_random_uuid())`,
    );
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "catalog_slug_aliases" ("id", "kind", "parent_id", "slug", "target_id")
         VALUES (gen_random_uuid(), 'UNIVERSITY', NULL, 'unjujuy', gen_random_uuid())`,
      ),
    ).toBe('23505');
    await client.query('ROLLBACK TO SAVEPOINT alias');
  });

  it('requires an https plan link and a facultad on a solicitud', async () => {
    const insert = (
      facultyId: string | null,
      facultyText: string | null,
      url: string,
    ) =>
      sqlErrorCode(
        client,
        `INSERT INTO "career_requests"
           ("id", "author_id", "faculty_id", "faculty_text", "career_name", "plan_url", "updated_at")
         VALUES (gen_random_uuid(), $1, $2, $3, 'Licenciatura en Física', $4, CURRENT_TIMESTAMP)`,
        [student, facultyId, facultyText, url],
      );
    expect(await insert(faculty, null, 'http://x.edu.ar/plan')).toBe('23514');
    expect(await insert(null, null, 'https://x.edu.ar/plan')).toBe('23514');
    expect(
      await insert(null, 'Facultad de Química', 'https://x.edu.ar/plan'),
    ).toBeUndefined();
    expect(
      await insert(faculty, null, 'https://x.edu.ar/plan'),
    ).toBeUndefined();
  });

  it('starts solicitudes pending and counts a supporter once', async () => {
    const { rows } = await client.query<{ status: string }>(
      `INSERT INTO "career_requests"
         ("id", "author_id", "faculty_id", "career_name", "plan_url", "updated_at")
       VALUES ($1, $2, $3, 'Licenciatura en Física', 'https://x.edu.ar/plan', CURRENT_TIMESTAMP)
       RETURNING "status"::text`,
      [request, student, faculty],
    );
    expect(rows[0].status).toBe('PENDING');
    await client.query(
      `INSERT INTO "career_request_supporters" ("request_id", "user_id") VALUES ($1, $2)`,
      [request, supporter],
    );
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "career_request_supporters" ("request_id", "user_id") VALUES ($1, $2)`,
        [request, supporter],
      ),
    ).toBe('23505');
  });

  it('adds the catálogo history actions', async () => {
    const { rows } = await client.query<{ value: string }>(
      `SELECT unnest(enum_range(NULL::"ModerationEventAction"))::text AS "value"`,
    );
    expect(rows.map((row) => row.value)).toEqual(
      expect.arrayContaining([
        'CATALOG_CREATED',
        'CATALOG_UPDATED',
        'CATALOG_DELETED',
        'CAREER_PUBLISHED',
        'CAREER_UNPUBLISHED',
        'CATALOG_PLACEMENT_CHANGED',
        'CATALOG_BULK_APPLIED',
        'CAREER_REQUEST_RESOLVED',
      ]),
    );
  });
});
