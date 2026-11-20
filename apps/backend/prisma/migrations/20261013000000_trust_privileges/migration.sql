-- Change privilegios-confianza (3c-2): correction suggestions, priority reportes, Lupa.


-- CreateEnum
CREATE TYPE "CorrectionField" AS ENUM ('SUBJECT', 'RESOURCE_TYPE', 'ACADEMIC_YEAR', 'PROFESSOR');

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('OPEN', 'ACCEPTED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CorrectionDecider" AS ENUM ('AUTHOR', 'MODERATION');

-- CreateEnum
CREATE TYPE "CorrectionClosedReason" AS ENUM ('FIELD_CHANGED', 'MATERIAL_GONE');

-- AlterEnum
ALTER TYPE "PointReason" ADD VALUE 'CORRECTION_ACCEPTED';

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "priority" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "correction_suggestions" (
    "id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "suggester_id" UUID NOT NULL,
    "field" "CorrectionField" NOT NULL,
    "current_value" VARCHAR(60),
    "proposed_value" VARCHAR(60),
    "comment" VARCHAR(500),
    "status" "CorrectionStatus" NOT NULL DEFAULT 'OPEN',
    "decided_by" "CorrectionDecider",
    "decided_by_id" UUID,
    "closed_reason" "CorrectionClosedReason",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "correction_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "correction_suggestions_material_id_status_idx" ON "correction_suggestions"("material_id", "status");

-- CreateIndex
CREATE INDEX "correction_suggestions_suggester_id_status_idx" ON "correction_suggestions"("suggester_id", "status");

-- CreateIndex
CREATE INDEX "correction_suggestions_status_created_at_idx" ON "correction_suggestions"("status", "created_at");

-- AddForeignKey
ALTER TABLE "correction_suggestions" ADD CONSTRAINT "correction_suggestions_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_suggestions" ADD CONSTRAINT "correction_suggestions_suggester_id_fkey" FOREIGN KEY ("suggester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- One open suggestion per material and field, also under concurrent requests.
CREATE UNIQUE INDEX "correction_suggestions_one_open_per_field"
  ON "correction_suggestions" ("material_id", "field")
  WHERE "status" = 'OPEN';

-- Lupa joins the catalog right after Ojo atento (README_PUNTOS_E_INSIGNIAS §6.2).
UPDATE "badges" SET "sort_order" = 18 WHERE "slug" = 'primera-camada';
INSERT INTO "badges" ("id", "slug", "name", "description", "image_url", "rarity", "sort_order")
VALUES (gen_random_uuid(), 'lupa', 'Lupa', '10 correcciones aceptadas.', '/assets/insignias/gema/lupa.svg', 'RARA', 17)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "image_url" = EXCLUDED."image_url",
  "rarity" = EXCLUDED."rarity",
  "sort_order" = EXCLUDED."sort_order";
