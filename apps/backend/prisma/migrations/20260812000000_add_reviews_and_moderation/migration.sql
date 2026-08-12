-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MANANA', 'TARDE', 'NOCHE', 'NO_INDICO');

-- CreateEnum
CREATE TYPE "CourseCondition" AS ENUM ('PROMO', 'REGULAR', 'LIBRE', 'PREFIERO_NO_RESPONDER');

-- CreateEnum
CREATE TYPE "ExamFormat" AS ENUM ('ESCRITO', 'ORAL', 'MIXTO');

-- CreateEnum
CREATE TYPE "ExamSession" AS ENUM ('DICIEMBRE', 'JULIO', 'MARZO', 'FEBRERO_MARZO', 'ESPECIAL', 'NO_RECUERDO');

-- CreateEnum
CREATE TYPE "MaterialModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "ModerationAction_new" AS ENUM ('BAN_USER', 'UNBAN_USER', 'MUTE_USER', 'UNMUTE_USER', 'REMOVE_MATERIAL', 'APPROVE_MATERIAL', 'REJECT_MATERIAL', 'REMOVE_GUIDE', 'APPROVE_GUIDE', 'PROMOTE_MODERATOR', 'DEMOTE_MODERATOR');
ALTER TABLE "moderation_logs" ALTER COLUMN "action" TYPE "ModerationAction_new" USING ("action"::text::"ModerationAction_new");
ALTER TYPE "ModerationAction" RENAME TO "ModerationAction_old";
ALTER TYPE "ModerationAction_new" RENAME TO "ModerationAction";
DROP TYPE "public"."ModerationAction_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "moderation_logs" DROP CONSTRAINT "moderation_logs_target_professor_review_id_fkey";

-- DropForeignKey
ALTER TABLE "professor_reviews" DROP CONSTRAINT "professor_reviews_professor_id_fkey";

-- DropForeignKey
ALTER TABLE "professor_reviews" DROP CONSTRAINT "professor_reviews_user_id_fkey";

-- DropIndex
DROP INDEX "materials_subject_id_is_approved_created_at_idx";

-- DropIndex
DROP INDEX "moderation_logs_target_professor_review_id_idx";

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "drive_download_url" VARCHAR(500),
ADD COLUMN     "drive_file_id" VARCHAR(200),
ADD COLUMN     "drive_preview_url" VARCHAR(500),
ADD COLUMN     "moderation_reason" TEXT,
ADD COLUMN     "moderation_status" "MaterialModerationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "staged_file_path" VARCHAR(500);

-- AlterTable
ALTER TABLE "moderation_logs" DROP COLUMN "target_professor_review_id";

-- DropTable
DROP TABLE "professor_reviews";

-- CreateTable
CREATE TABLE "course_reviews" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "shift" "Shift" NOT NULL DEFAULT 'NO_INDICO',
    "condition" "CourseCondition" NOT NULL DEFAULT 'PREFIERO_NO_RESPONDER',
    "recommendation" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_experiences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "shift" "Shift",
    "year" SMALLINT NOT NULL,
    "session" "ExamSession" NOT NULL DEFAULT 'NO_RECUERDO',
    "format" "ExamFormat" NOT NULL,
    "professor_id" UUID,
    "examiner_name" VARCHAR(150),
    "difficulty_theory" SMALLINT NOT NULL,
    "difficulty_practice" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_reviews_subject_id_idx" ON "course_reviews"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_reviews_user_id_subject_id_shift_key" ON "course_reviews"("user_id", "subject_id", "shift");

-- CreateIndex
CREATE INDEX "exam_experiences_subject_id_idx" ON "exam_experiences"("subject_id");

-- CreateIndex
CREATE INDEX "exam_experiences_year_idx" ON "exam_experiences"("year");

-- CreateIndex
CREATE INDEX "exam_experiences_session_idx" ON "exam_experiences"("session");

-- CreateIndex
CREATE INDEX "materials_subject_id_moderation_status_created_at_idx" ON "materials"("subject_id", "moderation_status", "created_at");

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_experiences" ADD CONSTRAINT "exam_experiences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_experiences" ADD CONSTRAINT "exam_experiences_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_experiences" ADD CONSTRAINT "exam_experiences_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "professors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

