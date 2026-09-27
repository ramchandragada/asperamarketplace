-- Catalogue product images for storefront cards and PDP galleries (dev/preview seed assets).
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_images_product_id_sort_order_idx" ON "product_images"("product_id", "sort_order");

ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
