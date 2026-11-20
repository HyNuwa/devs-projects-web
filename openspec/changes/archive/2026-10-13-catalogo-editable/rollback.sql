-- Rollback for change catalogo-editable. Run in one transaction.
-- It aborts when the change already left data the old schema cannot hold or the
-- append-only history would lose: materia codes longer than 20 characters,
-- anual placements, or catálogo events. The new ModerationEventAction values
-- stay: Postgres cannot drop enum values, and an unused value is harmless.
-- Carreras en borrador become public after the rollback, since the old code
-- has no borrador; delete them first if they must stay hidden.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "subjects" WHERE length("code") > 20) THEN
    RAISE EXCEPTION 'Hay códigos de materia de más de 20 caracteres.';
  END IF;
  IF EXISTS (SELECT 1 FROM "study_plan_subjects" WHERE "semester" = 0) THEN
    RAISE EXCEPTION 'Hay materias anuales.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "moderation_events"
    WHERE "action"::text IN (
      'CATALOG_CREATED', 'CATALOG_UPDATED', 'CATALOG_DELETED', 'CAREER_PUBLISHED',
      'CAREER_UNPUBLISHED', 'CATALOG_PLACEMENT_CHANGED', 'CATALOG_BULK_APPLIED',
      'CAREER_REQUEST_RESOLVED'
    )
  ) THEN
    RAISE EXCEPTION 'El historial ya tiene eventos del catálogo.';
  END IF;
END $$;

DROP TABLE IF EXISTS "career_request_supporters";
DROP TABLE IF EXISTS "career_requests";
DROP TYPE IF EXISTS "CareerRequestStatus";
DROP TABLE IF EXISTS "catalog_slug_aliases";
DROP TYPE IF EXISTS "CatalogSlugKind";

ALTER TABLE "subjects" DROP CONSTRAINT IF EXISTS "subjects_code_slug";
ALTER TABLE "careers" DROP CONSTRAINT IF EXISTS "careers_code_slug";
ALTER TABLE "faculties" DROP CONSTRAINT IF EXISTS "faculties_short_name_slug";
ALTER TABLE "universities" DROP CONSTRAINT IF EXISTS "universities_short_name_slug";
ALTER TABLE "subjects" ALTER COLUMN "code" TYPE VARCHAR(20);
ALTER TABLE "study_plan_subjects" DROP CONSTRAINT IF EXISTS "study_plan_subjects_semester_check";
ALTER TABLE "careers" DROP COLUMN IF EXISTS "status";
DROP TYPE IF EXISTS "CareerStatus";

DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261015000000_catalog_editing';

COMMIT;
