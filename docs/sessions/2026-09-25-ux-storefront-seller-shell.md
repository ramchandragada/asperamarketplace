# Session: Storefront UX + seller RBAC/dashboard

Date: 2026-09-25  
Goal: Complete UX redesign slices 1–6 and seller RBAC/action dashboard after PR #12.  
Branch: `cursor/ux-storefront-seller-shell-10f6`  
Starting commit: `a2e29ad` (continuity tip)  
Risks: no PR merges; no live payments; A-20–A-28 open; production `.vercel.app` still on empty `main`.

## Acceptance

1. Design tokens + shared UI + site header/footer  
2. Homepage discovery rails  
3. Browse filters + product cards + PDP polish  
4. Seller capability RBAC server policies + protected routes  
5. `/seller` action dashboard from real data  
6. Seller nav, trust wording, a11y basics; typecheck + unit tests  

## Notes

- Audit: `docs/UX_REDESIGN_AUDIT.md`  
- Lightweight `components/ui` (no new UI framework package)  
- Seed adds seller ops/finance/support demo users  
