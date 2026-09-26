-- CreateEnum
CREATE TYPE "public"."LedgerAccountType" AS ENUM ('asset', 'liability', 'revenue', 'expense', 'equity');

-- CreateEnum
CREATE TYPE "public"."JournalEntryStatus" AS ENUM ('draft', 'posted', 'reversed');

-- CreateEnum
CREATE TYPE "public"."SettlementStatus" AS ENUM ('pending', 'held', 'released', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "public"."ReconciliationStatus" AS ENUM ('open', 'investigating', 'resolved', 'written_off');

-- CreateTable
CREATE TABLE "public"."ledger_accounts" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_type" "public"."LedgerAccountType" NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'INR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journal_entries" (
    "id" UUID NOT NULL,
    "entry_number" TEXT NOT NULL,
    "status" "public"."JournalEntryStatus" NOT NULL DEFAULT 'draft',
    "memo" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "order_id" UUID,
    "seller_id" UUID,
    "source_event" TEXT NOT NULL,
    "posted_at" TIMESTAMPTZ(6),
    "reversed_entry_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journal_lines" (
    "id" UUID NOT NULL,
    "journal_entry_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "debit_paise" INTEGER NOT NULL DEFAULT 0,
    "credit_paise" INTEGER NOT NULL DEFAULT 0,
    "seller_id" UUID,
    "order_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."commission_rules" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rate_bps" INTEGER NOT NULL,
    "seller_id" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settlement_batches" (
    "id" UUID NOT NULL,
    "batch_number" TEXT NOT NULL,
    "seller_id" UUID NOT NULL,
    "status" "public"."SettlementStatus" NOT NULL DEFAULT 'pending',
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "gross_paise" INTEGER NOT NULL,
    "commission_paise" INTEGER NOT NULL,
    "net_paise" INTEGER NOT NULL,
    "hold_reason" TEXT,
    "released_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settlement_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settlement_lines" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "fulfilment_group_id" UUID NOT NULL,
    "gross_paise" INTEGER NOT NULL,
    "commission_paise" INTEGER NOT NULL,
    "net_paise" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reconciliation_exceptions" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount_paise" INTEGER,
    "status" "public"."ReconciliationStatus" NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "reconciliation_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_code_key" ON "public"."ledger_accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_entry_number_key" ON "public"."journal_entries"("entry_number");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_reversed_entry_id_key" ON "public"."journal_entries"("reversed_entry_id");

-- CreateIndex
CREATE INDEX "journal_entries_order_id_idx" ON "public"."journal_entries"("order_id");

-- CreateIndex
CREATE INDEX "journal_entries_seller_id_idx" ON "public"."journal_entries"("seller_id");

-- CreateIndex
CREATE INDEX "journal_entries_status_posted_at_idx" ON "public"."journal_entries"("status", "posted_at");

-- CreateIndex
CREATE INDEX "journal_lines_journal_entry_id_idx" ON "public"."journal_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "journal_lines_account_id_idx" ON "public"."journal_lines"("account_id");

-- CreateIndex
CREATE INDEX "commission_rules_seller_id_active_idx" ON "public"."commission_rules"("seller_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_batches_batch_number_key" ON "public"."settlement_batches"("batch_number");

-- CreateIndex
CREATE INDEX "settlement_batches_seller_id_status_idx" ON "public"."settlement_batches"("seller_id", "status");

-- CreateIndex
CREATE INDEX "settlement_lines_batch_id_idx" ON "public"."settlement_lines"("batch_id");

-- CreateIndex
CREATE INDEX "settlement_lines_order_id_idx" ON "public"."settlement_lines"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_lines_fulfilment_group_id_key" ON "public"."settlement_lines"("fulfilment_group_id");

-- CreateIndex
CREATE INDEX "reconciliation_exceptions_status_kind_idx" ON "public"."reconciliation_exceptions"("status", "kind");

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_reversed_entry_id_fkey" FOREIGN KEY ("reversed_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_lines" ADD CONSTRAINT "journal_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_lines" ADD CONSTRAINT "journal_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."settlement_lines" ADD CONSTRAINT "settlement_lines_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."settlement_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."settlement_lines" ADD CONSTRAINT "settlement_lines_fulfilment_group_id_fkey" FOREIGN KEY ("fulfilment_group_id") REFERENCES "public"."order_fulfilment_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

