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

const schemaName = `community_moderation_${Date.now()}_${Math.random()
  .toString(16)
  .slice(2, 10)}`;
const migrationPath = resolve(
  process.cwd(),
  'prisma/migrations/20260828110000_add_community_reporting_and_moderation/migration.sql',
);

const authorId = '10000000-0000-4000-8000-000000000001';
const moderatorId = '10000000-0000-4000-8000-000000000002';
const reporterId = '10000000-0000-4000-8000-000000000003';
const reviewId = '40000000-0000-4000-8000-000000000001';
const examId = '50000000-0000-4000-8000-000000000001';

async function expectCheckViolation(
  client: Client,
  savepoint: string,
  sql: string,
  values: unknown[],
) {
  await client.query(`SAVEPOINT ${savepoint}`);
  let errorCode: string | undefined;
  try {
    await client.query(sql, values);
  } catch (error) {
    errorCode = (error as { code?: string }).code;
  }
  await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);

  if (errorCode !== '23514') {
    throw new Error(
      `Se esperaba una violación CHECK (23514) y se recibió ${errorCode ?? 'ningún error'}.`,
    );
  }
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    await client.query(`SET LOCAL search_path TO "${schemaName}", public`);

    await client.query(`
      CREATE TABLE "users" ("id" UUID PRIMARY KEY);
      CREATE TABLE "course_reviews" (
        "id" UUID PRIMARY KEY,
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE "exam_experiences" (
        "id" UUID PRIMARY KEY,
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO "users" ("id") VALUES
        ('${authorId}'), ('${moderatorId}'), ('${reporterId}');
      INSERT INTO "course_reviews" ("id", "user_id")
      VALUES ('${reviewId}', '${authorId}');
      INSERT INTO "exam_experiences" ("id", "user_id")
      VALUES ('${examId}', '${authorId}');
    `);

    const migrationSql = await readFile(migrationPath, 'utf8');
    await client.query(migrationSql);

    await client.query(
      `
        INSERT INTO "community_reports" (
          "id", "reporter_id", "course_review_id", "reason", "updated_at"
        ) VALUES (
          '60000000-0000-4000-8000-000000000001', $1, $2,
          'POSIBLEMENTE_ENGANOSO', CURRENT_TIMESTAMP
        )
      `,
      [reporterId, reviewId],
    );
    await client.query(
      `
        INSERT INTO "community_reports" (
          "id", "reporter_id", "exam_experience_id", "reason", "updated_at"
        ) VALUES (
          '60000000-0000-4000-8000-000000000002', $1, $2,
          'NO_RELACIONADO', CURRENT_TIMESTAMP
        )
      `,
      [reporterId, examId],
    );

    await expectCheckViolation(
      client,
      'report_no_target',
      `
        INSERT INTO "community_reports" (
          "id", "reporter_id", "reason", "updated_at"
        ) VALUES ('60000000-0000-4000-8000-000000000003', $1, 'SPAM_O_REPETIDO', CURRENT_TIMESTAMP)
      `,
      [reporterId],
    );
    await expectCheckViolation(
      client,
      'report_dual_target',
      `
        INSERT INTO "community_reports" (
          "id", "reporter_id", "course_review_id", "exam_experience_id",
          "reason", "updated_at"
        ) VALUES (
          '60000000-0000-4000-8000-000000000004', $1, $2, $3,
          'SPAM_O_REPETIDO', CURRENT_TIMESTAMP
        )
      `,
      [reporterId, reviewId, examId],
    );

    await expectCheckViolation(
      client,
      'action_no_target',
      `
        INSERT INTO "community_moderation_actions" (
          "id", "moderator_id", "author_id", "action", "reason"
        ) VALUES (
          '70000000-0000-4000-8000-000000000001', $1, $2,
          'REMOVE', 'Sin objetivo'
        )
      `,
      [moderatorId, authorId],
    );
    await expectCheckViolation(
      client,
      'action_dual_target',
      `
        INSERT INTO "community_moderation_actions" (
          "id", "moderator_id", "author_id", "course_review_id",
          "exam_experience_id", "action", "reason"
        ) VALUES (
          '70000000-0000-4000-8000-000000000002', $1, $2, $3, $4,
          'REMOVE', 'Dos objetivos'
        )
      `,
      [moderatorId, authorId, reviewId, examId],
    );

    await expectCheckViolation(
      client,
      'review_incomplete_removal',
      'UPDATE "course_reviews" SET "is_removed" = true WHERE "id" = $1',
      [reviewId],
    );
    await expectCheckViolation(
      client,
      'exam_incomplete_removal',
      'UPDATE "exam_experiences" SET "is_removed" = true WHERE "id" = $1',
      [examId],
    );

    for (const target of [
      { table: 'course_reviews', column: 'course_review_id', id: reviewId },
      { table: 'exam_experiences', column: 'exam_experience_id', id: examId },
    ]) {
      await client.query(
        `
          INSERT INTO "community_moderation_actions" (
            "id", "moderator_id", "author_id", "${target.column}",
            "action", "reason"
          ) VALUES (gen_random_uuid(), $1, $2, $3, 'REMOVE', 'Contenido fuera de contexto')
        `,
        [moderatorId, authorId, target.id],
      );
      await client.query(
        `
          UPDATE "${target.table}"
          SET "is_removed" = true,
              "removed_reason" = 'Contenido fuera de contexto',
              "removed_at" = CURRENT_TIMESTAMP,
              "removed_by_id" = $1
          WHERE "id" = $2
        `,
        [moderatorId, target.id],
      );

      const removed = await client.query<{ is_removed: boolean }>(
        `SELECT "is_removed" FROM "${target.table}" WHERE "id" = $1`,
        [target.id],
      );
      if (removed.rows[0].is_removed !== true) {
        throw new Error(`No se removió ${target.table}.`);
      }

      await client.query(
        `
          INSERT INTO "community_moderation_actions" (
            "id", "moderator_id", "author_id", "${target.column}",
            "action", "reason"
          ) VALUES (gen_random_uuid(), $1, $2, $3, 'RESTORE', 'Revisión completada')
        `,
        [moderatorId, authorId, target.id],
      );
      await client.query(
        `
          UPDATE "${target.table}"
          SET "is_removed" = false,
              "removed_reason" = NULL,
              "removed_at" = NULL,
              "removed_by_id" = NULL
          WHERE "id" = $1
        `,
        [target.id],
      );
    }

    const reportCount = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM "community_reports"',
    );
    const actionCount = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM "community_moderation_actions"',
    );
    const restoredTargets = await client.query<{ count: string }>(`
      SELECT (
        (SELECT COUNT(*) FROM "course_reviews" WHERE "is_removed" = false)
        +
        (SELECT COUNT(*) FROM "exam_experiences" WHERE "is_removed" = false)
      )::text AS count
    `);

    if (
      reportCount.rows[0].count !== '2' ||
      actionCount.rows[0].count !== '4' ||
      restoredTargets.rows[0].count !== '2'
    ) {
      throw new Error(
        'Los estados o la evidencia append-only son inesperados.',
      );
    }

    console.log(
      JSON.stringify({
        validReviewReports: 1,
        validExamReports: 1,
        invalidTargetRowsRejected: 4,
        invalidRemovalStatesRejected: 2,
        removeRestoreTargets: 2,
        appendOnlyActions: Number(actionCount.rows[0].count),
      }),
    );
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  }
}

void main();
