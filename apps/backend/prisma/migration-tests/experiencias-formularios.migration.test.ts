import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const migration = '20261117000000_experiencias_formularios';
const schemaName = uniqueSchemaName('experiencias_formularios');

const faculty = '00000000-0000-4000-8000-00000000f001';
const author = '10000000-0000-4000-8000-000000000001';
const subject = '40000000-0000-4000-8000-000000000001';
const review = '50000000-0000-4000-8000-000000000001';
const exam = '60000000-0000-4000-8000-000000000001';

const reviewColumns = `"academic_year", "shift", "condition", "attempt", "professor_name",
  "difficulty", "recommendation", "comment", "is_anonymous"`;
const examColumns = `"shift", "year", "session", "format", "exam_date", "examiner_name",
  "difficulty", "difficulty_theory", "difficulty_practice", "outcome", "grade", "comment",
  "is_anonymous"`;

describe.skipIf(!databaseUrl)(`migration ${migration}`, () => {
  const client = new Client({ connectionString: databaseUrl });
  let reviewBefore: Record<string, unknown>;
  let examBefore: Record<string, unknown>;

  beforeAll(async () => {
    await client.connect();
    await client.query('BEGIN');
    await applyMigrationsBefore(client, schemaName, migration);
    await client.query(
      `INSERT INTO "users" ("id", "username", "email", "password_hash", "updated_at")
       VALUES ($1, 'autora', 'a@example.com', 'x', CURRENT_TIMESTAMP)`,
      [author],
    );
    await client.query(
      `INSERT INTO "subjects" ("id", "faculty_id", "code", "name", "updated_at")
       VALUES ($1, $2, 'unju-fi-analisis-2', 'Análisis Matemático II', CURRENT_TIMESTAMP)`,
      [subject, faculty],
    );
    await client.query(
      `INSERT INTO "course_reviews" ("id", "user_id", "subject_id", ${reviewColumns}, "updated_at")
       VALUES ($1, $2, $3, 2025, 'TARDE', 'PROMO', 'PRIMERA_CURSADA', 'Ing. Laura Quiroga',
               'ALTA', 4, 'Una cursada exigente pero bien organizada.', true, CURRENT_TIMESTAMP)`,
      [review, author, subject],
    );
    await client.query(
      `INSERT INTO "exam_experiences" ("id", "user_id", "subject_id", ${examColumns}, "updated_at")
       VALUES ($1, $2, $3, 'MANANA', 2025, 'DICIEMBRE', 'ORAL', '2025-12-10', 'Ing. Pérez',
               'MEDIA', 4, 3, 'APROBADO', 8, 'La mesa preguntó por integrales dobles.', false,
               CURRENT_TIMESTAMP)`,
      [exam, author, subject],
    );
    reviewBefore = (
      await client.query(
        `SELECT ${reviewColumns} FROM "course_reviews" WHERE "id" = $1`,
        [review],
      )
    ).rows[0];
    examBefore = (
      await client.query(
        `SELECT ${examColumns} FROM "exam_experiences" WHERE "id" = $1`,
        [exam],
      )
    ).rows[0];
    await applyMigration(client, schemaName, migration);
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('adds the new nullable columns with their types', async () => {
    const { rows } = await client.query<{
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(
      `SELECT "table_name", "column_name", "data_type", "is_nullable"
       FROM information_schema.columns
       WHERE "table_schema" = $1
         AND ("table_name", "column_name") IN (
           ('course_reviews', 'promotion_grade'),
           ('exam_experiences', 'board_size'),
           ('exam_experiences', 'duration_minutes'),
           ('exam_experiences', 'prep_lead_days'),
           ('exam_experiences', 'prep_daily_minutes'),
           ('exam_experiences', 'topics'))
       ORDER BY "table_name", "column_name"`,
      [schemaName],
    );

    expect(rows).toEqual([
      {
        table_name: 'course_reviews',
        column_name: 'promotion_grade',
        data_type: 'smallint',
        is_nullable: 'YES',
      },
      {
        table_name: 'exam_experiences',
        column_name: 'board_size',
        data_type: 'smallint',
        is_nullable: 'YES',
      },
      {
        table_name: 'exam_experiences',
        column_name: 'duration_minutes',
        data_type: 'smallint',
        is_nullable: 'YES',
      },
      {
        table_name: 'exam_experiences',
        column_name: 'prep_daily_minutes',
        data_type: 'smallint',
        is_nullable: 'YES',
      },
      {
        table_name: 'exam_experiences',
        column_name: 'prep_lead_days',
        data_type: 'smallint',
        is_nullable: 'YES',
      },
      {
        table_name: 'exam_experiences',
        column_name: 'topics',
        data_type: 'ARRAY',
        is_nullable: 'NO',
      },
    ]);
  });

  it('stores topics as text and defaults them to an empty array', async () => {
    const { rows: elementType } = await client.query<{ udt_name: string }>(
      `SELECT "udt_name" FROM information_schema.columns
       WHERE "table_schema" = $1 AND "table_name" = 'exam_experiences'
         AND "column_name" = 'topics'`,
      [schemaName],
    );
    expect(elementType).toEqual([{ udt_name: '_text' }]);

    await client.query(
      `INSERT INTO "exam_experiences" ("id", "user_id", "subject_id", "year", "format", "updated_at")
       VALUES ('60000000-0000-4000-8000-000000000002', $1, $2, 2026, 'ESCRITO', CURRENT_TIMESTAMP)`,
      [author, subject],
    );
    const { rows } = await client.query<{ topics: string[] }>(
      `SELECT "topics" FROM "exam_experiences"
       WHERE "id" = '60000000-0000-4000-8000-000000000002'`,
    );
    expect(rows).toEqual([{ topics: [] }]);
  });

  it('keeps every value of existing reseñas and finales, with the new facts undeclared', async () => {
    const { rows: reviews } = await client.query(
      `SELECT ${reviewColumns}, "promotion_grade" FROM "course_reviews" WHERE "id" = $1`,
      [review],
    );
    const { rows: exams } = await client.query(
      `SELECT ${examColumns}, "board_size", "duration_minutes", "prep_lead_days",
              "prep_daily_minutes", "topics"
       FROM "exam_experiences" WHERE "id" = $1`,
      [exam],
    );

    expect(reviews).toEqual([{ ...reviewBefore, promotion_grade: null }]);
    expect(exams).toEqual([
      {
        ...examBefore,
        board_size: null,
        duration_minutes: null,
        prep_lead_days: null,
        prep_daily_minutes: null,
        topics: [],
      },
    ]);
  });
});
