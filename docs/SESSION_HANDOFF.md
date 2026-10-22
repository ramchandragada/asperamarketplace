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

Work was done on `claude/relaxed-brahmagupta-tfm2p7` and merged to `main` via PRs #58, #59, #60. `main` is the source of truth and what's deployed.
