# Aspera Marketplace

India-first multi-vendor marketplace. Engineering through Phase 10 lives on stacked `cursor/*-10f6` branches. Tip: `cursor/phase-10-hardening-launch-10f6`. Production launch remains blocked on open legal items A-20–A-28 in `ASSUMPTIONS.md`.

Source of truth: https://github.com/ramchandragada/asperamarketplace

## Work from any Cursor install

See [docs/CONTINUE-FROM-ANY-CURSOR.md](docs/CONTINUE-FROM-ANY-CURSOR.md): open this GitHub repo in Cursor (Desktop or Cloud Agent), checkout the tip branch, migrate Neon/local non-prod, run `pnpm dev`.

## Requirements

- Node.js 24.21.0 (`.nvmrc`)
- pnpm 10.33.3
- PostgreSQL 16 for local development (or shared Neon non-prod from the Vercel project)

## Local setup

```bash
docker compose up -d   # or local Postgres 16 / Neon non-prod URL
cp .env.example .env   # set DATABASE_URL to non-production only
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

App: http://localhost:3000

### Development credentials (fictional only)

| Account | Email | Password |
| --- | --- | --- |
| Admin | `admin@aspera.local` | `AsperaAdminDevOnly1!` |
| Seller | `seller@aspera.local` | `AsperaSellerDevOnly1!` |

Do not use real personal data. These passwords are for local development and CI-like smoke only.

### Useful routes

- `/register`, `/login`, `/account`, `/browse`, `/cart`, `/checkout`, `/orders`
- `/seller/onboarding`, `/seller/catalogue`, `/seller/fulfilment`, `/seller/analytics`
- `/support`, `/privacy`
- `/admin/sellers`, `/admin/products`, `/admin/finance`, `/admin/trust`, `/admin/analytics`
- `/api/health`

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Docs

- [docs/CONTINUE-FROM-ANY-CURSOR.md](docs/CONTINUE-FROM-ANY-CURSOR.md)
- [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md)
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DECISIONS.md](DECISIONS.md)
- [ASSUMPTIONS.md](ASSUMPTIONS.md)
- [RISK_REGISTER.md](RISK_REGISTER.md)
- [docs/MIGRATIONS.md](docs/MIGRATIONS.md)
- [API.md](API.md)
- [TESTING.md](TESTING.md)
- [SECURITY.md](SECURITY.md)
- [RUNBOOK.md](RUNBOOK.md)

Launch is not cleared until A-20–A-28 are decided and the launch checklist is green.
