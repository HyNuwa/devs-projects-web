import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';
import {
  applySearchKeyBackfill,
  planSearchKeyBackfill,
  summarizeSearchKeyBackfill,
} from '../backfills/search-key-backfill';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Define MIGRATION_TEST_DATABASE_URL o DATABASE_URL para ejecutar la prueba de migración.',
  );
}

const schemaName = `material_context_${Date.now()}_${Math.random()
  .toString(16)
  .slice(2, 10)}`;
const migrationPath = resolve(
  process.cwd(),
  'prisma/migrations/20260828090000_add_material_context_and_interactions/migration.sql',
);

const userId = '10000000-0000-4000-8000-000000000001';
const subjectId = '20000000-0000-4000-8000-000000000001';
const materialId = '30000000-0000-4000-8000-000000000001';

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    await client.query(`SET LOCAL search_path TO "${schemaName}", public`);

    await client.query(`
      CREATE TYPE "Shift" AS ENUM ('MANANA', 'TARDE', 'NOCHE', 'NO_INDICO');
      CREATE TYPE "MaterialModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY
      );

      CREATE TABLE "subjects" (
        "id" UUID PRIMARY KEY,
        "code" VARCHAR(20),
        "name" VARCHAR(150) NOT NULL,
        "material_count" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE "professors" (
        "id" UUID PRIMARY KEY,
        "name" VARCHAR(150) NOT NULL
      );

      CREATE TABLE "materials" (
        "id" UUID PRIMARY KEY,
        "title" VARCHAR(200) NOT NULL,
        "author_id" UUID NOT NULL REFERENCES "users"("id"),
        "subject_id" UUID NOT NULL REFERENCES "subjects"("id"),
        "moderation_status" "MaterialModerationStatus" NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO "users" ("id") VALUES ('${userId}');
      INSERT INTO "subjects" ("id", "code", "name")
      VALUES ('${subjectId}', 'ED-01', 'Estructura de Datos');
      INSERT INTO "materials" (
        "id", "title", "author_id", "subject_id", "moderation_status"
      ) VALUES (
        '${materialId}',
        'Árboles y grafos',
        '${userId}',
        '${subjectId}',
        'APPROVED'
      );
    `);

    const migrationSql = await readFile(migrationPath, 'utf8');
    await client.query(migrationSql);

    const preserved = await client.query<{
      id: string;
      title: string;
      moderation_status: string;
      resource_type: string;
      academic_year: number | null;
      professor_id: string | null;
      shift: string | null;
      search_key: string;
    }>(`
      SELECT
        "id",
        "title",
        "moderation_status",
        "resource_type",
        "academic_year",
        "professor_id",
        "shift",
        "search_key"
      FROM "materials"
      WHERE "id" = '${materialId}'
    `);

    const row = preserved.rows[0];
    if (
      preserved.rowCount !== 1 ||
      row.id !== materialId ||
      row.title !== 'Árboles y grafos' ||
      row.moderation_status !== 'APPROVED' ||
      row.resource_type !== 'OTRO' ||
      row.academic_year !== null ||
      row.professor_id !== null ||
      row.shift !== null ||
      row.search_key !== ''
    ) {
      throw new Error(
        `La migración no preservó el material o inventó contexto: ${JSON.stringify(row)}`,
      );
    }

    const dryRunPlan = await planSearchKeyBackfill(client);
    const dryRunSummary = summarizeSearchKeyBackfill(dryRunPlan);
    if (
      dryRunSummary.subjectsScanned !== 1 ||
      dryRunSummary.subjectUpdates !== 1 ||
      dryRunSummary.materialsScanned !== 1 ||
      dryRunSummary.materialUpdates !== 1
    ) {
      throw new Error(
        `El dry-run del backfill informó conteos inesperados: ${JSON.stringify(dryRunSummary)}`,
      );
    }

    const beforeApply = await client.query<{
      subject_search_key: string;
      material_search_key: string;
    }>(`
      SELECT
        (SELECT "search_key" FROM "subjects" WHERE "id" = '${subjectId}') AS "subject_search_key",
        (SELECT "search_key" FROM "materials" WHERE "id" = '${materialId}') AS "material_search_key"
    `);
    if (
      beforeApply.rows[0].subject_search_key !== '' ||
      beforeApply.rows[0].material_search_key !== ''
    ) {
      throw new Error('El dry-run modificó claves de búsqueda.');
    }

    await applySearchKeyBackfill(client, dryRunPlan);

    const afterApply = await client.query<{
      subject_search_key: string;
      material_search_key: string;
    }>(`
      SELECT
        (SELECT "search_key" FROM "subjects" WHERE "id" = '${subjectId}') AS "subject_search_key",
        (SELECT "search_key" FROM "materials" WHERE "id" = '${materialId}') AS "material_search_key"
    `);
    if (
      afterApply.rows[0].subject_search_key !== 'estructura de datos ed-01' ||
      afterApply.rows[0].material_search_key !== 'arboles y grafos'
    ) {
      throw new Error(
        `El write path del backfill produjo claves inesperadas: ${JSON.stringify(afterApply.rows[0])}`,
      );
    }

    const constraints = await client.query<{ conname: string }>(
      `
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = $1
      `,
      [schemaName],
    );
    const constraintNames = new Set(
      constraints.rows.map(({ conname }) => conname),
    );
    for (const expected of [
      'materials_professor_id_fkey',
      'material_helpfulness_user_id_fkey',
      'material_helpfulness_material_id_fkey',
      'saved_materials_user_id_fkey',
      'saved_materials_material_id_fkey',
    ]) {
      if (!constraintNames.has(expected)) {
        throw new Error(`Falta la restricción ${expected}`);
      }
    }

    const indexes = await client.query<{ indexname: string }>(
      'SELECT indexname FROM pg_indexes WHERE schemaname = $1',
      [schemaName],
    );
    const indexNames = new Set(indexes.rows.map(({ indexname }) => indexname));
    for (const expected of [
      'materials_subject_resource_status_created_idx',
      'material_helpfulness_user_id_material_id_key',
      'saved_materials_user_id_material_id_key',
    ]) {
      if (!indexNames.has(expected)) {
        throw new Error(`Falta el índice ${expected}`);
      }
    }

    console.log(
      JSON.stringify({
        existingMaterials: preserved.rowCount,
        resourceTypeBackfill: row.resource_type,
        optionalContext: 'NULL',
        foreignKeysChecked: 5,
        requiredIndexesChecked: 3,
        dryRun: dryRunSummary,
        backfillAppliedAfterDryRun: true,
      }),
    );
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  }
}

void main();
