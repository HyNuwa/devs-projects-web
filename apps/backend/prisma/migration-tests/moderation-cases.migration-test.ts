import { Client } from 'pg';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Define MIGRATION_TEST_DATABASE_URL o DATABASE_URL para ejecutar la prueba de migración.',
  );
}

const migration = '20260929010000_moderation_cases';
const schemaName = uniqueSchemaName('moderation_cases');

const authorId = '10000000-0000-4000-8000-000000000001';
const moderatorId = '10000000-0000-4000-8000-000000000002';
const reporterA = '10000000-0000-4000-8000-000000000003';
const reporterB = '10000000-0000-4000-8000-000000000004';
const subjectId = '20000000-0000-4000-8000-000000000001';
const pendingMaterial = '30000000-0000-4000-8000-000000000001';
const publishedMaterial = '30000000-0000-4000-8000-000000000002';
const visibleReview = '40000000-0000-4000-8000-000000000001';
const removedReview = '40000000-0000-4000-8000-000000000002';

function expectEqual(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: se esperaba ${JSON.stringify(expected)} y se recibió ${JSON.stringify(actual)}.`,
    );
  }
}

async function expectSqlError(
  client: Client,
  label: string,
  expectedCode: string,
  sql: string,
  values: unknown[] = [],
) {
  const savepoint = `sp_${Math.random().toString(16).slice(2, 10)}`;
  await client.query(`SAVEPOINT ${savepoint}`);
  let code: string | undefined;
  try {
    await client.query(sql, values);
  } catch (error) {
    code = (error as { code?: string }).code;
  }
  await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
  expectEqual(label, code, expectedCode);
}

async function seedPreviousState(client: Client) {
  await client.query(
    `INSERT INTO "users" ("id", "username", "email", "password_hash", "updated_at") VALUES
       ($1, 'autora', 'a@example.com', 'x', CURRENT_TIMESTAMP),
       ($2, 'moderador', 'm@example.com', 'x', CURRENT_TIMESTAMP),
       ($3, 'reporta1', 'r1@example.com', 'x', CURRENT_TIMESTAMP),
       ($4, 'reporta2', 'r2@example.com', 'x', CURRENT_TIMESTAMP)`,
    [authorId, moderatorId, reporterA, reporterB],
  );
  await client.query(
    `INSERT INTO "subjects" ("id", "name", "updated_at") VALUES ($1, 'Álgebra', CURRENT_TIMESTAMP)`,
    [subjectId],
  );
  const insertMaterial = `
    INSERT INTO "materials" ("id", "title", "file_url", "file_type", "file_size", "author_id",
      "subject_id", "publication_status", "updated_at")
    VALUES ($1, $2, 'https://example.com/f.pdf', 'pdf', 10, $3, $4, $5, CURRENT_TIMESTAMP)`;
  await client.query(insertMaterial, [
    pendingMaterial,
    'Pendiente',
    authorId,
    subjectId,
    'PENDING_REVIEW',
  ]);
  await client.query(insertMaterial, [
    publishedMaterial,
    'Publicado',
    authorId,
    subjectId,
    'PUBLISHED',
  ]);

  const insertReview = `
    INSERT INTO "course_reviews" ("id", "user_id", "subject_id", "recommendation",
      "publication_status", "author_facing_reason", "updated_at")
    VALUES ($1, $2, $3, 4, $4, $5, CURRENT_TIMESTAMP)`;
  await client.query(insertReview, [
    visibleReview,
    authorId,
    subjectId,
    'PUBLISHED',
    null,
  ]);
  await client.query(insertReview, [
    removedReview,
    authorId,
    subjectId,
    'REMOVED',
    'Ataca a una persona',
  ]);

  const insertReport = `
    INSERT INTO "community_reports" ("id", "reporter_id", "course_review_id", "reason", "updated_at")
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`;
  await client.query(insertReport, [
    '60000000-0000-4000-8000-000000000001',
    reporterA,
    visibleReview,
    'INSULTOS_O_ACOSO',
  ]);
  await client.query(insertReport, [
    '60000000-0000-4000-8000-000000000002',
    reporterB,
    visibleReview,
    'POSIBLEMENTE_ENGANOSO',
  ]);
  await client.query(insertReport, [
    '60000000-0000-4000-8000-000000000003',
    reporterA,
    removedReview,
    'INSULTOS_O_ACOSO',
  ]);

  await client.query(
    `INSERT INTO "community_moderation_actions" ("id", "moderator_id", "author_id", "course_review_id",
       "action", "reason")
     VALUES ('70000000-0000-4000-8000-000000000001', $1, $2, $3, 'REMOVE', 'Ataca a una persona')`,
    [moderatorId, authorId, removedReview],
  );
  await client.query(
    `INSERT INTO "moderation_logs" ("id", "moderator_id", "target_material_id", "action", "reason") VALUES
       ('80000000-0000-4000-8000-000000000001', $1, $2, 'APPROVE_MATERIAL', NULL),
       ('80000000-0000-4000-8000-000000000002', $1, NULL, 'BAN_USER', 'Spam')`,
    [moderatorId, publishedMaterial],
  );
}

async function one<T>(client: Client, sql: string, values: unknown[] = []) {
  const { rows } = await client.query(sql, values);
  return rows[0] as T;
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('BEGIN');
    await applyMigrationsBefore(client, schemaName, migration);
    await seedPreviousState(client);
    await applyMigration(client, schemaName, migration);

    const openCase = await one<{
      status: string;
      kind: string;
      reports: string;
      open_reports: string;
    }>(
      client,
      `SELECT c."status"::text, c."kind"::text,
              count(r.*)::text AS reports,
              count(r.*) FILTER (WHERE r."status" = 'OPEN')::text AS open_reports
       FROM "moderation_cases" c JOIN "reports" r ON r."case_id" = c."id"
       WHERE c."course_review_id" = $1 GROUP BY c."id"`,
      [visibleReview],
    );
    expectEqual('caso de reseña visible', openCase, {
      status: 'OPEN',
      kind: 'REPORTS',
      reports: '2',
      open_reports: '2',
    });

    const closedCase = await one<{
      status: string;
      decision: string;
      report_status: string;
    }>(
      client,
      `SELECT c."status"::text, c."decision"::text, r."status"::text AS report_status
       FROM "moderation_cases" c JOIN "reports" r ON r."case_id" = c."id"
       WHERE c."course_review_id" = $1`,
      [removedReview],
    );
    expectEqual('caso de reseña retirada', closedCase, {
      status: 'CLOSED',
      decision: 'REMOVE',
      report_status: 'CONFIRMED',
    });

    const priorReview = await one<{ kind: string; status: string }>(
      client,
      `SELECT "kind"::text, "status"::text FROM "moderation_cases" WHERE "material_id" = $1`,
      [pendingMaterial],
    );
    expectEqual('revisión previa migrada', priorReview, {
      kind: 'PRIOR_REVIEW',
      status: 'OPEN',
    });

    const events = await client.query(
      `SELECT "action"::text, "reason", "metadata"->>'legacyAction' AS legacy
       FROM "moderation_events" ORDER BY "action"`,
    );
    expectEqual('eventos migrados', events.rows, [
      { action: 'LEGACY_ACTION', reason: 'Spam', legacy: 'BAN_USER' },
      { action: 'PRIOR_REVIEW_APPROVED', reason: null, legacy: null },
      { action: 'REMOVED', reason: 'Ataca a una persona', legacy: null },
    ]);

    const oldTables = await one<{ count: string }>(
      client,
      `SELECT count(*)::text FROM information_schema.tables
       WHERE table_schema = $1 AND table_name IN ('community_reports', 'community_moderation_actions', 'moderation_logs')`,
      [schemaName],
    );
    expectEqual('tablas viejas eliminadas', oldTables.count, '0');

    await expectSqlError(
      client,
      'segundo caso abierto',
      '23505',
      `INSERT INTO "moderation_cases" ("id", "kind", "status", "target_type", "course_review_id")
       VALUES ('90000000-0000-4000-8000-000000000001', 'REPORTS', 'OPEN', 'COURSE_REVIEW', $1)`,
      [visibleReview],
    );
    await expectSqlError(
      client,
      'caso sin destino',
      '23514',
      `INSERT INTO "moderation_cases" ("id", "kind", "status", "target_type")
       VALUES ('90000000-0000-4000-8000-000000000002', 'REPORTS', 'OPEN', 'MATERIAL')`,
    );
    await expectSqlError(
      client,
      'tipo de destino inconsistente',
      '23514',
      `INSERT INTO "moderation_cases" ("id", "kind", "status", "target_type", "material_id")
       VALUES ('90000000-0000-4000-8000-000000000003', 'REPORTS', 'OPEN', 'COURSE_REVIEW', $1)`,
      [publishedMaterial],
    );
    const caseId = (
      await one<{ id: string }>(
        client,
        `SELECT "id" FROM "moderation_cases" WHERE "course_review_id" = $1 AND "status" = 'OPEN'`,
        [visibleReview],
      )
    ).id;
    await expectSqlError(
      client,
      'reporte repetido',
      '23505',
      `INSERT INTO "reports" ("id", "case_id", "reporter_id", "reason", "status", "target_type", "course_review_id")
       VALUES ('91000000-0000-4000-8000-000000000001', $1, $2, 'OTRO', 'OPEN', 'COURSE_REVIEW', $3)`,
      [caseId, reporterA, visibleReview],
    );
    await expectSqlError(
      client,
      'editar historial',
      'P0001',
      `UPDATE "moderation_events" SET "reason" = 'x'`,
    );
    await expectSqlError(
      client,
      'borrar historial',
      'P0001',
      `DELETE FROM "moderation_events"`,
    );

    await client.query(`DELETE FROM "course_reviews" WHERE "id" = $1`, [
      removedReview,
    ]);
    const survivingEvents = await one<{ count: string }>(
      client,
      `SELECT count(*)::text FROM "moderation_events"`,
    );
    expectEqual(
      'el historial sobrevive al borrado del contenido',
      survivingEvents.count,
      '3',
    );

    console.log(
      JSON.stringify({
        migration,
        cases: 3,
        constraintsChecked: 6,
        appendOnly: true,
      }),
    );
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
