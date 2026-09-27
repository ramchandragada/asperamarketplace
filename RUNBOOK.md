# Runbook

## Start locally

1. Install Node.js 24.21.0 and pnpm 10.33.3.
2. Start PostgreSQL 16 (`docker compose up -d` or local install).
3. Copy `.env.example` to `.env` and set `DATABASE_URL` to the non-production database.
4. Run `pnpm install`, `pnpm db:migrate`, and `pnpm db:seed`.
5. Run `pnpm dev` or `pnpm build && pnpm start`.

Seeded accounts are documented in `README.md`. They are fictional.

## Seller approval smoke

1. Sign in as the seeded seller, open `/seller/onboarding`, create a draft, upload a PDF, submit.
2. Sign in as the seeded admin, open `/admin/sellers`, approve.
3. Confirm an audit row and `SellerApproved` outbox event exist.

## Migrations

See [docs/MIGRATIONS.md](docs/MIGRATIONS.md). Confirm the target is not production before every migrate.

## Checks

`pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`. CI migrates a disposable Postgres service first.

## Deploy / rollback

Vercel production still tracks `main` and has no marketplace database. Application rollback is a previous Vercel deployment. Database rollback for disposable non-prod is drop/recreate/migrate.
