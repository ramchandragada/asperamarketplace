# Session — Public preview access (Vercel Auth)

Date: 2026-09-25  
Branch: `cursor/v2-storefront-gaps-10f6`  
Commit: `3272a1a63001d5b6ff97b88c6fb07574b177a80f`

## Investigation

| Setting | Before | After |
|---------|--------|-------|
| Vercel Authentication (`ssoProtection`) | **enabled**, `deploymentType: all_except_custom_domains` | **disabled** (`null`) |
| Password protection | disabled | unchanged (disabled) |
| Trusted IPs | disabled | unchanged |
| Automation bypass | not used for public access | unchanged |
| App auth / seller RBAC / admin gates | intact | unchanged |

Root cause of “preview opens Vercel login”: project-level **Vercel Authentication** covered all deployment URLs (except custom domains). There is no custom domain on this project, so every preview URL required team SSO.

## Change made

- API: `update_project` → `ssoProtection: null` on project `asperamarketplace` (`prj_70YBDmgCx9F15AtU6iWlDXJLUJhn`).
- Redeployed tip commit as `dpl_2HUtseo2T5J1RnDib9gptBX4wpTK`.

**Note:** Vercel’s SSO enum has no “production-only” mode. Disabling SSO opens **preview** (required for external audit). Production alias `asperamarketplace.vercel.app` still points at empty `main` and was already under the same SSO rule; app-level `/seller` and `/admin` routes remain login-gated.

## Public URLs

- Deployment: https://asperamarketplace-hhd5bg8ma-ramchandragadas-projects.vercel.app  
- Branch alias: https://asperamarketplace-git-cursor-v2-fb0a5b-ramchandragadas-projects.vercel.app  

## Verification (unauthenticated)

- Homepage 200, no Vercel SSO wall; catalogue rails visible  
- `/shop`, `/wishlist`, `/sell`, `/login`, PDP 200  
- `/account`, `/cart`, `/seller`, `/admin/sellers` → app `/login` (307), not Vercel  
- Catalogue API returns seeded products with Unsplash images + diversified sellers  
- Login UI: Email/Password, Forgot password; no “development account” copy  

## Audit judgment (Claude + Merlin style re-audit)

Most Priority 1–9 items were already implemented on this tip. Do **not** re-litigate V1 shell work. Remaining optional polish (not blockers for public review): blur placeholders on more images, deeper checkout wizard UX, richer mobile accordion edge cases. Public seller shops live at `/shops/[slug]` (correct — `/seller/*` is the authenticated seller dashboard).
