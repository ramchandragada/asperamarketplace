# Migrations

## Eighth migration

Name: `20260925080000_trust_safety`  
Checkpoint: `docs/schema-checkpoints/2026-09-25-trust-safety.sql`  
Tables: `risk_cases`, `counterfeit_cases`, `product_reviews`, `privacy_requests`, `compliance_evidence`  
Enums: `RiskCaseStatus`, `CounterfeitCaseStatus`, `ReviewModerationStatus`, `PrivacyRequestStatus`, `ComplianceEvidenceStatus`

## Sixth migration

Name: `20260925060800_fulfilment_care`  
Checkpoint: `docs/schema-checkpoints/2026-09-25-fulfilment-care.sql`  
Tables: `shipments`, `return_requests`, `refunds`, `support_tickets`, `disputes`  
Enums: `ReturnStatus`, `RefundStatus`, `TicketStatus`, `DisputeStatus`  
Alters: `OrderStatus` (+`partially_cancelled`, `fulfilled`); fulfilment tracking columns

## Seventh migration

Name: `20260925070000_finance_ledger`  
Checkpoint: `docs/schema-checkpoints/2026-09-25-finance-ledger.sql`  
Tables: `ledger_accounts`, `journal_entries`, `journal_lines`, `commission_rules`, `settlement_batches`, `settlement_lines`, `reconciliation_exceptions`  
Enums: `LedgerAccountType`, `JournalEntryStatus`, `SettlementStatus`, `ReconciliationStatus`

Additive only. Mock settlements and double-entry posts on paid orders. No live payout provider.

## Fifth migration

Name: `20260925060147_payments_orders`  
Checkpoint: `docs/schema-checkpoints/2026-09-25-payments-orders.sql`  
Tables: `orders`, `order_fulfilment_groups`, `order_lines`, `payment_attempts`, `payment_webhook_events`, `invoices`, `notification_messages`  
Enums: `OrderStatus`, `FulfilmentGroupStatus`, `PaymentAttemptStatus`, `InvoiceStatus`

Additive only. Mock payment provider only. No live Razorpay credentials.

## Fourth migration

Name: `20260925040646_cart_checkout`  
Checkpoint: `docs/schema-checkpoints/2026-09-25-cart-checkout.sql`  
Tables: `carts`, `cart_items`, `customer_addresses`, `checkout_sessions`  
Enums: `CartStatus`, `CheckoutStatus`

Additive only. Server-owned checkout snapshots and stock reservations use existing `inventory_items` / `stock_movements` (movement type `reserve`). No live payment tables in this slice.

## Third migration

Name: `20260924153355_catalogue_discovery` (+ `20260924153407_products_search_gin`)  
Checkpoint: `docs/schema-checkpoints/2026-09-24-catalogue-discovery.sql`  
Tables: `categories`, `brands`, `products`, `product_variants`, `inventory_items`, `stock_movements`  
Enums: `ProductStatus`  
Indexes: standard FK/status indexes plus GIN `to_tsvector` on `products.search_document`

Additive only. Apply with `pnpm db:migrate` on a non-production database, then `pnpm db:seed` for fictional admin/seller accounts and one approved public listing.

## Second migration

Name: `20260924151736_identity_seller_onboarding`  
Checkpoint: `docs/schema-checkpoints/2026-09-24-identity-seller.sql`  
Tables: `users`, `roles`, `user_roles`, `sessions`, `login_attempts`, `sellers`, `seller_kyc_cases`, `kyc_documents`  
Enums: user status, seller status, KYC stage/status

Additive only. Apply with `pnpm db:migrate` on a non-production database, then `pnpm db:seed` for fictional admin/seller accounts.

## First migration

Name: `20260924150842_platform_foundation`  
Checkpoint: `docs/schema-checkpoints/2026-09-24-platform-tables.sql`  
Tables: `audit_logs`, `idempotency_records`, `outbox_events`, `feature_flags`, `platform_settings`

These migrations are for non-production databases. They must not be pointed at production until production credentials, backups, and a reviewed launch checklist exist.

## Apply locally

1. Start PostgreSQL 16. Prefer `docker compose up -d` when Docker is available.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to the non-production database.
3. Run `pnpm db:migrate` (`prisma migrate deploy`) or `pnpm db:migrate:dev` while editing the schema.
4. Confirm with `pnpm db:status`.

## CI

GitHub Actions starts PostgreSQL 16, runs `pnpm db:migrate`, then typecheck, lint, test, and build.
