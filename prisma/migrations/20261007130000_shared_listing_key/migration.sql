-- Multiple sellers can list the same shopper-facing product by sharing a listing key.
-- Each seller still owns a Product row with their own variants and inventory.
ALTER TABLE "products" ADD COLUMN "shared_listing_key" TEXT;

CREATE INDEX "products_shared_listing_key_idx" ON "products"("shared_listing_key");

CREATE UNIQUE INDEX "products_shared_listing_key_seller_id_key" ON "products"("shared_listing_key", "seller_id");
