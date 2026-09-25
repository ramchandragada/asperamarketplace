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

Pending.
