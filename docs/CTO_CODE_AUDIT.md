# Aspera Marketplace — CTO Code Audit & Roadmap

**Date:** 2026-10-22
**Scope:** Full codebase audit (money/correctness, security, performance/scale, UI/UX)
**Branch reviewed:** `main` @ `f3fda6f` (worked on `claude/relaxed-brahmagupta-tfm2p7`)
**Method:** Local build + full test run against a seeded database, plus a four-stream deep code audit.

---

## 1. Executive summary

Aspera is a **genuinely well-engineered, pre-launch multi-vendor marketplace** — far above the quality of a typical AI-generated project. The architecture (modular monolith, double-entry ledger, server-authoritative pricing, idempotency, audit logs) is sound, and the core checkout → payment path is **atomic and concurrency-safe**. It builds clean and all 105 tests pass.

The work needed to become "world-class, rock-solid, fast" is concentrated in four areas, none of which require re-architecting:

| Area | Verdict | Headline issue |
|---|---|---|
| **Money correctness** | 🟡 Core solid, refund side leaks | Refunds bypass the ledger; a line can be refunded twice; settlements don't net returns |
| **Security (authz)** | 🟢 Strong | No IDOR, no unauth mutations. Only admin MFA enforcement needs hardening |
| **Performance/scale** | 🟡 Fine now, won't scale | Search ignores its index; browse sorts in-memory; no caching |
| **UI/UX** | 🟡 Good base, trust gaps | Dev/mock payment text shown to shoppers; clunky checkout; no delivery dates |

**Baseline health (verified locally):** `typecheck` ✅ · `lint` ✅ · `test` 105 passed ✅ · `build` ✅ · DB migrate + seed ✅

---

## 2. What's already done well (keep & protect)

- **Browser is never trusted for money.** Totals/tax/stock are always recomputed server-side from the DB; client totals are an optional cross-check only.
- **Checkout is atomic & race-safe.** Reservation + checkout session + cart version bump + audit + outbox commit in one transaction; stock uses optimistic-locking (`version` guards), so concurrent buyers can't oversell.
- **Payment integrity.** The only path to `paid` is an HMAC-SHA256-verified webhook with replay protection (`timingSafeEqual`, unique event id, amount cross-check), and prod refuses the dev-default secret. `markPaymentSucceeded` is fully atomic (payment + order + inventory + invoice + ledger in one tx).
- **Double-entry ledger is balanced & append-only.** Every posting enforces `debits == credits`; no update/delete of journal rows anywhere.
- **Authorization is consistent.** Ownership is enforced in the service layer (`where userId = actor`), not the route. No IDOR, no body/query-id trust, no open redirect. Sessions are random tokens stored SHA-256-hashed; bcrypt rounds=12; login lockout present.
- **Honest merchandising** (no fake countdowns/badges), correct **₹ en-IN formatting**, strong trust scaffolding (buyer protection, approved-seller, COD/returns), solid accessibility foundation, `next/image` discipline, and Product/Breadcrumb **JSON-LD SEO**.

---

## 3. Findings by severity

> Locations are `file:line` from the audit. Each will be re-verified at implementation time (part of our discuss → approve → implement loop).

### 🔴 Money leaks (fix first — these are real rupees)

- **M-1 · Refunds never hit the ledger.** `postRefundLedger` (`src/modules/finance/service.ts:288`) has **zero callers**. Every refund path (buyer cancel `orders/service.ts:1026`, group cancel `fulfilment/service.ts:353`, return approval `fulfilment/service.ts:521`, protection payout `protection/service.ts:266`) writes a `Refund` row but posts nothing to the journal. → Ledger overstates cash/seller-payable after any refund; settlements computed off it overpay.
- **M-2 · A line can be refunded twice (exceeds amount paid).** `decideProtectionClaim` (`protection/service.ts:258-285`) refunds the full line total with no check against prior returns/refunds on that line, and the `return_not_honored` claim type *requires* an existing return. → Buyer returns a line (refund #1), then files a protection claim on the same line (refund #2). This is the same class as the historical over-refund bug, via a new door. `Refund` has no `orderLineId`, so a cross-path cap isn't even computable yet.
- **M-3 · Settlements pay sellers for returned goods.** `createSettlementBatch` (`finance/service.ts:346-377`) pays out on `delivered` groups with no join to refunds/returns. → Delivered-then-returned line still settles at full value; platform eats the loss.
- **M-4 · `mock-complete` payment endpoint has no env/role guard** (`src/app/api/payments/mock-complete/route.ts`). Fine while payments are intentionally mocked, but it must be gated to non-production (or removed) before any real gateway work, or it becomes a "free orders" bug.

### 🟠 Correctness hardening (latent, mitigated today)

- **M-5 · Idempotency re-executes non-completed commands** (`src/platform/idempotency/store.ts:70-80`). Only *completed* commands de-dupe; a crash between effect and completion re-runs on retry, and a concurrent same-key read can let both proceed. Currently saved by downstream unique constraints (checkoutSessionId, PaymentAttempt key) and version guards — so not a live double-charge, but the layer isn't self-sufficient.
- **M-6 · Concurrent return requests can over-approve** (`fulfilment/service.ts:421-438`). Two simultaneous requests both read `alreadyReturned=0`; approval re-caps only against line quantity, not other open returns.
- **M-7 · Settlement release gating is fragile** (`finance/service.ts:441-459`). "Open risk" is a substring match on a free-text field; no KYC or open-dispute/pending-refund check before payout.
- **M-8 · Refunds exclude GST & shipping** — buyers aren't refunded tax/shipping they paid (buyer-fairness + dispute source).
- **M-9 · Coupon cost is parked in "Refund liability"** (`finance/service.ts:216-276`). The entry balances, but confirm this is the intended coupon-funding model (today the platform, not the seller, funds coupons).

### 🟠 Security hardening

- **S-1 · Admin MFA is not enforced at the API boundary** (MEDIUM). Only the admin *page* layout (`src/app/admin/layout.tsx:34-39`) redirects un-enrolled admins; the `/api/admin/**`, `/api/finance/**`, `/api/trust/**` routes check role but **not** TOTP. → A phished/leaked admin password drives the whole admin surface via direct `fetch`. This defeats the "TOTP enforced for admins" claim.
- **S-2 · TOTP second factor is brute-forceable** (LOW–MED). `completeTotpLogin` has no rate-limit/lockout and the 5-min challenge token is replayable (not consumed on failure). Requires the password first, so it's a second-factor-bypass gap.
- **S-3 · TOTP key derivation falls back to `DATABASE_URL` then a hardcoded constant** (LOW). The secret protecting stored TOTP secrets shouldn't be the DB URL (which leaks into logs). Require a dedicated `TOTP_ENCRYPTION_KEY`, fail-closed in prod.
- **S-4 · CSP still allows `unsafe-inline`/`unsafe-eval`** (`next.config.ts`) — known, tracked; needs a nonce/hash rollout.

### 🟠 Performance & scale (fine at today's size; blocks growth)

- **P-1 · Search ignores its own GIN index.** The query computes `to_tsvector(concat_ws(...))` on the fly + two `ILIKE '%q%'` scans (`catalogue/service.ts:1210-1222`), which can't use the indexed expression. → Every keyword search is a full seq scan; worst at the hottest query.
- **P-2 · Browse sort/filter loads the full matching set into Node and sorts in JS.** The no-search path runs `findMany` with `take: undefined` then sorts/paginates in memory (`catalogue/service.ts:1352-1491`). → "Sort by price" on a big category loads every row + relations into the function heap; OOM risk under concurrency.
- **P-3 · Storefront is all-dynamic, no caching.** Home fires **8** catalogue queries per request, PDP is per-slug dynamic, no ISR/`revalidate`/`unstable_cache` (`app/page.tsx:30`, `products/[slug]/page.tsx:23`). → Every anonymous visit hits Postgres 8×.
- **P-4 · Reservation-expiry sweep runs on every storefront read**, with an in-memory throttle that's ineffective on serverless and an unindexed scan (`cart/reservations.ts:84-127`). → Read pages trigger write-path scans. Move to a cron/scheduled job.
- **P-5 · No serverless connection pooling for Prisma** (suspected, deploy-dependent). On Vercel/Lambda a traffic spike exhausts Postgres connections. Needs PgBouncer/Accelerate + `connection_limit`.
- **P-6 · Missing indexes**: `products(status, published_at)`, `product_variants(selling_price_paise)`, `checkout_sessions(status, reserved_until)`. (Orders/session/inventory are already well-indexed — credit due.)
- **P-7 · Over-fetch/no-pagination in seller & admin tooling.** `listProductsForModeration` loads *every* product; seller inventory/product lists `take: 2000/500` then filter in JS (silent truncation).
- **P-8 · 31 KB mega-menu data shipped to the browser** via two `"use client"` components.

### 🟡 UI/UX (trust & conversion)

- **U-1 · Developer/mock payment language shown to shoppers** (CRITICAL for trust). "pay with the development mock (no live charges)" appears in `checkout/page.tsx:44-45` and `checkout-panel.tsx:267-269`. → Reads as a fake/broken store at the highest-intent moment. Gate dev copy; show real payment-method framing (UPI/Cards/COD/Netbanking) even while settlement is mocked.
- **U-2 · Checkout flow is manual and confusing.** Shopper must click "Preview totals" before a disabled "Place order"; there are two "Place order" buttons and duplicate coupon UIs. → Collapse to: address → live-priced summary → single "Place order & Pay" with COD/online choice.
- **U-3 · No delivery-date ETAs anywhere.** The pincode API already returns `etaLabel`/`codAvailable`, but it's never surfaced as "Delivery by Tue, 28 Oct". Indian shoppers expect a date.
- **U-4 · No persistent "Deliver to [pincode]" in the header.** Pincode is re-entered per product; competitors persist it globally.
- **U-5 · Wishlist architecture re-renders every card.** Each `ProductCard` independently subscribes to wishlist state via `useSyncExternalStore` + window listeners (`product-card.tsx:57-95`); toggling one heart re-renders the whole grid. Needs one provider/context + `React.memo`.
- **U-6 · Looping rails render every product 3× in the DOM** (a11y + analytics noise) — `aria-hidden` the clones.
- **U-7 · Oversized client components.** `catalogue-browse.tsx` ~1,300 lines / ~42 KB single `"use client"` with ~25 `useState`; `home-storefront.tsx` ~35 KB. Split + memoize.
- **U-8 · Design system drift.** `DESIGN_SYSTEM.md` contradicts `globals.css` (wrong tokens/fonts/dark-mode); ~28 components use raw `text-red-700` instead of `--danger`; pervasive hardcoded hex; a dead `animate-shimmer` (no keyframes → static skeletons); two parallel button systems.
- **U-9 · Smaller polish:** "ratings" and "reviews" show the same count; cart empty state is a bare `<p>` (not the shared `EmptyState`); cart quantity has no +/- stepper; mobile bottom-nav Cart has no count badge; skeleton aspect ratios don't match real cards (CLS); low-contrast greys (`#999` ≈ 2.85:1, below WCAG AA).

---

## 4. Recommended roadmap (proposed — for your approval)

Sequenced for your constraints: **real payments last, dummy orders + small-scale testing now, scale later.** Each sprint is independently shippable; we discuss → you approve → I implement, sprint by sprint.

**Sprint 1 — Money integrity (the "rock-solid core").** M-1, M-2, M-3, plus guard M-4 and harden M-6. *Why first:* even at small scale, the day you take real test orders, the money math must be correct. Add `orderLineId` to `Refund`, a single remaining-refundable cap across all refund paths, ledger postings for refunds, and settlement netting.

**Sprint 2 — Storefront trust & conversion.** U-1 (strip dev payment language + real payment-method UI), U-2 (one-flow checkout), U-3 (delivery ETAs), U-4 (header pincode), U-9 cart polish. *Why:* makes the store credible for real-user testing without touching the payment gateway.

**Sprint 3 — Performance & scale.** P-1 (fix search index), P-2 (SQL-ify browse sort), P-3 (ISR/caching), P-4 (sweep → cron), P-6 (indexes), U-5/U-7/P-8 (frontend perf). *Why:* set up before you scale, not during.

**Sprint 4 — Security hardening.** S-1 (API-level MFA), S-2 (TOTP rate-limit + single-use challenge), S-3 (dedicated key), S-4 (CSP). *Why:* before onboarding real admins/sellers.

**Sprint 5 — Design-system & a11y cleanup.** U-6, U-8, remaining U-9, contrast fixes. *Why:* consistency pass that makes future UI work faster and the product feel premium.

**Then — feature growth & launch infra** (separate planning): richer reviews on PDP, search quality, seller tooling depth, prod DB separation, error monitoring (Sentry), transactional email, and — last — the real payment gateway (Razorpay + COD).

---

## 5. Notes

- Every finding above was produced by reading the code, not running exploits. Before implementing a fix I will reconfirm the exact path and add/extend a test that fails before and passes after.
- No code has been changed. No production system was touched; all work ran against a local seeded database.
- Branch sprawl (~55 `cursor/*` branches) should be pruned once `main` is confirmed as the source of truth — a low-risk housekeeping task for later.
