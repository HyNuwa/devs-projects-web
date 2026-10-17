import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const migration = '20261011000000_institutions';
// The review fix that locks the rows the plan–materia trigger reads.
const triggerLocks = '20261011010000_institutions_trigger_locks';
const schemaName = uniqueSchemaName('institutions');

// Fixed ids the migration and the seed share (design.md, «Migration in three steps»).
const UNJU = '00000000-0000-4000-8000-00000000a001';
const FI = '00000000-0000-4000-8000-00000000f001';

const userId = '10000000-0000-4000-8000-000000000001';
const careerId = '30000000-0000-4000-8000-000000000001';
const planId = '31000000-0000-4000-8000-000000000001';
const subjectA = '32000000-0000-4000-8000-000000000001';
const subjectB = '32000000-0000-4000-8000-000000000002';
const materialId = '33000000-0000-4000-8000-000000000001';

const otherFaculty = '00000000-0000-4000-8000-00000000f002';
const otherCareer = '30000000-0000-4000-8000-000000000002';
const otherPlan = '31000000-0000-4000-8000-000000000002';
const otherSubject = '32000000-0000-4000-8000-000000000003';

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
      `INSERT INTO "careers" ("id", "name", "code", "updated_at")
       VALUES ($1, 'Ingeniería Informática', 'II', CURRENT_TIMESTAMP)`,
      [careerId],
    );
    await client.query(
      `INSERT INTO "study_plans" ("id", "career_id", "name", "code", "duration", "updated_at")
       VALUES ($1, $2, 'Plan 2023', 'P2023', 5, CURRENT_TIMESTAMP)`,
      [planId, careerId],
    );
    await client.query(
      `INSERT INTO "subjects" ("id", "code", "name", "updated_at")
       VALUES ($1, 'AM1', 'Análisis Matemático I', CURRENT_TIMESTAMP),
              ($2, 'BD', 'Bases de Datos', CURRENT_TIMESTAMP)`,
      [subjectA, subjectB],
    );
    await client.query(
      `INSERT INTO "study_plan_subjects" ("id", "study_plan_id", "subject_id", "year", "semester")
       VALUES (gen_random_uuid(), $1, $2, 1, 1), (gen_random_uuid(), $1, $3, 3, 2)`,
      [planId, subjectA, subjectB],
    );
    await client.query(
      `INSERT INTO "user_study_plans" ("id", "user_id", "study_plan_id", "status")
       VALUES (gen_random_uuid(), $1, $2, 'ACTIVE')`,
      [userId, planId],
    );
    await client.query(
      `INSERT INTO "materials" ("id", "title", "file_url", "file_type", "file_size",
         "author_id", "subject_id", "resource_type", "updated_at")
       VALUES ($1, 'Parcial 1', '/x.pdf', 'pdf', 10, $2, $3, 'PARCIAL', CURRENT_TIMESTAMP)`,
      [materialId, userId, subjectA],
    );

    await applyMigration(client, schemaName, migration);
    await applyMigration(client, schemaName, triggerLocks);

    // A second facultad to exercise the cross-facultad rules.
    await client.query(
      `INSERT INTO "faculties" ("id", "university_id", "name", "short_name", "updated_at")
       VALUES ($1, $2, 'Facultad de Ciencias Agrarias', 'FCA', CURRENT_TIMESTAMP)`,
      [otherFaculty, UNJU],
    );
    await client.query(
      `INSERT INTO "careers" ("id", "faculty_id", "name", "code", "updated_at")
       VALUES ($1, $2, 'Ingeniería Agronómica', 'IA', CURRENT_TIMESTAMP)`,
      [otherCareer, otherFaculty],
    );
    await client.query(
      `INSERT INTO "study_plans" ("id", "career_id", "name", "code", "duration", "updated_at")
       VALUES ($1, $2, 'Plan 2020', 'P2020', 5, CURRENT_TIMESTAMP)`,
      [otherPlan, otherCareer],
    );
    await client.query(
      `INSERT INTO "subjects" ("id", "faculty_id", "code", "name", "updated_at")
       VALUES ($1, $2, 'AM1-FCA', 'Análisis Matemático I', CURRENT_TIMESTAMP)`,
      [otherSubject, otherFaculty],
    );
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('creates UNJU and its Facultad de Ingeniería with fixed ids', async () => {
    const { rows } = await client.query(
      `SELECT u."id" AS "universityId", u."name" AS "university", u."short_name" AS "uShort",
              f."id" AS "facultyId", f."name" AS "faculty", f."short_name" AS "fShort"
       FROM "faculties" f JOIN "universities" u ON u."id" = f."university_id"
       WHERE f."id" = $1`,
      [FI],
    );
    expect(rows).toEqual([
      {
        universityId: UNJU,
        university: 'Universidad Nacional de Jujuy',
        uShort: 'UNJU',
        facultyId: FI,
        faculty: 'Facultad de Ingeniería',
        fShort: 'FI',
      },
    ]);
  });

  it('assigns every existing carrera and materia to FI', async () => {
    const careers = await client.query(
      `SELECT "faculty_id" FROM "careers" WHERE "id" = $1`,
      [careerId],
    );
    const subjects = await client.query(
      `SELECT "faculty_id" FROM "subjects" WHERE "id" = ANY($1::uuid[]) ORDER BY "id"`,
      [[subjectA, subjectB]],
    );
    expect(careers.rows).toEqual([{ faculty_id: FI }]);
    expect(subjects.rows).toEqual([{ faculty_id: FI }, { faculty_id: FI }]);
  });

  it('keeps plans, plan links, declared plans and contributions unchanged', async () => {
    const counts = await client.query(
      `SELECT
         (SELECT count(*) FROM "study_plans" WHERE "career_id" = $1)::int AS "plans",
         (SELECT count(*) FROM "study_plan_subjects" WHERE "study_plan_id" = $2)::int AS "links",
         (SELECT count(*) FROM "user_study_plans" WHERE "user_id" = $3)::int AS "declared",
         (SELECT "subject_id" FROM "materials" WHERE "id" = $4) AS "materialSubject"`,
      [careerId, planId, userId, materialId],
    );
    expect(counts.rows).toEqual([
      { plans: 1, links: 2, declared: 1, materialSubject: subjectA },
    ]);
  });

  it('requires a facultad on carreras and materias', async () => {
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "careers" ("id", "name", "code", "updated_at")
         VALUES (gen_random_uuid(), 'Sin facultad', 'SF', CURRENT_TIMESTAMP)`,
        [],
      ),
    ).toBe('23502');
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "subjects" ("id", "name", "updated_at")
         VALUES (gen_random_uuid(), 'Sin facultad', CURRENT_TIMESTAMP)`,
        [],
      ),
    ).toBe('23502');
  });

  it('makes a carrera code unique per facultad, not globally', async () => {
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "careers" ("id", "faculty_id", "name", "code", "updated_at")
         VALUES (gen_random_uuid(), $1, 'Otra II', 'II', CURRENT_TIMESTAMP)`,
        [otherFaculty],
      ),
    ).toBeUndefined();
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "careers" ("id", "faculty_id", "name", "code", "updated_at")
         VALUES (gen_random_uuid(), $1, 'Repetida', 'II', CURRENT_TIMESTAMP)`,
        [FI],
      ),
    ).toBe('23505');
  });

  it('rejects linking a plan to a materia of another facultad', async () => {
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "study_plan_subjects" ("id", "study_plan_id", "subject_id", "year", "semester")
         VALUES (gen_random_uuid(), $1, $2, 1, 1)`,
        [planId, otherSubject],
      ),
    ).toBe('23514');
    expect(
      await sqlErrorCode(
        client,
        `UPDATE "study_plan_subjects" SET "study_plan_id" = $1 WHERE "study_plan_id" = $2`,
        [otherPlan, planId],
      ),
    ).toBe('23514');
  });

  it('keeps the plan’s previous materias after a rejected link', async () => {
    await sqlErrorCode(
      client,
      `INSERT INTO "study_plan_subjects" ("id", "study_plan_id", "subject_id", "year", "semester")
       VALUES (gen_random_uuid(), $1, $2, 1, 1)`,
      [planId, otherSubject],
    );
    const { rows } = await client.query(
      `SELECT "subject_id" FROM "study_plan_subjects" WHERE "study_plan_id" = $1 ORDER BY "subject_id"`,
      [planId],
    );
    expect(rows).toEqual([{ subject_id: subjectA }, { subject_id: subjectB }]);
  });

  it('locks the plan, carrera and materia it checks, so concurrent moves wait', async () => {
    const { rows } = await client.query<{ source: string }>(
      `SELECT pg_get_functiondef(p.oid) AS "source" FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE p.proname = 'study_plan_subjects_same_faculty' AND n.nspname = $1`,
      [schemaName],
    );
    expect(rows[0].source).toContain('FOR SHARE OF p, c');
    expect(rows[0].source).toMatch(
      /FROM "subjects" s WHERE s\."id" = NEW\."subject_id"\s+FOR SHARE/,
    );
  });

  it('allows linking a plan to a materia of its own facultad', async () => {
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "study_plan_subjects" ("id", "study_plan_id", "subject_id", "year", "semester")
         VALUES (gen_random_uuid(), $1, $2, 1, 1)`,
        [otherPlan, otherSubject],
      ),
    ).toBeUndefined();
  });

  it('rejects moving a linked materia to another facultad', async () => {
    expect(
      await sqlErrorCode(
        client,
        `UPDATE "subjects" SET "faculty_id" = $1 WHERE "id" = $2`,
        [otherFaculty, subjectA],
      ),
    ).toBe('23514');
  });

  it('rejects moving a carrera with plans to another facultad', async () => {
    expect(
      await sqlErrorCode(
        client,
        `UPDATE "careers" SET "faculty_id" = $1 WHERE "id" = $2`,
        [otherFaculty, careerId],
      ),
    ).toBe('23514');
  });

  it('rejects moving a plan with materias to a carrera of another facultad', async () => {
    expect(
      await sqlErrorCode(
        client,
        `UPDATE "study_plans" SET "career_id" = $1 WHERE "id" = $2`,
        [otherCareer, planId],
      ),
    ).toBe('23514');
  });

  it('never cascades a facultad delete onto its content', async () => {
    expect(
      await sqlErrorCode(client, `DELETE FROM "faculties" WHERE "id" = $1`, [
        FI,
      ]),
    ).toBe('23503');
  });
});
