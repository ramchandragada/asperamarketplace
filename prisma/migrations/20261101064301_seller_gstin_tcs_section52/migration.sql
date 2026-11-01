-- Seller public GSTIN + pickup / fulfilment disclosure (ECO marketplace).
ALTER TABLE "sellers"
  ADD COLUMN IF NOT EXISTS "gstin" TEXT,
  ADD COLUMN IF NOT EXISTS "pickup_city" TEXT,
  ADD COLUMN IF NOT EXISTS "fulfilment_by" TEXT NOT NULL DEFAULT 'seller_shop';

CREATE UNIQUE INDEX IF NOT EXISTS "sellers_gstin_key" ON "sellers"("gstin");

-- Settlement batch: GST s.52 TCS break-up (replaces treating tcs_paise as 206C-only).
ALTER TABLE "settlement_batches"
  ADD COLUMN IF NOT EXISTS "tcs_cgst_paise" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tcs_sgst_paise" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tcs_igst_paise" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tcs_supply_type" TEXT,
  ADD COLUMN IF NOT EXISTS "tcs_gstin" TEXT;

COMMENT ON COLUMN "settlement_batches"."tcs_paise" IS 'GST TCS u/s 52 total (CGST+SGST or IGST) withheld from seller net';

-- Per-seller TCS collection lines for GSTR-8 export (order paid).
CREATE TABLE IF NOT EXISTS "tcs_collection_lines" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "seller_id" UUID NOT NULL,
  "seller_gstin" TEXT NOT NULL,
  "supply_type" TEXT NOT NULL,
  "taxable_paise" INTEGER NOT NULL,
  "cgst_paise" INTEGER NOT NULL DEFAULT 0,
  "sgst_paise" INTEGER NOT NULL DEFAULT 0,
  "igst_paise" INTEGER NOT NULL DEFAULT 0,
  "tcs_paise" INTEGER NOT NULL,
  "tcs_gstin" TEXT NOT NULL,
  "period_month" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tcs_collection_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tcs_collection_lines_order_seller_key"
  ON "tcs_collection_lines"("order_id", "seller_id");
CREATE INDEX IF NOT EXISTS "tcs_collection_lines_period_month_idx"
  ON "tcs_collection_lines"("period_month");
CREATE INDEX IF NOT EXISTS "tcs_collection_lines_seller_id_idx"
  ON "tcs_collection_lines"("seller_id");

ALTER TABLE "tcs_collection_lines"
  ADD CONSTRAINT "tcs_collection_lines_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tcs_collection_lines"
  ADD CONSTRAINT "tcs_collection_lines_seller_id_fkey"
  FOREIGN KEY ("seller_id") REFERENCES "sellers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed / demo sellers without a real Regular GSTIN must not stay live.
UPDATE "sellers"
SET
  "status" = 'suspended',
  "status_reason" = 'Missing Regular GSTIN — complete KYC before catalogue goes live',
  "approved_at" = NULL,
  "updated_at" = CURRENT_TIMESTAMP
WHERE ("gstin" IS NULL OR btrim("gstin") = '')
  AND "status" IN ('approved', 'under_review', 'submitted');

UPDATE "products" AS p
SET
  "status" = 'draft',
  "published_at" = NULL,
  "updated_at" = CURRENT_TIMESTAMP
FROM "sellers" AS s
WHERE p."seller_id" = s."id"
  AND (s."gstin" IS NULL OR btrim(s."gstin") = '')
  AND p."status" = 'approved';
