-- Points become a ledger of movimientos (openspec change puntos-libro).
-- Every existing row is kept: free-text reasons map onto the new enum, and each
-- row gets a legacy idempotency key. The rebuild script recomputes points later.

-- CreateEnum
CREATE TYPE "PointReason" AS ENUM ('MATERIAL_PUBLISHED', 'MATERIAL_PIONEER', 'HELPFUL_RECEIVED', 'COURSE_REVIEWED', 'EXAM_EXPERIENCE_SHARED', 'REPORT_CONFIRMED', 'GUIDE_CREATED', 'LEGACY_ADJUSTMENT');

-- Reversals used to be written as `<reason>_REVERTED`; they keep the base reason.
-- MATERIAL_APPROVED was the name before immediate publication. Anything else
-- (for example seed adjustments) becomes LEGACY_ADJUSTMENT.
ALTER TABLE "point_transactions"
  ALTER COLUMN "reason" TYPE "PointReason"
  USING (
    CASE regexp_replace("reason", '_REVERTED$', '')
      WHEN 'MATERIAL_APPROVED' THEN 'MATERIAL_PUBLISHED'
      WHEN 'MATERIAL_PUBLISHED' THEN 'MATERIAL_PUBLISHED'
      WHEN 'COURSE_REVIEWED' THEN 'COURSE_REVIEWED'
      WHEN 'EXAM_EXPERIENCE_SHARED' THEN 'EXAM_EXPERIENCE_SHARED'
      WHEN 'GUIDE_CREATED' THEN 'GUIDE_CREATED'
      ELSE 'LEGACY_ADJUSTMENT'
    END
  )::"PointReason";

-- AlterTable
ALTER TABLE "point_transactions"
  ADD COLUMN "idempotency_key" VARCHAR(250),
  ADD COLUMN "reverses_id" UUID;

UPDATE "point_transactions" SET "idempotency_key" = 'legacy:' || "id";

ALTER TABLE "point_transactions" ALTER COLUMN "idempotency_key" SET NOT NULL;

-- DropIndex
DROP INDEX "point_transactions_user_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "point_transactions_idempotency_key_key" ON "point_transactions"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "point_transactions_reverses_id_key" ON "point_transactions"("reverses_id");

-- CreateIndex
CREATE INDEX "point_transactions_user_id_created_at_idx" ON "point_transactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "point_transactions_reason_reference_id_idx" ON "point_transactions"("reason", "reference_id");

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_reverses_id_fkey" FOREIGN KEY ("reverses_id") REFERENCES "point_transactions"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
