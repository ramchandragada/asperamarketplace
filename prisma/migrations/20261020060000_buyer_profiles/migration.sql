-- CreateTable
CREATE TABLE "public"."buyer_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" TEXT,
    "gstin" TEXT,
    "tax_invoice_preferred" BOOLEAN NOT NULL DEFAULT false,
    "preferred_payment_method" TEXT NOT NULL DEFAULT 'mock',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "buyer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buyer_profiles_user_id_key" ON "public"."buyer_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "public"."buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
