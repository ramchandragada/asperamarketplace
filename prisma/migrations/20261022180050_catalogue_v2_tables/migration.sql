-- CreateEnum
CREATE TYPE "public"."OfferCondition" AS ENUM ('new', 'refurbished', 'used');

-- CreateTable
CREATE TABLE "public"."catalogue_products" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "category_id" UUID NOT NULL,
    "brand_id" UUID,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'draft',
    "status_reason" TEXT,
    "country_of_origin" TEXT,
    "hsn_code" TEXT,
    "attributes" JSONB,
    "search_document" TEXT NOT NULL DEFAULT '',
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "catalogue_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."catalogue_images" (
    "id" UUID NOT NULL,
    "catalogue_product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalogue_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."catalogue_variants" (
    "id" UUID NOT NULL,
    "catalogue_product_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "option_values" JSONB,
    "mrp_paise" INTEGER,
    "weight_grams" INTEGER,
    "gtin" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalogue_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."seller_offers" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "catalogue_variant_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "selling_price_paise" INTEGER NOT NULL,
    "mrp_paise" INTEGER NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'INR',
    "condition" "public"."OfferCondition" NOT NULL DEFAULT 'new',
    "dispatch_days" INTEGER,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'draft',
    "status_reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seller_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."offer_inventory" (
    "id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "on_hand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "damaged" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "offer_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalogue_products_slug_key" ON "public"."catalogue_products"("slug");

-- CreateIndex
CREATE INDEX "catalogue_products_category_id_idx" ON "public"."catalogue_products"("category_id");

-- CreateIndex
CREATE INDEX "catalogue_products_brand_id_idx" ON "public"."catalogue_products"("brand_id");

-- CreateIndex
CREATE INDEX "catalogue_products_status_idx" ON "public"."catalogue_products"("status");

-- CreateIndex
CREATE INDEX "catalogue_images_catalogue_product_id_sort_order_idx" ON "public"."catalogue_images"("catalogue_product_id", "sort_order");

-- CreateIndex
CREATE INDEX "catalogue_variants_catalogue_product_id_idx" ON "public"."catalogue_variants"("catalogue_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_offers_sku_key" ON "public"."seller_offers"("sku");

-- CreateIndex
CREATE INDEX "seller_offers_seller_id_idx" ON "public"."seller_offers"("seller_id");

-- CreateIndex
CREATE INDEX "seller_offers_catalogue_variant_id_idx" ON "public"."seller_offers"("catalogue_variant_id");

-- CreateIndex
CREATE INDEX "seller_offers_status_idx" ON "public"."seller_offers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "seller_offers_seller_id_catalogue_variant_id_key" ON "public"."seller_offers"("seller_id", "catalogue_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_inventory_offer_id_key" ON "public"."offer_inventory"("offer_id");

-- AddForeignKey
ALTER TABLE "public"."catalogue_products" ADD CONSTRAINT "catalogue_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."catalogue_products" ADD CONSTRAINT "catalogue_products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."catalogue_images" ADD CONSTRAINT "catalogue_images_catalogue_product_id_fkey" FOREIGN KEY ("catalogue_product_id") REFERENCES "public"."catalogue_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."catalogue_variants" ADD CONSTRAINT "catalogue_variants_catalogue_product_id_fkey" FOREIGN KEY ("catalogue_product_id") REFERENCES "public"."catalogue_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seller_offers" ADD CONSTRAINT "seller_offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seller_offers" ADD CONSTRAINT "seller_offers_catalogue_variant_id_fkey" FOREIGN KEY ("catalogue_variant_id") REFERENCES "public"."catalogue_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offer_inventory" ADD CONSTRAINT "offer_inventory_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."seller_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
