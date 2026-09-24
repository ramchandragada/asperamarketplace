# Migrations

## First migration

Name: `20260924150842_platform_foundation`  
Checkpoint: `docs/schema-checkpoints/2026-09-24-platform-tables.sql`  
Tables: `audit_logs`, `idempotency_records`, `outbox_events`, `feature_flags`, `platform_settings`

This migration is for non-production databases. It must not be pointed at production until production credentials, backups, and a reviewed launch checklist exist.

## Apply locally

1. Start PostgreSQL 16. Prefer `docker compose up -d` when Docker is available. This environment used a local apt install of PostgreSQL 16 because Docker was not installed.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to the non-production database.
3. Run `pnpm db:migrate` (`prisma migrate deploy`) or `pnpm db:migrate:dev` while editing the schema.
4. Confirm with `pnpm db:status`.

The local development password in `.env.example` and `docker-compose.yml` is fictional and development-only. Change it for any shared environment.

## Compatibility

The migration is additive. It creates five platform tables and their indexes. It does not alter or drop existing marketplace domain tables, because none existed.

## Rollback

| Situation | Action |
| --- | --- |
| Local disposable database | Drop the database, recreate it, and migrate again. Example: `dropdb aspera_marketplace_dev && createdb -O aspera_dev aspera_marketplace_dev && pnpm db:migrate` |
| Shared non-production database with no important data | Same as local, after confirming the target is not production |
| Shared non-production database that must keep other data | Restore from a host backup taken before the migration. Do not hand-edit `_prisma_migrations` |
| Production | Not authorized for this migration. Production had no database when this slice shipped |

Prisma does not emit automatic down SQL for this migration. Reversal is restore or recreate, not an in-place reverse script.

## CI

GitHub Actions starts a PostgreSQL 16 service, runs `pnpm db:migrate`, then typecheck, lint, test, and build. The CI password matches the fictional local compose password and is not a production secret.
