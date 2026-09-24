# Aspera Marketplace

India-first multi-vendor marketplace. The repository currently contains the application foundation: a Next.js shell, a health check, structured logs, and the Phase 0 planning documents. Catalogue, checkout, payments, and a database are not implemented.

Source of truth: https://github.com/ramchandragada/asperamarketplace

The linked Vercel project is `asperamarketplace` on team `ramchandragadas-projects`. Production still deploys `main`. Until this foundation is merged, https://asperamarketplace.vercel.app serves the empty initial commit. Railway is not connected.

## Requirements

- Node.js 24.21.0 (`.nvmrc`)
- pnpm 10.33.3

## Local setup

```bash
pnpm install
pnpm dev
```

The app listens on http://localhost:3000. `GET /api/health` returns the service status. Copy `.env.example` to `.env.local` only when you need to override `LOG_LEVEL`. Do not put secrets in Git.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

GitHub Actions runs the same checks on pull requests and on pushes to `main`.

## Read before changing the code

- [PROJECT_AUDIT.md](PROJECT_AUDIT.md) — the empty starting point
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — what is done and the next slice
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DECISIONS.md](DECISIONS.md)
- [ASSUMPTIONS.md](ASSUMPTIONS.md)
- [RISK_REGISTER.md](RISK_REGISTER.md)
- [API.md](API.md)
- [TESTING.md](TESTING.md)
- [SECURITY.md](SECURITY.md)
- [RUNBOOK.md](RUNBOOK.md)
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)

The next slice is a non-production PostgreSQL migration for platform tables. It does not start until that database exists.
