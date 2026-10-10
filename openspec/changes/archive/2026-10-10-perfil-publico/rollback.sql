-- Rollback for change perfil-publico (migration 20261012000000_profile_customization).
-- Nothing else depends on these objects. Run inside a transaction:
--   psql "$DATABASE_URL" -1 -f rollback.sql
DROP TABLE IF EXISTS "profile_customizations";
ALTER TABLE "users" DROP COLUMN IF EXISTS "max_level";
-- Prisma only accepts `migrate resolve --rolled-back` for failed migrations.
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261012000000_profile_customization';
