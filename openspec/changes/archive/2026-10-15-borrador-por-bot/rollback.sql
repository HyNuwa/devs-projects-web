-- Rollback of 20261020000000_optativas_and_plan_reading.
-- Aborts while any optativa exists: move them to an año or remove them first.
-- The CATALOG_PLAN_READ enum value stays: Postgres cannot drop enum values,
-- and an unused value is harmless.
BEGIN;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "study_plan_subjects" WHERE "year" IS NULL) THEN
    RAISE EXCEPTION 'There are optativas; place or remove them before rolling back.';
  END IF;
END $$;
ALTER TABLE "study_plan_subjects" DROP CONSTRAINT "study_plan_subjects_optativa_check";
ALTER TABLE "study_plan_subjects" ALTER COLUMN "year" SET NOT NULL;
ALTER TABLE "study_plan_subjects" ALTER COLUMN "semester" SET NOT NULL;
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261020000000_optativas_and_plan_reading';
COMMIT;
