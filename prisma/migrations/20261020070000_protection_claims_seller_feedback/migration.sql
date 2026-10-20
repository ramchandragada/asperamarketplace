-- AlterTable
ALTER TABLE "sellers" ADD COLUMN "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "sellers" ADD COLUMN "rating_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "sellers_rating_avg_idx" ON "sellers"("rating_avg");

-- CreateEnum
CREATE TYPE "ProtectionClaimType" AS ENUM ('not_delivered', 'not_as_described', 'return_not_honored', 'other');

-- CreateEnum
CREATE TYPE "ProtectionClaimStatus" AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'seller_resolved');

-- CreateTable
CREATE TABLE "protection_claims" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "order_line_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "claim_type" "ProtectionClaimType" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_urls" JSONB NOT NULL DEFAULT '[]',
    "status" "ProtectionClaimStatus" NOT NULL DEFAULT 'submitted',
    "resolution_note" TEXT,
    "refund_id" UUID,
    "seller_debit_paise" INTEGER,
    "decided_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ(6),

    CONSTRAINT "protection_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "order_line_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "shipping_rating" INTEGER,
    "packaging_rating" INTEGER,
    "accuracy_rating" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "protection_claims_user_id_status_idx" ON "protection_claims"("user_id", "status");
CREATE INDEX "protection_claims_seller_id_status_idx" ON "protection_claims"("seller_id", "status");
CREATE INDEX "protection_claims_order_id_idx" ON "protection_claims"("order_id");
CREATE INDEX "protection_claims_order_line_id_idx" ON "protection_claims"("order_line_id");
CREATE INDEX "protection_claims_status_created_at_idx" ON "protection_claims"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "seller_feedback_order_line_id_key" ON "seller_feedback"("order_line_id");
CREATE INDEX "seller_feedback_seller_id_created_at_idx" ON "seller_feedback"("seller_id", "created_at");
CREATE INDEX "seller_feedback_user_id_idx" ON "seller_feedback"("user_id");

-- AddForeignKey
ALTER TABLE "protection_claims" ADD CONSTRAINT "protection_claims_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "protection_claims" ADD CONSTRAINT "protection_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "protection_claims" ADD CONSTRAINT "protection_claims_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_feedback" ADD CONSTRAINT "seller_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "seller_feedback" ADD CONSTRAINT "seller_feedback_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
