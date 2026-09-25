# Marketplace baseline audit — Aspera

Date: 2026-09-25  
Branch: `cursor/marketplace-audit-truth-10f6`  
Base HEAD at audit start: `9aa0efe` (`cursor/aspera-original-identity-10f6`)  
Preview context: Vercel preview deployments for Aspera identity branch  

## Baseline commands (executed before edits)

| Command | Result |
| --- | --- |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test:unit` | Pass — 40/40 |
| `pnpm build` | Pass (requires no `NODE_ENV` in `.env`; documented in `.env.example`) |
| `pnpm test:e2e` | **Missing** — no Playwright/Cypress script |
| `pnpm test:integration` | Exists; not run in this baseline (needs DB) |
| `pnpm db:status` / seed | Scripts exist; seed is non-production only |

---

## 1. Architecture (current)

- **Stack:** Next.js 16.3.6 App Router, React 19, TypeScript, Prisma 6.16.2, PostgreSQL, Tailwind v4, pnpm 10.33.3, Node 24.x.
- **Shape:** Modular monolith under `src/modules/*` (identity, catalogue, cart, orders, payments, fulfilment, finance, trust, seller, analytics) + `src/platform/*`.
- **UI:** Hand-rolled components in `src/components` (not shadcn CLI). Original Aspera teal/orange tokens in `globals.css` (post Meesho-trade-dress removal).
- **Edge:** `src/proxy.ts` request-ID only — **no auth middleware**.
- **Deploy:** Vercel (`vercel.json`); mock payments; Railway/Neon intended for Postgres (A-05).

---

## 2. Route map

### Customer
`/`, `/browse`, `/shop`, `/popular`, `/products/[slug]`, `/shops/[slug]`, `/cart`, `/wishlist`, `/checkout`, `/orders`, `/orders/[orderId]`, `/account`, `/login`, `/register`, `/sell`, `/download-app`, `/help`, `/support`, `/about`, `/careers`, `/press`

### Seller
`/seller`, `/seller/onboarding`, `/seller/catalogue`, `/seller/fulfilment`, `/seller/finance`, `/seller/analytics`, `/seller/compliance`, `/seller/profile`

### Admin
`/admin/sellers`, `/admin/products`, `/admin/finance`, `/admin/trust`, `/admin/analytics`

### Legal / policy
`/privacy`, `/returns`, `/shipping`, `/seller-policies`, `/commission` — **no dedicated `/terms`**

### API (selected)
Auth, catalogue, cart, checkout, payments (start/webhook/mock-complete), orders, fulfilment, returns, finance, trust, analytics, wishlist, seller, admin.

Preferred IA from engineering brief (`/categories`, `/search`, `/sellers/...`) is **not** implemented; existing URLs must keep redirects if/when introduced.

---

## 3. Data model map (relevant)

| Domain | Models | Notes |
| --- | --- | --- |
| Identity | `User`, `Role`, `UserRole`, `Session`, `LoginAttempt` | Cookie `aspera_session` |
| Seller | `Seller`, `SellerKycCase`, `KycDocument` | Status: draft→submitted→under_review→approved\|rejected\|suspended |
| Catalogue | `Category`, `Brand`, `Product`, `ProductImage`, `ProductVariant`, `InventoryItem`, `StockMovement` | `Product.attributes` JSON used as catch-all |
| Reviews | `ProductReview` | Seed does **not** create rows |
| Cart/checkout | `Cart`, `CartItem`, `CheckoutSession`, addresses | Server snapshot in paise |
| Orders/payments | `Order`, `OrderLine`, `OrderFulfilmentGroup`, `PaymentAttempt`, `PaymentWebhookEvent` | Mock provider only |
| Trust/finance | counterfeit, privacy requests, journal, settlements | Partial |

**Not present:** `Promotion`, `Campaign`, `SellerListing`, `Price`, `MediaAsset` verification, `DeliveryRule`, `ReturnPolicy` entities, badge/programme tables.

Money: integer **paise** on variants and checkout (`ASSUMPTIONS` A-09).

---

## 4. Authentication and authorisation map

- Session: opaque token → hashed in `Session`; 14-day TTL; httpOnly cookie.
- Roles: customer, seller_*, marketplace_support, catalogue_moderator, finance/risk operators, admin, super_admin, auditor (`src/modules/identity/roles.ts`).
- Seller capabilities gated in `policy.ts` / `seller/access.ts`.
- **Gap:** Proxy does not enforce auth; reliance on route-level `requireActor`. Seller layout redirects unauthenticated users.
- **P1 risk:** Need systematic IDOR tests proving seller A cannot read seller B orders/PII (partial coverage via integration tests; not exhaustive).

---

## 5. Payment flow map

1. Checkout creates order `awaiting_payment`.
2. `POST /api/payments/start` → `MockPaymentProvider` → `PaymentAttempt`.
3. Dev: `POST /api/payments/mock-complete` signs body.
4. `POST /api/payments/webhook` HMAC verify → idempotent `PaymentWebhookEvent` → order `paid` / `payment_failed`.

Razorpay credentials reserved in `.env.example` but **unused**. Live payments blocked (A-08/A-23/A-28).

---

## 6. Seller lifecycle map

States: `draft` → `submitted` → `under_review` → `approved` | `rejected`; `approved` → `suspended` → `under_review`.  
KYC stages exist; documents upload in draft/rejected.  
Catalogue product statuses: draft/submitted/approved/rejected (moderation).  
Dashboard capability-gated.

---

## 7. Environment variables

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Postgres |
| `LOG_LEVEL` | Logging |
| `DOCUMENT_STORAGE_PATH` | KYC uploads |
| `MOCK_PAYMENT_WEBHOOK_SECRET` | Mock webhook HMAC |
| `NEXT_PUBLIC_SITE_URL` | Absolute SEO URLs (optional; defaults in code) |
| Razorpay / S3 / email / SMS | Commented placeholders only |

**Do not set `NODE_ENV` in env files** — breaks Next 16 `/_global-error` prerender.

---

## 8. Unsupported claims and demo data

| Item | Location | Severity | Status at audit |
| --- | --- | --- | --- |
| Seeded `ratingAverage` / `reviewCount` / `ratingDistribution` | `seed-catalogue.ts` → `Product.attributes` | **P0** | Shown on product cards via catalogue service |
| Seeded `dealEndsAt` | same | **P0** | Not rendered (UI gated) but still stored as if real |
| Fabricated delivery fees/labels in attributes | same | **P1** | Can disagree with `SHIPPING_POLICY` |
| “Featured store” for any approved seller | `product-card.tsx` | **P0** | No Featured Store programme |
| “Verified Business Seller” | `pdp-trust-badge-row.tsx` | **P1** | Means approved status only; wording overclaims |
| “verified quality” | `aspera-gold-section.tsx` | **P0** | Component unused on homepage but still in tree |
| Bank/UPI “offers” | `bank-offers-strip.tsx` | **P1** | Presentation-only; no promotion records |
| `SAMPLE_REVIEWS` | `lib/sample-reviews.ts` | **P0** | Fabricated; unused after prior fix — still shippable hazard |
| Unsplash as product photos | seed + marketing tiles | **P1** | Documented placeholders; not labelled in UI |
| Demo footer entity / phone | `site-chrome.tsx` | OK if labelled | Already marked demo |
| Legal A-20–A-28 | `ASSUMPTIONS.md` / `COMPLIANCE_REGISTER.md` | **P1** launch | Incomplete |

Meesho pink / “Trusted by Millions” / Mall / Aspera Original: largely removed from live UI in prior identity work; remain as **prohibited** patterns.

---

## 9. Duplicated logic

- Inventory available qty: `cart/pricing.availableQuantity` vs inline `onHand-reserved` in catalogue/wishlist/shops/PDP.
- Discount %: `helpers.discountPercent` vs inline in catalogue filter.
- Free-delivery threshold: card heuristic vs `SHIPPING_POLICY.freeAbovePaise`.

---

## 10. Missing tests (high level)

- No `test:e2e` harness.
- No concurrency inventory reservation tests.
- No payment double-webhook E2E beyond partial order unit/integration.
- No systematic IDOR matrix for all seller/customer objects.
- No DB constraint tests for SKU uniqueness / MRP≥price (rely on app validation).
- No accessibility automated suite.
- Storefront truth: no tests asserting attributes ratings are not surfaced.

Integration tests exist for cart, catalogue, orders, fulfilment, seller onboarding, platform DB.

---

## 11. Build / deployment assumptions

- Preview DB must be non-production; never seed production (A-06).
- Mock payments only until counsel + credentials.
- Production domain unset.
- Image CDN still Unsplash remotePatterns.

---

## 12. Findings by severity

### P0
1. Storefront displays seeded attribute ratings/review counts as if customer activity.
2. Misleading seller merchandising labels (“Featured store”, unused Gold “verified quality”).
3. Fabricated `dealEndsAt` / sample reviews remain in codebase as landmines.
4. Browser must never be trusted for money/stock (already server-side for checkout — preserve).

### P1
1. Attribute delivery fees diverge from checkout shipping policy.
2. Legal centre incomplete (A-20–A-28); grievance/entity placeholders.
3. Auth not at edge; IDOR coverage incomplete.
4. Unsplash placeholders presented as product photography without UI labelling.
5. Duplicate pricing/inventory helpers risk drift.
6. OOS SKUs can still appear in discovery rails if not filtered.

### P2
1. No `/categories` canonical IA; URL sprawl (`/browse` vs `/shop`).
2. No Promotion model; bank-offer strip is dead merchandising.
3. SEO structured data must stay gated to real reviews (PDP already gated).
4. Missing e2e script and web-vitals dashboards.

### P3
1. Further seller dashboard visual polish.
2. Synonym/Hindi search readiness.
3. AVIF pipeline / owned media storage.

---

## 13. Proposed implementation batches

1. **`fix/catalogue-truth-and-media` (this PR — first P0 slice)**  
   Stop surfacing fake ratings/deals; honest seller labels; quarantine false claim components; seed truthfulness; tests.
2. **`fix/pricing-inventory-integrity`**  
   Shared inventory/discount services; constraints; reservation sketch.
3. **`feat/server-authoritative-checkout`**  
   Harden cart merge, PIN delivery, idempotent checkout.
4. **`feat/seller-moderation-workflow`**  
   Explicit moderation states + evidence.
5. **`feat/legal-trust-centre`**  
   Policy versions + config-driven entity (no invented legal facts).
6. **`hardening/marketplace-security`**  
   IDOR matrix, rate limits, upload hardening.

---

## 14. First P0 slice scope (approved for immediate implementation)

**Objective:** Truthful catalogue + merchandising integrity — remove misleading/unsupported claims without redesigning the homepage layout.

In scope:
- Stop reading seeded `ratingAverage` / `reviewCount` / `dealEndsAt` for storefront cards.
- Stop seeding those fabricated metrics (keep only non-metric attributes needed for demos, clearly marked).
- Replace overclaiming seller badges with honest “Approved seller” (or omit).
- Quarantine/neutralise Gold + bank-offer components and delete sample reviews.
- Prefer `SHIPPING_POLICY` for free-delivery hints on cards.
- Filter out-of-stock from homepage rails.
- Add unit tests for claim/truth helpers.
- Document seed as demo media placeholders.

Out of scope for this slice: homepage redesign, Promotion schema, Razorpay, legal entity invention, full image re-licensing.

---

## 15. P0 slice completion notes (2026-09-25)

Implemented on `cursor/marketplace-audit-truth-10f6`:

| Finding | Fix |
| --- | --- |
| Attribute ratings on cards | `resolveStorefrontRating` ignores attributes; catalogue/wishlist/shops null them |
| Seed fake metrics | `storefrontAttributes` no longer writes ratings/deals/delivery fees |
| Featured store / Verified Business | Replaced with “Approved seller” |
| Gold / bank offers | Components return `null` (quarantined) |
| SAMPLE_REVIEWS | Deleted |
| Homepage OOS | `inStockOnly: true` + qty filter on rails |
| Free delivery | Tied to `SHIPPING_POLICY.freeAbovePaise` |
| Tests | `claims.test.ts` — 4 new unit tests |
| Scripts | `db:validate`, stub `test:e2e` |

**Re-seed required** on preview DBs to clear legacy attribute metrics from JSON (display already ignores them).
