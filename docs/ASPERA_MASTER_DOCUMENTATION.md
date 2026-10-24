# Aspera Marketplace — Master Documentation

**The single, complete reference for the Aspera Marketplace platform** —
technical and business, narrative and inventory, in one document. It consolidates
what were three separate documents (project documentation, developer reference,
and developer handoff). Generated 2026-10-24.

**Live:** https://aspera.market (Vercel) · **Default branch:** `main` ·
**What it is now:** a **Pune PC-components marketplace** (testing playground) —
multi-vendor, India/GST-aware, payments still mocked.

> Historical/working docs remain alongside this one for depth:
> `SESSION_HANDOFF.md` (running change log), `CTO_CODE_AUDIT.md`,
> `CATALOGUE_V2_PLAN.md`, `DASHBOARD_UX_AUDIT.md`, `DESIGN_SYSTEM.md`, and the
> audit/plan set. This master document supersedes `PROJECT_DOCUMENTATION.md`,
> `CURSOR_REFERENCE.md`, and `CURSOR_HANDOFF.md` as the one-stop reference.

---

## Table of contents

**Part A — Orientation**
1. [What Aspera is](#1-what-aspera-is)
2. [Read-me-first rules](#2-read-me-first-rules)
3. [Business model & locked decisions](#3-business-model--locked-decisions)

**Part B — The system**
4. [Technology stack](#4-technology-stack)
5. [Architecture](#5-architecture)
6. [Repository layout](#6-repository-layout)
7. [Data model](#7-data-model)
8. [Domain modules](#8-domain-modules)
9. [API surface](#9-api-surface)
10. [Frontend & pages](#10-frontend--pages)
11. [Core workflows](#11-core-workflows)
12. [Money, tax & the ledger](#12-money-tax--the-ledger)
13. [Security & platform primitives](#13-security--platform-primitives)
14. [Catalogue v1 vs v2](#14-catalogue-v1-vs-v2)

**Part C — Working with it**
15. [Local development](#15-local-development)
16. [Build, deploy & environments](#16-build-deploy--environments)
17. [Testing](#17-testing)
18. [Conventions](#18-conventions)
19. [Operations & runbooks](#19-operations--runbooks)

**Part D — Status & reference**
20. [Current status & live data](#20-current-status--live-data)
21. [Roadmap & backlog](#21-roadmap--backlog)
22. [Reference: module functions](#22-reference-module-functions)
23. [Reference: API routes](#23-reference-api-routes)
24. [Reference: pages](#24-reference-pages)
25. [Glossary](#25-glossary)
26. [Appendix: PR history & env vars](#26-appendix-pr-history--env-vars)

---

# Part A — Orientation

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
operations are proven (see §3).

## 2. Read-me-first rules

Don't regress these:

1. **This is a modified Next.js 16** (see `AGENTS.md`). Read
   `node_modules/next/dist/docs/` before using unfamiliar Next APIs — APIs,
   conventions, and file structure may differ from upstream.
2. **Workflow: discuss → approve → implement.** Each change ships via a PR with
   all gates green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, and
   a green Vercel preview before merge to `main`.
3. **Migrations are additive-only** and auto-run on production deploy. Never
   assume a manual migrate step; never author a destructive migration.
4. **Money is server-authoritative.** All money in **paise** (integers). Never
   trust client totals. Display via `formatPaise`; compute refunds via
   `refund-math.ts`; post money to the ledger (`postOrderPaidLedger` /
   `postRefundLedger`).
5. **No hardcoded colors or raw status enums in UI** — use design tokens and
   `src/lib/status-labels.ts`.
6. **Light theme only** (no `dark:` variants).

## 3. Business model & locked decisions

Product decisions made with the owner. Binding until changed.

| Decision | Rule |
|---|---|
| **Payments** | **Mocked, and the LAST thing to go live.** Test with dummy orders; scale slowly. Razorpay/COD reserved but not wired. |
| **Platform commission** | **10% default** (`DEFAULT_COMMISSION_BPS = 1000` bps). Overridable per seller via `CommissionRule`. |
| **GST** | Typically **18%**, rate-driven. CGST+SGST for intra-state (seller & buyer same state); IGST for inter-state. `tax = floor(taxable × rateBps / 10000)`. |
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

# Part B — The system

## 4. Technology stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.3.6** (App Router, Turbopack) | ⚠️ "NOT the Next.js you know" — read `node_modules/next/dist/docs/` before new APIs. |
| UI runtime | **React 19.2** | Server Components by default. |
| Language | **TypeScript (strict)** | `noUncheckedIndexedAccess` on. |
| ORM | **Prisma 6.16.2** | Migrations in `prisma/migrations`. |
| Database | **PostgreSQL 16** | Neon in production. |
| Styling | **Tailwind CSS v4** | `@tailwindcss/postcss`; semantic tokens only. |
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

## 5. Architecture

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
- **Server-authoritative pricing.** Totals computed server-side in **paise**
  (integers) and snapshotted; the browser never sets money.
- **Idempotency** on money/stock operations (`IdempotencyRecord`, keyed).
- **Optimistic concurrency** via a `version` column; writes pass `expectedVersion`
  and fail on conflict.
- **Double-entry ledger** for all money movement (every event balanced).
- **Audit + outbox.** Privileged actions append to `AuditLog`; domain events are
  written transactionally to `OutboxEvent` for async publication.
- **Capability-based authorization** resolved from roles (`src/modules/identity`).

## 6. Repository layout

```
asperamarketplace/
├─ src/
│  ├─ app/                 Next.js App Router: pages + ~80 API routes
│  │  ├─ api/              REST endpoints (route.ts handlers)
│  │  ├─ (storefront)/     home, browse, shop, products, cart, checkout…
│  │  ├─ account/          buyer account hub
│  │  ├─ seller/           seller console
│  │  └─ admin/            admin console
│  ├─ modules/             domain logic (15 modules; see §8)
│  ├─ components/          58 React components (+ ui/ primitives)
│  ├─ lib/                 mega-menu, status labels, json-ld, safe-path
│  └─ platform/            cross-cutting infra (see §13)
├─ prisma/
│  ├─ schema.prisma        data model (70+ models/enums)
│  ├─ migrations/          21 migrations
│  ├─ seed.ts              baseline seed (currently OLD fashion demo — see §14)
│  └─ backfill-catalogue-v2.ts
├─ public/                 self-hosted images (products/, hero/, category-tiles/)
├─ scripts/                vercel-build.mjs, provisioning & demo helpers
└─ docs/                   this file + handoffs, audits, plans
```

## 7. Data model

PostgreSQL via Prisma. **70+ models and enums.** All money is `Int` paise; all
timestamps are `Timestamptz(6)`; mutable aggregates carry an integer `version`
for optimistic concurrency; table names are snake_case via `@@map`.

### 7.1 Platform & infrastructure
- **AuditLog** — append-only privileged-action history (actor, action, before/after, correlationId). Never updated/deleted by app code.
- **IdempotencyRecord** — command dedup for money/stock ops; unique `(key, scope)`; stores response for replay; `expiresAt`.
- **OutboxEvent** — domain events written in the state-change transaction, published async (`status`, `attempts`, `availableAt`).
- **FeatureFlag** — `key`, `enabled`, optional `payload` (e.g. `CATALOGUE_V2`).
- **PlatformSetting** — versioned key/value JSON settings.

### 7.2 Identity & access
- **User** — email, `passwordHash`, `displayName`, `status` (active/suspended/deleted), optional AES-GCM-encrypted TOTP secret (`totpSecretEnc`) for admins, soft-delete. Roles include `admin`, `seller_owner`, seller staff.
- **BuyerProfile** — business name, GSTIN (masked on display), tax-invoice preference, preferred payment method.
- **Role / UserRole** — RBAC. `UserRole.scopeKey` is `"global"` or a seller UUID (seller-scoped roles); unique `(userId, roleId, scopeKey)`.
- **Session** — hashed session token, expiry, revocation, IP/UA.
- **LoginAttempt** — audit of login successes/failures (brute-force visibility).

### 7.3 Seller & KYC
- **Seller** — owner, legal/trade name, `status` (draft→submitted→under_review→approved/rejected/suspended), PAN last-4, masked GSTIN, registered state, denormalized `ratingAvg`/`ratingCount`, `version`.
- **SellerKycCase** — KYC stage (`business_profile`/`documents`/`agreement`/`risk_screening`/`manual_review`) + status.
- **KycDocument** — uploaded doc metadata: storage key, filename, content-type, byte size, SHA-256 checksum, uploader.

### 7.4 Catalogue v1 (live)
- **Category** — slug, name, self-referential tree (`parentId`), `isActive`.
- **Brand** — slug, name.
- **Product** — seller-owned listing: slug, title, summary, description, `status`, HSN, `sharedListingKey` (groups the same shopper-facing product across sellers; unique `(sharedListingKey, sellerId)`), `attributes` JSON, `searchDocument` (GIN full-text), `version`.
- **ProductImage** — url, alt, sort order, `isPrimary`.
- **ProductVariant** — unique `sku`, option values, `mrpPaise`, `sellingPricePaise`, weight.
- **InventoryItem** — one per variant: `onHand`/`reserved`/`damaged`, `version`.
- **StockMovement** — append-only stock ledger (type, quantity, reason, correlationId).

### 7.5 Cart & checkout
- **Cart** — user-owned or **guest** (`guestToken` cookie); `status` (open/checked_out/abandoned); `version`.
- **CartItem** — variant + quantity; unique `(cartId, variantId)`.
- **CustomerAddress** — shipping address book; `isDefault`.
- **CheckoutSession** — server-owned pricing **snapshot** (subtotal/discount/shipping/tax/total paise), `couponCode`, `reservedUntil` (stock hold), `status` (draft/reserved/expired/cancelled/converted), unique `idempotencyKey`.

### 7.6 Orders & payments
- **Order** — unique `orderNumber`, pricing snapshot, `status` (awaiting_payment/paid/payment_failed/cancelled/partially_cancelled/fulfilled), one per `CheckoutSession`, `version`.
- **OrderFulfilmentGroup** — per-seller slice of an order: `status` (pending/processing/shipped/delivered/cancelled), line + shipping totals, carrier/tracking, `version`.
- **OrderLine** — immutable price/quantity snapshot (product/variant titles, sku, unit & line paise).
- **PaymentAttempt** — provider (`mock`), unique `providerReference` + `idempotencyKey`, `status`, amount, `clientSecret`, raw response.
- **PaymentWebhookEvent** — inbound webhook record: unique `(provider, providerEventId)`, `signatureValid`, `processed`, raw payload hash.
- **Invoice** — structured invoice `document` JSON, `status` (draft/issued/voided). *Not yet a legally reviewed GST invoice (open item).*
- **NotificationMessage** — outbound channel message queue (channel, recipient, template, status).

### 7.7 Fulfilment, returns & care
- **Shipment** — one per fulfilment group: carrier, tracking, label storage key.
- **ReturnRequest** — `status` (requested/approved/rejected/received/closed), reason, quantity, optional `orderLineId`, `version`.
- **Refund** — `amountPaise` + **`merchandisePaise`** (excludes GST; used for settlement netting & refund caps), `status` (pending/succeeded/failed), links to order/line/return.
- **SupportTicket** — buyer support (status, priority).
- **Dispute** — buyer↔seller dispute (status opened/under_review/resolved/closed).
- **ProtectionClaim** — Buyer Protection (A-to-z style): `claimType` (not_delivered/not_as_described/return_not_honored/other), evidence URLs, `status`, optional `refundId` + `sellerDebitPaise`.
- **SellerFeedback** — post-delivery seller quality rating (overall + shipping/packaging/accuracy); one per order line; feeds `Seller.ratingAvg`. *(Separate from `ProductReview`.)*

### 7.8 Finance & settlements
- **LedgerAccount** — chart of accounts (`code`, `accountType`: asset/liability/revenue/expense/equity).
- **JournalEntry** — balanced entry: unique `entryNumber`, `status` (draft/posted/reversed), `sourceEvent`, `correlationId`, optional reversal link.
- **JournalLine** — debit/credit paise against an account (optionally tagged seller/order).
- **CommissionRule** — `rateBps`, optional `sellerId` override, `active`.
- **SettlementBatch** — per-seller period batch: gross/commission/**tcs**/net paise, `status` (pending/held/released/paid/failed), hold reason.
- **SettlementLine** — one per fulfilment group (unique), gross/commission/net; nets refunded merchandise.
- **ReconciliationException** — money mismatches (`kind`, `reference`, amount, status open/investigating/resolved/written_off).

### 7.9 Trust, safety & compliance
- **RiskCase** — generic risk investigation on any subject (type+id, severity, status).
- **CounterfeitCase** — brand/counterfeit report against product+seller.
- **ProductReview** — moderated review (rating/title/body, status pending/approved/rejected/hidden).
- **WishlistItem** — unique `(userId, productId)`.
- **PrivacyRequest** — DSAR-style request (type, status received/in_progress/completed/rejected).
- **ComplianceEvidence** — compliance register evidence (registerKey, status draft/submitted/accepted/rejected).

### 7.10 Analytics & tax
- **AnalyticsEvent** — event stream (name, actor/seller/product/order, searchQuery, properties JSON).
- **Experiment** — A/B experiment (key, hypothesis, variants JSON, status).
- **TaxProfile** — configurable tax policy (`rateBps`, active, explanation). *Not a legal GST determination (open item).*

### 7.11 Catalogue v2 (additive, behind flag — nothing reads it yet)
- **CatalogueProduct** — marketplace-owned canonical product; sellers cannot edit its facts.
- **CatalogueImage** — images for the canonical product.
- **CatalogueVariant** — shared variant definition (no price, no SKU).
- **SellerOffer** — a seller's offer on a shared variant: price, unique SKU, `condition` (new/refurbished/used), dispatch days, moderation status; unique `(sellerId, catalogueVariantId)`.
- **OfferInventory** — stock per offer (mirror of InventoryItem, keyed by offer).

> **Two catalogue models coexist.** v1 `Product`/`ProductVariant`/`InventoryItem`
> is live and powers everything. v2 (`CatalogueProduct`+`SellerOffer`) is additive
> and inert until the `CATALOGUE_V2` flag + money-path migration. Don't mix them in
> queries/seeds. See §14. SKUs are separate unique namespaces:
> `product_variants.sku` and `seller_offers.sku` can hold the same string.

## 8. Domain modules

Each module under `src/modules/<name>` owns its slice of domain state and exposes
a `service.ts`. Routes/pages call these; they never write domain tables directly.
(Function-level lists in §22.)

| Module | Responsibility |
|---|---|
| **identity** | Users, roles/capabilities, sessions, login, admin TOTP, actor resolution. |
| **seller** | Seller onboarding, KYC documents, submit-for-review, admin review, access resolution. |
| **catalogue** | Categories/brands, product drafts & offers, moderation, public lookup, search, v2 helpers. |
| **cart** | Cart (user + guest), addresses, pricing, estimate, **checkout preview/confirm**, stock reservations. |
| **orders** | Order creation from checkout, payment start, mock payment outcome, webhook processing, buyer cancel, invoices. |
| **fulfilment** | Seller fulfilment (process/ship/deliver/cancel), returns, support tickets, disputes. |
| **finance** | Chart of accounts, commission resolution, **ledger postings**, settlements, reconciliation, CSV export, finance summary. |
| **tax** | Tax profiles, active policy resolution, GST computation. |
| **protection** | Buyer Protection claims (create/list/decide). |
| **trust** | Risk cases, counterfeit cases, review moderation, privacy requests, compliance evidence, trust-ops summary. |
| **account** | Buyer profile, reviews, notifications, coupon wallet, spend report (+ CSV). |
| **analytics** | Event tracking, platform dashboard, seller health, experiments. |
| **wishlist** | Wishlist add/remove/list. |
| **admin** | Admin-side aggregations/helpers. |
| **payments** | Mock payment provider + webhook signing/verification. |

## 9. API surface

~80 REST endpoints under `src/app/api/**/route.ts`. All use the shared
`jsonOk`/`jsonError` envelope (`platform/http/respond.ts`), are
`dynamic = "force-dynamic"`, enforce auth/capabilities server-side, and apply
idempotency + optimistic concurrency on mutations. Full list in §23.

> `payments/mock-complete` is a **dev-only** convenience endpoint, disabled in
> production.

## 10. Frontend & pages

~60 pages (App Router, mostly Server Components) + 58 components. Full list in §24.

**Mobile-first.** The home route is deliberately short on mobile (heavy
merchandising blocks are `hidden md:block`); "Products For You" uses infinite
scroll. Navigation data (mega-menu, category tiles, brand lanes, trending
searches) lives in `src/lib/mega-menu.ts`. Recent UX pass: trimmed mobile footer,
PDP price in a sticky buy-bar, seller "Products" list is a **responsive table**
(`seller-catalogue-panel.tsx` — pattern to reuse for other operator lists).

**Images.** Self-hosted under `public/` because only Unsplash is allow-listed in
Next `remotePatterns` + CSP. Adding an external image host means editing both.

## 11. Core workflows

### 11.1 Authentication
`registerUser` / `loginUser` → hashed `Session` token in an HTTP-only cookie.
`resolveActorFromToken` / `getOptionalActor` turn the cookie into an **actor**
with capabilities. On login, the client resolves the destination via
`/api/auth/me`: admin → `/admin`, seller → `/seller`, else `/account`; `?next=`
wins (`src/components/auth-form.tsx`). Admin TOTP exists but is **off** until
re-enabled for launch (`ENABLE_ADMIN_TOTP` + production).

### 11.2 Browse → cart → checkout → order
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

### 11.3 Fulfilment
Seller works each `OrderFulfilmentGroup`: `startProcessing` → `shipGroup`
(carrier + tracking, `Shipment`) → `markDelivered`, or `cancelFulfilmentGroup`.

### 11.4 Returns & refunds
`createReturnRequest` (quantity capped to purchased) → `reviewReturnRequest`.
On approval, `refundBreakdown` (`finance/refund-math.ts`) computes **item + GST**
(shipping excluded), capped per line and guarded by
`alreadyRefundedMerchandisePaise` so a line is never over-refunded across returns
+ protection claims. `postRefundLedger` writes the balancing reversal entries.
Protection claims (`decideProtectionClaim`) and buyer/group cancellations use the
same refund + ledger path.

### 11.5 Settlement
`createSettlementBatch` per seller/period: sums gross per fulfilment group, nets
refunded merchandise, applies commission (`resolveCommissionRateBps`) and **0.5%
TCS**, producing `netPaise`. `releaseSettlementBatch` moves it forward.
`ReconciliationException` captures mismatches; `exportSettlementsCsv` for finance.

### 11.6 Catalogue (seller listing)
`createProductDraft` or `createProductOffer` (matching an existing listing via
`sharedListingKey`) → `submitProductForReview` → admin `reviewProduct` →
`getPublicProductBySlug` / `searchApprovedProducts` surface it. The PDP shows
sibling sellers via `listSiblingSellerOffers`.

## 12. Money, tax & the ledger

- **Units:** everything in **paise** (integer). Display via `formatPaise`
  (Intl en-IN ₹).
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
  never edited. Settlements net out refunds.

## 13. Security & platform primitives

`src/platform/*` holds the cross-cutting infrastructure:

- **config/** — `env.ts` typed env access; `site-contact.ts` (footer/contact).
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
- **RBAC / capabilities** — roles resolve to capabilities (`identity/policy.ts`:
  `actorIsAdmin`, `actorHasSellerCapability`, …); seller-scoped roles carry the
  seller UUID. All API routes authorize server-side; layout gates at
  `app/admin/layout.tsx`, `app/seller/layout.tsx`.
- **Sessions** — hashed tokens, expiry, revocation, IP/UA recorded;
  `LoginAttempt` logs every attempt.
- **Admin 2FA** — AES-GCM-encrypted TOTP secret per admin; gated by
  `ENABLE_ADMIN_TOTP` + `VERCEL_ENV === production` (currently off; the legacy
  `REQUIRE_ADMIN_TOTP` is deliberately ignored). Re-enable before launch.
- **Idempotency + optimistic concurrency** — money/stock can't double-apply;
  conflicting writes fail on `version`.
- **Audit log** — append-only privileged-action trail with before/after + reason.
- **Outbox** — events are durable and published after commit, not inline.
- **Safe paths** (`lib/safe-path.ts`) — guards file/storage path handling.

## 14. Catalogue v1 vs v2

**v1 (live).** Each seller owns a full `Product` (+ `ProductVariant` +
`InventoryItem`). The same shopper-facing product across sellers is linked by
`sharedListingKey`; the PDP lists sibling offers. A seller may hold only **one**
`Product` per `sharedListingKey` (unique constraint).

**v2 (additive, inert, flag-gated OFF).** Goal: move from per-seller `Product` +
`sharedListingKey` to a marketplace-owned `CatalogueProduct` + `SellerOffer`
model (canonical facts owned by the marketplace; sellers attach offers with
price/SKU/condition/dispatch to shared `CatalogueVariant`s, stock in
`OfferInventory`). Gated by `catalogueV2Enabled()` (env `CATALOGUE_V2`, default
OFF). Progress:
- **P1 schema** (tables in §7.11). **P2 service** `catalogue-v2.ts`
  (`getCatalogueProductBySlug`, `listOffersForCatalogueVariant`, `rankOffers`
  buy-box, `bestOfferPricePaise`). **P3-prep backfill** `db:backfill:v2`.
- **Not done:** offer-centric PDP/search (P3); cart/checkout/orders/inventory on
  `offerId` (P4 — the money path); admin merge + retire old model (P5).
- **DO NOT** set `CATALOGUE_V2=true` in prod or re-point the money path without
  coordinating — the live PC catalogue uses the v1 `Product` model; the two must
  not diverge. The PC pivot seeded into **v1**; v2 would need its own seed.
  Plan: `docs/CATALOGUE_V2_PLAN.md`.

---

# Part C — Working with it

## 15. Local development

```bash
# Postgres 16 running locally, then:
export DATABASE_URL="postgresql://aspera_dev:aspera_dev_only_not_secret@127.0.0.1:5432/aspera_marketplace_dev?schema=public"
pnpm install
pnpm db:migrate     # prisma migrate deploy
pnpm db:seed        # NOTE: currently seeds the OLD fashion demo (see §21 backlog #2)
pnpm dev
```

Gates: `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build`.

**Demo logins** (dev only; gated by `ALLOW_DEMO_LOGINS` in prod):
- `admin@aspera.local` / `AsperaAdminDevOnly1!`
- `seller@aspera.local` / `AsperaSellerDevOnly1!`
- `customer@aspera.local` / `AsperaCustomerDevOnly1!`
- Pune PC sellers: `pcc|tzp|pcp|gip|ddp @aspera.local` / `AsperaSellerDevOnly1!`

## 16. Build, deploy & environments

- **Vercel** builds `main` → production; branches/PRs → preview deployments.
- **`scripts/vercel-build.mjs`:** applies `prisma migrate deploy` **only on
  production** (`VERCEL_ENV=production`; preview builds skip it), with **retry +
  backoff** (up to 5×: 8/16/24/32s) to survive the Prisma advisory-lock (P1002)
  when deploys overlap. Then `prisma generate` + `next build`. **Don't merge two
  PRs in quick succession** — overlapping prod builds still stress the lock.
- **Migrations:** additive, in `prisma/migrations` (21 so far). A PR that adds a
  migration won't see it on its own preview (production-only), which is fine for
  additive changes.
- **SEO/canonical:** default origin `https://aspera.market`
  (`layout.tsx`/`products/[slug]`/`robots.ts`/`sitemap.ts`); overridable by
  `NEXT_PUBLIC_SITE_URL` (set in Vercel Production).
- **Images:** self-hosted under `public/`; to use a new remote host, add it to
  both Next `remotePatterns` and the CSP `img-src`.
- **Open infra item:** production Neon still shares with preview/dev — separate it
  before real sellers/customers (backlog #3).

**Applying data to prod (no direct prod DB access from code sessions).** Prod data
changes must reach the Neon DB. Pattern used: a **guarded, admin-only,
confirmation-gated API route** that calls the seeder, triggered once by an
authenticated admin, then removed. (That's how the PC catalogue was applied; the
route `/api/admin/seed-pc` has since been deleted.) Alternatively, run the seeder
locally against the prod `DATABASE_URL`.

## 17. Testing

- **Vitest.** `pnpm test` (all), `test:unit` (excludes `*.integration.test.ts`),
  `test:integration` (needs a real `DATABASE_URL`; without it Prisma throws
  `PrismaClientInitializationError` — environment, not a code bug). Current suite:
  ~121 tests across ~46 files.
- **Co-located tests** across `platform/`, `lib/`, and modules (refund math,
  pricing, redaction, envelope, health, etc.).
- **CI:** GitHub Actions `ci` runs typecheck/lint/test/build on an **isolated DB**
  (unaffected by the prod migrate-lock). Vercel preview build must also be green
  before merge.
- **E2E:** Playwright is **not yet wired** as a suite (`test:e2e` exits with a
  pointer to `docs/marketplace-audit.md`). Chromium + Playwright are available for
  ad-hoc verification against preview/live.

## 18. Conventions

- **Colors:** semantic tokens only (`text-danger`, `bg-warning-soft`,
  `border-border`) — never `text-red-700`/hex/`black/*`. See `DESIGN_SYSTEM.md`.
- **Status enums shown to users:** `src/lib/status-labels.ts`.
- **Money:** `formatPaise`; integers in paise.
- **Refunds:** `src/modules/finance/refund-math.ts` (item + GST, per-line cap);
  always post to the ledger (`postRefundLedger`).
- **Destructive/irreversible UI:** confirm first. **Dev-only UI:** gate with
  `process.env.NODE_ENV !== "production"`.
- **Shared UI primitives:** `src/components/ui/*` (`Button`, `Badge`,
  `EmptyState`, `Skeleton`, `Card`, `PageShell`, `DashboardSkeleton`).
- **New dashboard segments:** add `loading.tsx` + `error.tsx`.
- **HTTP:** API routes use `jsonOk`/`jsonError`; idempotency + optimistic
  concurrency (`expectedVersion`) on mutations.
- **Light theme only** (no `dark:` variants).

## 19. Operations & runbooks

- **Deploy lock (P1002):** two overlapping production migrates fight the Prisma
  advisory lock. Mitigated by production-only migrate + retry/backoff. If a deploy
  still fails on it, re-deploy. Avoid merging several PRs within the same minute.
- **Prod data applies:** guarded admin endpoint pattern or local run against prod
  `DATABASE_URL` (see §16).
- **Database (local):** PostgreSQL 16; if it drops on idle, restart the cluster
  (`pg_ctlcluster 16 main start`). Integration tests need `DATABASE_URL`.
- **Images:** self-host under `public/`; external host needs `remotePatterns` +
  CSP edits.
- **Recipes:**
  - *Add/retry a product image:* drop `public/products/<slug>.jpg`, set
    `imagePath` in `PC_PRODUCTS`, reseed prod (guarded route or prod DB URL).
  - *Re-run the PC seed on prod:* re-add a guarded admin route calling
    `seedPcCatalogue(prisma)` (admin-auth + confirmation token), trigger as admin,
    remove it.
  - *Re-enable admin 2FA:* set `ENABLE_ADMIN_TOTP=true` in Vercel Production.
  - *Change the live domain / canonical:* `NEXT_PUBLIC_SITE_URL` + the fallbacks
    in `layout.tsx`/`products/[slug]`/`robots.ts`/`sitemap.ts`.
  - *Flip catalogue v2 on (preview only, when ready):* seed v2
    (`pnpm db:backfill:v2`), set `CATALOGUE_V2=true`, re-point PDP/cart (P3/P4).
- **More runbooks in `docs/`:** `DEPLOYMENT_POLICY.md`, `MIGRATIONS.md`,
  `BACKUP_RESTORE_DRILL.md`, `LAUNCH_CHECKLIST.md`, `LOAD_TEST.md`,
  `ACCESSIBILITY_REVIEW.md`, `CATALOGUE_SEED.md`.

---

# Part D — Status & reference

## 20. Current status & live data

- **Live storefront:** PC-components marketplace for **Pune**, on **aspera.market**.
- **Catalogue source of truth:** `src/modules/catalogue/pc-catalogue-data.ts` —
  `PC_CATEGORIES` (9), `PC_BRANDS` (39), `PC_SELLERS` (5 Pune shops:
  `pcc/tzp/pcp/gip/ddp`), `PC_PRODUCTS` (90). Each product: `{slug, categorySlug,
  brandSlug, sellerKey, title, summary, description, sku, sellingPricePaise,
  mrpPaise, onHand, weightGrams, hsnCode, imagePath}`.
- **90 products** across **9 categories** (10 each: processors, motherboards,
  graphics-cards, memory-ram, storage-ssd, cabinets, keyboard-mouse, monitors,
  ups) from **5 approved Pune sellers**; 39 brands.
- **Seeder:** `src/modules/catalogue/seed-pc.ts` → `seedPcCatalogue(prisma)`.
  Idempotent: upserts categories/brands/Pune sellers (approved), **archives** all
  non-PC products (status `archived`) + deactivates old categories, then upserts
  90 products (one `Standard` variant + inventory + image each). No hard delete,
  so existing orders/cart FKs stay valid. Old non-PC catalogue (~2320 products) is
  archived, not deleted.
- **Product images:** 74/90 self-hosted; **16 missing** (mostly UPS — their
  research URLs were store/category pages). `imagePath` is `null` for them →
  initials placeholder.
- **Payments:** mocked (by decision). **Admin 2FA:** off (by decision).

## 21. Roadmap & backlog

Prioritised:

1. **16 missing PC product images** (mostly UPS) — add JPGs + `imagePath`, reseed.
2. **Repoint `prisma/seed.ts`** to `seedPcCatalogue` so local = prod (it still
   seeds the old fashion demo).
3. **Separate the production Neon DB** from preview/dev — needed before real traffic.
4. **Real seller onboarding assets:** image upload (currently URL/self-hosted) +
   bulk catalogue import (spreadsheet) — blocks real sellers.
5. **Payments** (Razorpay/COD) — **LAST**, after dummy-order testing.
6. **Catalogue v2 P3→P5** (offer-centric PDP, money-path cutover, admin merge).
7. **Error monitoring (Sentry)** + transactional email/SMS/WhatsApp providers.
8. **Replace the demo admin** with a real private admin account; **re-enable 2FA**.
9. Legally reviewed **GST tax invoices** (close the Invoice/TaxProfile caveats).
10. **Playwright e2e** suite; load test; accessibility pass.

## 22. Reference: module functions

Exported service functions per module (`src/modules/<m>/service.ts` unless noted):

- **identity:** `ensureSystemRoles, registerUser, updateProfile, loginUser, completeTotpLogin, beginAdminTotpEnrollment, confirmAdminTotpEnrollment, adminTotpRequiredInProduction, adminHasTotpEnabled, logoutSession, resolveActorFromToken, requireActor, getOptionalActor, updateActorProfile, sessionCookieOptions`. Policy: `policy.ts` (`actorIsAdmin, actorHasSellerCapability, sellerIdsForCapability`).
- **seller:** `createSellerDraft, uploadSellerDocument, submitSellerForReview, listSellersForAdmin, getSellerDocumentForAdmin, reviewSeller, listOwnedSellers`; access: `access.ts` `resolveSellerForActor`.
- **catalogue:** `listActiveCategories, listActiveBrands, ensureGenericCategory, createProductDraft, createProductOffer, listSiblingSellerOffers, submitProductForReview, reviewProduct, listSellerProducts, getSellerProduct, updateSellerProduct, listSellerInventory, listProductsForModeration, listAdminProducts, getPublicProductBySlug, searchApprovedProducts`; v2 `catalogue-v2.ts` (`getCatalogueProductBySlug, listOffersForCatalogueVariant, rankOffers, bestOfferPricePaise, createCatalogueProduct, createSellerOffer`).
- **cart:** `getCartForIdentity, getCartForActor, emptyCartView, addCartItem, updateCartItem, mergeGuestCartIntoUser, listAddresses, deleteAddress, updateAddress, createAddress, estimateCart, previewCheckout, confirmCheckout, getLatestReservedCheckout`; `pricing.ts`, `guest.ts`, `reservations.ts`.
- **orders:** `createOrderFromCheckout, startPayment, simulateMockPaymentOutcome, processPaymentWebhook, listOrdersForActor, getOrderForActor, cancelBuyerOrder, getInvoiceForActor`.
- **fulfilment:** `listSellerFulfilment, startProcessing, shipGroup, markDelivered, cancelFulfilmentGroup, createReturnRequest, reviewReturnRequest, createSupportTicket, createDispute, listReturnsForSeller, listReturnsForBuyer, listTicketsForActor`.
- **finance:** `ensureChartOfAccounts, resolveCommissionRateBps, postOrderPaidLedger, alreadyRefundedMerchandisePaise, postRefundLedger, listJournalEntries, createSettlementBatch, releaseSettlementBatch, listSettlements, createReconciliationException, resolveReconciliationException, listReconciliationExceptions, exportSettlementsCsv, financeSummary`; `refund-math.ts`.
- **tax:** `ensureDefaultTaxProfiles, resolveActiveTaxPolicy, listTaxProfiles`.
- **protection:** `createProtectionClaim, getProtectionClaimForActor, listProtectionClaimsForActor, listProtectionClaimsForAdmin, decideProtectionClaim`.
- **trust:** `openRiskCase, updateRiskCase, listRiskCases, reportCounterfeit, reviewCounterfeit, listCounterfeitCases, createProductReview, moderateReview, listReviewsForModeration, listApprovedReviewsForProduct, createPrivacyRequest, updatePrivacyRequest, listPrivacyRequests, createComplianceEvidence, submitComplianceEvidence, listComplianceEvidence, trustOpsSummary`.
- **account:** `getBuyerProfile, upsertBuyerProfile, listBuyerReviews, listPendingReviews, listBuyerNotifications, listCouponWallet, buildSpendReport, spendReportToCsv`.
- **analytics:** `trackAnalyticsEvent, platformDashboard, sellerHealth, createExperiment, updateExperiment, listExperiments`.
- **wishlist:** `listWishlistProducts, addWishlistItem, removeWishlistItem, listWishlistProductIds`.

## 23. Reference: API routes

**Auth:** `auth/login`, `auth/logout`, `auth/me`, `auth/register`, `auth/totp/setup`, `auth/totp/verify`.
**Catalogue (public):** `catalogue/categories`, `catalogue/products`, `catalogue/products/[slug]`, `catalogue/suggest`, `pincode/check`.
**Cart/checkout:** `cart`, `cart/items`, `cart/estimate`, `checkout/preview`, `checkout/confirm`, `checkout/addresses`, `checkout/addresses/[id]`.
**Orders/payments:** `orders`, `orders/[orderId]`, `orders/[orderId]/cancel`, `orders/[orderId]/invoices/[invoiceId]`, `payments/start`, `payments/webhook`, `payments/mock-complete` (**dev-only, disabled in prod**).
**Seller:** `seller`, `seller/submit`, `seller/[sellerId]/documents`, `seller/products`, `seller/products/[id]`, `seller/products/offer`, `seller/products/submit`.
**Fulfilment:** `fulfilment/groups`, `fulfilment/process`, `fulfilment/ship`, `fulfilment/deliver`, `fulfilment/cancel`.
**Returns/claims/tickets:** `returns`, `returns/mine`, `returns/review`, `claims`, `claims/[claimId]`, `disputes`, `tickets`.
**Account:** `account/me`, `account/profile`, `account/business`, `account/notifications`, `account/coupons`, `account/reviews`, `account/spend`, `wishlist`.
**Admin:** `admin/sellers`, `admin/sellers/review`, `admin/sellers/[id]/documents/[docId]`, `admin/products`, `admin/products/review`, `admin/data-quality`, `admin/data-quality/cleanup`, `admin/claims/[claimId]/decide`.
**Finance:** `finance/journal`, `finance/settlements`, `finance/settlements/release`, `finance/reconcile`, `finance/export`.
**Trust:** `trust/risk-cases`, `trust/counterfeit`, `trust/reviews`, `trust/seller-feedback`, `trust/privacy`, `trust/compliance`.
**Analytics/health:** `analytics/events`, `analytics/dashboard`, `health`.

## 24. Reference: pages

**Storefront:** `/`, `/shop`, `/browse`, `/popular`, `/products/[slug]`, `/shops/[slug]`, `/cart`, `/checkout`, `/wishlist`, `/commission`, `/sell`.
**Account (buyer):** `/account`, `/account/{addresses,business,coupons,notifications,payments,profile,returns,reviews,spend}`, `/orders`, `/orders/[orderId]`, `/returns`.
**Seller console:** `/seller`, `/seller/{catalogue,catalogue/[id],inventory,fulfilment,returns,finance,compliance,profile,analytics,onboarding}`.
**Admin console:** `/admin`, `/admin/{sellers,products,orders,orders/[orderId],claims,data-quality,trust,finance,analytics,audit,security}`.
**Auth/info:** `/login`, `/register`, `/about`, `/careers`, `/press`, `/help`, `/support`, `/privacy`, `/terms`, `/shipping`, `/returns`, `/buyer-protection`, `/seller-policies`, `/download-app`.

## 25. Glossary

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
| **buy-box** | The ranked "best offer" among sibling sellers (catalogue v2 `rankOffers`). |

## 26. Appendix: PR history & env vars

### Environment variables
| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres/Neon connection |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (prod: `https://aspera.market`) |
| `ALLOW_DEMO_LOGINS` | Allow `@aspera.local` logins in prod |
| `ENABLE_ADMIN_TOTP` | `true` to enforce admin 2FA (default off) |
| `REQUIRE_ADMIN_TOTP` | **Legacy, ignored** — don't rely on it |
| `CATALOGUE_V2` | `true` to read the v2 catalogue (default off; not prod-ready) |
| `VERCEL_ENV` | Vercel-set; gates the production-only migrate |
| `LOG_LEVEL` | Lowest log level written (debug/info/warn/error) |
| `DOCUMENT_STORAGE_PATH` | KYC doc storage path |
| `MOCK_PAYMENT_WEBHOOK_SECRET` | Mock payment webhook HMAC secret |
| `SITE_SUPPORT_EMAIL` / `SITE_SUPPORT_PHONE*` / `SITE_GRIEVANCE_EMAIL` / `SITE_LEGAL_ENTITY` | Footer/contact overrides (`platform/config/site-contact.ts`) |
| *(reserved, unset)* | `RAZORPAY_*`, `S3_*`, `EMAIL_PROVIDER_API_KEY`, `SMS_PROVIDER_API_KEY`, `WHATSAPP_PROVIDER_API_KEY` |

> **Never set `NODE_ENV`** — Next manages it (development for `next dev`,
> production for `next build`). A manual value breaks production builds.

### Recent PR history (this session, all merged)
#58–#64 money integrity, storefront/checkout UX, dashboard safety + design
tokens, seller payout, admin seller queue · #65/#67 admin 2FA off + login
routing · #66 production-only migrate · #68–#70 catalogue v2 P1/P2/P3-prep · #71
`aspera.market` canonical · #72/#73 handoff sync · #75–#81 mobile UX pass · #83
Pune PC catalogue + seed + nav · #84 PC home rebrand · #86 migrate retry
hardening · #87 Cursor handoff doc · #88 Cursor reference · #89 project
documentation. (Full detail: `SESSION_HANDOFF.md`.)

---

*Maintained alongside the code. When behavior changes, update this document in the
same PR.*
