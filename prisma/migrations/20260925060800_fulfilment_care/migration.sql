-- CreateEnum
CREATE TYPE "public"."ReturnStatus" AS ENUM ('requested', 'approved', 'rejected', 'received', 'closed');

-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('pending', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "public"."DisputeStatus" AS ENUM ('opened', 'under_review', 'resolved', 'closed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."OrderStatus" ADD VALUE 'partially_cancelled';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'fulfilled';

-- AlterTable
ALTER TABLE "public"."order_fulfilment_groups" ADD COLUMN     "cancelled_at" TIMESTAMPTZ(6),
ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "delivered_at" TIMESTAMPTZ(6),
ADD COLUMN     "shipped_at" TIMESTAMPTZ(6),
ADD COLUMN     "tracking_number" TEXT,
ADD COLUMN     "tracking_url" TEXT;

-- CreateTable
CREATE TABLE "public"."shipments" (
    "id" UUID NOT NULL,
    "fulfilment_group_id" UUID NOT NULL,
    "carrier" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "tracking_url" TEXT,
    "label_storage_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."return_requests" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "status" "public"."ReturnStatus" NOT NULL DEFAULT 'requested',
    "reason" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "order_line_id" UUID,
    "status_reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refunds" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "return_request_id" UUID,
    "amount_paise" INTEGER NOT NULL,
    "status" "public"."RefundStatus" NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "provider_reference" TEXT,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."support_tickets" (
    "id" UUID NOT NULL,
    "order_id" UUID,
    "user_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."disputes" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "public"."DisputeStatus" NOT NULL DEFAULT 'opened',
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipments_fulfilment_group_id_key" ON "public"."shipments"("fulfilment_group_id");

-- CreateIndex
CREATE INDEX "return_requests_order_id_idx" ON "public"."return_requests"("order_id");

-- CreateIndex
CREATE INDEX "return_requests_user_id_idx" ON "public"."return_requests"("user_id");

-- CreateIndex
CREATE INDEX "return_requests_seller_id_status_idx" ON "public"."return_requests"("seller_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_return_request_id_key" ON "public"."refunds"("return_request_id");

-- CreateIndex
CREATE INDEX "refunds_order_id_idx" ON "public"."refunds"("order_id");

-- CreateIndex
CREATE INDEX "support_tickets_user_id_status_idx" ON "public"."support_tickets"("user_id", "status");

-- CreateIndex
CREATE INDEX "support_tickets_order_id_idx" ON "public"."support_tickets"("order_id");

-- CreateIndex
CREATE INDEX "disputes_order_id_idx" ON "public"."disputes"("order_id");

-- CreateIndex
CREATE INDEX "disputes_seller_id_status_idx" ON "public"."disputes"("seller_id", "status");

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_fulfilment_group_id_fkey" FOREIGN KEY ("fulfilment_group_id") REFERENCES "public"."order_fulfilment_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_return_request_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "public"."return_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_tickets" ADD CONSTRAINT "support_tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disputes" ADD CONSTRAINT "disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

