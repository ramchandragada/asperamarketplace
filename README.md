# Aspera Marketplace

India-first multi-vendor marketplace. Phase 2 is in progress on this branch: authentication, seller KYC onboarding, document upload, and admin approval. Catalogue, checkout, and payments are not implemented.

Source of truth: https://github.com/ramchandragada/asperamarketplace

## Requirements

- Node.js 24.21.0 (`.nvmrc`)
- pnpm 10.33.3
- PostgreSQL 16 for local development

## Local setup

```bash
docker compose up -d   # or local Postgres 16
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

- `/register`, `/login`, `/account`
- `/seller/onboarding`
- `/admin/sellers` (admin role)
- `/api/health`

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Docs

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

Next phase after review: catalogue and discovery.
