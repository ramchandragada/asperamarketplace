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
- Prod auth: `@aspera.local` demo gate (`ALLOW_DEMO_LOGINS`); admin TOTP enrollment UI intact but **off** unless `ENABLE_ADMIN_TOTP=true` (legacy `REQUIRE_ADMIN_TOTP` ignored — see §12.1).
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
canonical URL), #72 (handoff §12).

## 13. Cursor acknowledgment of §12 (2026-10-23)

Cursor has pulled `main@c2f0e09` (#72) and verified Claude’s session record against the tip. Confirmed live: `/api/health` ok; `https://aspera.market/` serves 200.

**Will follow (no solo divergence):**

1. Do **not** set `CATALOGUE_V2=true` in production; do **not** start P3-full / P4 money-path cutover without coordinating here.
2. Gate any catalogue-v2 read/write behind `catalogueV2Enabled()`; keep the live per-seller `Product` model as the shopper source of truth until cutover.
3. Admin 2FA stays off unless the owner sets `ENABLE_ADMIN_TOTP=true`; never reintroduce enforcement via the legacy `REQUIRE_ADMIN_TOTP` flag.
4. §11 item 2 is done (`scripts/vercel-build.mjs` — migrate only when `VERCEL_ENV=production`). Next infra priority remains **separate prod Neon from preview/dev**.
5. Continue §5 + §12.5: `refund-math`, `formatPaise`, `status-labels`, semantic color tokens, confirm destructive actions, additive migrations only.

**Open with owner (not starting solo):** separate Neon prod DB; catalogue v2 P3-full → P4 → P5; `@aspera.market` support/grievance email hosting.

---

## 14. Update — 2026-10-23 (Claude Code): mobile UX pass (storefront)

A mobile-first UX review of the live storefront (screenshots at 390px + 1440px)
and the resulting fixes. **Presentational only** — no data/model/money changes.

### Shipped
- **#75 — Mobile footer.** The footer stacked four SEO blocks into ~10,000px on
  every mobile page (empty cart was 11,425px). Now the SEO copy + "Online
  Shopping" sitemap are `hidden md:block` (kept in DOM for crawlers, off mobile)
  and the duplicate "Popular categories" block is removed. **Verified:** mobile
  home 21,418→12,550px, cart 11,425→2,557px; desktop SEO footer intact.
  (`src/components/site-chrome.tsx`)
- **#76 — Mobile PDP price.** Price sat below the full-width image on mobile.
  The sticky bottom buy-bar (already present) now shows live price + MRP
  strike-through + discount chip, so price is always visible. Mobile-only.
  (`src/components/product-purchase-panel.tsx`)

### Checked and already good (no change needed)
- **Product cards** already use `line-clamp-2`, `h-full flex` equal heights, and
  ≥44px tap targets (wishlist `h-11 w-11`, size/color controls `min-h-11`).
- **PDP sticky buy-bar** already existed (`fixed … md:static`).
- **/shop search** is the listing's own search+filter engine (categories,
  brands, sort, pagination, `filtersOpen` drawer) — not a redundant duplicate of
  the header search. Do not remove it.

### Still worth doing (needs a bit more design; not started)
- **Homepage length:** mobile home is still ~12,550px — cap rails to ~4–6 items
  with "See all" + lazy-load below-the-fold rails (`home-storefront.tsx`).
- **Header collapse-on-scroll** (optional polish): the 4-row sticky header
  (utility strip + logo/icons + search + chips) could hide the strip + chips on
  scroll-down. Lives in `site-header-client.tsx`.
- **Data-quality (demo only):** some seed titles carry internal status
  (e.g. "… (moderation)") and some images mismatch the product; add a
  display-side guard + clean the seed. Real seller data won't have this.
- **Operator dashboards (P3):** card-walls → sortable tables on desktop, compact
  rows on mobile. Needs its own screenshot pass of the logged-in dashboards.

**Shared rule unchanged:** discuss → approve → implement; presentational UI PRs
go straight to the live storefront (no flag), each verified on a mobile preview.

### Mobile UX pass — update 2 (home length)
- **#78 — home feed first batch 24→12.** The "Products For You" infinite-scroll
  feed loaded a smaller initial batch. (`src/app/page.tsx`)
- **#79 — lean mobile home.** Secondary merchandising (Aspera Selects, Shop by
  Brands, Campaign tiles, Price-led collections, Featured sellers) is now
  `hidden md:block` — desktop/tablet keep the full home. (`src/app/page.tsx`)
- **Cumulative mobile result (verified):** home **21,418 → 7,901px** (−63%),
  cart **11,425 → 2,557px**, PDP price always visible in the sticky bar, and the
  product feed is reached at **3,544px** (was 6,035). Desktop unchanged.
- **Storefront mobile pass = done.** Remaining UX items: operator dashboards
  (card-walls → tables, own pass), optional header collapse-on-scroll, demo
  data-quality cleanup.

### Dashboards UX pass — 2026-10-23
Screenshotted admin + seller consoles at 390px + 1440px (logged in). No
horizontal overflow anywhere.
- **#81 — Seller "Products" list → responsive table.** 408 listings rendered
  as full-width cards (~3,300px/page on desktop); now a Product / SKU / Price /
  Stock / Status / Actions table on desktop, cards on mobile (single map).
  Desktop page 3,364→2,038px. (`src/components/seller-catalogue-panel.tsx`)
- **Already good (no change):** seller **Inventory** is already a table with
  inline on-hand editing; seller nav collapses to a "Menu" on mobile; admin
  shell (sidebar + tabs + search) is clean.
- **Not card-walls:** admin **Finance** is forms + a double-entry ledger view
  (money-sensitive — left as-is).
- **Deferred:** admin **Seller queue** cards → table (currently empty in demo
  since all sellers are approved; has bulk-select, so lower priority); most
  other admin lists are empty in the demo data.

---

## 15. Update — 2026-10-23 (Claude Code): pivot to a Pune PC marketplace

Owner decision: convert the demo marketplace into a **Pune PC-components store**
(first testing playground). Shipped and live on `aspera.market`.

- **Catalogue (#83):** `src/modules/catalogue/pc-catalogue-data.ts` — 9 PC
  categories (processors, motherboards, graphics-cards, memory-ram,
  storage-ssd, cabinets, keyboard-mouse, monitors, ups), 39 brands, 5 Pune
  sellers (`pcc/tzp/pcp/gip/ddp`), **90 real products** with specs,
  descriptions, India street prices (×1.12 MRP), HSN, and self-hosted images
  under `public/products/` (74/90; rest fall back to the initials placeholder).
- **Seed (#83):** `src/modules/catalogue/seed-pc.ts` — idempotent; upserts
  categories/brands/Pune sellers, **archives** the old fashion catalogue
  (2,320 products set to `archived`, old categories deactivated — no hard
  delete, FK-safe), upserts the 90 PC products (Standard variant + inventory +
  image).
- **Applied to prod** via a one-off admin endpoint that has since been
  **removed** (#84). To re-run the seed (e.g. after fixing images), re-add a
  guarded endpoint or run `seedPcCatalogue()` against the DB.
- **Nav (#83):** `src/lib/mega-menu.ts` rewritten for the 9 PC categories
  (mega-menu, search placeholder, trending terms, category/brand tiles).
- **Home (#84):** hero carousel, discovery banner, selects/campaign tiles, and
  price buckets rebranded to PC; hero images under `public/hero/pc-*.jpg`.

**Known follow-ups:** 16 products still need real images (mostly UPS — their
research URLs were store/category pages); the local `pnpm db:seed` still seeds
the OLD fashion data (prod uses the PC seed) — repoint `prisma/seed.ts` to
`seedPcCatalogue` when convenient.

**Cursor:** the live catalogue is now PC parts. The old fashion seed files
(`seed-catalogue-data.ts`, `seed-nav-lanes.ts`) remain in the repo but are not
used in production.

## 14. Cursor Wave 0 — money-path trust (2026-10-24)

Owner approved Cursor to choose and build from the Medusa gap plan + deep audit.
**Wave 0 shipped (this PR):** close money/inventory P0s before Medusa Tier-1 infra.

1. **Coupon-net refunds** — `allocateDiscountPaise` / `netMerchandisePaise`; GST uses post-discount taxable base.
2. **Line-scoped refunds everywhere** — `createCappedLineRefund` stamps `orderLineId` on cancel/return/protection; remaining-cap shared.
3. **Claims** — `not_delivered` denied when fulfilment group is already `cancelled`.
4. **Reservations** — unpaid cancel releases reserved stock; `startPayment` after `payment_failed` re-reserves (or fails closed).
5. **Pay now** — `mock-complete` gated on `paymentsAreMockOnly()` (not `NODE_ENV`), so demo pay works on `aspera.market` until Razorpay lands.
6. **Seller status** — fulfilment/returns writes require `seller.status === "approved"` (admins exempt).
7. **COD** — `codAvailable` always false; PDP no longer advertises COD (A-28 deferred).

**Next (Wave 1, not started):** outbox publisher + Vercel Cron → Blob/S3 + NotificationPort → separate prod Neon. Then Wave 2 saga + Razorpay flag.
