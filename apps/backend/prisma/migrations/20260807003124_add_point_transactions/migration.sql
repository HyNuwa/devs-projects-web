-- CreateTable
CREATE TABLE "point_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "reference_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "point_transactions_user_id_idx" ON "point_transactions"("user_id");

-- CreateIndex
CREATE INDEX "point_transactions_created_at_idx" ON "point_transactions"("created_at");

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
