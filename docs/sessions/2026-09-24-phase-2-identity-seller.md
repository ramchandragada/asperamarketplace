# Session: Phase 2 identity and seller onboarding

Date: 2026-09-24  
Goal: Implement authentication, server-side RBAC, seller KYC states, local document storage, admin approval queue, and audit/outbox events so one fictional seller can be approved locally.  
Branch: `cursor/phase-2-identity-seller-10f6`  
Starting commit: `eac1462` on `cursor/phase-1-foundations-10f6`  
Remote: `https://github.com/ramchandragada/asperamarketplace`

## Starting state

Phase 1 complete. Platform tables exist. Local PostgreSQL `aspera_marketplace_dev` is available. No identity or seller modules yet.

## Risks at start

- Do not invent legal entity, seller-of-record, or data-ownership answers (A-20–A-28).
- Do not collect real personal data. Seeds stay fictional.
- Prefer first-party credential auth for this slice so Phase 2 does not block on an external IdP account.
- Never migrate production. There is still no production database.

## Outcome

Pending.
