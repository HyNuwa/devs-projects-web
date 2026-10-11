-- Rollback for change privilegios-confianza (migrations 20261013000000_trust_privileges and 20261013010000_role_changed_event).
-- Run inside a transaction:  psql "$DATABASE_URL" -1 -f rollback.sql
-- Postgres cannot drop one enum value, so PointReason is rebuilt without
-- CORRECTION_ACCEPTED, and the script aborts if any movimiento uses it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "point_transactions" WHERE "reason"::text = 'CORRECTION_ACCEPTED') THEN
    RAISE EXCEPTION 'There are CORRECTION_ACCEPTED movimientos; reverse or delete them before rolling back.';
  END IF;
END $$;

DROP TABLE IF EXISTS "correction_suggestions";
DROP TYPE IF EXISTS "CorrectionField";
DROP TYPE IF EXISTS "CorrectionStatus";
DROP TYPE IF EXISTS "CorrectionDecider";
DROP TYPE IF EXISTS "CorrectionClosedReason";
ALTER TABLE "reports" DROP COLUMN IF EXISTS "priority";

DELETE FROM "user_badges" WHERE "badge_id" IN (SELECT "id" FROM "badges" WHERE "slug" = 'lupa');
DELETE FROM "badges" WHERE "slug" = 'lupa';
UPDATE "badges" SET "sort_order" = 17 WHERE "slug" = 'primera-camada';

ALTER TYPE "PointReason" RENAME TO "PointReason_old";
CREATE TYPE "PointReason" AS ENUM ('MATERIAL_PUBLISHED', 'MATERIAL_PIONEER', 'HELPFUL_RECEIVED', 'COURSE_REVIEWED', 'EXAM_EXPERIENCE_SHARED', 'REPORT_CONFIRMED', 'GUIDE_CREATED', 'LEGACY_ADJUSTMENT');
ALTER TABLE "point_transactions" ALTER COLUMN "reason" TYPE "PointReason" USING "reason"::text::"PointReason";
DROP TYPE "PointReason_old";

-- The moderation history is append-only: if any role change was recorded,
-- the enum value must stay and the rollback stops here.
DO $$
DECLARE labels text;
BEGIN
  IF EXISTS (SELECT 1 FROM "moderation_events" WHERE "action"::text = 'ROLE_CHANGED') THEN
    RAISE EXCEPTION 'The moderation history records role changes; it is append-only, so ROLE_CHANGED cannot be dropped.';
  END IF;
  SELECT string_agg(quote_literal(label), ', ' ORDER BY sort)
    INTO labels
    FROM (SELECT e.enumlabel AS label, e.enumsortorder AS sort
            FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
           WHERE t.typname = 'ModerationEventAction' AND e.enumlabel <> 'ROLE_CHANGED') AS kept;
  ALTER TYPE "ModerationEventAction" RENAME TO "ModerationEventAction_old";
  EXECUTE 'CREATE TYPE "ModerationEventAction" AS ENUM (' || labels || ')';
  ALTER TABLE "moderation_events"
    ALTER COLUMN "action" TYPE "ModerationEventAction" USING "action"::text::"ModerationEventAction";
  DROP TYPE "ModerationEventAction_old";
END $$;

-- Prisma only accepts `migrate resolve --rolled-back` for failed migrations.
DELETE FROM "_prisma_migrations" WHERE "migration_name" IN ('20261013000000_trust_privileges', '20261013010000_role_changed_event');
