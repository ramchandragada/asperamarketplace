# Aspera Marketplace — Project Documentation

**The complete technical + business reference for the Aspera Marketplace
platform.** Authoritative, single-source overview generated 2026-10-24.

Companion documents:
- `CURSOR_REFERENCE.md` — terse inventory (every route/function/constant).
- `CURSOR_HANDOFF.md` — setup, deploy, env, conventions, backlog for developers.
- `SESSION_HANDOFF.md` — running change log and decision history.
- `CATALOGUE_V2_PLAN.md` — the shared-catalogue migration plan.

---

## Table of contents

1. [What Aspera is](#1-what-aspera-is)
2. [Business model & locked decisions](#2-business-model--locked-decisions)
3. [Technology stack](#3-technology-stack)
4. [Architecture](#4-architecture)
5. [Repository layout](#5-repository-layout)
6. [Data model](#6-data-model)
7. [Domain modules](#7-domain-modules)
8. [API surface](#8-api-surface)
9. [Frontend & pages](#9-frontend--pages)
10. [Core workflows](#10-core-workflows)
11. [Money, tax & the ledger](#11-money-tax--the-ledger)
12. [Security & platform primitives](#12-security--platform-primitives)
13. [Catalogue v1 vs v2](#13-catalogue-v1-vs-v2)
14. [Build, deploy & environments](#14-build-deploy--environments)
15. [Testing](#15-testing)
16. [Operations & runbooks](#16-operations--runbooks)
17. [Current status & live data](#17-current-status--live-data)
18. [Roadmap & backlog](#18-roadmap--backlog)
19. [Glossary](#19-glossary)

---

## 1. What Aspera is

Aspera is an online **marketplace for India** — multiple sellers list products,
buyers browse/search/checkout, sellers fulfil, and the platform handles pricing,
tax, commissions, settlements, returns, trust & safety, and buyer protection.

**Current focus (pivot, Oct 2026):** the storefront is a **computer-components
marketplace for Pune** — processors, motherboards, graphics cards, memory, SSDs,
cabinets, keyboard/mouse combos, monitors, and UPS. Live at **aspera.market**.
The underlying platform is category-agnostic; the PC focus is seed data +
merchandising, not a code constraint.

**Posture:** a modular monolith with a money-grade core — server-authoritative
pricing in paise, a double-entry ledger, idempotent money/stock operations, and
optimistic concurrency. Payments are **mocked** by design until the catalogue and
operations are proven (see §2).

---

## 2. Business model & locked decisions

These are product decisions made with the owner. They are binding until changed.

| Decision | Rule |
|---|---|
| **Payments** | **Mocked, and the LAST thing to go live.** Test with dummy orders; scale slowly. Razorpay/COD are reserved but not wired. |
| **Platform commission** | **10% default** (`DEFAULT_COMMISSION_BPS = 1000` bps). Overridable per seller via `CommissionRule`. |
| **GST** | Typically **18%**, rate-driven. CGST+SGST for intra-state (seller & buyer same state), IGST for inter-state. `tax = floor(taxable × rateBps / 10000)`. |
| **TCS** | **0.5%** (u/s 206C(1H)) withheld from seller settlement net. |
| **Shipping** | Flat **₹49** base + **₹20/kg**; **free above ₹999** merchandise subtotal. |
| **Refunds** | **Item price + GST**. Shipping is **non-refundable**. A line can't be refunded beyond what was paid, across returns + protection claims combined. |
| **Coupons** | **Platform-funded** (not charged to sellers). Dev coupon `ASPERA10` = 10% off, capped ₹200. |
| **COD** | Deferred. |
| **Catalogue data** | Work with demo/PC data until real sellers onboard. |
| **Launch gating** | Replace demo admin + re-enable admin 2FA before public launch. |

**Revenue model:** commission on each sold fulfilment group, netted of refunds,
with TCS withheld and GST accounted separately. Buyers pay item + GST + shipping
− discount; sellers receive merchandise − commission − TCS.

---

## 3. Technology stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.3.6** (App Router, Turbopack) | ⚠️ "NOT the Next.js you know" — read `node_modules/next/dist/docs/` before using new APIs (see `AGENTS.md`). |
| UI runtime | **React 19.2** | Server Components by default. |
| Language | **TypeScript (strict)** | `noUncheckedIndexedAccess` on. |
| ORM | **Prisma 6.16.2** | `@prisma/client`; migrations in `prisma/migrations`. |
| Database | **PostgreSQL 16** | Neon in production. |
| Styling | **Tailwind CSS v4** | `@tailwindcss/postcss`. |
| Validation | **Zod 4** | Request/DTO validation. |
| Auth hashing | **bcryptjs** | Password hashing. |
| Testing | **Vitest 3** | Unit + integration (integration needs `DATABASE_URL`). |
| Runtime | **Node `>=24.21.0 <25`** | Local Node 22 works with an engine warning. |
| Package manager | **pnpm 10.33.3** | |
| Hosting | **Vercel** (app) + **Neon** (DB) | `main` auto-deploys to production. |
| Domain | **aspera.market** (GoDaddy DNS) | Canonical origin. |

**Scripts** (`package.json`): `dev`, `build`, `vercel-build`, `start`, `lint`,
`typecheck`, `test` / `test:unit` / `test:integration`, `db:*` (generate,
validate, migrate, migrate:dev, status, seed), `db:backfill:v2`.

---

## 4. Architecture

**Modular monolith.** One deployable Next.js app, internally split into domain
modules with a shared platform layer. Layering (dependencies point downward):

```
 Routes / Pages (src/app)          ← HTTP + RSC; thin; auth + validation + call module
      │
 Domain modules (src/modules/*)    ← business logic, the only place that writes domain state
      │
 Platform (src/platform/*)         ← cross-cutting: db, http, idempotency, logging, config…
      │
 Prisma / PostgreSQL
```

**Principles:**
- **Server-authoritative pricing.** The browser never sets money. Totals are
  computed server-side in **paise** (integers) and snapshotted.
- **Idempotency** on money/stock operations (`IdempotencyRecord`, keyed).
- **Optimistic concurrency** via a `version` column on mutable aggregates;
  writes pass `expectedVersion` and fail on conflict.
- **Double-entry ledger** for all money movement (every event balanced).
- **Audit + outbox.** Privileged actions append to `AuditLog`; domain events are
  written transactionally to `OutboxEvent` for async publication.
- **Capability-based authorization** resolved from roles (`src/modules/identity`).

---

## 5. Repository layout

```
asperamarketplace/
├─ src/
│  ├─ app/                 Next.js App Router: pages + ~80 API routes
│  │  ├─ api/              REST endpoints (route.ts handlers)
│  │  ├─ (storefront)/     home, browse, shop, products, cart, checkout…
│  │  ├─ account/          buyer account hub
│  │  ├─ seller/           seller console
│  │  └─ admin/            admin console
│  ├─ modules/             domain logic (15 modules; see §7)
│  ├─ components/          58 React components (+ ui/ primitives)
│  ├─ lib/                 mega-menu, status labels, json-ld, safe-path
│  └─ platform/            cross-cutting infra (see §12)
├─ prisma/
│  ├─ schema.prisma        data model (70+ models/enums)
│  ├─ migrations/          21 migrations
│  ├─ seed.ts              baseline seed
│  └─ backfill-catalogue-v2.ts
├─ public/                 self-hosted images (products/, hero/, category-tiles/)
├─ scripts/                vercel-build.mjs, provisioning & demo helpers
└─ docs/                   this file + handoffs, audits, plans
```

---

## 6. Data model

PostgreSQL via Prisma. **70+ models and enums.** All money is `Int` paise; all
timestamps are `Timestamptz(6)`; mutable aggregates carry an integer `version`
for optimistic concurrency; table names are snake_case via `@@map`.

### 6.1 Platform & infrastructure
- **AuditLog** — append-only privileged-action history (actor, action, before/after, correlationId). Never updated/deleted by app code.
- **IdempotencyRecord** — command dedup for money/stock ops; unique `(key, scope)`; stores response for replay; `expiresAt`.
- **OutboxEvent** — domain events written in the state-change transaction, published async (`status`, `attempts`, `availableAt`).
- **FeatureFlag** — `key`, `enabled`, optional `payload` (e.g. `CATALOGUE_V2`).
- **PlatformSetting** — versioned key/value JSON settings.

### 6.2 Identity & access
- **User** — email, `passwordHash`, `displayName`, `status` (active/suspended/deleted), optional AES-GCM-encrypted TOTP secret (`totpSecretEnc`) for admins, soft-delete.
- **BuyerProfile** — business name, GSTIN (masked on display), tax-invoice preference, preferred payment method.
- **Role / UserRole** — RBAC. `UserRole.scopeKey` is `"global"` or a seller UUID (seller-scoped roles); unique `(userId, roleId, scopeKey)`.
- **Session** — hashed session token, expiry, revocation, IP/UA.
- **LoginAttempt** — audit of login successes/failures (brute-force visibility).

### 6.3 Seller & KYC
- **Seller** — owner, legal/trade name, `status` (draft→submitted→under_review→approved/rejected/suspended), PAN last-4, masked GSTIN, registered state, denormalized `ratingAvg`/`ratingCount`, `version`.
- **SellerKycCase** — KYC workflow stage (`business_profile`/`documents`/`agreement`/`risk_screening`/`manual_review`) + status.
- **KycDocument** — uploaded doc metadata: storage key, filename, content-type, byte size, SHA-256 checksum, uploader.

### 6.4 Catalogue v1 (live)
- **Category** — slug, name, self-referential tree (`parentId`), `isActive`.
- **Brand** — slug, name.
- **Product** — seller-owned listing: slug, title, summary, description, `status`, HSN, `sharedListingKey` (groups the same shopper-facing product across sellers; unique `(sharedListingKey, sellerId)`), `attributes` JSON, `searchDocument` (GIN full-text), `version`.
- **ProductImage** — url, alt, sort order, `isPrimary`.
- **ProductVariant** — unique `sku`, option values, `mrpPaise`, `sellingPricePaise`, weight.
- **InventoryItem** — one per variant: `onHand`/`reserved`/`damaged`, `version`.
- **StockMovement** — append-only stock ledger (type, quantity, reason, correlationId).

### 6.5 Cart & checkout
- **Cart** — user-owned or **guest** (`guestToken` cookie); `status` (open/checked_out/abandoned); `version`.
- **CartItem** — variant + quantity; unique `(cartId, variantId)`.
- **CustomerAddress** — shipping address book; `isDefault`.
- **CheckoutSession** — server-owned pricing **snapshot** (subtotal/discount/shipping/tax/total paise), `couponCode`, `reservedUntil` (stock hold), `status` (draft/reserved/expired/cancelled/converted), unique `idempotencyKey`.

### 6.6 Orders & payments
- **Order** — unique `orderNumber`, pricing snapshot, `status` (awaiting_payment/paid/payment_failed/cancelled/partially_cancelled/fulfilled), one per `CheckoutSession`, `version`.
- **OrderFulfilmentGroup** — per-seller slice of an order: `status` (pending/processing/shipped/delivered/cancelled), line + shipping totals, carrier/tracking, `version`.
- **OrderLine** — immutable price/quantity snapshot (product/variant titles, sku, unit & line paise).
- **PaymentAttempt** — provider (`mock`), unique `providerReference` + `idempotencyKey`, `status`, amount, `clientSecret`, raw response.
- **PaymentWebhookEvent** — inbound webhook record: unique `(provider, providerEventId)`, `signatureValid`, `processed`, raw payload hash.
- **Invoice** — structured invoice `document` JSON, `status` (draft/issued/voided). *Not yet a legally reviewed GST invoice (open item).*
- **NotificationMessage** — outbound channel message queue (channel, recipient, template, status).

### 6.7 Fulfilment, returns & care
- **Shipment** — one per fulfilment group: carrier, tracking, label storage key.
- **ReturnRequest** — `status` (requested/approved/rejected/received/closed), reason, quantity, optional `orderLineId`, `version`.
- **Refund** — `amountPaise` + **`merchandisePaise`** (excludes GST; used for settlement netting & refund caps), `status` (pending/succeeded/failed), links to order/line/return.
- **SupportTicket** — buyer support (status, priority).
- **Dispute** — buyer↔seller dispute (status opened/under_review/resolved/closed).
- **ProtectionClaim** — Buyer Protection (A-to-z style): `claimType` (not_delivered/not_as_described/return_not_honored/other), evidence URLs, `status`, optional `refundId` + `sellerDebitPaise`.
- **SellerFeedback** — post-delivery seller quality rating (overall + shipping/packaging/accuracy); one per order line; feeds `Seller.ratingAvg`.

### 6.8 Finance & settlements
- **LedgerAccount** — chart of accounts (`code`, `accountType`: asset/liability/revenue/expense/equity).
- **JournalEntry** — balanced entry: unique `entryNumber`, `status` (draft/posted/reversed), `sourceEvent`, `correlationId`, optional reversal link.
- **JournalLine** — debit/credit paise against an account (optionally tagged seller/order).
- **CommissionRule** — `rateBps`, optional `sellerId` override, `active`.
- **SettlementBatch** — per-seller period batch: gross/commission/**tcs**/net paise, `status` (pending/held/released/paid/failed), hold reason.
- **SettlementLine** — one per fulfilment group (unique), gross/commission/net; nets refunded merchandise.
- **ReconciliationException** — money mismatches (`kind`, `reference`, amount, status open/investigating/resolved/written_off).

### 6.9 Trust, safety & compliance
- **RiskCase** — generic risk investigation on any subject (type+id, severity, status).
- **CounterfeitCase** — brand/counterfeit report against product+seller.
- **ProductReview** — moderated review (rating/title/body, status pending/approved/rejected/hidden).
- **WishlistItem** — unique `(userId, productId)`.
- **PrivacyRequest** — DSAR-style request (type, status received/in_progress/completed/rejected).
- **ComplianceEvidence** — compliance register evidence (registerKey, status draft/submitted/accepted/rejected).

### 6.10 Analytics & tax
- **AnalyticsEvent** — event stream (name, actor/seller/product/order, searchQuery, properties JSON).
- **Experiment** — A/B experiment (key, hypothesis, variants JSON, status).
- **TaxProfile** — configurable tax policy (`rateBps`, active, explanation). *Not a legal GST determination (open item).*

### 6.11 Catalogue v2 (additive, behind flag — nothing reads it yet)
- **CatalogueProduct** — marketplace-owned canonical product; sellers cannot edit its facts.
- **CatalogueImage** — images for the canonical product.
- **CatalogueVariant** — shared variant definition (no price, no SKU).
- **SellerOffer** — a seller's offer on a shared variant: price, unique SKU, `condition` (new/refurbished/used), dispatch days, moderation status; unique `(sellerId, catalogueVariantId)`.
- **OfferInventory** — stock per offer (mirror of InventoryItem, keyed by offer).

> **Two catalogue models coexist.** v1 `Product`/`ProductVariant`/`InventoryItem`
> is live and powers everything. v2 (`CatalogueProduct`+`SellerOffer`) is additive
> and inert until the `CATALOGUE_V2` flag + money-path migration. Don't mix them in
> queries/seeds. See §13.

---

## 7. Domain modules

Each module under `src/modules/<name>` owns its slice of domain state and
exposes a `service.ts`. Routes/pages call these; they never write domain tables
directly. (Full function lists are in `CURSOR_REFERENCE.md §2`.)

| Module | Responsibility |
|---|---|
| **identity** | Users, roles/capabilities, sessions, login, admin TOTP, actor resolution. |
| **seller** | Seller onboarding, KYC documents, submit-for-review, admin review, access resolution. |
| **catalogue** | Categories/brands, product drafts & offers, moderation, public lookup, search (`searchApprovedProducts`), v2 helpers. |
| **cart** | Cart (user + guest), addresses, pricing, estimate, **checkout preview/confirm**, stock reservations. |
| **orders** | Order creation from checkout, payment start, mock payment outcome, webhook processing, buyer cancel, invoices. |
| **fulfilment** | Seller fulfilment (process/ship/deliver/cancel), returns, support tickets, disputes. |
| **finance** | Chart of accounts, commission resolution, **ledger postings** (order-paid, refund), settlements, reconciliation, CSV export, finance summary. |
| **tax** | Tax profiles, active policy resolution, GST computation. |
| **protection** | Buyer Protection claims (create/list/decide). |
| **trust** | Risk cases, counterfeit cases, review moderation, privacy requests, compliance evidence, trust-ops summary. |
| **account** | Buyer profile, reviews, notifications, coupon wallet, spend report (+ CSV). |
| **analytics** | Event tracking, platform dashboard, seller health, experiments. |
| **wishlist** | Wishlist add/remove/list. |
| **admin** | Admin-side aggregations/helpers. |
| **payments** | Mock payment provider + webhook signing/verification. |

---

## 8. API surface

~80 REST endpoints under `src/app/api/**/route.ts`. All use the shared
`jsonOk`/`jsonError` envelope (`platform/http/respond.ts`), are
`dynamic = "force-dynamic"`, enforce auth/capabilities server-side, and apply
idempotency + optimistic concurrency on mutations.

**Groups:** `auth/*`, `catalogue/*` + `pincode/check`, `cart/*` + `checkout/*`,
`orders/*` + `payments/*`, `seller/*`, `fulfilment/*`, `returns|claims|disputes|
tickets`, `account/* ` + `wishlist`, `admin/*`, `finance/*`, `trust/*`,
`analytics/*`, `health`.

Full route-by-route list: `CURSOR_REFERENCE.md §3`.

> `payments/mock-complete` is a **dev-only** convenience endpoint and is disabled
> in production.

---

## 9. Frontend & pages

~60 pages (App Router, mostly Server Components), plus 58 components.

- **Storefront:** `/`, `/shop`, `/browse`, `/popular`, `/products/[slug]`, `/shops/[slug]`, `/cart`, `/checkout`, `/wishlist`, `/commission`, `/sell`.
- **Buyer account:** `/account` + `addresses, business, coupons, notifications, payments, profile, returns, reviews, spend`; `/orders`, `/orders/[orderId]`, `/returns`.
- **Seller console:** `/seller` + `catalogue, catalogue/[id], inventory, fulfilment, returns, finance, compliance, profile, analytics, onboarding`.
- **Admin console:** `/admin` + `sellers, products, orders, orders/[orderId], claims, data-quality, trust, finance, analytics, audit, security`.
- **Auth/info:** `/login`, `/register`, plus policy/marketing pages (`about, careers, press, help, support, privacy, terms, shipping, returns, buyer-protection, seller-policies, download-app`).

**Mobile-first.** The home route is deliberately short on mobile (heavy
merchandising blocks are `hidden md:block`); "Products For You" uses infinite
scroll. Navigation data (mega-menu, category tiles, brand lanes, trending
searches) lives in `src/lib/mega-menu.ts`.

**Images.** Self-hosted under `public/` because only Unsplash is allow-listed in
Next `remotePatterns` + CSP. Adding an external image host means editing both
allowlists.

---

## 10. Core workflows

### 10.1 Authentication
`registerUser` / `loginUser` → hashed `Session` token in an HTTP-only cookie.
`resolveActorFromToken` / `getOptionalActor` turn the cookie into an **actor**
with capabilities. On login, the client resolves the destination via
`/api/auth/me`: admin → `/admin`, seller → `/seller`, else `/account`; `?next=`
wins (`src/components/auth-form.tsx`). Admin TOTP exists but is **off** until
re-enabled for launch (`ENABLE_ADMIN_TOTP` + production).

### 10.2 Browse → cart → checkout → order
1. Browse/search (`searchApprovedProducts`, GIN full-text on `searchDocument`).
2. Add to cart (user or guest cart; guest merges into user on login).
3. `estimateCart` / `previewCheckout` — server **re-prices** (subtotal, coupon
   discount, shipping, GST), creates a `CheckoutSession` snapshot, and
   **reserves stock** (`reservedUntil`).
4. `confirmCheckout` → `createOrderFromCheckout` — builds the `Order`, one
   `OrderFulfilmentGroup` per seller, and immutable `OrderLine` snapshots.
5. `startPayment` → mock `PaymentAttempt`; `processPaymentWebhook` /
   `simulateMockPaymentOutcome` marks it paid/failed (signature-verified,
   idempotent).
6. On paid: `postOrderPaidLedger` writes the balanced journal (cash in; seller
   payable; commission revenue; GST liability). Expired/cancelled checkouts
   release their reservations.

### 10.3 Fulfilment
Seller works each `OrderFulfilmentGroup`: `startProcessing` → `shipGroup`
(carrier + tracking, `Shipment`) → `markDelivered`, or `cancelFulfilmentGroup`.

### 10.4 Returns & refunds
`createReturnRequest` (quantity capped to purchased) → `reviewReturnRequest`.
On approval, `refundBreakdown` (`finance/refund-math.ts`) computes **item + GST**
(shipping excluded), capped per line and guarded by
`alreadyRefundedMerchandisePaise` so a line is never over-refunded across returns
+ protection claims. `postRefundLedger` writes the balancing reversal entries.
Protection claims (`decideProtectionClaim`) and buyer/group cancellations use the
same refund + ledger path.

### 10.5 Settlement
`createSettlementBatch` per seller/period: sums gross per fulfilment group, nets
refunded merchandise, applies commission (`resolveCommissionRateBps`) and **0.5%
TCS**, producing `netPaise`. `releaseSettlementBatch` moves it forward.
`ReconciliationException` captures mismatches; `exportSettlementsCsv` for finance.

### 10.6 Catalogue (seller listing)
`createProductDraft` or `createProductOffer` (matching an existing listing via
`sharedListingKey`) → `submitProductForReview` → admin `reviewProduct` →
`getPublicProductBySlug` / `searchApprovedProducts` surface it. The PDP shows
sibling sellers via `listSiblingSellerOffers`.

---

## 11. Money, tax & the ledger

- **Units:** everything in **paise** (integer). Display via `formatPaise`.
- **Server authority:** prices come from the DB at estimate/confirm time; the
  browser's numbers are never trusted. Totals are snapshotted on the checkout and
  order so later price changes don't rewrite history.
- **GST:** rate-bps based (typically 1800 = 18%). Intra-state → CGST+SGST;
  inter-state → IGST, decided by seller vs. buyer state. `tax = floor(taxable ×
  rateBps / 10000)`. `TaxProfile` holds configurable policy. *Invoices are
  structured but not yet legally reviewed GST tax invoices — an open item.*
- **Commission:** `resolveCommissionRateBps(sellerId)` → seller override or
  `DEFAULT_COMMISSION_BPS` (1000 = 10%).
- **TCS:** 0.5% withheld from seller net at settlement (u/s 206C(1H)).
- **Shipping:** `SHIPPING_POLICY` = flat ₹49 (`basePaise 4900`) + ₹20/kg
  (`perKgPaise 2000`), free above ₹999 (`freeAbovePaise 99900`).
- **Refund math:** item + GST, shipping excluded, per-line cap, no double refund.
- **Double-entry:** every money event is a balanced `JournalEntry` of
  `JournalLine` debits/credits against `LedgerAccount`s; entries can be reversed,
  never edited.

---

## 12. Security & platform primitives

`src/platform/*` holds the cross-cutting infrastructure:

- **config/** — `env.ts` typed env access; `site-contact.ts`.
- **db/** — `prisma.ts` singleton client.
- **http/** — `respond.ts` (`jsonOk`/`jsonError`), `envelope.ts`, `errors.ts`,
  `request-id.ts` (correlation IDs), `api-error-message.ts`.
- **idempotency/** — `store.ts` (the `IdempotencyRecord`-backed dedup).
- **logging/** — `logger.ts` + `redact.ts` (secrets/PII never logged).
- **notifications/** — `port.ts` (channel-agnostic notification port).
- **storage/** — `local.ts` (local document storage for KYC uploads).
- **validation/** — `id.ts` (ID validation), Zod schemas.
- **feature-flags/** — `commands.ts`.

**Security properties:**
- **RBAC / capabilities** — roles resolve to capabilities; seller-scoped roles
  carry the seller UUID. All API routes authorize server-side.
- **Sessions** — hashed tokens, expiry, revocation, IP/UA recorded;
  `LoginAttempt` logs every attempt.
- **Admin 2FA** — AES-GCM-encrypted TOTP secret per admin; gated by
  `ENABLE_ADMIN_TOTP` + `VERCEL_ENV === production` (currently off for build/test;
  re-enable before launch).
- **Idempotency + optimistic concurrency** — money/stock can't double-apply;
  conflicting writes fail on `version`.
- **Audit log** — append-only privileged-action trail with before/after + reason.
- **Outbox** — events are durable and published after commit, not inline.
- **Safe paths** (`lib/safe-path.ts`) — guards file/storage path handling.

---

## 13. Catalogue v1 vs v2

**v1 (live).** Each seller owns a full `Product` (+ `ProductVariant` +
`InventoryItem`). The same shopper-facing product across sellers is linked by
`sharedListingKey`; the PDP lists sibling offers. A seller may hold only **one**
`Product` per `sharedListingKey` (unique constraint).

**v2 (additive, inert).** A marketplace-owned `CatalogueProduct` holds canonical
facts; sellers attach `SellerOffer`s (price, SKU, condition, dispatch) to shared
`CatalogueVariant`s, with `OfferInventory` per offer. Sellers can't edit
catalogue facts. Tables exist and have a backfill (`db:backfill:v2`), but
**nothing reads them** until the `CATALOGUE_V2` flag and the money-path migration
land. Plan: `docs/CATALOGUE_V2_PLAN.md`.

> SKUs live in separate unique namespaces: `product_variants.sku` and
> `seller_offers.sku` can hold the same string independently.

---

## 14. Build, deploy & environments

- **Vercel** builds `main` → production; branches/PRs → preview deployments.
- **`scripts/vercel-build.mjs`:** applies `prisma migrate deploy` **only on
  production** (preview builds skip it), with **retry + backoff** (8/16/24/32s)
  to survive the Prisma advisory-lock (P1002) when deploys overlap. Then
  `prisma generate` + `next build`.
- **Migrations:** additive, in `prisma/migrations` (21 so far). A PR that adds a
  migration won't see it on its own preview (production-only), which is fine for
  additive changes.
- **Env vars** (`.env.example`): `DATABASE_URL`, `LOG_LEVEL`,
  `DOCUMENT_STORAGE_PATH`, `MOCK_PAYMENT_WEBHOOK_SECRET`; reserved/unset for later:
  `RAZORPAY_*`, `S3_*`, `EMAIL_PROVIDER_API_KEY`, `SMS_PROVIDER_API_KEY`,
  `WHATSAPP_PROVIDER_API_KEY`. **Never set `NODE_ENV`** — Next manages it.
  `ENABLE_ADMIN_TOTP` controls admin 2FA (off now).
- **Canonical origin** is `https://aspera.market` (layout, product metadata,
  robots, sitemap).

---

## 15. Testing

- **Vitest.** `pnpm test` (all), `test:unit` (excludes `*.integration.test.ts`),
  `test:integration` (needs a real `DATABASE_URL`; without it Prisma throws
  `PrismaClientInitializationError` — environment, not a code bug).
- **Co-located tests** across `platform/`, `lib/`, and modules (e.g. refund math,
  pricing, redaction, envelope, health).
- **E2E:** Playwright is **not yet wired** as a suite (`test:e2e` exits with a
  P2 pointer to `docs/marketplace-audit.md`). Chromium + Playwright are available
  in the environment for ad-hoc verification against preview/live.
- **CI gate:** typecheck (`tsc --noEmit`) + lint (`eslint`) + Vitest should pass
  before merge; Vercel preview must be green before merging to `main`.

---

## 16. Operations & runbooks

- **Deploy lock (P1002):** two overlapping production migrates fight the Prisma
  advisory lock. Mitigated by production-only migrate + retry/backoff. If a deploy
  still fails on it, re-deploy; the retry usually clears it. Avoid merging several
  PRs to `main` within the same minute.
- **Prod data applies:** direct Neon access isn't available from the dev
  environment. The pattern used for one-off prod data changes was a **guarded,
  admin-only endpoint** (confirm token), triggered as admin, then **removed**.
- **Database (local):** PostgreSQL 16; if it drops on idle, restart the cluster
  (`pg_ctlcluster 16 main start`). Integration tests need `DATABASE_URL`.
- **Images:** self-host under `public/`; to use an external CDN, add it to Next
  `remotePatterns` **and** the CSP.
- **Supporting runbooks in `docs/`:** `DEPLOYMENT_POLICY.md`, `MIGRATIONS.md`,
  `BACKUP_RESTORE_DRILL.md`, `LAUNCH_CHECKLIST.md`, `LOAD_TEST.md`,
  `ACCESSIBILITY_REVIEW.md`, `CATALOGUE_SEED.md`.

---

## 17. Current status & live data

- **Live storefront:** PC-components marketplace for **Pune**, on **aspera.market**.
- **Catalogue:** **90 products** across **9 categories** (10 each: processors,
  motherboards, graphics-cards, memory-ram, storage-ssd, cabinets, keyboard-mouse,
  monitors, ups) from **5 approved Pune sellers**; 39 brands. Old non-PC catalogue
  (~2320 products) was **archived** (status `archived`, not deleted) and old
  categories deactivated. Seed logic: `src/modules/catalogue/seed-pc.ts` +
  `pc-catalogue-data.ts` (idempotent upsert; no hard delete).
- **Product images:** 74/90 self-hosted; **16 missing** (mostly UPS).
- **Payments:** mocked (by decision).
- **Admin 2FA:** off (by decision; re-enable before launch).

---

## 18. Roadmap & backlog

**Near-term**
- Add the 16 missing product images (mostly UPS).
- Point `prisma/seed.ts` at `seedPcCatalogue` so fresh envs seed the PC catalogue.
- **Separate the production Neon DB** from preview/dev so previews can't touch
  prod data.

**Catalogue v2**
- Flip reads to `CatalogueProduct`/`SellerOffer` behind `CATALOGUE_V2`; migrate
  the money path (reservations → `OfferInventory`). Phases in `CATALOGUE_V2_PLAN.md`.

**Seller enablement**
- Real seller image upload + bulk product import (to replace demo seed data).

**Launch-gating**
- Payments (LAST): wire Razorpay + webhooks against the reserved env vars; COD.
- Replace demo admin credentials; re-enable admin TOTP.
- Legally reviewed GST tax invoices (close the Invoice/TaxProfile caveats).
- Sentry/error monitoring + transactional email/SMS/WhatsApp providers.
- Playwright e2e suite; load test; accessibility pass.

---

## 19. Glossary

| Term | Meaning |
|---|---|
| **paise** | 1/100 of a rupee; all money stored as integer paise. |
| **actor** | The authenticated principal (user + resolved capabilities). |
| **fulfilment group** | The per-seller slice of a multi-seller order. |
| **shared listing key** | Key linking different sellers' listings of the same product. |
| **snapshot** | Server-computed pricing frozen on checkout/order. |
| **idempotency key** | Client-supplied key making a money/stock op safe to retry. |
| **version** | Optimistic-concurrency counter on a mutable row. |
| **bps** | Basis points; 100 bps = 1%. Commission 1000 bps = 10%. |
| **TCS** | Tax Collected at Source (0.5%, u/s 206C(1H)). |
| **CGST/SGST/IGST** | GST components: intra-state pair vs. inter-state single. |
| **outbox** | Table of domain events published after transaction commit. |

---

*Maintained alongside the code. When behavior changes, update this file and
`CURSOR_REFERENCE.md` in the same PR.*
