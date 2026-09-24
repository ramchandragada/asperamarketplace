# Aspera Marketplace

India-first multi-vendor marketplace. The repository currently contains the Phase 1 foundation: a Next.js shell, platform database tables, a health check, structured logs, and planning documents. Catalogue, checkout, and payments are not implemented.

Source of truth: https://github.com/ramchandragada/asperamarketplace

The linked Vercel project is `asperamarketplace` on team `ramchandragadas-projects`. Production still deploys `main`. Until this foundation is merged, https://asperamarketplace.vercel.app serves the empty initial commit. Railway is not connected.

## Requirements

- Node.js 24.21.0 (`.nvmrc`)
- pnpm 10.33.3
- PostgreSQL 16 for local development

## Local setup

```bash
# Database: Docker when available
docker compose up -d

# Or install PostgreSQL 16 and create database aspera_marketplace_dev
# owned by role aspera_dev.

cp .env.example .env
# Set DATABASE_URL to the non-production database. Never use production.

pnpm install
pnpm db:migrate
pnpm dev
```

The app listens on http://localhost:3000. `GET /api/health` returns the service and database status.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

GitHub Actions runs migrate, then those checks, against a PostgreSQL 16 service.

## Read before changing the code

- [PROJECT_AUDIT.md](PROJECT_AUDIT.md) — the empty starting point
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — what is done and the next phase
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DECISIONS.md](DECISIONS.md)
- [ASSUMPTIONS.md](ASSUMPTIONS.md)
- [RISK_REGISTER.md](RISK_REGISTER.md)
- [docs/MIGRATIONS.md](docs/MIGRATIONS.md)
- [API.md](API.md)
- [TESTING.md](TESTING.md)
- [SECURITY.md](SECURITY.md)
- [RUNBOOK.md](RUNBOOK.md)
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)

Phase 1 is complete. The next phase is identity and seller onboarding.
