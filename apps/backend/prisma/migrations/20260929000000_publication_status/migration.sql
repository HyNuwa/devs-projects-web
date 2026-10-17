-- Publicación inmediata (ADR 0001): one publication status shared by materials,
-- reseñas de cursada and experiencias de final. Existing data is mapped before the
-- old moderation columns are dropped.

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('PUBLISHED', 'PENDING_REVIEW', 'REJECTED', 'HIDDEN', 'REMOVED');

-- 1. New columns
ALTER TABLE "materials"
  ADD COLUMN "publication_status" "PublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "hidden_at" TIMESTAMP(3),
  ADD COLUMN "author_facing_reason" VARCHAR(1000),
  ADD COLUMN "file_hash" CHAR(64);

ALTER TABLE "course_reviews"
  ADD COLUMN "publication_status" "PublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "hidden_at" TIMESTAMP(3),
  ADD COLUMN "author_facing_reason" VARCHAR(1000);

ALTER TABLE "exam_experiences"
  ADD COLUMN "publication_status" "PublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "hidden_at" TIMESTAMP(3),
  ADD COLUMN "author_facing_reason" VARCHAR(1000);

-- 2. Map existing data
UPDATE "materials" SET
  "publication_status" = CASE
    WHEN "is_removed" THEN 'REMOVED'::"PublicationStatus"
    WHEN "moderation_status" = 'APPROVED' THEN 'PUBLISHED'::"PublicationStatus"
    WHEN "moderation_status" = 'PENDING' THEN 'PENDING_REVIEW'::"PublicationStatus"
    ELSE 'REJECTED'::"PublicationStatus"
  END,
  "author_facing_reason" = "moderation_reason",
  "status_changed_at" = "updated_at";

UPDATE "course_reviews" SET
  "publication_status" = 'REMOVED',
  "author_facing_reason" = "removed_reason",
  "status_changed_at" = COALESCE("removed_at", "updated_at")
WHERE "is_removed";

UPDATE "exam_experiences" SET
  "publication_status" = 'REMOVED',
  "author_facing_reason" = "removed_reason",
  "status_changed_at" = COALESCE("removed_at", "updated_at")
WHERE "is_removed";

-- 3. Drop the old moderation columns, their indexes and foreign keys
ALTER TABLE "course_reviews" DROP CONSTRAINT "course_reviews_removed_by_id_fkey";
ALTER TABLE "exam_experiences" DROP CONSTRAINT "exam_experiences_removed_by_id_fkey";

DROP INDEX "course_reviews_removed_by_idx";
DROP INDEX "course_reviews_removed_created_idx";
DROP INDEX "exam_experiences_removed_by_idx";
DROP INDEX "exam_experiences_removed_created_idx";
DROP INDEX "materials_academic_year_moderation_status_created_at_idx";
DROP INDEX "materials_moderation_status_search_key_idx";
DROP INDEX "materials_professor_id_moderation_status_created_at_idx";
DROP INDEX "materials_shift_moderation_status_created_at_idx";
DROP INDEX "materials_subject_id_moderation_status_created_at_idx";
DROP INDEX "materials_subject_resource_status_created_idx";

ALTER TABLE "course_reviews"
  DROP COLUMN "is_removed",
  DROP COLUMN "removed_at",
  DROP COLUMN "removed_by_id",
  DROP COLUMN "removed_reason";

ALTER TABLE "exam_experiences"
  DROP COLUMN "is_removed",
  DROP COLUMN "removed_at",
  DROP COLUMN "removed_by_id",
  DROP COLUMN "removed_reason";

ALTER TABLE "materials"
  DROP COLUMN "is_approved",
  DROP COLUMN "is_removed",
  DROP COLUMN "moderation_reason",
  DROP COLUMN "moderation_status";

DROP TYPE "MaterialModerationStatus";

-- 4. Indexes on the new status
CREATE INDEX "course_reviews_status_created_idx" ON "course_reviews"("publication_status", "created_at");
CREATE INDEX "exam_experiences_status_created_idx" ON "exam_experiences"("publication_status", "created_at");
CREATE INDEX "materials_subject_id_publication_status_created_at_idx" ON "materials"("subject_id", "publication_status", "created_at");
CREATE INDEX "materials_subject_resource_status_created_idx" ON "materials"("subject_id", "resource_type", "publication_status", "created_at");
CREATE INDEX "materials_publication_status_search_key_idx" ON "materials"("publication_status", "search_key");
CREATE INDEX "materials_academic_year_publication_status_created_at_idx" ON "materials"("academic_year", "publication_status", "created_at");
CREATE INDEX "materials_professor_id_publication_status_created_at_idx" ON "materials"("professor_id", "publication_status", "created_at");
CREATE INDEX "materials_shift_publication_status_created_at_idx" ON "materials"("shift", "publication_status", "created_at");
CREATE INDEX "materials_subject_id_file_hash_idx" ON "materials"("subject_id", "file_hash");
