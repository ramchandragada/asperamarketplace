# Aspera Marketplace

India-first multi-vendor marketplace. Engineering through Phase 10 + continuity (PR #12) and the storefront/seller-shell UX slice live on stacked `cursor/*-10f6` branches. Tip for this work: `cursor/ux-storefront-seller-shell-10f6` (based on `cursor/post-phase-10-continuity-10f6`). Production launch remains blocked on open legal items A-20–A-28 in `ASSUMPTIONS.md`.

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
| Seller owner (home) | `seller@aspera.local` | `AsperaSellerDevOnly1!` |
| Seller fashion | `seller.fashion@aspera.local` | `AsperaFashionDevOnly1!` |
| Seller tech | `seller.tech@aspera.local` | `AsperaTechDevOnly1!` |
| Seller wellness | `seller.wellness@aspera.local` | `AsperaWellnessDevOnly1!` |
| Seller ops | `seller.ops@aspera.local` | `AsperaOpsDevOnly1!` |
| Seller finance | `seller.finance@aspera.local` | `AsperaFinanceDevOnly1!` |
| Seller support | `seller.support@aspera.local` | `AsperaSupportDevOnly1!` |

Catalogue seed: **12 categories**, **≥10 products each** (see `docs/CATALOGUE_SEED.md`). Run `pnpm db:migrate && pnpm db:seed` on non-production only.

### Useful routes

- `/`, `/browse`, `/products/[slug]`, `/cart`, `/checkout`, `/orders`
- `/seller` (action dashboard), `/seller/catalogue`, `/seller/fulfilment`, `/seller/finance`, `/seller/compliance`, `/seller/profile`, `/seller/analytics`, `/seller/onboarding`
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

- [docs/UX_REDESIGN_AUDIT.md](docs/UX_REDESIGN_AUDIT.md)
- [docs/CONTINUE-FROM-ANY-CURSOR.md](docs/CONTINUE-FROM-ANY-CURSOR.md)
- [docs/CONTINUATION_AUDIT_PR12.md](docs/CONTINUATION_AUDIT_PR12.md)
- [COMPLIANCE_REGISTER.md](COMPLIANCE_REGISTER.md)
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DECISIONS.md](DECISIONS.md)
- [ASSUMPTIONS.md](ASSUMPTIONS.md)
- [RISK_REGISTER.md](RISK_REGISTER.md)
- [SECURITY.md](SECURITY.md)
- [TESTING.md](TESTING.md)

`asperamarketplace.vercel.app` tracks `main` (still initial README only) and returns 404 until stacked PRs are deliberately merged. Use the PR preview for demos.

Launch is not cleared until A-20–A-28 are decided and the launch checklist is green.
