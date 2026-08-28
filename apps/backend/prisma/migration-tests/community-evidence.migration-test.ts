import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Define MIGRATION_TEST_DATABASE_URL o DATABASE_URL para ejecutar la prueba de migración.',
  );
}

const schemaName = `community_evidence_${Date.now()}_${Math.random()
  .toString(16)
  .slice(2, 10)}`;
const migrationPath = resolve(
  process.cwd(),
  'prisma/migrations/20260828100000_expand_community_evidence/migration.sql',
);

const userId = '10000000-0000-4000-8000-000000000001';
const subjectId = '20000000-0000-4000-8000-000000000001';
const legacyReviewId = '40000000-0000-4000-8000-000000000001';
const legacyExamId = '50000000-0000-4000-8000-000000000001';

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    await client.query(`SET LOCAL search_path TO "${schemaName}", public`);

    await client.query(`
      CREATE TYPE "Shift" AS ENUM ('MANANA', 'TARDE', 'NOCHE', 'NO_INDICO');
      CREATE TYPE "CourseCondition" AS ENUM ('PROMO', 'REGULAR', 'LIBRE', 'PREFIERO_NO_RESPONDER');
      CREATE TYPE "ExamSession" AS ENUM ('DICIEMBRE', 'JULIO', 'MARZO', 'FEBRERO_MARZO', 'ESPECIAL', 'NO_RECUERDO');
      CREATE TYPE "ExamFormat" AS ENUM ('ESCRITO', 'ORAL', 'MIXTO');

      CREATE TABLE "users" ("id" UUID PRIMARY KEY);
      CREATE TABLE "subjects" ("id" UUID PRIMARY KEY);
      CREATE TABLE "professors" ("id" UUID PRIMARY KEY);

      CREATE TABLE "course_reviews" (
        "id" UUID PRIMARY KEY,
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "subject_id" UUID NOT NULL REFERENCES "subjects"("id"),
        "shift" "Shift" NOT NULL DEFAULT 'NO_INDICO',
        "condition" "CourseCondition" NOT NULL DEFAULT 'PREFIERO_NO_RESPONDER',
        "recommendation" SMALLINT NOT NULL,
        "comment" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX "course_reviews_user_id_subject_id_shift_key"
      ON "course_reviews"("user_id", "subject_id", "shift");

      CREATE TABLE "exam_experiences" (
        "id" UUID PRIMARY KEY,
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "subject_id" UUID NOT NULL REFERENCES "subjects"("id"),
        "shift" "Shift",
        "year" SMALLINT NOT NULL,
        "session" "ExamSession" NOT NULL DEFAULT 'NO_RECUERDO',
        "format" "ExamFormat" NOT NULL,
        "professor_id" UUID REFERENCES "professors"("id") ON DELETE SET NULL,
        "examiner_name" VARCHAR(150),
        "difficulty_theory" SMALLINT NOT NULL,
        "difficulty_practice" SMALLINT NOT NULL,
        "comment" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO "users" ("id") VALUES ('${userId}');
      INSERT INTO "subjects" ("id") VALUES ('${subjectId}');
      INSERT INTO "course_reviews" (
        "id", "user_id", "subject_id", "shift", "condition", "recommendation"
      ) VALUES (
        '${legacyReviewId}', '${userId}', '${subjectId}', 'TARDE',
        'PREFIERO_NO_RESPONDER', 4
      );
      INSERT INTO "exam_experiences" (
        "id", "user_id", "subject_id", "year", "session", "format",
        "difficulty_theory", "difficulty_practice"
      ) VALUES (
        '${legacyExamId}', '${userId}', '${subjectId}', 2025, 'JULIO', 'ORAL', 4, 2
      );
    `);

    const migrationSql = await readFile(migrationPath, 'utf8');
    await client.query(migrationSql);

    const legacyReview = await client.query<{
      academic_year: number | null;
      attempt: string | null;
      difficulty: string | null;
      professor_id: string | null;
      professor_name: string | null;
      comment: string | null;
      condition: string;
      is_anonymous: boolean;
    }>('SELECT * FROM "course_reviews" WHERE "id" = $1', [legacyReviewId]);
    const review = legacyReview.rows[0];
    if (
      review.academic_year !== null ||
      review.attempt !== null ||
      review.difficulty !== null ||
      review.professor_id !== null ||
      review.professor_name !== null ||
      review.comment !== null ||
      review.condition !== 'PREFIERO_NO_RESPONDER' ||
      review.is_anonymous !== false
    ) {
      throw new Error(
        `La reseña legacy fue alterada: ${JSON.stringify(review)}`,
      );
    }

    const legacyExam = await client.query<{
      difficulty_theory: number | null;
      difficulty_practice: number | null;
      difficulty: string | null;
      outcome: string | null;
      grade: number | null;
      exam_date: string | null;
      is_anonymous: boolean;
    }>('SELECT * FROM "exam_experiences" WHERE "id" = $1', [legacyExamId]);
    const exam = legacyExam.rows[0];
    if (
      exam.difficulty_theory !== 4 ||
      exam.difficulty_practice !== 2 ||
      exam.difficulty !== null ||
      exam.outcome !== null ||
      exam.grade !== null ||
      exam.exam_date !== null ||
      exam.is_anonymous !== false
    ) {
      throw new Error(
        `La experiencia legacy fue alterada: ${JSON.stringify(exam)}`,
      );
    }

    await client.query(
      `
        INSERT INTO "course_reviews" (
          "id", "user_id", "subject_id", "academic_year", "shift",
          "condition", "attempt", "recommendation", "comment"
        ) VALUES
          ('40000000-0000-4000-8000-000000000002', $1, $2, 2026, 'TARDE', 'REGULAR', 'PRIMERA_CURSADA', 4, 'Primera cursada documentada con suficiente detalle.'),
          ('40000000-0000-4000-8000-000000000003', $1, $2, 2026, 'TARDE', 'LIBRE', 'PRIMERA_RECURSADA', 3, 'Segunda cursada independiente durante el mismo ciclo lectivo.')
      `,
      [userId, subjectId],
    );

    const repeated = await client.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM "course_reviews"
        WHERE "user_id" = $1
          AND "subject_id" = $2
          AND "academic_year" = 2026
          AND "shift" = 'TARDE'
      `,
      [userId, subjectId],
    );
    if (repeated.rows[0].count !== '2') {
      throw new Error(
        'Las cursadas repetidas no sobrevivieron como registros separados.',
      );
    }

    console.log(
      JSON.stringify({
        legacyReviewPreserved: true,
        legacyExamDifficultyPreserved: true,
        inventedCommunityFields: 0,
        repeatedSameYearReviews: Number(repeated.rows[0].count),
      }),
    );
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  }
}

void main();
