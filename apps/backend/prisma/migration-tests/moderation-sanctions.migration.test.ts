import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  applyMigration,
  applyMigrationsBefore,
  uniqueSchemaName,
} from './support/apply-migrations';

const databaseUrl =
  process.env.MIGRATION_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

const migration = '20260930000000_moderation_sanctions';
const schemaName = uniqueSchemaName('moderation_sanctions');

const authorId = '10000000-0000-4000-8000-000000000001';
const moderatorId = '10000000-0000-4000-8000-000000000002';
const subjectId = '20000000-0000-4000-8000-000000000001';
const restoredMaterial = '30000000-0000-4000-8000-000000000001';
const anonymousReview = '40000000-0000-4000-8000-000000000001';
const restoredCase = '50000000-0000-4000-8000-000000000001';
const anonymousCase = '50000000-0000-4000-8000-000000000002';

/** Runs `sql` in a savepoint and returns the Postgres error code it raised, if any. */
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

async function seedPreviousState(client: Client) {
  await client.query(
    `INSERT INTO "users" ("id", "username", "email", "password_hash", "updated_at") VALUES
       ($1, 'autora', 'a@example.com', 'x', CURRENT_TIMESTAMP),
       ($2, 'moderador', 'm@example.com', 'x', CURRENT_TIMESTAMP)`,
    [authorId, moderatorId],
  );
  await client.query(
    `INSERT INTO "subjects" ("id", "name", "updated_at") VALUES ($1, 'Álgebra', CURRENT_TIMESTAMP)`,
    [subjectId],
  );
  // A material retired and later restored through its caso.
  await client.query(
    `INSERT INTO "materials" ("id", "title", "file_url", "file_type", "file_size", "author_id",
       "subject_id", "publication_status", "updated_at")
     VALUES ($1, 'Parcial', 'https://example.com/f.pdf', 'pdf', 10, $2, $3, 'PUBLISHED', CURRENT_TIMESTAMP)`,
    [restoredMaterial, authorId, subjectId],
  );
  // An anonymous reseña that stays retired.
  await client.query(
    `INSERT INTO "course_reviews" ("id", "user_id", "subject_id", "recommendation", "is_anonymous",
       "publication_status", "updated_at")
     VALUES ($1, $2, $3, 2, true, 'REMOVED', CURRENT_TIMESTAMP)`,
    [anonymousReview, authorId, subjectId],
  );
  await client.query(
    `INSERT INTO "moderation_cases" ("id", "kind", "status", "target_type", "material_id",
       "closed_at", "decision", "decided_by_id", "decision_reason")
     VALUES ($1, 'REPORTS', 'CLOSED', 'MATERIAL', $2, '2026-09-10', 'REMOVE', $3, 'Datos personales')`,
    [restoredCase, restoredMaterial, moderatorId],
  );
  await client.query(
    `INSERT INTO "moderation_cases" ("id", "kind", "status", "target_type", "course_review_id",
       "closed_at", "decision", "decided_by_id", "decision_reason")
     VALUES ($1, 'REPORTS', 'CLOSED', 'COURSE_REVIEW', $2, '2026-09-12', 'REMOVE', $3, 'Insultos')`,
    [anonymousCase, anonymousReview, moderatorId],
  );
  await client.query(
    `INSERT INTO "moderation_events" ("id", "actor_id", "action", "target_type", "material_id",
       "target_user_id", "case_id", "reason", "created_at")
     VALUES (gen_random_uuid(), $1, 'RESTORED', 'MATERIAL', $2, $3, $4, 'Error', '2026-09-11 10:00:00')`,
    [moderatorId, restoredMaterial, authorId, restoredCase],
  );
}

describe.skipIf(!databaseUrl)(`migration ${migration}`, () => {
  const client = new Client({ connectionString: databaseUrl });

  beforeAll(async () => {
    await client.connect();
    await client.query('BEGIN');
    await applyMigrationsBefore(client, schemaName, migration);
    await seedPreviousState(client);
    await applyMigration(client, schemaName, migration);
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('backfills the author of every caso, including anonymous content', async () => {
    const { rows } = await client.query<{
      id: string;
      target_author_id: string;
    }>(`SELECT "id", "target_author_id" FROM "moderation_cases" ORDER BY "id"`);

    expect(rows).toEqual([
      { id: restoredCase, target_author_id: authorId },
      { id: anonymousCase, target_author_id: authorId },
    ]);
  });

  it('marks a retiro restored through its caso as reverted, and leaves live retiros alone', async () => {
    // Compared in SQL: node-pg reads timestamps without a zone as local time.
    const { rows } = await client.query<{
      id: string;
      reverted_at: string | null;
    }>(
      `SELECT "id", to_char("reverted_at", 'YYYY-MM-DD HH24:MI') AS "reverted_at"
       FROM "moderation_cases" ORDER BY "id"`,
    );

    expect(rows).toEqual([
      { id: restoredCase, reverted_at: '2026-09-11 10:00' },
      { id: anonymousCase, reverted_at: null },
    ]);
  });

  it('allows only one appeal per decision', async () => {
    const insertAppeal = `INSERT INTO "appeals" ("id", "appellant_id", "kind", "case_id", "explanation", "decided_by_id")
      VALUES (gen_random_uuid(), $1, 'RETIRO', $2, 'No es lo que dicen', $3)`;
    await client.query(insertAppeal, [authorId, anonymousCase, moderatorId]);

    expect(
      await sqlErrorCode(client, insertAppeal, [
        authorId,
        anonymousCase,
        moderatorId,
      ]),
    ).toBe('23505');
  });

  it('requires an appeal to target exactly one decision', async () => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO "sanctions" ("id", "user_id", "type", "reason", "applied_by_id")
       VALUES (gen_random_uuid(), $1, 'WARNING', 'Insultos', $2) RETURNING "id"`,
      [authorId, moderatorId],
    );

    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "appeals" ("id", "appellant_id", "kind", "case_id", "sanction_id", "explanation", "decided_by_id")
         VALUES (gen_random_uuid(), $1, 'SANCTION', $2, $3, 'x', $4)`,
        [authorId, restoredCase, rows[0].id, moderatorId],
      ),
    ).toBe('23514');
    expect(
      await sqlErrorCode(
        client,
        `INSERT INTO "appeals" ("id", "appellant_id", "kind", "explanation", "decided_by_id")
         VALUES (gen_random_uuid(), $1, 'SANCTION', 'x', $2)`,
        [authorId, moderatorId],
      ),
    ).toBe('23514');
  });

  it('keeps at most one pending suspension proposal per account', async () => {
    const propose = `INSERT INTO "suspension_proposals" ("id", "user_id", "proposed_by_id", "reason", "duration_days")
      VALUES (gen_random_uuid(), $1, $2, 'Reincide', 30)`;
    await client.query(propose, [authorId, moderatorId]);

    expect(await sqlErrorCode(client, propose, [authorId, moderatorId])).toBe(
      '23505',
    );
  });

  it('leaves every account without an active sanction', async () => {
    const { rows } = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM "users"
       WHERE "is_banned" OR "banned_until" IS NOT NULL OR "muted_until" IS NOT NULL`,
    );

    expect(rows[0].count).toBe('0');
  });
});
