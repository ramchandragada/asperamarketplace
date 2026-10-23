# Aspera Marketplace — Deep Audit (2026-10-23)

**Auditor:** Cursor Cloud Agent  
**Tip audited:** `main@c2f0e09` (+ Cursor §13 ack on `cursor/handoff-ack-s12-ffa4`)  
**Surfaces:** storefront · customer account · seller · admin · auth · money · tax · infra  
**Live checks:** `/api/health` ok · `https://aspera.market` → 200 · mock payments · `CATALOGUE_V2` OFF  

Interactive twin: Cursor canvas *Aspera Marketplace Deep Audit — 2026-10-23*.

---

## Verdict

**Not launch-ready** for real sellers, real PII, or real money. Safe for continued **demo** on `aspera.market`.

| Severity | Count |
|----------|------:|
| P0 blockers | 6 |
| P1 high | 14 |
| P2 medium | 7 |
| P3 polish | 3 |

Browse→reserve→order spine, service-layer RBAC, webhook HMAC, and line-scoped refund math are solid. The money path still has integrity holes; seller fulfilment authz misses status; preview shares prod Neon; admin TOTP is off and page-only.

---

## P0 — must fix before trusting money / inventory

| ID | Area | Finding | Fix |
|----|------|---------|-----|
| M-01 | Money | Coupon cancels/returns refund pre-discount `lineTotalPaise` | Allocate coupon into refund math; never refund more than cash collected |
| M-02 | Money | Cancel refunds omit `orderLineId` → Buyer Protection can double-refund | Always set `orderLineId` (or order-level cap); block claims on cancelled/fully refunded lines |
| M-03 | Money | Unpaid cancel never releases `inventory.reserved` | Release reservations in unpaid-cancel tx (same as `markPaymentFailed`) |
| M-04 | Customer | Pay now → `/api/payments/mock-complete` (404 when `NODE_ENV=production`) | Prod-safe pay path + pay CTA on order confirmation |
| S-01 | Seller | Suspended sellers can still ship/cancel/return via API (`assertFulfilmentWrite` ignores status) | Gate fulfilment + returns on `approved` (not suspended) |
| I-01 | Infra | Production + preview share one Neon `DATABASE_URL` (§11.1 / A-06) | Separate production Neon |

---

## P1 — high before real users

| ID | Area | Finding |
|----|------|---------|
| A-01 | Auth | Admin 2FA off (`ENABLE_ADMIN_TOTP`); APIs never enforce TOTP |
| A-02 | Auth | Production gates use `VERCEL_ENV`, not `NODE_ENV` (demo/TOTP fail-open off-Vercel) |
| A-03 | Auth | Seeded demo credentials; seed has no production abort |
| A-04 | Auth | TOTP encryption key falls back to `DATABASE_URL` / `"aspera-dev-totp-key"` |
| C-01 | Customer | Payment failure releases stock; retry does not re-reserve |
| C-02 | Customer | COD advertised (`codAvailable: true`) but not a payment path (A-28) |
| T-01 | Tax | Missing seller `registeredState` treated as intra-state |
| T-02 | Tax | Flat 18% GST; TCS labeled 206C(1H) without counsel (A-24) |
| S-02 | Seller | Rejected KYC cannot re-submit; `request_info` does not reopen docs |
| S-03 | Seller | No AWB/labels/courier; seller self-marks delivered |
| S-04 | Seller | Disputes: no seller inbox; `sellerId` not bound to order |
| AD-01 | Admin | Buyer Protection approve refunds with no confirmation |
| AD-02 | Admin | Counterfeit Uphold does not delist/pause product |
| I-02 | Infra | KYC/invoice storage ephemeral on Vercel (`/tmp`) |

---

## P2 / P3 (summary)

- **P2:** CSRF/Origin binding; email verified at register + no password reset; idempotency in-flight keys; status enum leakage; seller team UI / image upload / multi-variant; trust ops UI half-built; seller queue no real pagination; support emails still `@asperamarketplace.com`.
- **P3:** UT state aliases; customer can open `/seller` shell; `super_admin` post-login miss; catalogue v2 correctly OFF until coordinated P4.

---

## Login surfaces

| Role | Entry | Post-login | Gate notes |
|------|-------|------------|------------|
| Customer | `/login` · `/register` | `/account` (or `?next=`) | `@aspera.local` blocked in Vercel production unless `ALLOW_DEMO_LOGINS` |
| Seller | same `AuthForm` | `/seller` or onboarding | Layout auth-only; catalogue needs approved; fulfilment API missing status gate |
| Admin | same `AuthForm` | `/admin` | HTML layout role check; TOTP wall only if `ENABLE_ADMIN_TOTP=true` |

---

## What is solid (do not regress)

1. Session model: hashed opaque tokens, bcrypt 12, lockout, open-redirect guard, security headers  
2. Service-layer `requireAdmin` / seller capabilities / ownership — no classic IDOR on admin money paths  
3. Server pricing + cart version + inventory version on reserve  
4. `refund-math` + `postRefundLedger` when `orderLineId` is set  
5. Webhook HMAC + prod rejection of default mock secret  
6. Seller settlement waterfall + TCS display  
7. Admin product queue (search, pagination, confirm, `expectedVersion`)  
8. §11 item 2 done — migrate only when `VERCEL_ENV=production`  
9. `aspera.market` canonical + robots private disallow  
10. Catalogue v2 additive + fail-closed flag  

---

## Recommended fix order

1. Coupon-aware refunds + `orderLineId` on every refund + block double-claim  
2. Release reservations on unpaid cancel; re-reserve on payment retry  
3. Replace Pay now → mock-complete with prod-safe demo/pay path + order-detail CTA  
4. Gate fulfilment/returns on approved seller; fix KYC re-submit + `request_info`  
5. Separate production Neon (A-06)  
6. Durable object storage for KYC; stop advertising COD  
7. Enable admin TOTP + enforce on privileged APIs; dedicated `TOTP_ENCRYPTION_KEY`  
8. Tax counsel (A-24) + fail-closed place-of-supply; then live PA (A-23)  

**Coordination:** discuss → approve → implement. Do **not** set `CATALOGUE_V2=true` or start P4 money-path cutover without Claude (§12 / §13).

---

## Legal / launch checklist still open

A-20–A-28 (entity, seller of record, FDI, PA, GST/TCS/9(5), DPDP, licences, settlement terms, COD) remain blockers per `docs/LAUNCH_CHECKLIST.md`. Site is already live on shared Neon — A-06 is more urgent than the checklist’s old wording implies.
