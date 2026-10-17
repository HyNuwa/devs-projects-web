-- Rollback for change alcance-por-facultad. Run in one transaction, data part
-- first, then remove both migrations from "_prisma_migrations".
-- The enum value MODERATOR_SCOPE_CHANGED stays: Postgres cannot drop enum
-- values, and an unused value is harmless. Events already recorded with it
-- must be deleted first if the old code has to read the history.

BEGIN;

-- Data migration 20261014010000_catalog_preload. Removes the preloaded
-- facultades and universidades that still have no carreras or materias; FI-UNJU
-- stays. Moderator facultades go first: they restrict deleting a facultad.
-- Plan links go away with the schema part.
DELETE FROM "moderator_scopes";
DELETE FROM "faculties" f
USING "universities" u
WHERE u."id" = f."university_id"
  AND u."short_name" IN ('UNJU', 'UNSa', 'UNT', 'UNCA', 'UNSE', 'UBA', 'UNC', 'UNLP', 'UTN', 'UNR', 'UNCuyo', 'UNL', 'UNNE')
  AND f."id" <> '00000000-0000-4000-8000-00000000f001'
  AND NOT EXISTS (SELECT 1 FROM "careers" c WHERE c."faculty_id" = f."id")
  AND NOT EXISTS (SELECT 1 FROM "subjects" s WHERE s."faculty_id" = f."id");
DELETE FROM "universities" u
WHERE u."short_name" IN ('UNSa', 'UNT', 'UNCA', 'UNSE', 'UBA', 'UNC', 'UNLP', 'UTN', 'UNR', 'UNCuyo', 'UNL', 'UNNE')
  AND NOT EXISTS (SELECT 1 FROM "faculties" f WHERE f."university_id" = u."id");

-- Schema migration 20261014000000_moderator_scopes.
DELETE FROM "moderation_events" WHERE "action" = 'MODERATOR_SCOPE_CHANGED';
DROP INDEX IF EXISTS "careers_faculty_code_lower_key";
DROP INDEX IF EXISTS "faculties_university_short_name_lower_key";
DROP INDEX IF EXISTS "universities_short_name_lower_key";
ALTER TABLE "careers" DROP CONSTRAINT IF EXISTS "careers_plan_url_https";
ALTER TABLE "careers" DROP COLUMN IF EXISTS "plan_url";
DROP INDEX IF EXISTS "study_plans_career_id_key";
DROP INDEX IF EXISTS "subjects_code_key";
DROP TABLE IF EXISTS "moderator_scopes";

DELETE FROM "_prisma_migrations"
WHERE "migration_name" IN ('20261014000000_moderator_scopes', '20261014010000_catalog_preload');

COMMIT;
