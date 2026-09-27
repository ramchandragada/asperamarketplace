# Session: Seller RBAC + action dashboard

Date: 2026-09-25  
Goal: Implement seller_operations / seller_finance / seller_support policies and seller action dashboard after PR #12.  
Branch: `cursor/seller-rbac-dashboard-10f6` (from `cursor/post-phase-10-continuity-10f6` @ `a2e29ad`)  
Starting commit: `a2e29ad`  
Risks: do not merge #1–#12; no live payments; A-20–A-28 remain open; pages currently key off ownerUserId only.

## Acceptance criteria

1. Policy helpers distinguish catalogue/fulfilment (ops+owner), returns/support (support+ops+owner), finance read (finance+owner).
2. Seller pages resolve access via scoped roles, not only `Seller.ownerUserId`.
3. `/seller` dashboard shows late fulfilment, low stock, open returns, next settlement summary.
4. Unit tests cover forbidden cross-role actions.
5. Seed demo users for ops/finance/support; docs updated; typecheck + unit tests pass.
