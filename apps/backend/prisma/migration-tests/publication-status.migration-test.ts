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

const migration = '20260929000000_publication_status';
const schemaName = uniqueSchemaName('publication_status');

const authorId = '10000000-0000-4000-8000-000000000001';
const moderatorId = '10000000-0000-4000-8000-000000000002';
const subjectId = '20000000-0000-4000-8000-000000000001';
const material = {
  approved: '30000000-0000-4000-8000-000000000001',
  pending: '30000000-0000-4000-8000-000000000002',
  rejected: '30000000-0000-4000-8000-000000000003',
  removed: '30000000-0000-4000-8000-000000000004',
};
const review = {
  visible: '40000000-0000-4000-8000-000000000001',
  removed: '40000000-0000-4000-8000-000000000002',
};
const exam = {
  visible: '50000000-0000-4000-8000-000000000001',
  removed: '50000000-0000-4000-8000-000000000002',
};
const removedAt = '2026-09-20 12:00:00';

function expectEqual(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: se esperaba ${JSON.stringify(expected)} y se recibió ${JSON.stringify(actual)}.`,
    );
  }
}

async function seedPreviousState(client: Client) {
  await client.query(
    `
      INSERT INTO "users" ("id", "username", "email", "password_hash", "updated_at") VALUES
        ($1, 'autora', 'autora@example.com', 'x', CURRENT_TIMESTAMP),
        ($2, 'moderador', 'moderador@example.com', 'x', CURRENT_TIMESTAMP);
      `,
    [authorId, moderatorId],
  );
  await client.query(
    `INSERT INTO "subjects" ("id", "name", "updated_at") VALUES ($1, 'Álgebra', CURRENT_TIMESTAMP)`,
    [subjectId],
  );

  const insertMaterial = `
    INSERT INTO "materials" (
      "id", "title", "file_url", "file_type", "file_size", "author_id", "subject_id",
      "moderation_status", "moderation_reason", "is_approved", "is_removed", "updated_at"
    ) VALUES ($1, $2, 'https://example.com/f.pdf', 'pdf', 10, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
  `;
  await client.query(insertMaterial, [
    material.approved,
    'Aprobado',
    authorId,
    subjectId,
    'APPROVED',
    null,
    true,
    false,
  ]);
  await client.query(insertMaterial, [
    material.pending,
    'Pendiente',
    authorId,
    subjectId,
    'PENDING',
    null,
    false,
    false,
  ]);
  await client.query(insertMaterial, [
    material.rejected,
    'Rechazado',
    authorId,
    subjectId,
    'REJECTED',
    'Tiene datos personales',
    false,
    false,
  ]);
  await client.query(insertMaterial, [
    material.removed,
    'Retirado',
    authorId,
    subjectId,
    'APPROVED',
    null,
    true,
    true,
  ]);

  const insertReview = `
    INSERT INTO "course_reviews" (
      "id", "user_id", "subject_id", "recommendation", "is_removed", "removed_reason",
      "removed_at", "removed_by_id", "updated_at"
    ) VALUES ($1, $2, $3, 4, $4, $5, $6, $7, CURRENT_TIMESTAMP)
  `;
  await client.query(insertReview, [
    review.visible,
    authorId,
    subjectId,
    false,
    null,
    null,
    null,
  ]);
  await client.query(insertReview, [
    review.removed,
    authorId,
    subjectId,
    true,
    'Ataca a una persona',
    removedAt,
    moderatorId,
  ]);

  const insertExam = `
    INSERT INTO "exam_experiences" (
      "id", "user_id", "subject_id", "year", "format", "is_removed", "removed_reason",
      "removed_at", "removed_by_id", "updated_at"
    ) VALUES ($1, $2, $3, 2025, 'ESCRITO', $4, $5, $6, $7, CURRENT_TIMESTAMP)
  `;
  await client.query(insertExam, [
    exam.visible,
    authorId,
    subjectId,
    false,
    null,
    null,
    null,
  ]);
  await client.query(insertExam, [
    exam.removed,
    authorId,
    subjectId,
    true,
    'Datos personales',
    removedAt,
    moderatorId,
  ]);
}

async function statusOf(client: Client, table: string, id: string) {
  const { rows } = await client.query(
    `SELECT "publication_status"::text AS status, "author_facing_reason" AS reason,
            to_char("status_changed_at", 'YYYY-MM-DD HH24:MI:SS') AS changed FROM "${table}" WHERE "id" = $1`,
    [id],
  );
  return rows[0] as { status: string; reason: string | null; changed: string };
}

async function columnsOf(client: Client, table: string) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
    [schemaName, table],
  );
  return new Set(rows.map((row: { column_name: string }) => row.column_name));
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('BEGIN');
    await applyMigrationsBefore(client, schemaName, migration);
    await seedPreviousState(client);
    await applyMigration(client, schemaName, migration);

    const mapped = {
      approved: await statusOf(client, 'materials', material.approved),
      pending: await statusOf(client, 'materials', material.pending),
      rejected: await statusOf(client, 'materials', material.rejected),
      removedMaterial: await statusOf(client, 'materials', material.removed),
      visibleReview: await statusOf(client, 'course_reviews', review.visible),
      removedReview: await statusOf(client, 'course_reviews', review.removed),
      visibleExam: await statusOf(client, 'exam_experiences', exam.visible),
      removedExam: await statusOf(client, 'exam_experiences', exam.removed),
    };

    expectEqual('material aprobado', mapped.approved.status, 'PUBLISHED');
    expectEqual('material pendiente', mapped.pending.status, 'PENDING_REVIEW');
    expectEqual(
      'material rechazado',
      [mapped.rejected.status, mapped.rejected.reason],
      ['REJECTED', 'Tiene datos personales'],
    );
    expectEqual('material retirado', mapped.removedMaterial.status, 'REMOVED');
    expectEqual(
      'reseña visible',
      [mapped.visibleReview.status, mapped.visibleReview.reason],
      ['PUBLISHED', null],
    );
    expectEqual(
      'reseña retirada',
      [mapped.removedReview.status, mapped.removedReview.reason],
      ['REMOVED', 'Ataca a una persona'],
    );
    expectEqual('fecha del retiro', mapped.removedReview.changed, removedAt);
    expectEqual('experiencia visible', mapped.visibleExam.status, 'PUBLISHED');
    expectEqual(
      'experiencia retirada',
      [mapped.removedExam.status, mapped.removedExam.reason],
      ['REMOVED', 'Datos personales'],
    );

    const materialColumns = await columnsOf(client, 'materials');
    for (const dropped of [
      'moderation_status',
      'moderation_reason',
      'is_approved',
      'is_removed',
    ]) {
      expectEqual(
        `materials.${dropped} eliminada`,
        materialColumns.has(dropped),
        false,
      );
    }
    expectEqual('materials.file_hash', materialColumns.has('file_hash'), true);
    for (const table of ['course_reviews', 'exam_experiences']) {
      const columns = await columnsOf(client, table);
      for (const dropped of [
        'is_removed',
        'removed_at',
        'removed_by_id',
        'removed_reason',
      ]) {
        expectEqual(
          `${table}.${dropped} eliminada`,
          columns.has(dropped),
          false,
        );
      }
      expectEqual(`${table}.hidden_at`, columns.has('hidden_at'), true);
    }

    await client.query(
      `INSERT INTO "materials" ("id", "title", "file_url", "file_type", "file_size", "author_id", "subject_id", "updated_at")
       VALUES ('30000000-0000-4000-8000-000000000009', 'Nuevo', 'https://example.com/n.pdf', 'pdf', 1, $1, $2, CURRENT_TIMESTAMP)`,
      [authorId, subjectId],
    );
    const fresh = await statusOf(
      client,
      'materials',
      '30000000-0000-4000-8000-000000000009',
    );
    expectEqual('estado por defecto', fresh.status, 'PUBLISHED');

    console.log(
      JSON.stringify({
        migration,
        mappedRows: 8,
        droppedColumnsChecked: 12,
        defaultStatus: fresh.status,
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
