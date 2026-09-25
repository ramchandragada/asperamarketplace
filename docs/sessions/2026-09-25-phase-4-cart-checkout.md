# Session: Phase 4 cart and checkout

Date: 2026-09-25  
Goal: Multi-seller cart, address, shipping estimate, server price snapshot, tax trace, coupon validation, atomic stock reservation, checkout review. No live payment.  
Branch: `cursor/phase-4-cart-checkout-10f6`  
Base: `cursor/phase-3-catalogue-discovery-10f6`

## Risks

- Never trust browser money or stock values. Reject mismatched `clientTotalPaise`.
- Tax and shipping are configurable stubs with explanation traces (A-24 remains open).
- COD and live Razorpay stay out of scope (A-28, Phase 5).

## Outcome

Cart/checkout schema migrated on local non-prod Postgres. APIs cover cart lines, addresses, preview, and confirm-with-reservation (idempotent). PDP add-to-cart, `/cart`, and `/checkout` UI ship. Typecheck, lint, tests (30 passed), and production build passed locally. Production was not migrated. Live payment remains Phase 5.

## Next

Phase 5 mock payments and order state machine after review. Hosted Neon already has earlier migrations; apply `20260925040646_cart_checkout` on preview/non-prod before relying on cart routes there.
