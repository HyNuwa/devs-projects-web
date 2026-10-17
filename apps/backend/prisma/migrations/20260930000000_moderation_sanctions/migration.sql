-- Sanciones, propuestas de suspensión y apelaciones (docs/README_MODERACION.md §6–§7).
-- 1. Structures generated from schema.prisma
-- CreateEnum
CREATE TYPE "SanctionType" AS ENUM ('WARNING', 'MUTE', 'SUSPENSION');

-- CreateEnum
CREATE TYPE "SuspensionProposalStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AppealKind" AS ENUM ('RETIRO', 'SANCTION');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ModerationEventAction" ADD VALUE 'WARNED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'MUTED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'SUSPENDED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'SANCTION_LIFTED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'SUSPENSION_PROPOSED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'SUSPENSION_REJECTED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'APPEAL_FILED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'APPEAL_ACCEPTED';
ALTER TYPE "ModerationEventAction" ADD VALUE 'APPEAL_REJECTED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "banned_until" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "moderation_cases" ADD COLUMN     "reverted_at" TIMESTAMP(3),
ADD COLUMN     "target_author_id" UUID;

-- CreateTable
CREATE TABLE "sanctions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "SanctionType" NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3),
    "applied_by_id" UUID NOT NULL,
    "case_id" UUID,
    "lifted_at" TIMESTAMP(3),
    "lifted_by_id" UUID,
    "lift_reason" VARCHAR(1000),
    "voided_at" TIMESTAMP(3),
    "voided_by_appeal_id" UUID,
    "seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sanctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspension_proposals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "proposed_by_id" UUID NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "duration_days" INTEGER,
    "case_id" UUID,
    "status" "SuspensionProposalStatus" NOT NULL DEFAULT 'PENDING',
    "decided_by_id" UUID,
    "decision_reason" VARCHAR(1000),
    "decided_at" TIMESTAMP(3),
    "sanction_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suspension_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appeals" (
    "id" UUID NOT NULL,
    "appellant_id" UUID NOT NULL,
    "kind" "AppealKind" NOT NULL,
    "case_id" UUID,
    "sanction_id" UUID,
    "explanation" VARCHAR(1000) NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'PENDING',
    "decided_by_id" UUID NOT NULL,
    "reviewer_id" UUID,
    "answer" VARCHAR(1000),
    "answered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appeals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sanctions_user_id_starts_at_idx" ON "sanctions"("user_id", "starts_at");

-- CreateIndex
CREATE INDEX "sanctions_case_id_idx" ON "sanctions"("case_id");

-- CreateIndex
CREATE INDEX "suspension_proposals_status_created_at_idx" ON "suspension_proposals"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "appeals_case_id_key" ON "appeals"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "appeals_sanction_id_key" ON "appeals"("sanction_id");

-- CreateIndex
CREATE INDEX "appeals_status_created_at_idx" ON "appeals"("status", "created_at");

-- CreateIndex
CREATE INDEX "moderation_cases_target_author_id_decision_closed_at_idx" ON "moderation_cases"("target_author_id", "decision", "closed_at");

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "moderation_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspension_proposals" ADD CONSTRAINT "suspension_proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_appellant_id_fkey" FOREIGN KEY ("appellant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_sanction_id_fkey" FOREIGN KEY ("sanction_id") REFERENCES "sanctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 2. Constraints Prisma cannot express

-- One PENDING suspension proposal per account.
CREATE UNIQUE INDEX "suspension_proposals_one_pending_per_user"
  ON "suspension_proposals"("user_id") WHERE "status" = 'PENDING';

-- An appeal targets exactly one decision, matching its kind.
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_one_target_check" CHECK (
  ("kind" = 'RETIRO' AND "case_id" IS NOT NULL AND "sanction_id" IS NULL)
  OR ("kind" = 'SANCTION' AND "sanction_id" IS NOT NULL AND "case_id" IS NULL)
);

-- 3. Backfill

-- The author of each caso's target, anonymous content included.
UPDATE "moderation_cases" c SET "target_author_id" = COALESCE(
  (SELECT m."author_id" FROM "materials" m WHERE m."id" = c."material_id"),
  (SELECT r."user_id" FROM "course_reviews" r WHERE r."id" = c."course_review_id"),
  (SELECT e."user_id" FROM "exam_experiences" e WHERE e."id" = c."exam_experience_id")
);

-- Retiros already undone: a restore goes through the retiro's caso and logs RESTORED with it.
UPDATE "moderation_cases" c SET "reverted_at" = restored.at
FROM (
  SELECT "case_id", min("created_at") AS at
  FROM "moderation_events"
  WHERE "action" = 'RESTORED' AND "case_id" IS NOT NULL
  GROUP BY "case_id"
) restored
WHERE restored."case_id" = c."id" AND c."decision" = 'REMOVE';
