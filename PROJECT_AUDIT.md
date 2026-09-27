# Project audit

Audit date: 2026-09-25  
Scope: Continuation after Phases 0–10 on `cursor/phase-10-hardening-launch-10f6` / continuity branch.  
Companion: `docs/CONTINUATION_AUDIT.md`

## Repository identity

| Item | Observed value |
| --- | --- |
| GitHub | https://github.com/ramchandragada/asperamarketplace |
| Tip branch | `cursor/phase-10-hardening-launch-10f6` (continuity work on `cursor/post-phase-10-continuity-10f6`) |
| Stacked PRs | #1–#11 draft, merge in order onto `main` only after deliberate release review |
| Stack | Next.js 16 App Router, TypeScript strict, Prisma 6.16.2, PostgreSQL 16, pnpm 10.33.3, Node 24.21.0 |
| Deploy | Vercel project `asperamarketplace`; previews SSO-protected |
| Database | Local `aspera_marketplace_dev` + shared Neon non-prod (migrations through Phase 9) |

## Current architecture

Modular monolith. UI and route handlers call domain services. Money/stock mutations use transactions, idempotency, audit logs, and outbox events. Browser totals are never trusted.

Modules present: `identity`, `seller`, `catalogue`, `cart`, `orders`, `payments`, `fulfilment`, `finance`, `trust`, `analytics`, plus `platform/*`.

## Implemented features

Auth/RBAC, seller KYC, catalogue/search, cart/checkout, mock payments/orders, fulfilment/returns/tickets/disputes, ledger/settlements, trust/privacy/compliance evidence, analytics/experiments, Phase 10 hardening docs.

## Missing or thin vs master brief

- Full seller role matrix (ops/finance/support)
- Rich seed (~20 products)
- PDP approved-review display
- Configurable tax rule engine with traces (A-24 open)
- Live Razorpay / COD
- Hosted object storage, MFA, prod DB separation (A-06)
- `COMPLIANCE_REGISTER.md` (added in continuity slice)
- ONDC adapter implementation
- Recharts-backed charts (CSS bars today)

## Database state

10 Prisma migrations; local and Neon non-prod applied through analytics. Phase 10 added no migration. Production must not reuse Neon credentials.

## Deployment state

Vercel previews building from PR branches (CI green on tip). `main` still older. Railway not wired; Neon used via Vercel storage integration.

## Security findings

- Mock webhook HMAC + replay rejection in place
- CSP draft still allows `'unsafe-inline'` / `'unsafe-eval'`
- Secrets stay out of Git; Neon URL must not be committed
- Shared Neon across Vercel targets is a launch blocker

## Technical debt

- Local Cloud Agent `next build` `/_global-error` prerender failure (CI/Vercel OK)
- Stale Phase 0 wording previously left in this file (corrected here)
- Thin demo catalogue
- Tax amounts on orders lack rule-trace provenance

## Risks

See `RISK_REGISTER.md` and open assumptions A-20–A-28. Do not invent legal answers in code.

## Recommended next vertical slice

Post–Phase 10 continuity: compliance register document, expanded fictional seed, approved reviews on PDP, configurable tax profiles with explanation traces and professional-review disclaimer. No live payments. No automatic PR merges.
