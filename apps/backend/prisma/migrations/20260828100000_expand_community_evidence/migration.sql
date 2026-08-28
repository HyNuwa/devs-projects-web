-- CreateEnum
CREATE TYPE "CourseAttempt" AS ENUM (
    'PRIMERA_CURSADA',
    'PRIMERA_RECURSADA',
    'SEGUNDA_O_MAS_RECURSADAS',
    'PREFIERO_NO_RESPONDER'
);

-- CreateEnum
CREATE TYPE "CommunityDifficulty" AS ENUM (
    'MUY_BAJA',
    'BAJA',
    'MEDIA',
    'ALTA',
    'MUY_ALTA'
);

-- CreateEnum
CREATE TYPE "ExamOutcome" AS ENUM (
    'APROBADO',
    'DESAPROBADO',
    'PREFIERO_NO_DECIR'
);

-- AlterTable
ALTER TABLE "course_reviews"
ADD COLUMN "academic_year" SMALLINT,
ADD COLUMN "attempt" "CourseAttempt",
ADD COLUMN "professor_id" UUID,
ADD COLUMN "professor_name" VARCHAR(150),
ADD COLUMN "difficulty" "CommunityDifficulty",
ADD COLUMN "is_anonymous" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "exam_experiences"
ADD COLUMN "exam_date" DATE,
ADD COLUMN "difficulty" "CommunityDifficulty",
ADD COLUMN "outcome" "ExamOutcome",
ADD COLUMN "grade" SMALLINT,
ADD COLUMN "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "difficulty_theory" DROP NOT NULL,
ALTER COLUMN "difficulty_practice" DROP NOT NULL;

-- DropIndex
DROP INDEX "course_reviews_user_id_subject_id_shift_key";

-- CreateIndex
CREATE INDEX "course_reviews_subject_year_created_idx"
ON "course_reviews"("subject_id", "academic_year", "created_at");

-- CreateIndex
CREATE INDEX "course_reviews_professor_created_idx"
ON "course_reviews"("professor_id", "created_at");

-- CreateIndex
CREATE INDEX "course_reviews_difficulty_created_idx"
ON "course_reviews"("difficulty", "created_at");

-- CreateIndex
CREATE INDEX "course_reviews_attempt_created_idx"
ON "course_reviews"("attempt", "created_at");

-- CreateIndex
CREATE INDEX "exam_experiences_subject_year_exam_date_created_idx"
ON "exam_experiences"("subject_id", "year", "exam_date", "created_at");

-- CreateIndex
CREATE INDEX "exam_experiences_professor_created_idx"
ON "exam_experiences"("professor_id", "created_at");

-- CreateIndex
CREATE INDEX "exam_experiences_outcome_created_idx"
ON "exam_experiences"("outcome", "created_at");

-- CreateIndex
CREATE INDEX "exam_experiences_difficulty_created_idx"
ON "exam_experiences"("difficulty", "created_at");

-- AddForeignKey
ALTER TABLE "course_reviews"
ADD CONSTRAINT "course_reviews_professor_id_fkey"
FOREIGN KEY ("professor_id") REFERENCES "professors"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddConstraint
ALTER TABLE "exam_experiences"
ADD CONSTRAINT "exam_experiences_grade_outcome_check"
CHECK (
    "grade" IS NULL
    OR (
        "grade" BETWEEN 0 AND 10
        AND "outcome" IN ('APROBADO', 'DESAPROBADO')
    )
);
