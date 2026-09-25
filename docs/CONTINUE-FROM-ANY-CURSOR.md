# Working on this repo from any PC (Cursor)

The GitHub repository is the source of truth. Open it in Cursor on any machine:

1. Cursor → Open Repository → `https://github.com/ramchandragada/asperamarketplace`
2. Check out the latest feature branch (storefront UX + seller shell tip):

```bash
git fetch origin
git checkout cursor/ux-storefront-seller-shell-10f6
pnpm install
```

If that branch is unavailable, use `cursor/post-phase-10-continuity-10f6` (PR #12).

3. For local run, copy `.env.example` → `.env` and set `DATABASE_URL` to the shared Neon non-prod URL from the Vercel project (or your own local Postgres).
4. Run `pnpm db:migrate` then `pnpm db:seed` then `pnpm dev`.

Alternatively use **Cursor Cloud Agents** on this repo: they already have the environment and can continue from the tip branch without local setup.

## Branch stack (newest last)

| Phase | Branch | PR |
| --- | --- | --- |
| 0 Discovery | `cursor/phase-0-discovery-10f6` | #1 |
| 1 Foundations | `cursor/phase-1-foundations-10f6` | #2 |
| 2 Identity/seller | `cursor/phase-2-identity-seller-10f6` | #3 |
| 3 Catalogue | `cursor/phase-3-catalogue-discovery-10f6` | #4 |
| 4 Cart/checkout | `cursor/phase-4-cart-checkout-10f6` | #5 |
| 5 Payments/orders | `cursor/phase-5-payments-orders-10f6` | #6 |
| 6 Fulfilment/care | `cursor/phase-6-fulfilment-care-10f6` | #7 |
| 7 Finance | `cursor/phase-7-finance-ledger-10f6` | #8 |
| 8 Trust/safety | `cursor/phase-8-trust-safety-10f6` | #9 |
| 9 Analytics | `cursor/phase-9-analytics-10f6` | #10 |
| 10 Hardening | `cursor/phase-10-hardening-launch-10f6` | #11 |
| Continuity | `cursor/post-phase-10-continuity-10f6` | #12 |
| UX + seller shell | `cursor/ux-storefront-seller-shell-10f6` | (this tip) |

Prefer the newest branch tip when continuing work. Merging PRs in order keeps `main`/Vercel production aligned.

## Preview

Vercel previews deploy from each PR branch. Sign into Vercel to open protected preview URLs.

## Continue from any Cursor

After clone/checkout of the tip branch, the same Neon non-prod database and Vercel project stay shared. No machine-local secrets are required beyond copying env from the Vercel project (or using Cursor Cloud Agents which already have them).

See `docs/LAUNCH_CHECKLIST.md` before any production cutover. Legal A-20–A-28 remain open.
