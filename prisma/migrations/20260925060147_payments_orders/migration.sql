-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('awaiting_payment', 'paid', 'payment_failed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."FulfilmentGroupStatus" AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."PaymentAttemptStatus" AS ENUM ('created', 'pending', 'succeeded', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('draft', 'issued', 'voided');

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "checkout_session_id" UUID NOT NULL,
    "address_id" UUID NOT NULL,
    "status" "public"."OrderStatus" NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'INR',
    "snapshot" JSONB NOT NULL,
    "subtotal_paise" INTEGER NOT NULL,
    "discount_paise" INTEGER NOT NULL DEFAULT 0,
    "shipping_paise" INTEGER NOT NULL DEFAULT 0,
    "tax_paise" INTEGER NOT NULL DEFAULT 0,
    "total_paise" INTEGER NOT NULL,
    "status_reason" TEXT,
    "paid_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_fulfilment_groups" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "status" "public"."FulfilmentGroupStatus" NOT NULL DEFAULT 'pending',
    "line_total_paise" INTEGER NOT NULL,
    "shipping_paise" INTEGER NOT NULL DEFAULT 0,
    "status_reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_fulfilment_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_lines" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "fulfilment_group_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "product_title" TEXT NOT NULL,
    "variant_title" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_paise" INTEGER NOT NULL,
    "line_total_paise" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_attempts" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "provider_reference" TEXT NOT NULL,
    "status" "public"."PaymentAttemptStatus" NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'INR',
    "client_secret" TEXT,
    "failure_reason" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "raw_create_response" JSONB,
    "paid_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "payment_attempt_id" UUID,
    "event_type" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "signature_valid" BOOLEAN NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processing_error" TEXT,
    "raw_payload" JSONB NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'draft',
    "currency_code" TEXT NOT NULL DEFAULT 'INR',
    "total_paise" INTEGER NOT NULL,
    "document" JSONB NOT NULL,
    "storage_key" TEXT,
    "issued_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_messages" (
    "id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider_ref" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(6),

    CONSTRAINT "notification_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "public"."orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_checkout_session_id_key" ON "public"."orders"("checkout_session_id");

-- CreateIndex
CREATE INDEX "orders_user_id_status_idx" ON "public"."orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "public"."orders"("status");

-- CreateIndex
CREATE INDEX "order_fulfilment_groups_order_id_idx" ON "public"."order_fulfilment_groups"("order_id");

-- CreateIndex
CREATE INDEX "order_fulfilment_groups_seller_id_status_idx" ON "public"."order_fulfilment_groups"("seller_id", "status");

-- CreateIndex
CREATE INDEX "order_lines_order_id_idx" ON "public"."order_lines"("order_id");

-- CreateIndex
CREATE INDEX "order_lines_fulfilment_group_id_idx" ON "public"."order_lines"("fulfilment_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_provider_reference_key" ON "public"."payment_attempts"("provider_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_idempotency_key_key" ON "public"."payment_attempts"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_attempts_order_id_idx" ON "public"."payment_attempts"("order_id");

-- CreateIndex
CREATE INDEX "payment_attempts_user_id_idx" ON "public"."payment_attempts"("user_id");

-- CreateIndex
CREATE INDEX "payment_attempts_status_idx" ON "public"."payment_attempts"("status");

-- CreateIndex
CREATE INDEX "payment_webhook_events_payment_attempt_id_idx" ON "public"."payment_webhook_events"("payment_attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_provider_event_id_key" ON "public"."payment_webhook_events"("provider", "provider_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "public"."invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_order_id_idx" ON "public"."invoices"("order_id");

-- CreateIndex
CREATE INDEX "notification_messages_status_created_at_idx" ON "public"."notification_messages"("status", "created_at");

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_checkout_session_id_fkey" FOREIGN KEY ("checkout_session_id") REFERENCES "public"."checkout_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_fulfilment_groups" ADD CONSTRAINT "order_fulfilment_groups_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_fulfilment_groups" ADD CONSTRAINT "order_fulfilment_groups_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_lines" ADD CONSTRAINT "order_lines_fulfilment_group_id_fkey" FOREIGN KEY ("fulfilment_group_id") REFERENCES "public"."order_fulfilment_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_attempts" ADD CONSTRAINT "payment_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_payment_attempt_id_fkey" FOREIGN KEY ("payment_attempt_id") REFERENCES "public"."payment_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
