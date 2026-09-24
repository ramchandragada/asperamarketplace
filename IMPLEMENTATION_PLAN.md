# Implementation plan

Phase 0 is complete for discovery and planning. Phase 1 is complete on `cursor/phase-1-foundations-10f6`: the application shell and the first non-production platform migration. Marketplace domain features start in Phase 2.

Starting commit inspected: `bff8c577c6b1348b4b9cd87bf47c073ea65068d6` on `main`.  
Phase 0 branch: `cursor/phase-0-discovery-10f6`.  
Phase 1 branch: `cursor/phase-1-foundations-10f6`.

## Baseline checks

Recorded 2026-09-24 before any product code existed.

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | No script. `package.json` is absent. | Not runnable |
| Lint | No script. ESLint is not configured. | Not runnable |
| Unit tests | No script. No test runner. | Not runnable |
| Integration tests | No script. No database. | Not runnable |
| Application build | No script. | Not runnable |
| Vercel production build | Deployment `dpl_DUinJHJE55SJ2CYBTkVF59xMfD98` for `bff8c57` | State `READY`. Build warned that output has no `functions`, `static`, or `services` directory. Public URL returned HTTP 404 `NOT_FOUND`. |
| Local toolchain on the audit machine | `node -v`, `npm -v`, `pnpm -v` | Node.js v22.14.0, npm 10.9.7, pnpm 10.33.3. Not pinned by the repository. Vercel project Node setting is 24.x. |

## Phase 1 slice 1 checks

Recorded 2026-09-24 on Node.js v24.21.0 and pnpm 10.33.3.

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | Passed |
| Lint | `pnpm lint` | Passed. npm warns that ESLint 9.39.5 is deprecated. See D-014. |
| Unit tests | `pnpm test` | Passed. 4 files, 8 tests at that time. |
| Application build | `pnpm build` | Passed |
| Local smoke | `pnpm start`, `curl` | `GET /` and `GET /api/health` returned HTTP 200 with `database: not_configured` |
| GitHub Actions | Run `36017324374` on pull request #2 | Passed |
| Vercel production | Unchanged | `main` still empty deploy of `bff8c57` |

## Phase 1 slice 2 checks

Recorded 2026-09-24 after the platform migration against local PostgreSQL 16.

| Check | Command | Result |
| --- | --- | --- |
| Schema checkpoint | `docs/schema-checkpoints/2026-09-24-platform-tables.sql` | Committed before Prisma migrate |
| Migration | `pnpm exec prisma migrate dev --name platform_foundation` | Applied `20260924150842_platform_foundation` to `aspera_marketplace_dev` |
| Typecheck | `pnpm typecheck` | Passed |
| Lint | `pnpm lint` | Passed |
| Unit and integration tests | `pnpm test` | Passed. 12 passed, 1 skipped (the no-database skip case when `DATABASE_URL` is set). Integration covered connection and a transactional feature-flag + audit + outbox write. |
| Application build | `pnpm build` | Passed. `/` and `/api/health` are dynamic. |
| Local smoke | `pnpm start`, `curl` | `GET /api/health` returned `database: configured`. Home page showed Configured. |
| Production | Unchanged | No production database. Migration not pointed at production. |
| Railway | Not connected | Local PostgreSQL and `docker-compose.yml` are the non-production path for this slice. |
| GitHub Actions | Run `36018512468` on pull request #2 | Passed: Postgres service, migrate, typecheck, lint, test, and build. |

## Phase 0 exit criteria

| Criterion | Result |
| --- | --- |
| Git remote, branch, and clean tree inspected | Met |
| Stack, database, env, CI, Vercel, and Railway inspected | Met |
| Discovery documents | Met |
| Baseline checks recorded | Met |
| Marketplace code | Not started in Phase 0 |
| Prisma installed | Deferred to Phase 1 slice 2 |

## Phase 1 exit criteria

| Criterion | Result |
| --- | --- |
| Node and package manager pinned | Met. Node.js 24.21.0, pnpm 10.33.3 |
| Next.js app, health route, API envelope, redacting logs | Met |
| `.env.example`, `.gitignore`, CI | Met |
| Non-production Postgres | Met. Local PostgreSQL 16 in this environment. `docker-compose.yml` for other machines |
| Schema checkpoint then Prisma migration | Met. Platform tables only |
| Rollback documented | Met. `docs/MIGRATIONS.md` |
| Marketplace screens | Not started, by design |
| Production database | None. Not migrated |

## Sequence after Phase 1

Work one vertical slice at a time. Do not start Phase 2 until Phase 1 checks remain green on the branch.

### Phase 2 — Identity and seller onboarding

Authentication, server-side RBAC, seller KYC states, document storage port, approval queue, and audit log. One seller can be approved in the local mock environment.

### Phase 3 — Catalogue and discovery

Categories, products, variants, inventory quantities, moderation queue, public browse, PostgreSQL search and filters.

### Phase 4 — Cart and checkout

Multi-seller cart, address, shipping estimate, server-side price snapshot, tax trace, coupon validation, atomic stock reservation, checkout review. No live payment.

### Phase 5 — Payments and orders

Mock payment provider, webhook verification and replay rejection, order state machine, invoice document, notification port, failure recovery.

### Phase 6 — Fulfilment and customer care

Seller processing, shipment mock, tracking, partial cancellation, returns, refunds, tickets, disputes.

### Phase 7 — Finance

Double-entry ledger, commissions, settlement rules, reconciliation exceptions, exports, finance console.

### Phase 8 — Trust, safety, and compliance operations

Risk cases with reason codes and appeals, counterfeit queue, review moderation, privacy requests, compliance register evidence.

### Phase 9 — Analytics and optimisation

Event taxonomy first, then dashboards, search analytics, seller health, and experiments with guardrails.

### Phase 10 — Production hardening

Security review, accessibility review against WCAG 2.2 AA as a quality goal, load test, backup restore drill, observability, and a launch checklist. Launch still requires the open legal decisions in `ASSUMPTIONS.md`.

## Documents for this phase

- `SECURITY.md`, `RUNBOOK.md`, `API.md`, `DESIGN_SYSTEM.md`, `TESTING.md`
- `docs/MIGRATIONS.md` for the first migration and rollback
- `COMPLIANCE_REGISTER.md` still waits for an owner and evidence model

## Definition of done for every later slice

1. Schema, API, UI, tests, and docs for that slice are listed before editing.
2. Typecheck, lint, unit tests, and the relevant end-to-end path are run.
3. Failures are fixed or recorded. A recorded failure means the slice is not complete.
4. `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, and `RISK_REGISTER.md` are updated.
5. The commit is pushed. Production is unchanged unless the slice was an intentional, checked deploy from `main`.
