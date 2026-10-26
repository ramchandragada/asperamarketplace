# CTO decision — Grok regression P0s (2026-10-26 IST)

## Verdict
**NOT SHIPABLE** until mock self-pay is dead on production and category tiles are truthful.

## Decision order (shipping this PR)

1. **Kill mock “Pay now” on live production** (Grok P0-1)  
   - `VERCEL_ENV=production` → `mockSelfPayAllowed()` is always `false`, even if `ALLOW_MOCK_SELF_PAY=true`.  
   - Orders UI hides Pay now and shows “gateway coming soon”.  
   - Account payments copy no longer advertises mock pay on prod.

2. **Fix Shop-by-category images + show all 12 tiles** (Grok P0-2 / P0-3)  
   - Cherry-picked from #117: dedicated laptop / PSU / cooler / UPS tiles; no `slice(0, 8)`.

3. **Harden browse soft-nav** (belt-and-suspenders; soft-nav already PASS in Grok)  
   - Cherry-picked from #119: URL-keyed remount + stale-prop refetch.

4. **Seller staff workspace** (Grok P0-4)  
   - Actor roles fall back to `scopeKey` when `sellerId` is null.  
   - Seed re-binds ops/finance/support to Pune City Computers and clears orphan scopes.  
   - **Ops note:** run `pnpm db:seed` against the shared non-prod DB (or a one-shot staff repair) after deploy so prod memberships match.

## Explicitly deferred (P1 — next sprint)
Tax inclusive vs GST add-on copy, checkout payment step UX, non-Pune ETA softness, stub policy pages, wishlist 401, product HTTP status, `/seller/catalogue/new`, missing RAM images, text brand tiles.

## Do not merge
Nothing else blocks this ship train. Close/supersede #117 and #119 once this PR lands (same commits included).
