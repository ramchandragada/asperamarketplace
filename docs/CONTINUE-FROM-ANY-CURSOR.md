# Working on this repo from any PC (Cursor)

The GitHub repository is the source of truth. Open it in Cursor on any machine:

1. Cursor → Open Repository → `https://github.com/ramchandragada/asperamarketplace`
2. Check out the latest feature branch (currently Phase 5):

```bash
git fetch origin
git checkout cursor/phase-5-payments-orders-10f6
pnpm install
```

3. For local run, copy `.env.example` → `.env` and set `DATABASE_URL` to the shared Neon non-prod URL from the Vercel project (or your own local Postgres).
4. Run `pnpm db:migrate` then `pnpm dev`.

## Branch stack (newest last)

| Phase | Branch | PR |
| --- | --- | --- |
| 0 Discovery | `cursor/phase-0-discovery-10f6` | earlier |
| 1 Foundations | `cursor/phase-1-foundations-10f6` | earlier |
| 2 Identity/seller | `cursor/phase-2-identity-seller-10f6` | earlier |
| 3 Catalogue | `cursor/phase-3-catalogue-discovery-10f6` | #4 |
| 4 Cart/checkout | `cursor/phase-4-cart-checkout-10f6` | #5 |
| 5 Payments/orders | `cursor/phase-5-payments-orders-10f6` | #6 |

Prefer the newest branch tip when continuing work. Merging PRs in order (0→5) keeps `main`/Vercel production aligned.

## Preview

Vercel previews deploy from each PR branch. Sign into Vercel to open protected preview URLs.
