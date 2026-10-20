-- Admin TOTP + settlement marketplace TCS columns
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "totp_secret_enc" TEXT,
  ADD COLUMN IF NOT EXISTS "totp_enabled_at" TIMESTAMPTZ(6);

ALTER TABLE "settlement_batches"
  ADD COLUMN IF NOT EXISTS "tcs_paise" INTEGER NOT NULL DEFAULT 0;
