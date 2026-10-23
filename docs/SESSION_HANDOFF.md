# Session handoff — Claude Code → Cursor

**Date:** 2026-10-22
**Author:** Claude Code (acting as CTO on this session)
**Purpose:** Shared context so Claude and Cursor stay aligned. Everything below is **merged to `main` and deployed to production** (`asperamarketplace.vercel.app`) unless stated otherwise.

---

## 1. Operating model (please keep)

- Workflow is **discuss → approve → implement**. Propose before building; keep the owner in the loop.
- Every change ships with the gates green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
- Each change goes through a PR; CI (`check`) + Vercel preview must be green before merge.

## 2. Deployment pipeline (important)

- Vercel deploys `main`. A **`vercel-build` script** was added: `prisma migrate deploy && prisma generate && next build`. So **migrations auto-apply on every deploy** — do NOT merge a migration expecting to run it by hand, and if a migration is bad the build fails safely (prod keeps serving the old version).
- CI runs `prisma migrate deploy` against a test DB, then typecheck/lint/test/build.
- Production currently shares a **non-production database** (flagged in `docs/CTO_CODE_AUDIT.md`) — should be separated before real sellers/buyers.

## 3. Product decisions locked this session

- **Payments stay mocked** (no real gateway yet). Real Razorpay/COD is the LAST step. Test with dummy orders, scale slowly.
- **Refund policy = item price + GST** (shipping non-refundable).
- **Coupons are platform-funded** (not shared with sellers).
- **COD** deferred (not wired as a real order path yet).
- Theme is **light-only** on purpose (no `dark:` variants).

## 4. What shipped (by area, with key files)

### Sprint 1 — Money integrity (`src/modules/*`)
- Added `Refund.orderLineId` + `Refund.merchandisePaise` (migrations `20261022054131`, `20261022054602`). The first migration also fixed pre-existing drift: `carts.user_id` FK → `ON DELETE SET NULL` (guest carts) + a `protection_claims.updated_at` default.
- New **`src/modules/finance/refund-math.ts`**: `refundBreakdown()`, `cappedMerchandisePaise()`, `allocatedGstPaise()`, `unitMerchandisePaise()`. **Reuse this for any refund** — it's the single source of truth for item+GST + the per-line cap.
- Refunds now **post to the ledger** (`postRefundLedger` is called in all 4 paths: return approval, protection claim, group cancel, buyer cancel) with a balanced 4-way split (cash / seller payable / commission / GST).
- A line **cannot be refunded twice** across returns + protection claims (shared `remainingRefundable` cap via `alreadyRefundedMerchandisePaise`).
- **Settlements net out refunds** (`createSettlementBatch` subtracts refunded merchandise before commission/TCS).
- `/api/payments/mock-complete` is **disabled in production**.
- Tests: `refund-math.test.ts`, the mock-complete guard test, and a double-refund integration test in `fulfilment.integration.test.ts`.

### Sprint 2 — Storefront trust & checkout (`src/components`, `src/app`)
- Removed all shopper-facing "development mock" payment language.
- Rewrote **`checkout-panel.tsx`**: single auto-priced flow (no manual "Preview totals"), one "Place order", coupon in the summary.
- PDP (`product-purchase-panel.tsx`): shows **"Delivery by <date>" + COD** once a pincode resolves.
- Cart empty-state uses shared `EmptyState`; PDP ratings/reviews dup-count fixed; deleted dead `order-pay-buttons.tsx`.

### Wave 0 — Dashboard safety/correctness
- Gated the shopper-facing **"Test failed payment"** button to non-production (`orders-panel.tsx`).
- Confirmations before: settlement **payout release** (shows amount, `finance-console-panel.tsx`), bulk **data-quality archive** (`data-quality-cleanup-button.tsx`), buyer **cancel order** (`order-detail-panel.tsx`).
- **Operator-entered audit reasons** required for review moderation / counterfeit / reconciliation (were hardcoded) — `trust-ops-panel.tsx`, `finance-console-panel.tsx`.
- Fixed finance journal **raw-paise** display → `formatPaise`.
- **Address edit / delete / set-default** wired to existing PATCH/DELETE (`account-addresses-panel.tsx`).
- Return quantity capped to units purchased; `notFound()` for bad order ids; "Buy again" no longer silently drops items.

### Wave 1 — Design-system foundation
- **Color tokens**: swept hardcoded `text-red-700`/amber/green across ~30 components → semantic tokens (`text-danger`/`success`/`warning`). **Rule: never hardcode colors; use tokens.**
- New **`src/lib/status-labels.ts`**: order/payment/refund/fulfilment enum → friendly label. **Rule: never render raw status enums to users — use these.**
- Rewrote **`DESIGN_SYSTEM.md`** to match `globals.css` (Inter not Geist, light-only, real token table) and codify rules.
- **Dashboard loading/error states**: added `loading.tsx` + `error.tsx` to `src/app/{seller,admin,account}` (shared `DashboardSkeleton` in `ui/dashboard-skeleton.tsx` + `dashboard-error.tsx`). Fixed the dead `@keyframes shimmer` in `globals.css`.

### Wave 2 (started) — Seller payout screen
- Rebuilt **`src/app/seller/finance/page.tsx`** into a full **settlement waterfall** (gross → − commission → subtotal → − TCS 0.5% → net payout) with period, order count, payout/release date, hold reason, status labels, and summary tiles (paid-to-date / upcoming / lifetime commission / TCS). Data already existed on `SettlementBatch`.

## 5. Conventions for Cursor to follow (so we don't regress each other)

1. **Colors** → semantic tokens only (`text-danger`, `bg-warning-soft`, `border-border`), never `text-red-700` / hex / `black/*`.
2. **Status enums shown to users** → `src/lib/status-labels.ts`.
3. **Refund math** → `src/modules/finance/refund-math.ts` (item+GST, per-line cap). Always post refunds to the ledger via `postRefundLedger`.
4. **Money** → `formatPaise` (Intl en-IN ₹), never raw paise.
5. **Destructive/irreversible actions** → confirm first; **dev-only UI** → gate with `process.env.NODE_ENV !== "production"`.
6. **Shared UI primitives** → `src/components/ui/*` (`Button`, `Badge`, `EmptyState`, `Skeleton`, `Card`). Prefer over hand-rolled.
7. **New dashboard segments** → add `loading.tsx` + `error.tsx`.
8. **Migrations auto-run on deploy** — additive changes only; never assume a manual migration step.

## 6. Reference docs in-repo

- `docs/CTO_CODE_AUDIT.md` — full codebase audit (money/security/perf/UX) + roadmap.
- `docs/SPRINT_1_2_PLAN.md` — the money + checkout plan.
- `docs/DASHBOARD_UX_AUDIT.md` — admin/seller/account audit (the backlog below comes from here).

## 7. Remaining backlog (not started; from the audits)

- **Wave 1 finish:** full `Button`/`Badge` adoption across hand-rolled buttons/pills; a toast system (success/error currently a stray `<p>`); busy/disabled on remaining mutating buttons (double-submit guard).
- **Seller:** real product **image upload** (currently URL-paste only — blocks real sellers); bulk actions (stock/submit/ship); split the 605-line `seller-catalogue-panel.tsx`.
- **Admin:** paginate + search the seller queue (`listSellersForAdmin` is unbounded) and trust risk cases (`slice(0,10)`); bulk approve/reject; convert card-walls to sortable tables; nav backlog counts; modal focus-trap/Esc.
- **Account:** humanize the notifications page (shows `templateKey`); GST-invoice labeling; plain-language refund timeline; decompose the 795-line `order-detail-panel.tsx`.
- **Launch:** separate prod DB; error monitoring (Sentry); transactional email; then real payments.

## 8. Local dev

```bash
# Postgres 16 (docker compose up, or a native cluster) with:
DATABASE_URL=postgresql://aspera_dev:aspera_dev_only_not_secret@127.0.0.1:5432/aspera_marketplace_dev?schema=public
pnpm install && pnpm db:migrate && pnpm db:seed && pnpm dev
```
Dev seller login used for the payout screenshot: `seller@aspera.local` / `AsperaSellerDevOnly1!` (fictional, non-prod only).

## 9. Branch state

Work was done on `claude/relaxed-brahmagupta-tfm2p7` and merged to `main` via PRs **#58, #59, #60, #61** (this handoff). `main` is the source of truth for both Claude Code and Cursor.

**Production alias (verified 2026-10-22):** last **READY** production deploy is merge **#60** (`b2a5e82`) — seller payout waterfall + dashboard loading/error. Merge **#61** (doc-only) hit a failed production build (see §11); runtime is unaffected because Vercel kept serving the previous READY deployment. Repo/`main` still has the handoff for agents.

## 10. Cursor acknowledgment (keep Claude ↔ Cursor in sync)

Cursor has read this handoff and will follow §5 conventions. Prior Cursor work still on `main` (do not regress):

- Trust gaps: multi-seller cart/orders UI, pincode autofill, Buyer Protection, seller ratings, Amazon/Flipkart `/orders` filters.
- Prod auth: `@aspera.local` demo gate (`ALLOW_DEMO_LOGINS`), admin TOTP (`/admin/security`, `REQUIRE_ADMIN_TOTP`).
- OperatorChrome brand shell for seller/admin; GST v2 CGST/SGST/IGST + settlement TCS; catalogue DQ cleanup.
- PDP `.btn-cta` fixed-height system (Buy now must never stretch into a circle).

**Shared rule:** discuss → approve → implement; additive migrations only; no hardcoded status enums or danger colors.

## 11. Known infra fragility — Prisma migrate lock on shared DB

**Symptom (confirmed in Vercel build logs):** concurrent `vercel-build` runs that both execute `prisma migrate deploy` against the **same** Neon DB fight over Postgres advisory lock `72707369`. Loser fails with:

`P1002 … Timed out trying to acquire a postgres advisory lock (SELECT pg_advisory_lock(72707369)). Timeout: 10000ms.`

Seen when production + preview (or two production) builds overlap — e.g. #61 production deploy ERROR while #60 was still building. **Data is not corrupted**; re-run usually passes. GitHub `check` CI uses an isolated DB and is unaffected.

**Status:** item 2 is **done** (see below). Item 1 remains.

1. **Separate production Neon from preview/dev** (also required before real sellers/customers). Still open — needs Neon + Vercel env work (a production `DATABASE_URL` distinct from preview/dev).
2. ~~Move `prisma migrate deploy` out of concurrent preview builds~~ **DONE** — `vercel-build` now runs `node scripts/vercel-build.mjs`, which applies migrations **only when `VERCEL_ENV=production`**. Preview builds just `prisma generate` + `next build`, so they can no longer contend for the migrate lock. Caveat until item 1 lands: preview still shares the prod DB, so a PR that *adds* a migration won't see it on its own preview until it's merged and the production deploy applies it — fine for our additive-only migrations.

With item 2 done, overlapping builds no longer cause P1002. If a production deploy ever still fails, redeploy `main` once from the Vercel dashboard.

---

## 12. Update — 2026-10-23 (Claude Code): admin access, deploy-lock root fix, catalogue v2, custom domain

Everything below is **merged to `main` and live on production**. PRs **#62–#71**.
`main` remains the single source of truth for both agents.

### 12.1 Admin & seller access — the "admin is just a user account" incident

**Symptom reported:** admin could log in but every `/admin/*` page bounced to
`/admin/security`; seller onboarding/product-add impossible. Root cause was
**not** a broken console — it was the admin TOTP gate (Cursor's prod-auth
hardening, commit `6a6f6c7`). In production `REQUIRE_ADMIN_TOTP` was set to
`true`, so every admin without an enrolled authenticator was hard-locked.

**Owner decision:** 2FA is **deferred until launch** (we're on demo data, no
real payments yet). Changes (all merged):

- The gate is now `adminTotpRequiredInProduction()` reading a **new**
  `ENABLE_ADMIN_TOTP` flag (unset → OFF). The legacy `REQUIRE_ADMIN_TOTP` is
  **ignored on purpose** so a stale `true` in the environment can't force the
  wall back on. **To re-enable 2FA before launch: set `ENABLE_ADMIN_TOTP=true`
  in production.** The enrollment UI (`/admin/security`) + verify code are
  intact — do **not** delete them.
- Post-login routing: admins land on `/admin`, sellers on `/seller`, everyone
  else on `/account` (`auth-form.tsx` `resolveDestination`). An explicit
  `?next=` still wins; seller-registration flow unchanged.
- Files: `src/modules/identity/service.ts`, `src/components/auth-form.tsx`.

### 12.2 Deploy-lock root fix (§11 item 2 — DONE)

`vercel-build` now runs `node scripts/vercel-build.mjs`, which applies
`prisma migrate deploy` **only when `VERCEL_ENV=production`**. Preview builds
just `generate` + `next build`, so preview and production builds can no longer
contend for the Postgres advisory lock. **§11 item 1 (separate prod/preview
DBs) is still open** and still the right next infra step before real users.

### 12.3 Catalogue v2 — shared catalogue + seller offers (IN PROGRESS, flag-gated)

Migrating from the current **clone-and-group** model (each seller owns a full
`Product`; siblings linked by `sharedListingKey`; facts copied then drift) to a
**shared CatalogueProduct + SellerOffer** model. Full plan + phase checklist:
**`docs/CATALOGUE_V2_PLAN.md`** — read it before touching catalogue code.

Shipped so far, **all behind the `CATALOGUE_V2` flag (default OFF)** — nothing
in the storefront reads v2 yet, so production behaviour is unchanged:

- **P1 schema (#68):** `CatalogueProduct`, `CatalogueVariant`, `SellerOffer`,
  `OfferInventory`, `CatalogueImage`, enum `OfferCondition` (new/refurbished/
  used). Additive migration only.
- **P2 service (#69):** `src/modules/catalogue/catalogue-v2.ts` (create product/
  variant/offer, `getCatalogueProductBySlug`, `listOffersForCatalogueVariant`,
  `bestOfferPricePaise`, and a transparent `rankOffers` buy-box: in-stock first,
  then lowest price, dispatch tie-break, single featured winner) +
  `src/modules/catalogue/flags.ts` (`catalogueV2Enabled()`).
- **P3-prep backfill (#70):** `catalogue-v2-backfill.ts` + `pnpm db:backfill:v2`
  — idempotently maps existing approved products into catalogue+offers. Run
  once against a DB before flipping the flag.

**NOT done (do with the owner, do NOT start solo):**
- P3-full: offer-centric PDP + search reading v2 (a shopper-UX change).
- P4: cart/checkout/orders/inventory on `offerId` — **the money path**. Flip on
  preview first, verify a real purchase, then prod. Rollback = flag off.
- P5: admin canonical catalogue editing + reversible duplicate-merge; retire
  the old per-seller-Product model.

**Cursor, please:** do **not** set `CATALOGUE_V2=true` in production, and do
**not** begin re-pointing the PDP/cart/orders to offers without coordinating
here — the old model still powers the live site and the two must not diverge.

### 12.4 Custom domain — aspera.market (LIVE)

- `aspera.market` connected via GoDaddy DNS → Vercel; `www` 307-redirects to the
  apex; SSL issued; verified live over HTTPS.
- Code (#71): default canonical origin is now `https://aspera.market`
  (`layout.tsx` `metadataBase`, `products/[slug]` canonical/OG/JSON-LD,
  `robots.ts`, `sitemap.ts`). `NEXT_PUBLIC_SITE_URL=https://aspera.market` is set
  in Vercel Production and still overrides the code default.
- Open item: support/grievance emails still read `@asperamarketplace.com`
  (overridable via `SITE_SUPPORT_EMAIL` / `SITE_GRIEVANCE_EMAIL`) — needs email
  hosting on `aspera.market` before switching.

### 12.5 New conventions / flags

- **Admin 2FA:** off via `ENABLE_ADMIN_TOTP` (legacy `REQUIRE_ADMIN_TOTP`
  ignored). Re-enable with `ENABLE_ADMIN_TOTP=true` before launch.
- **Catalogue v2:** gate any v2 read/write behind `catalogueV2Enabled()`; keep
  it OFF in prod until the money-path cutover is done together.
- **Migrations:** still additive-only; they now run on production builds only.
- Everything else in §5 still applies (semantic color tokens, status-labels,
  refund-math, formatPaise, confirm destructive actions, shared UI primitives).

### 12.6 PRs merged since last sync

#62 (handoff), #63/#64 (admin seller queue: server-side search + pagination +
bulk approve/reject), #65/#67 (admin 2FA off + login routing), #66 (migrate
production-only), #68/#69/#70 (catalogue v2 P1/P2/P3-prep), #71 (aspera.market
canonical URL).
