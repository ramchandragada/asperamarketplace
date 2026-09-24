# Runbook

Phase 1 foundation operations.

## Start locally

1. Install Node.js 24.21.0 and pnpm 10.33.3.
2. Start PostgreSQL 16 with `docker compose up -d`, or use a local install with database `aspera_marketplace_dev`.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` to that non-production database.
4. Run `pnpm install` and `pnpm db:migrate`.
5. Run `pnpm dev`, or `pnpm build` and `pnpm start`.
6. Open http://localhost:3000 and request http://localhost:3000/api/health.

A healthy response has HTTP 200, `code` `OK`, and `data.database` `configured` when the database is reachable.

## Migrations

See [docs/MIGRATIONS.md](docs/MIGRATIONS.md). Confirm the target is not production before every migrate. Rollback for a disposable local database is drop, recreate, and migrate again.

## Checks

`pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` are the local gate. CI also runs `pnpm db:migrate` against a disposable Postgres service.

## Deploy

Vercel builds this repository from GitHub. Production tracks `main`. This branch must not be treated as production until it is merged and a new deployment is recorded. The current production deployment is still the empty `bff8c57` build.

Railway is not connected. Do not set a production `DATABASE_URL` until a production database, backups, and a launch checklist exist.

## Rollback

Application rollback is a Vercel promotion of the previous deployment. Database rollback for this phase is recreate or restore on a non-production instance. There is no production schema to roll back.

## Incident note for this slice

If `/api/health` returns 503 with `database: unavailable`, the process is up and PostgreSQL is not reachable. Check `DATABASE_URL`, network access, and `pnpm db:status`. Logs for `health.checked` include `requestId` and `database`.
