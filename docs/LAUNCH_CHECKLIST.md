# Launch checklist (Phase 10)

Status: engineering complete through Phase 10. **Do not launch** until open legal items A-20–A-28 in `ASSUMPTIONS.md` are closed by counsel and the business owner.

## Blockers (must stay red until decided)

- [ ] A-20 legal entity / states
- [ ] A-21 seller of record / tax invoice issuer
- [ ] A-22 FDI / inventory ownership
- [ ] A-23 payment aggregator model vs licensed PA
- [ ] A-24 GST / TCS / Section 9(5) rules by category
- [ ] A-25 personal-data ownership and processors (DPDP)
- [ ] A-26 launch category licences
- [ ] A-27 settlement commercial terms
- [ ] A-28 COD decision

## Engineering readiness

- [x] Modular monolith phases 0–10 on stacked `cursor/*-10f6` branches
- [x] Prisma migrations applied on local non-prod and shared Neon non-prod
- [x] Mock payments only; no live Razorpay credentials in repo
- [x] Money in paise; browser totals rejected on mismatch
- [x] Health route + redacting logs + security headers (incl. CSP draft)
- [ ] Separate production database credentials (A-06) — not yet provisioned distinctly from preview
- [ ] Production object storage for KYC/invoices (not local disk)
- [ ] MFA / managed IdP decision
- [ ] Content Security Policy tightened (remove `'unsafe-eval'` once Next build allows)
- [ ] Observability: hosted logs/metrics/traces (currently stdout JSON)

## Pre-production drill

- [ ] Backup restore drill recorded (`docs/BACKUP_RESTORE_DRILL.md`)
- [ ] Load smoke against preview (`docs/LOAD_TEST.md`)
- [ ] Accessibility pass (`docs/ACCESSIBILITY_REVIEW.md`)
- [ ] Security notes reviewed (`SECURITY.md`)

## Deploy path for any Cursor machine

1. Open `https://github.com/ramchandragada/asperamarketplace` in Cursor.
2. Checkout tip branch `cursor/phase-10-hardening-launch-10f6` (or later `main` after merges).
3. Copy env from Vercel project / `.env.example`.
4. `pnpm install && pnpm db:migrate && pnpm dev`.
5. Prefer Cloud Agents or linked Neon so every laptop shares the same non-prod data.

## Merge order

Merge draft PRs in phase order 0→10 onto `main` only after review. Vercel production deploys from `main`; do not point production at Neon until A-06 separation and legal blockers clear.
