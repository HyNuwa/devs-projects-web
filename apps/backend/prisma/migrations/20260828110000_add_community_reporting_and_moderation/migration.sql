-- CreateEnum
CREATE TYPE "CommunityReportReason" AS ENUM (
    'SPAM_O_REPETIDO',
    'INSULTOS_O_ACOSO',
    'DATOS_PERSONALES',
    'NO_RELACIONADO',
    'POSIBLEMENTE_ENGANOSO',
    'OTRO'
);

-- CreateEnum
CREATE TYPE "CommunityModerationActionType" AS ENUM ('REMOVE', 'RESTORE');

-- AlterTable
ALTER TABLE "course_reviews"
ADD COLUMN "is_removed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "removed_reason" VARCHAR(1000),
ADD COLUMN "removed_at" TIMESTAMP(3),
ADD COLUMN "removed_by_id" UUID;

-- AlterTable
ALTER TABLE "exam_experiences"
ADD COLUMN "is_removed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "removed_reason" VARCHAR(1000),
ADD COLUMN "removed_at" TIMESTAMP(3),
ADD COLUMN "removed_by_id" UUID;

-- CreateTable
CREATE TABLE "community_reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "course_review_id" UUID,
    "exam_experience_id" UUID,
    "reason" "CommunityReportReason" NOT NULL,
    "explanation" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_moderation_actions" (
    "id" UUID NOT NULL,
    "moderator_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "course_review_id" UUID,
    "exam_experience_id" UUID,
    "action" "CommunityModerationActionType" NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_moderation_actions_pkey" PRIMARY KEY ("id")
);

-- AddConstraint
ALTER TABLE "community_reports"
ADD CONSTRAINT "community_reports_exactly_one_target_check"
CHECK (num_nonnulls("course_review_id", "exam_experience_id") = 1);

-- AddConstraint
ALTER TABLE "community_moderation_actions"
ADD CONSTRAINT "community_moderations_exactly_one_target_check"
CHECK (num_nonnulls("course_review_id", "exam_experience_id") = 1);

-- AddConstraint
ALTER TABLE "course_reviews"
ADD CONSTRAINT "course_reviews_removal_state_check"
CHECK (
    (
        "is_removed" = false
        AND "removed_reason" IS NULL
        AND "removed_at" IS NULL
        AND "removed_by_id" IS NULL
    )
    OR (
        "is_removed" = true
        AND "removed_reason" IS NOT NULL
        AND length(trim("removed_reason")) > 0
        AND "removed_at" IS NOT NULL
        AND "removed_by_id" IS NOT NULL
    )
);

-- AddConstraint
ALTER TABLE "exam_experiences"
ADD CONSTRAINT "exam_experiences_removal_state_check"
CHECK (
    (
        "is_removed" = false
        AND "removed_reason" IS NULL
        AND "removed_at" IS NULL
        AND "removed_by_id" IS NULL
    )
    OR (
        "is_removed" = true
        AND "removed_reason" IS NOT NULL
        AND length(trim("removed_reason")) > 0
        AND "removed_at" IS NOT NULL
        AND "removed_by_id" IS NOT NULL
    )
);

-- CreateIndex
CREATE INDEX "course_reviews_removed_created_idx"
ON "course_reviews"("is_removed", "created_at");

-- CreateIndex
CREATE INDEX "course_reviews_removed_by_idx"
ON "course_reviews"("removed_by_id");

-- CreateIndex
CREATE INDEX "exam_experiences_removed_created_idx"
ON "exam_experiences"("is_removed", "created_at");

-- CreateIndex
CREATE INDEX "exam_experiences_removed_by_idx"
ON "exam_experiences"("removed_by_id");

-- CreateIndex
CREATE INDEX "community_reports_reporter_created_idx"
ON "community_reports"("reporter_id", "created_at");

-- CreateIndex
CREATE INDEX "community_reports_review_created_idx"
ON "community_reports"("course_review_id", "created_at");

-- CreateIndex
CREATE INDEX "community_reports_exam_created_idx"
ON "community_reports"("exam_experience_id", "created_at");

-- CreateIndex
CREATE INDEX "community_moderations_moderator_created_idx"
ON "community_moderation_actions"("moderator_id", "created_at");

-- CreateIndex
CREATE INDEX "community_moderations_author_created_idx"
ON "community_moderation_actions"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "community_moderations_review_created_idx"
ON "community_moderation_actions"("course_review_id", "created_at");

-- CreateIndex
CREATE INDEX "community_moderations_exam_created_idx"
ON "community_moderation_actions"("exam_experience_id", "created_at");

-- AddForeignKey
ALTER TABLE "course_reviews"
ADD CONSTRAINT "course_reviews_removed_by_id_fkey"
FOREIGN KEY ("removed_by_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_experiences"
ADD CONSTRAINT "exam_experiences_removed_by_id_fkey"
FOREIGN KEY ("removed_by_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports"
ADD CONSTRAINT "community_reports_reporter_id_fkey"
FOREIGN KEY ("reporter_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports"
ADD CONSTRAINT "community_reports_course_review_id_fkey"
FOREIGN KEY ("course_review_id") REFERENCES "course_reviews"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reports"
ADD CONSTRAINT "community_reports_exam_experience_id_fkey"
FOREIGN KEY ("exam_experience_id") REFERENCES "exam_experiences"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_moderation_actions"
ADD CONSTRAINT "community_moderation_actions_moderator_id_fkey"
FOREIGN KEY ("moderator_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_moderation_actions"
ADD CONSTRAINT "community_moderation_actions_author_id_fkey"
FOREIGN KEY ("author_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_moderation_actions"
ADD CONSTRAINT "community_moderation_actions_course_review_id_fkey"
FOREIGN KEY ("course_review_id") REFERENCES "course_reviews"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_moderation_actions"
ADD CONSTRAINT "community_moderation_actions_exam_experience_id_fkey"
FOREIGN KEY ("exam_experience_id") REFERENCES "exam_experiences"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
