# Implementation plan

Phase 0 status: documentation written in this change. No marketplace feature is implemented. Phase 0 is complete only for discovery and planning.

Starting commit inspected: `bff8c577c6b1348b4b9cd87bf47c073ea65068d6` on `main`.  
Work branch: `cursor/phase-0-discovery-10f6`.

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

There is no failing test suite to preserve. The next slice must add the checks before it adds features, then record the first real pass or failure here.

## Phase 0 exit criteria

| Criterion | Result |
| --- | --- |
| Git remote, branch, and clean tree inspected | Met. `origin` is `ramchandragada/asperamarketplace`. Tree was clean at `bff8c57`. |
| Stack, database, env, CI, Vercel, and Railway inspected | Met. Findings are in `PROJECT_AUDIT.md`. Railway is not connected. |
| `PROJECT_AUDIT.md` | This change |
| `ARCHITECTURE.md` | This change |
| `ASSUMPTIONS.md` | This change |
| `RISK_REGISTER.md` | This change |
| `DECISIONS.md` | This change |
| Baseline checks recorded | Met, as "not runnable" plus the empty Vercel build |
| Marketplace code | Not started, by design |
| Prisma installed | Not installed. Planned for the first database slice |

## Sequence after Phase 0

Work one vertical slice at a time. A slice is done only when its checks have been run and the result is written down. Do not start Phase 2 until Phase 1 checks pass.

### Phase 1 — Foundations

Slice 1, the only next slice:

- Pin Node and the package manager.
- Add Next.js App Router with TypeScript strict mode, ESLint, and a build.
- Add a health route and the standard API envelope (`data`, `error`, `code`, `message`, `fieldErrors`, `requestId`).
- Add structured logging with a correlation ID and redaction rules.
- Add `.env.example` with names and descriptions only, and a `.gitignore` for env files, keys, dumps, and uploads.
- Add GitHub Actions for typecheck, lint, and build.
- Align the Vercel Node setting with the pinned version when the project settings are updated. Do not change production behavior beyond what a reviewed app deploy requires.

Slice 1 does not add Prisma, pages that imitate the marketplace, or a database.

Slice 2, only after slice 1 checks pass and a non-production Postgres instance exists:

- Commit the schema checkpoint.
- Add Prisma and the first migration for platform tables the slice actually uses (audit, idempotency, outbox, feature flags), not the full domain model.
- Document rollback. Never point this migration at production.

### Phase 2 — Identity and seller onboarding

Authentication, server-side RBAC, seller KYC states, document storage port, approval queue, and audit log. One seller can be approved in the local mock environment.

### Phase 3 — Catalogue and discovery

Categories, products, variants, inventory quantities, moderation queue, public browse, PostgreSQL search and filters. At least one approved seller listing is visible without a login.

### Phase 4 — Cart and checkout

Multi-seller cart, address, shipping estimate, server-side price snapshot, tax trace, coupon validation, atomic stock reservation, checkout review. No live payment.

### Phase 5 — Payments and orders

Mock payment provider, webhook verification and replay rejection, order state machine, invoice document, notification port, failure recovery. Browser redirect is not payment proof.

### Phase 6 — Fulfilment and customer care

Seller processing, shipment mock, tracking, partial cancellation, returns, refunds, tickets, disputes.

### Phase 7 — Finance

Double-entry ledger, commissions, settlement rules, reconciliation exceptions, exports, finance console. No settlement release unless KYC, risk, and refund checks pass.

### Phase 8 — Trust, safety, and compliance operations

Risk cases with reason codes and appeals, counterfeit queue, review moderation, privacy requests, compliance register evidence.

### Phase 9 — Analytics and optimisation

Event taxonomy first, then dashboards, search analytics, seller health, and experiments with guardrails.

### Phase 10 — Production hardening

Security review, accessibility review against WCAG 2.2 AA as a quality goal, load test, backup restore drill, observability, and a launch checklist. Launch still requires the open legal decisions in `ASSUMPTIONS.md`.

## Later documents, not part of Phase 0

Create these with the slice that makes them true:

- `SECURITY.md` and `RUNBOOK.md` with Phase 1 operations
- `API.md` when the first mutation contract exists
- `DESIGN_SYSTEM.md` when tokens exist
- `TESTING.md` when the first automated test exists
- `COMPLIANCE_REGISTER.md` when an owner and evidence model exist

## Definition of done for every later slice

1. Schema, API, UI, tests, and docs for that slice are listed before editing.
2. Typecheck, lint, unit tests, and the relevant end-to-end path are run.
3. Failures are fixed or recorded. A recorded failure means the slice is not complete.
4. `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, and `RISK_REGISTER.md` are updated.
5. The commit is pushed. Production is unchanged unless the slice was an intentional, checked deploy from `main`.
