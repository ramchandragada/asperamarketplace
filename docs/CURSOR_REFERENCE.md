# Aspera Marketplace — Complete Reference (for Cursor)

Companion to `CURSOR_HANDOFF.md`. This is the zero-gap inventory: every API
route, page, module service function, business rule/constant, enum, and the key
workflows. Generated 2026-10-24.

---

## 1. Business rules & constants (source of truth)

| Rule | Value | Where |
|---|---|---|
| **Platform commission** | **10% default** (`DEFAULT_COMMISSION_BPS = 1000` bps); overridable per seller/category via `CommissionRule` | `modules/finance/service.ts` `resolveCommissionRateBps` |
| **GST** | rate-bps based, typically **18%**; CGST/SGST (intra-state) vs IGST (inter-state) split by seller↔buyer state; `tax = floor(taxable × rateBps / 10000)` | `modules/tax/gst.ts` |
| **TCS** | **0.5%** (u/s 206C(1H)) on settlements | `modules/tax/gst.ts`, `modules/finance` settlements |
| **Shipping** | flat **₹49** base + **₹20/kg** surcharge; **free above ₹999** merchandise subtotal | `modules/cart/pricing.ts` `SHIPPING_POLICY` |
| **Coupons** | platform-funded; dev coupon `ASPERA10` = 10% off, capped ₹200 | `modules/cart/pricing.ts` `KNOWN_COUPONS` |
| **Refund policy** | **item price + GST**, shipping non-refundable; per-line cap; cannot refund a line twice across returns+claims | `modules/finance/refund-math.ts` |
| **Payments** | **mocked** (no real gateway yet). Razorpay/COD is LAST. | `modules/payments`, `modules/orders` |
| **Prices** | integers in **paise**; server-authoritative; `formatPaise` for display | `modules/catalogue/helpers.ts` |

**Locked product decisions:** payments last; refunds = item+GST; coupons
platform-funded; COD deferred; demo/PC data until real sellers onboard.

## 2. Domain module function reference (`src/modules/<m>/service.ts`)

- **identity:** `ensureSystemRoles, registerUser, updateProfile, loginUser,
  completeTotpLogin, beginAdminTotpEnrollment, confirmAdminTotpEnrollment,
  adminTotpRequiredInProduction, adminHasTotpEnabled, logoutSession,
  resolveActorFromToken, requireActor, getOptionalActor, updateActorProfile,
  sessionCookieOptions`. Policy helpers in `identity/policy.ts`
  (`actorIsAdmin`, `actorHasSellerCapability`, `sellerIdsForCapability`, …).
- **seller:** `createSellerDraft, uploadSellerDocument, submitSellerForReview,
  listSellersForAdmin, getSellerDocumentForAdmin, reviewSeller, listOwnedSellers`.
  Access: `seller/access.ts` `resolveSellerForActor`.
- **catalogue:** `listActiveCategories, listActiveBrands, ensureGenericCategory,
  createProductDraft, createProductOffer, listSiblingSellerOffers,
  submitProductForReview, reviewProduct, listSellerProducts, getSellerProduct,
  updateSellerProduct, listSellerInventory, listProductsForModeration,
  listAdminProducts, getPublicProductBySlug, searchApprovedProducts`.
  v2: `catalogue-v2.ts` (`getCatalogueProductBySlug, listOffersForCatalogueVariant,
  rankOffers, bestOfferPricePaise, createCatalogueProduct, createSellerOffer…`).
- **cart:** `getCartForIdentity, getCartForActor, emptyCartView, addCartItem,
  updateCartItem, mergeGuestCartIntoUser, listAddresses, deleteAddress,
  updateAddress, createAddress, estimateCart, previewCheckout, confirmCheckout,
  getLatestReservedCheckout`. Pricing in `cart/pricing.ts`; guest cart in
  `cart/guest.ts`; reservations in `cart/reservations.ts`.
- **orders:** `createOrderFromCheckout, startPayment, simulateMockPaymentOutcome,
  processPaymentWebhook, listOrdersForActor, getOrderForActor, cancelBuyerOrder,
  getInvoiceForActor`.
- **fulfilment:** `listSellerFulfilment, startProcessing, shipGroup,
  markDelivered, cancelFulfilmentGroup, createReturnRequest, reviewReturnRequest,
  createSupportTicket, createDispute, listReturnsForSeller, listReturnsForBuyer,
  listTicketsForActor`.
- **finance:** `ensureChartOfAccounts, resolveCommissionRateBps,
  postOrderPaidLedger, alreadyRefundedMerchandisePaise, postRefundLedger,
  listJournalEntries, createSettlementBatch, releaseSettlementBatch,
  listSettlements, createReconciliationException, resolveReconciliationException,
  listReconciliationExceptions, exportSettlementsCsv, financeSummary`.
  Refund math in `finance/refund-math.ts`.
- **tax:** `ensureDefaultTaxProfiles, resolveActiveTaxPolicy, listTaxProfiles`.
- **protection:** `createProtectionClaim, getProtectionClaimForActor,
  listProtectionClaimsForActor, listProtectionClaimsForAdmin, decideProtectionClaim`.
- **trust:** `openRiskCase, updateRiskCase, listRiskCases, reportCounterfeit,
  reviewCounterfeit, listCounterfeitCases, createProductReview, moderateReview,
  listReviewsForModeration, listApprovedReviewsForProduct, createPrivacyRequest,
  updatePrivacyRequest, listPrivacyRequests, createComplianceEvidence,
  submitComplianceEvidence, listComplianceEvidence, trustOpsSummary`.
- **account:** `getBuyerProfile, upsertBuyerProfile, listBuyerReviews,
  listPendingReviews, listBuyerNotifications, listCouponWallet, buildSpendReport,
  spendReportToCsv`.
- **analytics:** `trackAnalyticsEvent, platformDashboard, sellerHealth,
  createExperiment, updateExperiment, listExperiments`.
- **wishlist:** `listWishlistProducts, addWishlistItem, removeWishlistItem,
  listWishlistProductIds`.

## 3. API routes (`src/app/api/.../route.ts`)

**Auth:** `auth/login`, `auth/logout`, `auth/me`, `auth/register`,
`auth/totp/setup`, `auth/totp/verify`.
**Catalogue (public):** `catalogue/categories`, `catalogue/products`,
`catalogue/products/[slug]`, `catalogue/suggest`, `pincode/check`.
**Cart/checkout:** `cart`, `cart/items`, `cart/estimate`, `checkout/preview`,
`checkout/confirm`, `checkout/addresses`, `checkout/addresses/[id]`.
**Orders/payments:** `orders`, `orders/[orderId]`, `orders/[orderId]/cancel`,
`orders/[orderId]/invoices/[invoiceId]`, `payments/start`,
`payments/webhook`, `payments/mock-complete` (**disabled in prod**).
**Seller:** `seller`, `seller/submit`, `seller/[sellerId]/documents`,
`seller/products`, `seller/products/[id]`, `seller/products/offer`,
`seller/products/submit`.
**Fulfilment:** `fulfilment/groups`, `fulfilment/process`, `fulfilment/ship`,
`fulfilment/deliver`, `fulfilment/cancel`.
**Returns/claims/tickets:** `returns`, `returns/mine`, `returns/review`,
`claims`, `claims/[claimId]`, `disputes`, `tickets`.
**Account:** `account/me`, `account/profile`, `account/business`,
`account/notifications`, `account/coupons`, `account/reviews`, `account/spend`,
`wishlist`.
**Admin:** `admin/sellers`, `admin/sellers/review`,
`admin/sellers/[id]/documents/[docId]`, `admin/products`,
`admin/products/review`, `admin/data-quality`, `admin/data-quality/cleanup`,
`admin/claims/[claimId]/decide`.
**Finance:** `finance/journal`, `finance/settlements`,
`finance/settlements/release`, `finance/reconcile`, `finance/export`.
**Trust:** `trust/risk-cases`, `trust/counterfeit`, `trust/reviews`,
`trust/seller-feedback`, `trust/privacy`, `trust/compliance`.
**Analytics/health:** `analytics/events`, `analytics/dashboard`, `health`.

> All routes use `jsonOk`/`jsonError` (`platform/http/respond.ts`), are
> `dynamic = "force-dynamic"`, and enforce auth/capabilities server-side.
> Mutations use idempotency + optimistic concurrency (`expectedVersion`).

## 4. Pages (`src/app/.../page.tsx`)

**Storefront:** `/`, `/shop`, `/browse`, `/popular`, `/products/[slug]`,
`/shops/[slug]`, `/cart`, `/checkout`, `/wishlist`, `/commission`, `/sell`.
**Account (buyer):** `/account`, `/account/{addresses,business,coupons,
notifications,payments,profile,returns,reviews,spend}`, `/orders`,
`/orders/[orderId]`, `/returns`.
**Seller console:** `/seller`, `/seller/{catalogue,catalogue/[id],inventory,
fulfilment,returns,finance,compliance,profile,analytics,onboarding}`.
**Admin console:** `/admin`, `/admin/{sellers,products,orders,orders/[orderId],
claims,data-quality,trust,finance,analytics,audit,security}`.
**Auth/info:** `/login`, `/register`, `/about`, `/careers`, `/press`, `/help`,
`/support`, `/privacy`, `/terms`, `/shipping`, `/returns`, `/buyer-protection`,
`/seller-policies`, `/download-app`.

## 5. Key workflows (functions involved)

**Checkout → order:** `estimateCart`/`previewCheckout` (server re-prices,
reserves stock) → `confirmCheckout` → `createOrderFromCheckout` (creates `Order`
+ per-seller `OrderFulfilmentGroup` + `OrderLine` price snapshots) →
`startPayment` → mock `processPaymentWebhook`/`simulateMockPaymentOutcome` →
`postOrderPaidLedger` (balanced journal: cash / seller payable / commission /
GST). Failed/expired checkout → reservations released
(`releaseExpiredCheckoutReservations`).

**Fulfilment:** seller `startProcessing` → `shipGroup` → `markDelivered` (or
`cancelFulfilmentGroup`). Packing slip/label/invoice generated.

**Returns/refunds:** `createReturnRequest` (qty capped to purchased) →
`reviewReturnRequest` → refund via `refund-math.refundBreakdown` (item+GST,
per-line cap, `alreadyRefundedMerchandisePaise` guard) → `postRefundLedger`
(4-way split). Protection claims (`decideProtectionClaim`) and buyer/group
cancels share the same refund+ledger path.

**Settlements:** `createSettlementBatch` (nets out refunded merchandise, applies
commission + 0.5% TCS) → `releaseSettlementBatch`. `ReconciliationException` for
mismatches. `exportSettlementsCsv` for finance.

**Catalogue (seller):** `createProductDraft` or `createProductOffer`
(match an existing listing via `sharedListingKey`) → `submitProductForReview` →
admin `reviewProduct` → `getPublicProductBySlug`/`searchApprovedProducts` surface
it. `listSiblingSellerOffers` powers the PDP "other sellers".

## 6. Enums (Prisma)

`UserStatus, SellerStatus, KycCaseStatus, KycStage, ProductStatus
(draft/submitted/approved/rejected/archived), CartStatus, CheckoutStatus,
OrderStatus, FulfilmentGroupStatus, PaymentAttemptStatus, InvoiceStatus,
ReturnStatus, RefundStatus, TicketStatus, DisputeStatus, ProtectionClaimType,
ProtectionClaimStatus, LedgerAccountType, JournalEntryStatus, SettlementStatus,
ReconciliationStatus, RiskCaseStatus, CounterfeitCaseStatus,
ReviewModerationStatus, PrivacyRequestStatus, ComplianceEvidenceStatus,
ExperimentStatus, OfferCondition (new/refurbished/used)`.
Friendly labels for user-facing enums: `src/lib/status-labels.ts`.

## 7. Gotchas / non-obvious

- **Two catalogue models coexist:** v1 `Product` (live) and v2
  `CatalogueProduct`/`SellerOffer` (flag-off). Seeds/queries must not mix them.
- **`seller_offers.sku` and `product_variants.sku`** are separate unique
  namespaces (same string can exist in both).
- **A seller can hold only one `Product` per `sharedListingKey`** (unique
  constraint) — sibling offers come from different sellers.
- **Preview builds skip `prisma migrate deploy`**; only prod migrates (with
  retry). A PR that adds a migration won't see it on its own preview until
  merged (fine for additive migrations).
- **`getPublicProductBySlug` filters `status = "approved"`** — archived old
  catalogue is invisible but still in the DB.
- **Integration tests need `DATABASE_URL`**; without it they throw
  `PrismaClientInitializationError` (env, not a code bug).
- **Images:** only Unsplash is allowlisted (Next remotePatterns + CSP). Everything
  else must be self-hosted under `public/` or added to both allowlists.

See `CURSOR_HANDOFF.md` for setup, deploy, env vars, conventions, and backlog.
