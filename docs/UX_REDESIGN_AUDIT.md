# UX redesign audit — storefront + seller shell

Date: 2026-09-25  
Base: `cursor/post-phase-10-continuity-10f6` @ `a2e29ad`  
Branch: `cursor/seller-rbac-dashboard-10f6`  
Reference: Meesho.com as **conceptual UX only** (discovery rails, clear cards, trust signals)—not branding or layout copy.

## 1. Current UI and routes

| Area | State |
| --- | --- |
| Root layout | Geist fonts + tokens only; **no shared header/footer** |
| Home `/` | Phase status / internal links — not a commerce storefront |
| Browse `/browse` | Text list search; no grid, images, filters, or category chips |
| PDP `/products/[slug]` | Solid data + reviews; no media hierarchy or trust strip |
| Cart/checkout/orders | Functional panels, narrow column, form-like |
| Seller | `/seller/onboarding|catalogue|fulfilment|analytics` — no shell or `/seller` dashboard |
| Admin | Separate form consoles |

## 2. Reusable pieces

- CSS tokens in `globals.css` (accent teal, surface, radius)
- Feature panels: `catalogue-browse`, cart/checkout/orders, seller-*, admin-*
- Identity `ROLE_KEYS` including `seller_operations|finance|support`
- Catalogue search, money in paise, mock payments, ledger, compliance register
- Partial WIP: seller capabilities in `policy.ts`, `access.ts`, `dashboard.ts`

## 3. Auth / seller / compliance already present

- httpOnly sessions, RBAC roles seeded
- Seller KYC draft→submit→approve; `Seller.status`
- Tax profiles (configurable; A-24 open)
- Reviews with moderation; trust ops queues
- Settlements admin-managed; seller analytics reads aggregates

## 4. Gaps

- No design-system atoms (Button, Badge, Card, Empty, Skeleton)
- No marketplace chrome or category merchandising
- Product cards lack price/MRP/rating/seller/trust hierarchy
- Seller pages owner-only (`ownerUserId`); staff roles unused in UI
- No seller action dashboard or responsive seller nav
- Trust signals not surfaced on storefront cards/PDP

## 5. PR-sized slices (this branch)

1. Design tokens + shared UI + site header/footer  
2. Homepage discovery  
3. Browse filters + product cards + PDP polish  
4. Seller RBAC helpers + protected seller routes  
5. Seller action dashboard  
6. Seller shell nav, trust badges, a11y polish  

No app rewrite. No live payments. No PR merges onto `main`. A-20–A-28 remain open.
