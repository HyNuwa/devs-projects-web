-- Universidad → Facultad → Carrera → Plan → Materia (ADR 0002, change `instituciones`).
-- 1. New tables, with UNJU → Facultad de Ingeniería at fixed ids the seed reuses.
-- CreateTable
CREATE TABLE "universities" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "short_name" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" UUID NOT NULL,
    "university_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "short_name" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "universities_name_key" ON "universities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "universities_short_name_key" ON "universities"("short_name");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_university_id_name_key" ON "faculties"("university_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_university_id_short_name_key" ON "faculties"("university_id", "short_name");

-- AddForeignKey
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "universities" ("id", "name", "short_name", "updated_at")
VALUES ('00000000-0000-4000-8000-00000000a001', 'Universidad Nacional de Jujuy', 'UNJU', CURRENT_TIMESTAMP);

INSERT INTO "faculties" ("id", "university_id", "name", "short_name", "updated_at")
VALUES ('00000000-0000-4000-8000-00000000f001', '00000000-0000-4000-8000-00000000a001', 'Facultad de Ingeniería', 'FI', CURRENT_TIMESTAMP);

-- 2. Every existing carrera and materia belongs to FI.
ALTER TABLE "careers" ADD COLUMN "faculty_id" UUID;
ALTER TABLE "subjects" ADD COLUMN "faculty_id" UUID;

UPDATE "careers" SET "faculty_id" = '00000000-0000-4000-8000-00000000f001';
UPDATE "subjects" SET "faculty_id" = '00000000-0000-4000-8000-00000000f001';

ALTER TABLE "careers" ALTER COLUMN "faculty_id" SET NOT NULL;
ALTER TABLE "subjects" ALTER COLUMN "faculty_id" SET NOT NULL;

-- 3. Keys, foreign keys and the facultad invariants.
-- DropIndex
DROP INDEX "careers_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "careers_faculty_id_code_key" ON "careers"("faculty_id", "code");

-- CreateIndex
CREATE INDEX "subjects_faculty_id_idx" ON "subjects"("faculty_id");

-- AddForeignKey
ALTER TABLE "careers" ADD CONSTRAINT "careers_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A plan only includes materias of its carrera's facultad. Prisma can't express a
-- cross-table check, so four triggers guard every way the rule could break.

-- (a) Linking a plan and a materia.
CREATE FUNCTION "study_plan_subjects_same_faculty"() RETURNS trigger AS $$
BEGIN
  IF (
    SELECT c."faculty_id" FROM "study_plans" p JOIN "careers" c ON c."id" = p."career_id"
    WHERE p."id" = NEW."study_plan_id"
  ) IS DISTINCT FROM (
    SELECT s."faculty_id" FROM "subjects" s WHERE s."id" = NEW."subject_id"
  ) THEN
    RAISE EXCEPTION 'La materia % no pertenece a la facultad del plan %', NEW."subject_id", NEW."study_plan_id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "study_plan_subjects_same_faculty"
  BEFORE INSERT OR UPDATE OF "study_plan_id", "subject_id" ON "study_plan_subjects"
  FOR EACH ROW EXECUTE FUNCTION "study_plan_subjects_same_faculty"();

-- (b) Moving a materia that plans of another facultad include.
CREATE FUNCTION "subjects_faculty_matches_plans"() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "study_plan_subjects" sps
    JOIN "study_plans" p ON p."id" = sps."study_plan_id"
    JOIN "careers" c ON c."id" = p."career_id"
    WHERE sps."subject_id" = NEW."id" AND c."faculty_id" <> NEW."faculty_id"
  ) THEN
    RAISE EXCEPTION 'La materia % está en planes de otra facultad', NEW."id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "subjects_faculty_matches_plans"
  BEFORE UPDATE OF "faculty_id" ON "subjects"
  FOR EACH ROW WHEN (OLD."faculty_id" IS DISTINCT FROM NEW."faculty_id")
  EXECUTE FUNCTION "subjects_faculty_matches_plans"();

-- (c) Moving a carrera that has plans.
CREATE FUNCTION "careers_faculty_fixed_with_plans"() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "study_plans" p WHERE p."career_id" = NEW."id") THEN
    RAISE EXCEPTION 'La carrera % tiene planes y no puede cambiar de facultad', NEW."id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "careers_faculty_fixed_with_plans"
  BEFORE UPDATE OF "faculty_id" ON "careers"
  FOR EACH ROW WHEN (OLD."faculty_id" IS DISTINCT FROM NEW."faculty_id")
  EXECUTE FUNCTION "careers_faculty_fixed_with_plans"();

-- (d) Moving a plan with materias to a carrera of another facultad.
CREATE FUNCTION "study_plans_career_same_faculty"() RETURNS trigger AS $$
BEGIN
  IF (SELECT "faculty_id" FROM "careers" WHERE "id" = NEW."career_id")
       IS DISTINCT FROM (SELECT "faculty_id" FROM "careers" WHERE "id" = OLD."career_id")
     AND EXISTS (SELECT 1 FROM "study_plan_subjects" sps WHERE sps."study_plan_id" = NEW."id") THEN
    RAISE EXCEPTION 'El plan % tiene materias de otra facultad', NEW."id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "study_plans_career_same_faculty"
  BEFORE UPDATE OF "career_id" ON "study_plans"
  FOR EACH ROW WHEN (OLD."career_id" IS DISTINCT FROM NEW."career_id")
  EXECUTE FUNCTION "study_plans_career_same_faculty"();
