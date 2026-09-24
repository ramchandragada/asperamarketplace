# Migrations

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

1. Start PostgreSQL 16. Prefer `docker compose up -d` when Docker is available. This environment used a local apt install of PostgreSQL 16 because Docker was not installed.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to the non-production database.
3. Run `pnpm db:migrate` (`prisma migrate deploy`) or `pnpm db:migrate:dev` while editing the schema.
4. Confirm with `pnpm db:status`.

The local development password in `.env.example` and `docker-compose.yml` is fictional and development-only. Change it for any shared environment.

## Compatibility

The catalogue migration is additive. It creates catalogue and inventory tables and a GIN search index. It does not drop identity or platform tables. Launch category taxonomy remains an open business decision (A-26); seed uses a generic configurable category only.

## Rollback

| Situation | Action |
| --- | --- |
| Local disposable database | Drop the database, recreate it, and migrate again. Example: `dropdb aspera_marketplace_dev && createdb -O aspera_dev aspera_marketplace_dev && pnpm db:migrate` |
| Shared non-production database with no important data | Same as local, after confirming the target is not production |
| Shared non-production database that must keep other data | Restore from a host backup taken before the migration. Do not hand-edit `_prisma_migrations` |
| Production | Not authorized for this migration. Production had no marketplace database when this slice shipped |

Prisma does not emit automatic down SQL for this migration. Reversal is restore or recreate, not an in-place reverse script.

## CI

GitHub Actions starts a PostgreSQL 16 service, runs `pnpm db:migrate`, then typecheck, lint, test, and build. The CI password matches the fictional local compose password and is not a production secret.
