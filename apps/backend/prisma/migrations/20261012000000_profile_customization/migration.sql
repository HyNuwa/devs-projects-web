-- Change perfil-publico (3c-1): nivel máximo alcanzado and perfil público choices.

-- Nivel máximo alcanzado starts at the current nivel (grilling Q16) and only the
-- ledger raises it afterwards.
ALTER TABLE "users" ADD COLUMN "max_level" INTEGER NOT NULL DEFAULT 1;
UPDATE "users" SET "max_level" = "level";

-- One lazy row per account: no row means every default.
CREATE TABLE "profile_customizations" (
    "user_id" UUID NOT NULL,
    "avatar_cat" VARCHAR(40),
    "accent" VARCHAR(40),
    "background" VARCHAR(40),
    "frame" VARCHAR(40),
    "banner" VARCHAR(40),
    "theme" VARCHAR(40),
    "title_badge" VARCHAR(40),
    "featured_badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pinned" JSONB NOT NULL DEFAULT '[]',
    "show_level_and_badges" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_customizations_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "profile_customizations" ADD CONSTRAINT "profile_customizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
