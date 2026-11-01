-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourseFileState" AS ENUM ('PENDING', 'READY', 'FAILED', 'DETACHING');

-- CreateEnum
CREATE TYPE "CourseFileOrigin" AS ENUM ('UPLOAD', 'IMPORT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bannedUntil" TIMESTAMP(3),
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mutedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "role_change_audits" (
    "id" UUID NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "target_id" INTEGER NOT NULL,
    "old_role" "Role" NOT NULL,
    "new_role" "Role" NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_change_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "careers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "careers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plans" (
    "id" UUID NOT NULL,
    "career_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(20),
    "description" VARCHAR(5000),
    "search_key" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_subjects" (
    "id" UUID NOT NULL,
    "study_plan_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "year" SMALLINT NOT NULL,
    "semester" SMALLINT NOT NULL,
    "credits" SMALLINT,

    CONSTRAINT "study_plan_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(5000) NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "creator_id" INTEGER NOT NULL,
    "subject_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_sections" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_lessons" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_files" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "uploader_id" INTEGER NOT NULL,
    "drive_file_id" VARCHAR(200),
    "operation_id" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size" BIGINT NOT NULL,
    "allow_download" BOOLEAN NOT NULL DEFAULT true,
    "state" "CourseFileState" NOT NULL DEFAULT 'PENDING',
    "origin" "CourseFileOrigin" NOT NULL,
    "last_error_code" VARCHAR(50),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "retry_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_change_audits_target_id_created_at_idx" ON "role_change_audits"("target_id", "created_at");

-- CreateIndex
CREATE INDEX "role_change_audits_actor_id_created_at_idx" ON "role_change_audits"("actor_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "careers_code_key" ON "careers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "study_plans_career_id_code_key" ON "study_plans"("career_id", "code");

-- CreateIndex
CREATE INDEX "subjects_search_key_idx" ON "subjects"("search_key");

-- CreateIndex
CREATE INDEX "study_plan_subjects_subject_id_idx" ON "study_plan_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_plan_subjects_study_plan_id_subject_id_key" ON "study_plan_subjects"("study_plan_id", "subject_id");

-- CreateIndex
CREATE INDEX "courses_status_created_at_idx" ON "courses"("status", "created_at");

-- CreateIndex
CREATE INDEX "courses_subject_id_idx" ON "courses"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_sections_course_id_position_key" ON "course_sections"("course_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "course_lessons_section_id_position_key" ON "course_lessons"("section_id", "position");

-- CreateIndex
CREATE INDEX "course_enrollments_user_id_active_idx" ON "course_enrollments"("user_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_course_id_user_id_key" ON "course_enrollments"("course_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_files_drive_file_id_key" ON "course_files"("drive_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_files_operation_id_key" ON "course_files"("operation_id");

-- CreateIndex
CREATE INDEX "course_files_lesson_id_state_idx" ON "course_files"("lesson_id", "state");

-- CreateIndex
CREATE INDEX "course_files_state_retry_at_idx" ON "course_files"("state", "retry_at");

-- AddForeignKey
ALTER TABLE "role_change_audits" ADD CONSTRAINT "role_change_audits_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_change_audits" ADD CONSTRAINT "role_change_audits_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_subjects" ADD CONSTRAINT "study_plan_subjects_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_subjects" ADD CONSTRAINT "study_plan_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "course_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_files" ADD CONSTRAINT "course_files_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "course_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_files" ADD CONSTRAINT "course_files_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain invariants beyond Prisma's schema language.
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_position_nonnegative" CHECK ("position" >= 0);
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_position_nonnegative" CHECK ("position" >= 0);
ALTER TABLE "course_files" ADD CONSTRAINT "course_files_ready_has_drive_id" CHECK ("state" <> 'READY' OR "drive_file_id" IS NOT NULL);
ALTER TABLE "course_files" ADD CONSTRAINT "course_files_valid_size" CHECK ("size" > 0 AND "size" <= 26214400);
ALTER TABLE "study_plan_subjects" ADD CONSTRAINT "study_plan_subjects_valid_context" CHECK ("year" BETWEEN 1 AND 20 AND "semester" BETWEEN 1 AND 2 AND ("credits" IS NULL OR "credits" > 0));
