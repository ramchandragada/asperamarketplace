-- CreateEnum
CREATE TYPE "public"."CartStatus" AS ENUM ('open', 'checked_out', 'abandoned');

-- CreateEnum
CREATE TYPE "public"."CheckoutStatus" AS ENUM ('draft', 'reserved', 'expired', 'cancelled', 'converted');

-- CreateTable
CREATE TABLE "public"."carts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "public"."CartStatus" NOT NULL DEFAULT 'open',
    "currency_code" TEXT NOT NULL DEFAULT 'INR',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cart_items" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Home',
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."checkout_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "address_id" UUID NOT NULL,
    "status" "public"."CheckoutStatus" NOT NULL DEFAULT 'draft',
    "currency_code" TEXT NOT NULL DEFAULT 'INR',
    "coupon_code" TEXT,
    "snapshot" JSONB NOT NULL,
    "subtotal_paise" INTEGER NOT NULL,
    "discount_paise" INTEGER NOT NULL DEFAULT 0,
    "shipping_paise" INTEGER NOT NULL DEFAULT 0,
    "tax_paise" INTEGER NOT NULL DEFAULT 0,
    "total_paise" INTEGER NOT NULL,
    "reserved_until" TIMESTAMPTZ(6),
    "idempotency_key" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "carts_user_id_status_idx" ON "public"."carts"("user_id", "status");

-- CreateIndex
CREATE INDEX "cart_items_variant_id_idx" ON "public"."cart_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_variant_id_key" ON "public"."cart_items"("cart_id", "variant_id");

-- CreateIndex
CREATE INDEX "customer_addresses_user_id_idx" ON "public"."customer_addresses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_sessions_idempotency_key_key" ON "public"."checkout_sessions"("idempotency_key");

-- CreateIndex
CREATE INDEX "checkout_sessions_user_id_status_idx" ON "public"."checkout_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "checkout_sessions_cart_id_idx" ON "public"."checkout_sessions"("cart_id");

-- AddForeignKey
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_addresses" ADD CONSTRAINT "customer_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."checkout_sessions" ADD CONSTRAINT "checkout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."checkout_sessions" ADD CONSTRAINT "checkout_sessions_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."checkout_sessions" ADD CONSTRAINT "checkout_sessions_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
