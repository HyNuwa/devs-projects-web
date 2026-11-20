-- Manual rollback of migrations 20261011000000_institutions and
-- 20261011010000_institutions_trigger_locks. Never applied automatically.
-- Run as one transaction with psql. It aborts if a second facultad exists, because
-- dropping the columns would then lose which facultad each carrera and materia had.
BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM "faculties") > 1 THEN
    RAISE EXCEPTION 'Hay más de una facultad: el rollback perdería datos';
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS "study_plans_career_same_faculty" ON "study_plans";
DROP TRIGGER IF EXISTS "careers_faculty_fixed_with_plans" ON "careers";
DROP TRIGGER IF EXISTS "subjects_faculty_matches_plans" ON "subjects";
DROP TRIGGER IF EXISTS "study_plan_subjects_same_faculty" ON "study_plan_subjects";
DROP FUNCTION IF EXISTS "study_plans_career_same_faculty"();
DROP FUNCTION IF EXISTS "careers_faculty_fixed_with_plans"();
DROP FUNCTION IF EXISTS "subjects_faculty_matches_plans"();
DROP FUNCTION IF EXISTS "study_plan_subjects_same_faculty"();

ALTER TABLE "subjects" DROP CONSTRAINT IF EXISTS "subjects_faculty_id_fkey";
ALTER TABLE "careers" DROP CONSTRAINT IF EXISTS "careers_faculty_id_fkey";
DROP INDEX IF EXISTS "subjects_faculty_id_idx";
DROP INDEX IF EXISTS "careers_faculty_id_code_key";
CREATE UNIQUE INDEX "careers_code_key" ON "careers"("code");

ALTER TABLE "subjects" DROP COLUMN "faculty_id";
ALTER TABLE "careers" DROP COLUMN "faculty_id";

DROP TABLE "faculties";
DROP TABLE "universities";

-- `prisma migrate resolve --rolled-back` only accepts failed migrations, so the
-- history rows are removed by hand; then revert schema.prisma before `migrate deploy`.
DELETE FROM "_prisma_migrations"
WHERE "migration_name" IN ('20261011000000_institutions', '20261011010000_institutions_trigger_locks');

COMMIT;
