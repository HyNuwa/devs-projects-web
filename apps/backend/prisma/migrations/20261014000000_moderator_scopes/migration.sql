-- Change alcance-por-facultad (4): moderators cover facultades, materia codes
-- are unique, each carrera keeps a single internal plan, carreras can link
-- their official plan, and browsing slugs resolve to one row.

CREATE TABLE "moderator_scopes" (
    "user_id" UUID NOT NULL,
    "faculty_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderator_scopes_pkey" PRIMARY KEY ("user_id", "faculty_id")
);

CREATE INDEX "moderator_scopes_faculty_id_idx" ON "moderator_scopes"("faculty_id");

ALTER TABLE "moderator_scopes" ADD CONSTRAINT "moderator_scopes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "moderator_scopes" ADD CONSTRAINT "moderator_scopes_faculty_id_fkey"
    FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A materia code names one materia across the system (NULLs stay allowed).
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- One internal plan per carrera (ADR 0003).
CREATE UNIQUE INDEX "study_plans_career_id_key" ON "study_plans"("career_id");

-- Official plan link, https only.
ALTER TABLE "careers" ADD COLUMN "plan_url" VARCHAR(500);
ALTER TABLE "careers" ADD CONSTRAINT "careers_plan_url_https"
    CHECK ("plan_url" IS NULL OR "plan_url" LIKE 'https://%');

-- Browsing slugs are the lowercase short names and codes.
CREATE UNIQUE INDEX "universities_short_name_lower_key" ON "universities"(lower("short_name"));
CREATE UNIQUE INDEX "faculties_university_short_name_lower_key" ON "faculties"("university_id", lower("short_name"));
CREATE UNIQUE INDEX "careers_faculty_code_lower_key" ON "careers"("faculty_id", lower("code"));

ALTER TYPE "ModerationEventAction" ADD VALUE 'MODERATOR_SCOPE_CHANGED';
