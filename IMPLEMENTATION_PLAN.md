# Implementation plan

Phase 0 is complete for discovery and planning. Phase 1 slice 1, the application foundation, is implemented on `cursor/phase-1-foundations-10f6`. Prisma, a database, and marketplace screens are still absent.

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

There is no failing test suite to preserve. Phase 1 slice 1 added the first runnable checks. Their results are below.

## Phase 1 slice 1 checks

Recorded 2026-09-24 on Node.js v24.21.0 and pnpm 10.33.3.

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | Passed |
| Lint | `pnpm lint` | Passed. npm warns that ESLint 9.39.5 is deprecated. `eslint-config-next` 16.3.6 installed that major. See D-014. |
| Unit tests | `pnpm test` | Passed. 4 files, 8 tests. |
| Integration tests | No database | Not runnable |
| Application build | `pnpm build` | Passed. Routes: `/`, `/_not-found`, `/api/health`. Proxy compiled. |
| Local smoke | `pnpm start --port 3000`, then `curl` | `GET /` returned HTTP 200 with the foundation page. `GET /api/health` returned HTTP 200, the API envelope, `database: not_configured`, and echoed a valid `x-request-id`. A malformed request id was replaced. Security headers were present. Desktop and mobile screenshots of `/` showed the same status content. |
| Vercel production | Unchanged | `main` is still the empty deploy of `bff8c57`. This slice is not merged. |

## Phase 0 exit criteria

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

Slice 1 is done. It pinned Node.js 24.21.0 and pnpm 10.33.3, added the Next.js app, health route, API envelope, redacting logger, `.env.example`, `.gitignore`, and GitHub Actions. The Vercel project was already set to Node.js 24.x, so that setting was left unchanged. Slice 1 does not add Prisma, marketplace screens, or a database.

Slice 2, only after a non-production Postgres instance exists:

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

## Later documents

Phase 1 slice 1 added the documents that this slice made true:

- `SECURITY.md` and `RUNBOOK.md` cover the foundation operations only
- `API.md` documents the response envelope and `GET /api/health`. No mutation exists yet
- `DESIGN_SYSTEM.md` records the first tokens
- `TESTING.md` records the first automated tests

`COMPLIANCE_REGISTER.md` waits until an owner and evidence model exist.

## Definition of done for every later slice

1. Schema, API, UI, tests, and docs for that slice are listed before editing.
2. Typecheck, lint, unit tests, and the relevant end-to-end path are run.
3. Failures are fixed or recorded. A recorded failure means the slice is not complete.
4. `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, and `RISK_REGISTER.md` are updated.
5. The commit is pushed. Production is unchanged unless the slice was an intentional, checked deploy from `main`.
