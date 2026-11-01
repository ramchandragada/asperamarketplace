-- Seller payout bank (masked) + pickup address for courier handover.
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "pickup_line1" TEXT;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "pickup_postal_code" TEXT;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "bank_account_holder" TEXT;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "bank_name" TEXT;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "bank_ifsc" TEXT;
ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "bank_account_last4" TEXT;
