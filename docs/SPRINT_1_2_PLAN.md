# Sprint 1 & 2 — Implementation Plan (for approval)

**Date:** 2026-10-22
**Rule:** This is the plan. Nothing is implemented until you approve. Each fix will ship with a test that fails before and passes after, and the full `typecheck/lint/test/build` gate stays green.

---

## SPRINT 1 — Money integrity (backend)

**Goal:** make refunds and settlements correct so no rupee leaks when you start taking even small real test orders.

### 1.1 Database change (one migration)
Add to the `Refund` model:
- `orderLineId String? @db.Uuid` (+ relation to `OrderLine`, + `@@index([orderLineId])`).

Why: today a `Refund` isn't tied to a specific order line, so it's impossible to compute "how much of this line has already been refunded." This is the root enabler of the double-refund bug. Nullable because whole-order/whole-group cancels aren't line-specific; per-line refunds (returns, protection claims) will set it.

Backfill: not needed (demo data only). Migration is additive and safe.

### 1.2 Shared refund cap (new helper)
Add `remainingRefundablePaise(tx, orderLineId)` → `paidLineTotal − Σ(refunds already booked against that line, status in succeeded|pending)`. Every per-line refund path caps its payout at this value.

### 1.3 Fix: a line can be refunded twice *(audit M-2 — the real money bug)*
- **`protection/service.ts · decideProtectionClaim`** (line ~258): stamp `orderLineId` on the refund and cap `refundAmount` at `remainingRefundablePaise(...)`. If a prior return already refunded the line, the second payout caps to 0 and the claim is resolved without a double refund (admin sees the reason).
- **`fulfilment/service.ts · reviewReturnRequest`** (line ~521): stamp `orderLineId`; cap the computed refund at remaining refundable too.

### 1.4 Fix: refunds never hit the ledger *(audit M-1)*
Call the existing-but-unused `postRefundLedger` inside each refund transaction, using the same `tx`, debiting seller payable (2000) / crediting cash clearing (1000). Wire it into all four refund sites:
- `fulfilment/service.ts:353` (seller/admin group cancel)
- `fulfilment/service.ts:521` (return approval)
- `orders/service.ts:1026` (buyer cancel of paid order)
- `protection/service.ts:266` (protection payout)

Small refactor: give `postRefundLedger` an optional `tx` param (mirrors `postOrderPaidLedger`) and ensure the chart of accounts exists before the transaction. After this, the ledger is an accurate record of money out, and settlements computed from it stop overstating.

### 1.5 Fix: settlements pay for returned goods *(audit M-3)*
In **`finance/service.ts · createSettlementBatch`** (line ~346): for each delivered group, subtract refunds attributable to that group's lines from `grossPaise` before computing commission and net. A delivered-then-returned line settles at its true (post-refund) value, not full price.

### 1.6 Harden: mock-payment endpoint *(audit M-4)*
Gate `POST /api/payments/mock-complete` to non-production (`NODE_ENV !== "production"` → 404). It's correct for dev/testing now; this just makes sure it can never become a "free orders" hole in prod. ~3 lines.

### 1.7 Harden: concurrent return over-approval *(audit M-6)*
At return **approval** time, re-cap against *other* open returns for the same line (not just the line quantity), closing the two-simultaneous-requests gap.

### 1.8 Tests
New/extended vitest tests: (a) return-then-protection on the same line → second refund caps to 0; (b) a refund writes a balanced, append-only ledger entry; (c) a settlement nets out a returned line; (d) mock-complete is blocked when `NODE_ENV=production`.

### Deferred from Sprint 1 (need your decision — see §Decisions)
- **M-8** Refunds currently exclude GST & shipping (refund merchandise only).
- **M-9** Coupon cost is funded by the platform (parked in refund-liability), not shared with sellers.
- **M-5 / M-7** Idempotency self-sufficiency and structured settlement-risk gating — latent, mitigated today; propose a later "finance hardening" pass.

---

## SPRINT 2 — Storefront trust & conversion (frontend)

**Goal:** make the store feel real and convert, without touching the payment gateway.

### 2.1 Remove developer/mock payment language *(audit U-1 — trust-critical)*
- `checkout/page.tsx:42-45` and `checkout-panel.tsx:199,267-269`: replace all "development mock / no live charges" copy with neutral, real-store wording ("Review your order and choose how to pay").
- Add a clean **Payment method** step (UPI · Card · Netbanking · COD) on the order/payment page. For now every online method completes through the existing mock settlement; in non-prod a small, tasteful "Test mode" chip is fine — but the shopper never sees "development mock" again.

### 2.2 Simplify the checkout flow *(audit U-2)*
- Auto-price the order on load and whenever address/coupon changes (debounced) — remove the manual "Preview totals" gate and the disabled-until-previewed button.
- One primary **Place order** button (not two); move the single coupon input into the order-summary card (remove the duplicate coupon section).
- Backend is unchanged — it already recomputes authoritative totals server-side, so this is purely a UI simplification.

### 2.3 Delivery-date ETAs *(audit U-3)*
- On the PDP (`product-purchase-panel.tsx`), when a pincode resolves, show a bold **"Delivery by <etaLabel>"** and COD availability. The pincode API already returns `etaLabel` + `codAvailable` — it's just not surfaced prominently today.

### 2.4 Persistent "Deliver to [pincode]" in the header *(audit U-4)*
- Add a small `DeliveryLocation` context (localStorage-backed) + a header chip ("Deliver to 560001 · change"). The PDP reads the saved pincode so ETA/COD show without re-entering it on every product — matching Flipkart/Amazon/Meesho behavior.

### 2.5 Cart & PDP polish *(audit U-9 subset)*
- Reuse the existing `.qty-stepper` (+/−) in cart lines instead of the raw number input.
- Add a cart-count badge to the mobile bottom nav.
- Use the shared `EmptyState` component for the empty cart.
- Fix the PDP "N ratings · N reviews" duplicate-count line to show distinct, correct labels.

### 2.6 Verification
Typecheck/lint/build + I'll launch the app and capture before/after screenshots of checkout, PDP (with ETA), and cart on mobile + desktop widths so you can see the changes.

### Not in Sprint 2 (bigger, later)
Full wishlist re-architecture (U-5), splitting the 1,300-line browse component (U-7), looping-rail a11y (U-6), and the design-system token cleanup (U-8) belong in Sprint 3/5. Real **COD as a true no-online-payment order path** can be a fast-follow if you want it before the gateway — flagged below.

---

## Decisions I need from you

1. **Refund scope (M-8):** When a buyer returns/cancels, should we refund **only the item price** (current behavior) or **item + GST + proportional shipping**? (Most Indian marketplaces refund item + GST; shipping varies.)
2. **Coupon funding (M-9):** Are storefront coupons funded by **the platform** (current) or **shared with sellers**? Affects the ledger model.
3. **COD now or later:** Do you want **Cash on Delivery** wired as a real order path in Sprint 2 (realistic, needs a small order-state change), or keep all methods routing through the mock for now and add COD just before the gateway?

Defaults if you don't specify: (1) refund **item + GST**, shipping non-refundable; (2) coupons **platform-funded** (unchanged); (3) COD **later**.
