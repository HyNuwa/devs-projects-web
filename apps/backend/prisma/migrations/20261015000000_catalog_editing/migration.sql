-- Change catalogo-editable (4b): admins edit the catálogo, carreras start as
-- borrador, renamed slugs keep redirecting, materias can be anual, and students
-- ask for their carrera.

-- Carrera en borrador: existing carreras are already public.
CREATE TYPE "CareerStatus" AS ENUM ('DRAFT', 'PUBLISHED');
ALTER TABLE "careers" ADD COLUMN "status" "CareerStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "careers" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- 0 = anual, 1 and 2 = cuatrimestres.
ALTER TABLE "study_plan_subjects" ADD CONSTRAINT "study_plan_subjects_semester_check"
    CHECK ("semester" IN (0, 1, 2));

-- Generated materia codes carry universidad, facultad and name.
ALTER TABLE "subjects" ALTER COLUMN "code" TYPE VARCHAR(60);

-- Short names and codes become URL segments: ASCII letters, digits and hyphens.
-- NOT VALID: only new writes are checked, existing rows stay as loaded.
ALTER TABLE "universities" ADD CONSTRAINT "universities_short_name_slug"
    CHECK ("short_name" ~ '^[A-Za-z0-9-]+$') NOT VALID;
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_short_name_slug"
    CHECK ("short_name" ~ '^[A-Za-z0-9-]+$') NOT VALID;
ALTER TABLE "careers" ADD CONSTRAINT "careers_code_slug"
    CHECK ("code" ~ '^[A-Za-z0-9-]+$') NOT VALID;
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_code_slug"
    CHECK ("code" IS NULL OR "code" ~ '^[A-Za-z0-9-]+$') NOT VALID;

-- Old slugs of renamed entities. target_id points to one of four tables, so it
-- has no FK; the catálogo service deletes aliases with their entity.
CREATE TYPE "CatalogSlugKind" AS ENUM ('UNIVERSITY', 'FACULTY', 'CAREER', 'SUBJECT');
CREATE TABLE "catalog_slug_aliases" (
    "id" UUID NOT NULL,
    "kind" "CatalogSlugKind" NOT NULL,
    "parent_id" UUID,
    "slug" VARCHAR(60) NOT NULL,
    "target_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_slug_aliases_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "catalog_slug_aliases_slug_lower" CHECK ("slug" = lower("slug"))
);
CREATE UNIQUE INDEX "catalog_slug_aliases_place_key" ON "catalog_slug_aliases"
    ("kind", coalesce("parent_id", '00000000-0000-0000-0000-000000000000'::uuid), "slug");
CREATE INDEX "catalog_slug_aliases_target_id_idx" ON "catalog_slug_aliases"("target_id");

-- Solicitudes de carrera.
CREATE TYPE "CareerRequestStatus" AS ENUM
    ('PENDING', 'ACCEPTED', 'PUBLISHED', 'REJECTED', 'ALREADY_LOADED', 'WITHDRAWN');
CREATE TABLE "career_requests" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "faculty_id" UUID,
    "faculty_text" VARCHAR(150),
    "university_text" VARCHAR(150),
    "career_name" VARCHAR(100) NOT NULL,
    "plan_url" VARCHAR(500) NOT NULL,
    "comment" VARCHAR(500),
    "status" "CareerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" VARCHAR(500),
    "career_id" UUID,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "career_requests_plan_url_https" CHECK ("plan_url" LIKE 'https://%'),
    CONSTRAINT "career_requests_faculty_present"
        CHECK ("faculty_id" IS NOT NULL OR "faculty_text" IS NOT NULL)
);
CREATE INDEX "career_requests_author_id_status_idx" ON "career_requests"("author_id", "status");
CREATE INDEX "career_requests_faculty_id_status_idx" ON "career_requests"("faculty_id", "status");
CREATE INDEX "career_requests_status_updated_at_idx" ON "career_requests"("status", "updated_at");
CREATE INDEX "career_requests_career_id_idx" ON "career_requests"("career_id");

ALTER TABLE "career_requests" ADD CONSTRAINT "career_requests_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_requests" ADD CONSTRAINT "career_requests_faculty_id_fkey"
    FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "career_requests" ADD CONSTRAINT "career_requests_career_id_fkey"
    FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "career_requests" ADD CONSTRAINT "career_requests_resolved_by_id_fkey"
    FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "career_request_supporters" (
    "request_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_request_supporters_pkey" PRIMARY KEY ("request_id", "user_id")
);
CREATE INDEX "career_request_supporters_user_id_idx" ON "career_request_supporters"("user_id");
ALTER TABLE "career_request_supporters" ADD CONSTRAINT "career_request_supporters_request_id_fkey"
    FOREIGN KEY ("request_id") REFERENCES "career_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_request_supporters" ADD CONSTRAINT "career_request_supporters_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Catálogo history (admin-only).
ALTER TYPE "ModerationEventAction" ADD VALUE 'CATALOG_CREATED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'CATALOG_UPDATED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'CATALOG_DELETED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'CAREER_PUBLISHED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'CAREER_UNPUBLISHED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'CATALOG_PLACEMENT_CHANGED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'CATALOG_BULK_APPLIED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'CAREER_REQUEST_RESOLVED';
