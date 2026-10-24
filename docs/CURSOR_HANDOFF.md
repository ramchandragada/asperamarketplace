# Aspera Marketplace — Developer Handoff (for Cursor)

**Last updated:** 2026-10-24 by Claude Code.
**Live:** https://aspera.market (Vercel). **Default branch:** `main`.
**What it is now:** a **Pune PC-components marketplace** (testing playground) —
multi-vendor, India/GST-aware, payments still mocked.

This is the single most complete orientation doc. Pair it with:
`SESSION_HANDOFF.md` (running change log, §1–§15), `CTO_CODE_AUDIT.md`,
`DESIGN_SYSTEM.md`, `CATALOGUE_V2_PLAN.md`, `DASHBOARD_UX_AUDIT.md`.

---

## 0. Read-me-first rules (don't regress these)

1. **This is a modified Next.js 16** (see `AGENTS.md`). Read
   `node_modules/next/dist/docs/` before using unfamiliar Next APIs.
2. **Workflow:** discuss → approve → implement. Each change ships via a PR with
   all gates green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
3. **Migrations are additive-only** and auto-run on production deploy. Never
   assume a manual migrate step; never author a destructive migration.
4. **Money is server-authoritative.** All money in **paise** (integers). Never
   trust client totals. Use `formatPaise` to display, `refund-math.ts` for
   refunds, and post to the ledger via `postRefundLedger`.
5. **No hardcoded colors or raw status enums** in UI — use design tokens and
   `src/lib/status-labels.ts`.
6. Light theme only (no `dark:` variants).

---

## 1. Stack & layout

- **Next.js 16.3.6** (App Router, React 19.2, Turbopack), **TypeScript (strict,
  `noUncheckedIndexedAccess`)**, Tailwind.
- **Prisma 6.16.2** + **PostgreSQL 16** (Neon in prod).
- **Node `>=24.21.0 <25`** (CI/Vercel). Local dev tolerates Node 22 with an
  engine warning.
- Package manager: **pnpm**.

```
src/
  app/        Next routes + API (app router). Route groups: admin/, seller/,
              account/, api/, products/[slug], browse, shop, cart, checkout, …
  components/ UI (storefront + operator consoles + shared ui/ primitives)
  modules/    Domain logic: account, admin, analytics, cart, catalogue, finance,
              fulfilment, identity, orders, payments, protection, seller, tax,
              trust, wishlist
  lib/        status-labels.ts, mega-menu.ts (nav IA), json-ld, safe-path …
  platform/   infra: db/prisma, http/respond (jsonOk/jsonError), config/env,
              config/site-contact, storage, health
prisma/       schema.prisma, migrations/, seed.ts, backfill-catalogue-v2.ts
public/       products/ (PC product images), hero/ (PC hero images),
              category-tiles/
docs/         handoffs, audits, plans
```

## 2. Local dev

```bash
# Postgres 16 running locally, then:
export DATABASE_URL="postgresql://aspera_dev:aspera_dev_only_not_secret@127.0.0.1:5432/aspera_marketplace_dev?schema=public"
pnpm install
pnpm db:migrate     # prisma migrate deploy
pnpm db:seed        # NOTE: currently seeds the OLD fashion demo (see §5)
pnpm dev
```
Gates: `pnpm typecheck` · `pnpm lint` · `pnpm test` (Vitest; integration tests
need `DATABASE_URL`) · `pnpm build`.
Demo logins (dev only, gated by `ALLOW_DEMO_LOGINS` in prod):
`admin@aspera.local` / `AsperaAdminDevOnly1!`,
`seller@aspera.local` / `AsperaSellerDevOnly1!`,
`customer@aspera.local` / `AsperaCustomerDevOnly1!`.
Pune PC sellers: `pcc|tzp|pcp|gip|ddp @aspera.local` / `AsperaSellerDevOnly1!`.

## 3. Data model (key Prisma models in `prisma/schema.prisma`)

- **Identity:** `User`, `Role`, `UserRole` (scoped), `Session`, `LoginAttempt`,
  `BuyerProfile`. Roles include `admin`, `seller_owner`, seller staff.
- **Seller:** `Seller` (status, KYC, ratings), `SellerKycCase`, `KycDocument`.
- **Catalogue (current, "v1"):** `Category`, `Brand`, `Product` (owned by one
  seller; `sharedListingKey` groups the same shopper-facing product across
  sellers), `ProductVariant` (price/sku), `InventoryItem` (per variant),
  `StockMovement`, `ProductImage`.
- **Catalogue v2 (additive, behind flag — see §6):** `CatalogueProduct`,
  `CatalogueVariant`, `SellerOffer`, `OfferInventory`, `CatalogueImage`,
  enum `OfferCondition`.
- **Cart/Order:** `Cart`/`CartItem`, `CheckoutSession`, `Order`,
  `OrderFulfilmentGroup` (per-seller shipment grouping), `OrderLine` (price
  **snapshot** — never rewritten), `PaymentAttempt`, `Invoice`.
- **Money/finance:** double-entry `LedgerAccount`/`JournalEntry`/`JournalLine`,
  `CommissionRule`, `SettlementBatch`/`SettlementLine`, `ReconciliationException`.
- **Trust:** `RiskCase`, `CounterfeitCase`, `ProductReview`, `SellerFeedback`
  (product vs seller reviews are **separate**), `ProtectionClaim`, `Dispute`,
  `ReturnRequest`, `Refund`, `SupportTicket`, `PrivacyRequest`,
  `ComplianceEvidence`.
- **Tax:** `TaxProfile` (GST v2: CGST/SGST/IGST, TCS on settlements).
- Infra: `AuditLog` (append-only), `IdempotencyRecord`, `OutboxEvent`,
  `FeatureFlag`, `PlatformSetting`.

## 4. The current catalogue — Pune PC marketplace

**Source of truth:** `src/modules/catalogue/pc-catalogue-data.ts`
- `PC_CATEGORIES` (9): `processors, motherboards, graphics-cards, memory-ram,
  storage-ssd, cabinets, keyboard-mouse, monitors, ups`.
- `PC_BRANDS` (39), `PC_SELLERS` (5 Pune shops: keys `pcc/tzp/pcp/gip/ddp`).
- `PC_PRODUCTS` (90): `{slug, categorySlug, brandSlug, sellerKey, title, summary,
  description, sku, sellingPricePaise, mrpPaise, onHand, weightGrams, hsnCode,
  imagePath}`. `imagePath` → `/products/<slug>.jpg` (self-hosted) or `null`
  (initials placeholder). **74/90 have images.**

**Seeder:** `src/modules/catalogue/seed-pc.ts` → `seedPcCatalogue(prisma)`.
Idempotent. Upserts categories/brands/Pune sellers (approved), **archives** all
non-PC products (status `archived`) + deactivates old categories, then upserts
90 products (one `Standard` variant + inventory + image each). It does **not**
hard-delete, so existing orders/cart FKs stay valid.

**Nav/IA:** `src/lib/mega-menu.ts` — `MEGA_MENU`, `SEARCH_PLACEHOLDER`,
`TRENDING_SEARCHES`, `ASPERA_CATEGORY_TILES`, `ASPERA_BRAND_LANES`. All PC now.
**Home merchandising:** `src/app/page.tsx` (`DISCOVERY_LANES`, `SELECT_TILES`,
`CAMPAIGN_TILES`, `PRICE_COLLECTIONS`) + `src/components/home-storefront.tsx`
(`HERO_SLIDES`). Hero images in `public/hero/pc-*.jpg`.

### How to add / edit PC products
1. Edit `PC_PRODUCTS` (and `PC_BRANDS` if a new brand). Add image to
   `public/products/<slug>.jpg` and set `imagePath`.
2. Run `seedPcCatalogue()` against the target DB (locally: a small script, or
   add it to `prisma/seed.ts`). **Prod has no live seed endpoint** (it was a
   one-off, now removed) — re-add a guarded admin route or run the function with
   the prod `DATABASE_URL` to re-apply. See §8 "Applying data to prod".

### Known gap
16 products have no image (mostly UPS; their research URLs were store/category
pages). `imagePath` is `null` for them → placeholder. Fix: find direct image
URLs, drop JPGs in `public/products/`, set `imagePath`, re-run the seed.

## 5. Old fashion catalogue (not used in prod)
`seed-catalogue-data.ts`, `seed-nav-lanes.ts`, `seed-catalogue.ts` still exist
and `pnpm db:seed` (`prisma/seed.ts`) still seeds the **old fashion** data.
Production runs the **PC** seed instead. **TODO:** repoint `prisma/seed.ts` to
call `seedPcCatalogue` so local = prod. The old fashion products are `archived`
in prod, not deleted.

## 6. Catalogue v2 — shared catalogue + offers (IN PROGRESS, flag-gated OFF)
Plan: `docs/CATALOGUE_V2_PLAN.md`. Goal: move from per-seller `Product` +
`sharedListingKey` to a marketplace-owned `CatalogueProduct` + `SellerOffer`
model. Shipped behind `catalogueV2Enabled()` (`src/modules/catalogue/flags.ts`,
env `CATALOGUE_V2`, default **OFF**):
- **P1 schema** (tables above). **P2 service** `catalogue-v2.ts`
  (`getCatalogueProductBySlug`, `listOffersForCatalogueVariant`, `rankOffers`
  buy-box, `bestOfferPricePaise`). **P3-prep backfill**
  `catalogue-v2-backfill.ts` + `pnpm db:backfill:v2`.
- **Not done:** offer-centric PDP/search (P3), cart/checkout/orders/inventory on
  `offerId` (P4 — the money path), admin merge + retire old model (P5).
- **DO NOT** set `CATALOGUE_V2=true` in prod or re-point the money path without
  coordinating — the live PC catalogue uses the v1 `Product` model. The two must
  not diverge. Note: the PC pivot seeded into **v1**; v2 would need its own seed.

## 7. Auth, roles, gates
- **Demo logins** gated by `ALLOW_DEMO_LOGINS` (prod). `@aspera.local` accounts.
- **Admin 2FA (TOTP):** OFF. Gated on **`ENABLE_ADMIN_TOTP`** (`=== "true"` to
  enforce, in production). The legacy `REQUIRE_ADMIN_TOTP` is **deliberately
  ignored** (`src/modules/identity/service.ts` `adminTotpRequiredInProduction`).
  The enrolment UI (`/admin/security`) + verify code stay in place — re-enable
  before launch by setting `ENABLE_ADMIN_TOTP=true`.
- **Post-login routing** (`src/components/auth-form.tsx`): admin→`/admin`,
  seller→`/seller`, else `/account`; `?next=` wins.
- Layout gates: `src/app/admin/layout.tsx`, `src/app/seller/layout.tsx`.
- Capability checks: `src/modules/identity/policy.ts` (`actorIsAdmin`,
  `actorHasSellerCapability`, …).

## 8. Deploy & infra (Vercel)
- Vercel auto-deploys `main`. Build = `vercel-build` → `scripts/vercel-build.mjs`:
  - **Migrations run only on production builds** (`VERCEL_ENV=production`);
    preview builds skip migrate (so they never contend for the lock).
  - The production migrate **retries up to 5× with backoff** (8/16/24/32s) to
    survive the Prisma advisory-lock `P1002` (§11). **Don't merge two PRs in
    quick succession** — overlapping prod builds still stress the lock.
- **SEO/canonical:** default origin is `https://aspera.market`
  (`layout.tsx`/`products/[slug]`/`robots.ts`/`sitemap.ts`); overridable by
  `NEXT_PUBLIC_SITE_URL` (set in Vercel Production).
- **Images:** Next/Image `remotePatterns` + CSP `img-src` only allow Unsplash
  (`next.config`). Product/hero images are **self-hosted** under `public/` to
  avoid CSP/remote issues. To use a new remote image host, add it to both
  `remotePatterns` and the CSP `img-src`.
- **Open infra item (§11 item 1):** production Neon still shares with
  preview/dev. Separate it before real sellers/customers.

### Applying data to prod (no direct prod DB access from code sessions)
Prod data changes need to reach the Neon DB. Patterns used: a **guarded,
admin-only, confirmation-gated API route** that calls the seeder, triggered once
by an authenticated admin, then removed. (That's how the PC catalogue was
applied; the route `/api/admin/seed-pc` has since been deleted.) Alternatively
run the seeder locally against the prod `DATABASE_URL`.

## 9. Conventions
- **Colors:** semantic tokens only (`text-danger`, `bg-warning-soft`,
  `border-border`) — never `text-red-700`/hex/`black/*`. See `DESIGN_SYSTEM.md`.
- **Status enums shown to users:** `src/lib/status-labels.ts`.
- **Money:** `formatPaise` (Intl en-IN ₹), integers in paise.
- **Refunds:** `src/modules/finance/refund-math.ts` (item + GST, per-line cap);
  always post to the ledger (`postRefundLedger`). Settlements net out refunds.
- **Destructive/irreversible UI:** confirm first. **Dev-only UI:** gate with
  `process.env.NODE_ENV !== "production"`.
- **Shared UI primitives:** `src/components/ui/*` (`Button`, `Badge`,
  `EmptyState`, `Skeleton`, `Card`, `PageShell`, `DashboardSkeleton`).
- **New dashboard segments:** add `loading.tsx` + `error.tsx`.
- **HTTP:** API routes use `jsonOk`/`jsonError` from `platform/http/respond.ts`;
  idempotency + optimistic concurrency (`expectedVersion`) on mutations.

## 10. UX state (recent pass — mobile-first, desktop-strong)
- Mobile footer trimmed (SEO sitemap `hidden md:block`), PDP price in a sticky
  buy-bar, home length cut (secondary merchandising desktop-only), seller
  "Products" list is now a **responsive table** (`seller-catalogue-panel.tsx`,
  pattern to reuse for other operator lists). Details in `SESSION_HANDOFF.md`
  §14 + `DASHBOARD_UX_AUDIT.md`.
- **Next UX candidates:** admin seller-queue cards → table (when populated),
  optional header collapse-on-scroll.

## 11. Testing & gates
- `pnpm test` = Vitest. Unit tests run anywhere; `*.integration.test.ts` need a
  live `DATABASE_URL` (they'll error with `PrismaClientInitializationError`
  otherwise — that's env, not code). Current suite: ~121 tests, 46 files.
- GitHub Actions `ci` runs typecheck/lint/test/build on an **isolated DB**
  (unaffected by the prod migrate-lock). Vercel preview build must also be green.

## 12. Environment variables (reference)
| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres/Neon connection |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (prod: `https://aspera.market`) |
| `ALLOW_DEMO_LOGINS` | Allow `@aspera.local` logins in prod |
| `ENABLE_ADMIN_TOTP` | `true` to enforce admin 2FA (default off) |
| `REQUIRE_ADMIN_TOTP` | **Legacy, ignored** — don't rely on it |
| `CATALOGUE_V2` | `true` to read the v2 catalogue (default off; not prod-ready) |
| `VERCEL_ENV` | Vercel-set; gates the production-only migrate |
| `SITE_SUPPORT_EMAIL` / `SITE_SUPPORT_PHONE*` / `SITE_GRIEVANCE_EMAIL` / `SITE_LEGAL_ENTITY` | Footer/contact overrides (`platform/config/site-contact.ts`) |
| `DOCUMENT_STORAGE_PATH` | KYC doc storage path |
| `MOCK_PAYMENT_WEBHOOK_SECRET` | Mock payments |

## 13. Open backlog / TODO (prioritised)
1. **16 missing PC product images** (mostly UPS) — add JPGs + `imagePath`, reseed.
2. **Repoint `prisma/seed.ts`** to `seedPcCatalogue` (local = prod).
3. **Separate prod Neon DB** from preview/dev (§11 item 1) — needed before real traffic.
4. **Real seller onboarding assets:** image upload (currently URL/self-hosted),
   bulk catalogue import (spreadsheet) — blocks real sellers.
5. **Payments** (Razorpay/COD) — LAST, after dummy-order testing.
6. Catalogue v2 P3→P5 (offer-centric PDP, money-path cutover, admin merge).
7. Error monitoring (Sentry), transactional email.
8. Replace the demo admin with a real private admin account; re-enable 2FA.

## 14. How-to recipes
- **Add/retry a product image:** drop `public/products/<slug>.jpg`, set
  `imagePath` in `PC_PRODUCTS`, reseed prod (guarded route or prod `DATABASE_URL`).
- **Re-run the PC seed on prod:** re-add a guarded admin route calling
  `seedPcCatalogue(prisma)` (admin-auth + confirmation token), trigger as admin,
  remove it. (Removed route was `src/app/api/admin/seed-pc/route.ts` — see git
  history of PR #83/#84 for the exact pattern.)
- **Re-enable admin 2FA:** set `ENABLE_ADMIN_TOTP=true` in Vercel Production.
- **Change the live domain / canonical:** `NEXT_PUBLIC_SITE_URL` + the fallbacks
  in `layout.tsx`/`products/[slug]`/`robots.ts`/`sitemap.ts`.
- **Flip catalogue v2 on (preview only, when ready):** seed v2 data
  (`pnpm db:backfill:v2`), set `CATALOGUE_V2=true`, re-point PDP/cart (P3/P4).

## 15. Recent PR history (this session, all merged)
#58–#64 money integrity, storefront/checkout UX, dashboard safety + design
tokens, seller payout, admin seller queue. #65/#67 admin 2FA off + login
routing. #66 production-only migrate. #68–#70 catalogue v2 P1/P2/P3-prep. #71
`aspera.market` canonical. #72/#73 handoff sync + Cursor ack. #75/#76/#78/#79/#81
mobile UX pass. #83 Pune PC catalogue + seed + nav. #84 PC home rebrand. #86
migrate retry hardening. (Full detail: `SESSION_HANDOFF.md`.)
