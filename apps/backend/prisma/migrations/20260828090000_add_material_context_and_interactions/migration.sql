-- CreateEnum
CREATE TYPE "MaterialResourceType" AS ENUM (
    'PARCIAL',
    'FINAL',
    'APUNTE',
    'RESUMEN',
    'TRABAJO_PRACTICO',
    'GUIA_EJERCICIOS',
    'OTRO'
);

-- AlterTable
ALTER TABLE "subjects"
ADD COLUMN "search_key" VARCHAR(200) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "materials"
ADD COLUMN "search_key" VARCHAR(200) NOT NULL DEFAULT '',
ADD COLUMN "resource_type" "MaterialResourceType" NOT NULL DEFAULT 'OTRO',
ADD COLUMN "academic_year" SMALLINT,
ADD COLUMN "professor_id" UUID,
ADD COLUMN "shift" "Shift";

-- CreateTable
CREATE TABLE "material_helpfulness" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_helpfulness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_materials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "material_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subjects_search_key_idx" ON "subjects"("search_key");

-- CreateIndex
CREATE INDEX "materials_subject_resource_status_created_idx"
ON "materials"("subject_id", "resource_type", "moderation_status", "created_at");

-- CreateIndex
CREATE INDEX "materials_moderation_status_search_key_idx"
ON "materials"("moderation_status", "search_key");

-- CreateIndex
CREATE INDEX "materials_academic_year_moderation_status_created_at_idx"
ON "materials"("academic_year", "moderation_status", "created_at");

-- CreateIndex
CREATE INDEX "materials_professor_id_moderation_status_created_at_idx"
ON "materials"("professor_id", "moderation_status", "created_at");

-- CreateIndex
CREATE INDEX "materials_shift_moderation_status_created_at_idx"
ON "materials"("shift", "moderation_status", "created_at");

-- CreateIndex
CREATE INDEX "material_helpfulness_material_id_idx"
ON "material_helpfulness"("material_id");

-- CreateIndex
CREATE INDEX "material_helpfulness_user_id_created_at_idx"
ON "material_helpfulness"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "material_helpfulness_user_id_material_id_key"
ON "material_helpfulness"("user_id", "material_id");

-- CreateIndex
CREATE INDEX "saved_materials_material_id_idx"
ON "saved_materials"("material_id");

-- CreateIndex
CREATE INDEX "saved_materials_user_id_created_at_idx"
ON "saved_materials"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "saved_materials_user_id_material_id_key"
ON "saved_materials"("user_id", "material_id");

-- AddForeignKey
ALTER TABLE "materials"
ADD CONSTRAINT "materials_professor_id_fkey"
FOREIGN KEY ("professor_id") REFERENCES "professors"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_helpfulness"
ADD CONSTRAINT "material_helpfulness_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_helpfulness"
ADD CONSTRAINT "material_helpfulness_material_id_fkey"
FOREIGN KEY ("material_id") REFERENCES "materials"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_materials"
ADD CONSTRAINT "saved_materials_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_materials"
ADD CONSTRAINT "saved_materials_material_id_fkey"
FOREIGN KEY ("material_id") REFERENCES "materials"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
