-- DropForeignKey
ALTER TABLE "public"."carts" DROP CONSTRAINT "carts_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."protection_claims" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."refunds" ADD COLUMN     "order_line_id" UUID;

-- CreateIndex
CREATE INDEX "refunds_order_line_id_idx" ON "public"."refunds"("order_line_id");

-- AddForeignKey
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_order_line_id_fkey" FOREIGN KEY ("order_line_id") REFERENCES "public"."order_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
