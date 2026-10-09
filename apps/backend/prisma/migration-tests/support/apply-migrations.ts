import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Client } from 'pg';

const migrationsDirectory = resolve(process.cwd(), 'prisma/migrations');

async function migrationNames() {
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function migrationSql(name: string, schemaName: string) {
  const sql = await readFile(
    resolve(migrationsDirectory, name, 'migration.sql'),
    'utf8',
  );
  // Older migrations qualify some statements with "public" and wrap enum changes in
  // their own BEGIN/COMMIT. Keep everything inside the caller's transaction and the
  // throwaway schema so the test never touches real tables.
  return sql
    .replaceAll('"public".', `"${schemaName}".`)
    .replace(/^\s*(BEGIN|COMMIT);\s*$/gim, '');
}

/**
 * Creates `schemaName`, points the transaction's search_path at it and applies every
 * migration that sorts before `targetMigration`. Callers run inside BEGIN/ROLLBACK.
 */
export async function applyMigrationsBefore(
  client: Client,
  schemaName: string,
  targetMigration: string,
) {
  const names = await migrationNames();
  if (!names.includes(targetMigration)) {
    throw new Error(`No existe la migración ${targetMigration}.`);
  }

  await client.query(`CREATE SCHEMA "${schemaName}"`);
  await client.query(`SET LOCAL search_path TO "${schemaName}"`);

  for (const name of names.filter((candidate) => candidate < targetMigration)) {
    await client.query(await migrationSql(name, schemaName));
  }
}

export async function applyMigration(
  client: Client,
  schemaName: string,
  migration: string,
) {
  await client.query(await migrationSql(migration, schemaName));
}

export function uniqueSchemaName(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}
