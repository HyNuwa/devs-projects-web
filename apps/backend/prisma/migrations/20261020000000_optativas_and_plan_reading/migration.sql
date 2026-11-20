-- Optativas: a materia a carrera lists with no año or cuatrimestre.
ALTER TABLE "study_plan_subjects" ALTER COLUMN "year" DROP NOT NULL;
ALTER TABLE "study_plan_subjects" ALTER COLUMN "semester" DROP NOT NULL;
ALTER TABLE "study_plan_subjects" ADD CONSTRAINT "study_plan_subjects_optativa_check"
    CHECK (("year" IS NULL) = ("semester" IS NULL));

-- Lectura del plan in the catálogo history.
ALTER TYPE "ModerationEventAction" ADD VALUE 'CATALOG_PLAN_READ';
