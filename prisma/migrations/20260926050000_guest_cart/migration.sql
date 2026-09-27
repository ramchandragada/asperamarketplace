-- Guest carts: allow browsing/add-to-cart without sign-in; checkout still requires a user.
ALTER TABLE "carts" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "guest_token" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "carts_guest_token_key" ON "carts"("guest_token");
CREATE INDEX IF NOT EXISTS "carts_guest_token_status_idx" ON "carts"("guest_token", "status");
