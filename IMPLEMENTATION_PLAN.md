# Implementation plan

Phase 0 and Phase 1 are complete. Phase 2 identity and seller onboarding is implemented on `cursor/phase-2-identity-seller-10f6`.

Starting commit inspected: `bff8c577c6b1348b4b9cd87bf47c073ea65068d6` on `main`.  
Phase 0 branch: `cursor/phase-0-discovery-10f6`.  
Phase 1 branch: `cursor/phase-1-foundations-10f6`.  
Phase 2 branch: `cursor/phase-2-identity-seller-10f6`.

## Phase 2 checks

Recorded 2026-09-24 on Node.js v24.21.0 against local PostgreSQL `aspera_marketplace_dev`.

| Check | Result |
| --- | --- |
| Schema checkpoint | `docs/schema-checkpoints/2026-09-24-identity-seller.sql` committed before migrate |
| Migration | `20260924151736_identity_seller_onboarding` applied locally |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm test` | Passed. 20 passed, 1 skipped. Includes seller approval integration. |
| `pnpm build` | Passed |
| Local smoke | Seeded seller login, `/api/auth/me`, and seller draft creation returned HTTP 200/201 |
| Production | Unchanged. No production database. |

## Phase 2 exit criteria

| Criterion | Result |
| --- | --- |
| First-party auth with httpOnly sessions | Met |
| Server-enforced RBAC | Met for admin approval and seller ownership |
| Seller KYC draft → submit → approve/reject | Met |
| Document storage port with local adapter | Met |
| Audit + outbox on approval | Met (`SellerApproved`) |
| One seller approvable in local mock env | Met via seed users and integration test |
| Real personal data | Not used. Fictional seeds only |
| Clerk / external IdP | Not required for this phase. See D-017 |

## Earlier baselines

Phase 0 discovery and Phase 1 foundations checks remain as previously recorded. See git history on those branches for the detailed tables.

## Sequence after Phase 2

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

Risk cases, counterfeit queue, review moderation, privacy requests, compliance register evidence.

### Phase 9 — Analytics and optimisation

Event taxonomy, dashboards, search analytics, seller health, experiments.

### Phase 10 — Production hardening

Security review notes, accessibility self-review, load smoke script, backup restore drill, observability notes, and launch checklist. Launch still requires open legal decisions in `ASSUMPTIONS.md` (A-20–A-28). Engineering tip branch: `cursor/phase-10-hardening-launch-10f6`.

## Definition of done for every later slice

1. Schema, API, UI, tests, and docs for that slice are listed before editing.
2. Typecheck, lint, unit tests, and the relevant end-to-end path are run.
3. Failures are fixed or recorded. A recorded failure means the slice is not complete.
4. `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, and `RISK_REGISTER.md` are updated.
5. The commit is pushed. Production is unchanged unless the slice was an intentional, checked deploy from `main`.
