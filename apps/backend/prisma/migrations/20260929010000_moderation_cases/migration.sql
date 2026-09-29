-- Casos de moderación (docs/README_MODERACION.md §4–§5, §11): reportes for every
-- contribution type grouped into one caso per content, revisión previa as a caso,
-- and one append-only history. Existing reports, community moderation actions and
-- moderation logs are migrated, then their tables are dropped.

-- 1. Types
ALTER TYPE "CommunityReportReason" RENAME TO "ReportReason";
CREATE TYPE "ModerationTargetType" AS ENUM ('MATERIAL', 'COURSE_REVIEW', 'EXAM_EXPERIENCE');
CREATE TYPE "ModerationCaseKind" AS ENUM ('REPORTS', 'PRIOR_REVIEW');
CREATE TYPE "ModerationCaseStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "ModerationDecision" AS ENUM ('KEEP_VISIBLE', 'REMOVE', 'RESTORE', 'APPROVE', 'REJECT');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'CONFIRMED', 'DISMISSED');
CREATE TYPE "ModerationEventAction" AS ENUM ('PRIOR_REVIEW_OPENED', 'PRIOR_REVIEW_APPROVED', 'PRIOR_REVIEW_REJECTED', 'RESUBMITTED', 'REPORT_FILED', 'AUTO_HIDDEN', 'AUTO_UNHIDDEN_OVERDUE', 'KEPT_VISIBLE', 'REMOVED', 'RESTORED', 'AUTHOR_REVEALED', 'LEGACY_ACTION');

-- 2. Tables, indexes and foreign keys
CREATE TABLE "moderation_cases" (
    "id" UUID NOT NULL,
    "kind" "ModerationCaseKind" NOT NULL,
    "status" "ModerationCaseStatus" NOT NULL DEFAULT 'OPEN',
    "target_type" "ModerationTargetType" NOT NULL,
    "material_id" UUID,
    "course_review_id" UUID,
    "exam_experience_id" UUID,
    "high_priority" BOOLEAN NOT NULL DEFAULT false,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "decision" "ModerationDecision",
    "decided_by_id" UUID,
    "decision_reason" VARCHAR(1000),

    CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "explanation" VARCHAR(1000),
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "target_type" "ModerationTargetType" NOT NULL,
    "material_id" UUID,
    "course_review_id" UUID,
    "exam_experience_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "moderation_events" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" "ModerationEventAction" NOT NULL,
    "target_type" "ModerationTargetType",
    "material_id" UUID,
    "course_review_id" UUID,
    "exam_experience_id" UUID,
    "target_user_id" UUID,
    "case_id" UUID,
    "reason" VARCHAR(1000),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "moderation_cases_status_kind_opened_at_idx" ON "moderation_cases"("status", "kind", "opened_at");
CREATE INDEX "moderation_cases_material_id_idx" ON "moderation_cases"("material_id");
CREATE INDEX "moderation_cases_course_review_id_idx" ON "moderation_cases"("course_review_id");
CREATE INDEX "moderation_cases_exam_experience_id_idx" ON "moderation_cases"("exam_experience_id");
CREATE INDEX "reports_case_id_idx" ON "reports"("case_id");
CREATE UNIQUE INDEX "reports_reporter_id_material_id_key" ON "reports"("reporter_id", "material_id");
CREATE UNIQUE INDEX "reports_reporter_id_course_review_id_key" ON "reports"("reporter_id", "course_review_id");
CREATE UNIQUE INDEX "reports_reporter_id_exam_experience_id_key" ON "reports"("reporter_id", "exam_experience_id");
CREATE INDEX "moderation_events_created_at_idx" ON "moderation_events"("created_at");
CREATE INDEX "moderation_events_action_created_at_idx" ON "moderation_events"("action", "created_at");
CREATE INDEX "moderation_events_actor_id_created_at_idx" ON "moderation_events"("actor_id", "created_at");
CREATE INDEX "moderation_events_target_user_id_created_at_idx" ON "moderation_events"("target_user_id", "created_at");
CREATE INDEX "moderation_events_case_id_idx" ON "moderation_events"("case_id");

ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_course_review_id_fkey" FOREIGN KEY ("course_review_id") REFERENCES "course_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_exam_experience_id_fkey" FOREIGN KEY ("exam_experience_id") REFERENCES "exam_experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_course_review_id_fkey" FOREIGN KEY ("course_review_id") REFERENCES "course_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_exam_experience_id_fkey" FOREIGN KEY ("exam_experience_id") REFERENCES "exam_experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Migrate existing data

-- 3a. Reports: one caso per reported target. A target that is already REMOVED gets a
-- closed caso with its reports confirmed; anything else keeps an open caso.
INSERT INTO "moderation_cases" ("id", "kind", "status", "target_type", "course_review_id",
  "exam_experience_id", "opened_at", "closed_at", "decision", "decision_reason")
SELECT gen_random_uuid(), 'REPORTS',
  CASE WHEN target_status = 'REMOVED' THEN 'CLOSED'::"ModerationCaseStatus" ELSE 'OPEN'::"ModerationCaseStatus" END,
  CASE WHEN course_review_id IS NOT NULL THEN 'COURSE_REVIEW'::"ModerationTargetType" ELSE 'EXAM_EXPERIENCE'::"ModerationTargetType" END,
  course_review_id, exam_experience_id, opened_at,
  CASE WHEN target_status = 'REMOVED' THEN status_changed_at END,
  CASE WHEN target_status = 'REMOVED' THEN 'REMOVE'::"ModerationDecision" END,
  CASE WHEN target_status = 'REMOVED' THEN reason END
FROM (
  SELECT r."course_review_id", r."exam_experience_id", min(r."created_at") AS opened_at,
         COALESCE(cr."publication_status", ee."publication_status") AS target_status,
         COALESCE(cr."status_changed_at", ee."status_changed_at") AS status_changed_at,
         COALESCE(cr."author_facing_reason", ee."author_facing_reason") AS reason
  FROM "community_reports" r
  LEFT JOIN "course_reviews" cr ON cr."id" = r."course_review_id"
  LEFT JOIN "exam_experiences" ee ON ee."id" = r."exam_experience_id"
  GROUP BY r."course_review_id", r."exam_experience_id", cr."publication_status", ee."publication_status",
           cr."status_changed_at", ee."status_changed_at", cr."author_facing_reason", ee."author_facing_reason"
) targets;

INSERT INTO "reports" ("id", "case_id", "reporter_id", "reason", "explanation", "status", "target_type",
  "course_review_id", "exam_experience_id", "created_at", "resolved_at")
SELECT r."id", c."id", r."reporter_id", r."reason", r."explanation",
  CASE WHEN c."status" = 'CLOSED' THEN 'CONFIRMED'::"ReportStatus" ELSE 'OPEN'::"ReportStatus" END,
  c."target_type", r."course_review_id", r."exam_experience_id", r."created_at", c."closed_at"
FROM "community_reports" r
JOIN "moderation_cases" c
  ON c."course_review_id" IS NOT DISTINCT FROM r."course_review_id"
 AND c."exam_experience_id" IS NOT DISTINCT FROM r."exam_experience_id"
 AND c."kind" = 'REPORTS';

-- 3b. Materials waiting for approval become open revisión previa casos.
INSERT INTO "moderation_cases" ("id", "kind", "status", "target_type", "material_id", "opened_at")
SELECT gen_random_uuid(), 'PRIOR_REVIEW', 'OPEN', 'MATERIAL', "id", "created_at"
FROM "materials" WHERE "publication_status" = 'PENDING_REVIEW' AND NOT "is_deleted";

-- 3c. History: community moderation actions and moderation logs.
INSERT INTO "moderation_events" ("id", "actor_id", "action", "target_type", "course_review_id",
  "exam_experience_id", "target_user_id", "reason", "created_at")
SELECT a."id", a."moderator_id",
  CASE WHEN a."action" = 'REMOVE' THEN 'REMOVED'::"ModerationEventAction" ELSE 'RESTORED'::"ModerationEventAction" END,
  CASE WHEN a."course_review_id" IS NOT NULL THEN 'COURSE_REVIEW'::"ModerationTargetType" ELSE 'EXAM_EXPERIENCE'::"ModerationTargetType" END,
  a."course_review_id", a."exam_experience_id", a."author_id", a."reason", a."created_at"
FROM "community_moderation_actions" a;

INSERT INTO "moderation_events" ("id", "actor_id", "action", "target_type", "material_id",
  "target_user_id", "reason", "metadata", "created_at")
SELECT l."id", l."moderator_id",
  CASE l."action"::text
    WHEN 'APPROVE_MATERIAL' THEN 'PRIOR_REVIEW_APPROVED'::"ModerationEventAction"
    WHEN 'REJECT_MATERIAL' THEN 'PRIOR_REVIEW_REJECTED'::"ModerationEventAction"
    WHEN 'REMOVE_MATERIAL' THEN 'REMOVED'::"ModerationEventAction"
    ELSE 'LEGACY_ACTION'::"ModerationEventAction"
  END,
  CASE WHEN l."target_material_id" IS NOT NULL THEN 'MATERIAL'::"ModerationTargetType" END,
  l."target_material_id", l."target_user_id", l."reason",
  CASE WHEN l."action"::text IN ('APPROVE_MATERIAL', 'REJECT_MATERIAL', 'REMOVE_MATERIAL') THEN NULL
       ELSE jsonb_build_object('legacyAction', l."action"::text, 'targetGuideId', l."target_guide_id", 'expiresAt', l."expires_at") END,
  l."created_at"
FROM "moderation_logs" l;

-- 4. Drop the old tables and types
ALTER TABLE "community_moderation_actions" DROP CONSTRAINT "community_moderation_actions_author_id_fkey";
ALTER TABLE "community_moderation_actions" DROP CONSTRAINT "community_moderation_actions_course_review_id_fkey";
ALTER TABLE "community_moderation_actions" DROP CONSTRAINT "community_moderation_actions_exam_experience_id_fkey";
ALTER TABLE "community_moderation_actions" DROP CONSTRAINT "community_moderation_actions_moderator_id_fkey";
ALTER TABLE "community_reports" DROP CONSTRAINT "community_reports_course_review_id_fkey";
ALTER TABLE "community_reports" DROP CONSTRAINT "community_reports_exam_experience_id_fkey";
ALTER TABLE "community_reports" DROP CONSTRAINT "community_reports_reporter_id_fkey";
ALTER TABLE "moderation_logs" DROP CONSTRAINT "moderation_logs_moderator_id_fkey";
ALTER TABLE "moderation_logs" DROP CONSTRAINT "moderation_logs_target_guide_id_fkey";
ALTER TABLE "moderation_logs" DROP CONSTRAINT "moderation_logs_target_material_id_fkey";
ALTER TABLE "moderation_logs" DROP CONSTRAINT "moderation_logs_target_user_id_fkey";
DROP TABLE "community_moderation_actions";
DROP TABLE "community_reports";
DROP TABLE "moderation_logs";
DROP TYPE "CommunityModerationActionType";
DROP TYPE "ModerationAction";

-- 5. Integrity Prisma cannot express
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_exactly_one_target_check" CHECK (
  num_nonnulls("material_id", "course_review_id", "exam_experience_id") = 1
  AND ("target_type" = 'MATERIAL') = ("material_id" IS NOT NULL)
  AND ("target_type" = 'COURSE_REVIEW') = ("course_review_id" IS NOT NULL)
  AND ("target_type" = 'EXAM_EXPERIENCE') = ("exam_experience_id" IS NOT NULL)
);
ALTER TABLE "reports" ADD CONSTRAINT "reports_exactly_one_target_check" CHECK (
  num_nonnulls("material_id", "course_review_id", "exam_experience_id") = 1
  AND ("target_type" = 'MATERIAL') = ("material_id" IS NOT NULL)
  AND ("target_type" = 'COURSE_REVIEW') = ("course_review_id" IS NOT NULL)
  AND ("target_type" = 'EXAM_EXPERIENCE') = ("exam_experience_id" IS NOT NULL)
);

-- One open caso per target and kind.
CREATE UNIQUE INDEX "moderation_cases_one_open_material_idx" ON "moderation_cases"("material_id", "kind") WHERE "status" = 'OPEN' AND "material_id" IS NOT NULL;
CREATE UNIQUE INDEX "moderation_cases_one_open_review_idx" ON "moderation_cases"("course_review_id", "kind") WHERE "status" = 'OPEN' AND "course_review_id" IS NOT NULL;
CREATE UNIQUE INDEX "moderation_cases_one_open_exam_idx" ON "moderation_cases"("exam_experience_id", "kind") WHERE "status" = 'OPEN' AND "exam_experience_id" IS NOT NULL;

-- The moderation history is append-only.
CREATE FUNCTION "moderation_events_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'moderation_events is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "moderation_events_no_update_or_delete"
  BEFORE UPDATE OR DELETE ON "moderation_events"
  FOR EACH ROW EXECUTE FUNCTION "moderation_events_append_only"();
