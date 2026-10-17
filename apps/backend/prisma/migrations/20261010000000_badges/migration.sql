-- Insignias get their catalog (openspec change puntos-insignias). Earlier rows are
-- kept with a legacy slug; holders get edition 0.

-- CreateEnum
CREATE TYPE "BadgeRarity" AS ENUM ('COMUN', 'RARA', 'TEMPORADA', 'EDICION_UNICA');

-- CreateEnum
CREATE TYPE "BadgeTier" AS ENUM ('BRONCE', 'PLATA', 'ORO');

-- AlterTable
ALTER TABLE "badges"
  ADD COLUMN "rarity" "BadgeRarity" NOT NULL DEFAULT 'COMUN',
  ADD COLUMN "slug" VARCHAR(60),
  ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

UPDATE "badges" SET "slug" = 'legacy-' || "id";

ALTER TABLE "badges" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_badges"
  ADD COLUMN "edition" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "seen_at" TIMESTAMP(3),
  ADD COLUMN "tier" "BadgeTier",
  ADD COLUMN "tier_updated_at" TIMESTAMP(3);

-- DropIndex
DROP INDEX "user_badges_user_id_badge_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_edition_key" ON "user_badges"("user_id", "badge_id", "edition");

-- The catalog (README_PUNTOS_E_INSIGNIAS §6.2, without Lupa). badge-catalog.ts
-- holds the criteria and a test keeps both in step.
INSERT INTO "badges" ("id", "slug", "name", "description", "image_url", "rarity", "sort_order")
VALUES
  (gen_random_uuid(), 'primer-aporte', 'Primer aporte', 'Tu primer material publicado.', '/assets/insignias/gema/primer-aporte.svg', 'COMUN', 1),
  (gen_random_uuid(), 'primer-me-sirvio', 'Primer «Me sirvió»', 'Recibís tu primer «Me sirvió» válido.', '/assets/insignias/gema/primer-me-sirvio.svg', 'COMUN', 2),
  (gen_random_uuid(), 'salvavidas', 'Salvavidas', 'Un material tuyo llega a 50 «Me sirvió» (plata: 150, oro: 400).', '/assets/insignias/gema/salvavidas.svg', 'RARA', 3),
  (gen_random_uuid(), 'trotamaterias', 'Trotamaterias', 'Materiales publicados en 5 materias (plata: 10, oro: 20).', '/assets/insignias/gema/trotamaterias.svg', 'COMUN', 4),
  (gen_random_uuid(), 'primera-huella', 'Primera huella', 'Primer material de un tipo en una materia, con 3 «Me sirvió» (plata: 3 veces, oro: 8).', '/assets/insignias/gema/primera-huella.svg', 'RARA', 5),
  (gen_random_uuid(), 'primera-luz', 'Primera luz', 'Primer material publicado de una materia que no tenía ninguno.', '/assets/insignias/gema/primera-luz.svg', 'RARA', 6),
  (gen_random_uuid(), 'kit-completo', 'Kit completo', 'Materiales de 4 tipos distintos en una misma materia.', '/assets/insignias/gema/kit-completo.svg', 'RARA', 7),
  (gen_random_uuid(), 'archivo-historico', 'Archivo histórico', 'Materiales del mismo tipo y materia en 3 ciclos lectivos.', '/assets/insignias/gema/archivo-historico.svg', 'RARA', 8),
  (gen_random_uuid(), 'puente', 'Puente', 'Un material tuyo recibe «Me sirvió» de estudiantes de 3 carreras.', '/assets/insignias/gema/puente.svg', 'RARA', 9),
  (gen_random_uuid(), 'constante', 'Constante', 'Aportes en 2 cuatrimestres seguidos (plata: 4, oro: 8).', '/assets/insignias/gema/constante.svg', 'COMUN', 10),
  (gen_random_uuid(), 'voz-de-la-cursada', 'Voz de la cursada', '5 reseñas de cursada con nombre (plata: 15, oro: 40).', '/assets/insignias/gema/voz-de-la-cursada.svg', 'COMUN', 11),
  (gen_random_uuid(), 'contexto-completo', 'Contexto completo', '10 reseñas con nombre con todo el contexto de la cursada.', '/assets/insignias/gema/contexto-completo.svg', 'RARA', 12),
  (gen_random_uuid(), 'cronista-de-mesas', 'Cronista de mesas', 'Experiencias de final con nombre de las mesas de diciembre, julio y febrero/marzo.', '/assets/insignias/gema/cronista-de-mesas.svg', 'RARA', 13),
  (gen_random_uuid(), 'mesa-de-diciembre', 'Mesa de diciembre', 'Contaste con nombre una experiencia de final de la mesa de diciembre.', '/assets/insignias/gema/mesa-de-diciembre.svg', 'TEMPORADA', 14),
  (gen_random_uuid(), 'temporada-de-finales', 'Temporada de finales', '3 aportes publicados durante un período de mesas.', '/assets/insignias/gema/temporada-de-finales.svg', 'TEMPORADA', 15),
  (gen_random_uuid(), 'ojo-atento', 'Ojo atento', '10 reportes confirmados por moderación.', '/assets/insignias/gema/ojo-atento.svg', 'RARA', 16),
  (gen_random_uuid(), 'primera-camada', 'Primera camada', 'Cuenta del primer cuatrimestre de la plataforma, con un aporte en ese período.', '/assets/insignias/gema/primera-camada.svg', 'EDICION_UNICA', 17)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "image_url" = EXCLUDED."image_url",
  "rarity" = EXCLUDED."rarity",
  "sort_order" = EXCLUDED."sort_order";
