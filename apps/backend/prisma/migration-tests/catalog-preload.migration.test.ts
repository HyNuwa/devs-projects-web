import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const migration = '20261014010000_catalog_preload';
const schemaName = uniqueSchemaName('catalog_preload');

const fi = '00000000-0000-4000-8000-00000000f001';
const moderator = '10000000-0000-4000-8000-000000000001';
const student = '10000000-0000-4000-8000-000000000002';
const career = '20000000-0000-4000-8000-000000000001';
const subject = '30000000-0000-4000-8000-000000000001';
const planUrl =
  'https://www.fi.unju.edu.ar/carreras/perfil-alcance/ing-informatica.html';

/** Facultades per universidad in docs/catalogo/FUENTES_PRECARGA.md. */
const facultiesPerUniversity: Record<string, number> = {
  UNJU: 7,
  UNSa: 8,
  UNT: 15,
  UNCA: 8,
  UNSE: 5,
  UBA: 13,
  UNC: 15,
  UNLP: 17,
  UTN: 30,
  UNR: 13,
  UNCuyo: 15,
  UNL: 12,
  UNNE: 12,
};

describe.skipIf(!databaseUrl)(`migration ${migration}`, () => {
  const client = new Client({ connectionString: databaseUrl });

  const counts = async () =>
    (
      await client.query<{
        universities: string;
        faculties: string;
        careers: string;
        scopes: string;
      }>(
        `SELECT (SELECT count(*) FROM "universities") AS universities,
                (SELECT count(*) FROM "faculties") AS faculties,
                (SELECT count(*) FROM "careers") AS careers,
                (SELECT count(*) FROM "moderator_scopes") AS scopes`,
      )
    ).rows[0];

  beforeAll(async () => {
    await client.connect();
    await client.query('BEGIN');
    await applyMigrationsBefore(client, schemaName, migration);
    await client.query(
      `INSERT INTO "users" ("id", "username", "email", "password_hash", "role", "updated_at")
       VALUES ($1, 'mod', 'm@example.com', 'x', 'MODERATOR', CURRENT_TIMESTAMP),
              ($2, 'stu', 's@example.com', 'x', 'USER', CURRENT_TIMESTAMP)`,
      [moderator, student],
    );
    await client.query(
      `INSERT INTO "careers" ("id", "faculty_id", "name", "code", "updated_at")
       VALUES ($1, $2, 'Ingeniería Informática', 'II', CURRENT_TIMESTAMP)`,
      [career, fi],
    );
    await client.query(
      `INSERT INTO "subjects" ("id", "faculty_id", "code", "name", "updated_at")
       VALUES ($1, $2, 'AM1', 'Análisis I', CURRENT_TIMESTAMP)`,
      [subject, fi],
    );
    await applyMigration(client, schemaName, migration);
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('loads the 13 universidades with their reviewed facultades', async () => {
    const { rows } = await client.query<{
      short_name: string;
      faculties: string;
    }>(
      `SELECT u."short_name", count(f."id") AS faculties
       FROM "universities" u LEFT JOIN "faculties" f ON f."university_id" = u."id"
       GROUP BY u."short_name"`,
    );
    expect(
      Object.fromEntries(
        rows.map((row) => [row.short_name, Number(row.faculties)]),
      ),
    ).toEqual(facultiesPerUniversity);
    const named = await client.query(
      `SELECT u."short_name" AS university, f."short_name", f."name"
       FROM "faculties" f JOIN "universities" u ON u."id" = f."university_id"
       WHERE (u."short_name", f."short_name") IN (('UBA', 'FMED'), ('UTN', 'FRTDF'), ('UNCA', 'FCS'), ('UNJU', 'ESS'))
       ORDER BY 1, 2`,
    );
    expect(named.rows).toEqual([
      { university: 'UBA', short_name: 'FMED', name: 'Facultad de Medicina' },
      {
        university: 'UNCA',
        short_name: 'FCS',
        name: 'Facultad de Ciencias de la Salud',
      },
      {
        university: 'UNJU',
        short_name: 'ESS',
        name: 'Escuela Superior de Salud',
      },
      {
        university: 'UTN',
        short_name: 'FRTDF',
        name: 'Facultad Regional Tierra del Fuego',
      },
    ]);
  });

  it('keeps FI-UNJU with its carreras and materias, and gives no other facultad carreras', async () => {
    const { rows } = await client.query(
      `SELECT c."id", c."faculty_id" FROM "careers" c`,
    );
    expect(rows).toEqual([{ id: career, faculty_id: fi }]);
    const subjects = await client.query(
      `SELECT "id", "faculty_id" FROM "subjects"`,
    );
    expect(subjects.rows).toEqual([{ id: subject, faculty_id: fi }]);
    const fiRow = await client.query(
      `SELECT "name", "short_name" FROM "faculties" WHERE "id" = $1`,
      [fi],
    );
    expect(fiRow.rows).toEqual([
      { name: 'Facultad de Ingeniería', short_name: 'FI' },
    ]);
  });

  it('gives every existing moderator FI-UNJU, and nobody else a facultad', async () => {
    const { rows } = await client.query(
      `SELECT "user_id", "faculty_id" FROM "moderator_scopes"`,
    );
    expect(rows).toEqual([{ user_id: moderator, faculty_id: fi }]);
  });

  it('links Ingeniería Informática to its official plan', async () => {
    const { rows } = await client.query(
      `SELECT "plan_url" FROM "careers" WHERE "id" = $1`,
      [career],
    );
    expect(rows).toEqual([{ plan_url: planUrl }]);
  });

  it('duplicates nothing when applied again', async () => {
    const before = await counts();
    await applyMigration(client, schemaName, migration);
    expect(await counts()).toEqual(before);
  });
});
