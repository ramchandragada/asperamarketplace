# Catalogue seed & visuals

Date: 2026-09-25  
Updated: marketplace-audit truthfulness slice  

## Purpose

Populate a visually credible India-first catalogue for **development/preview only**. Does **not** invent live payments, customer reviews, ratings, deal timers, or production PII.

## Truthfulness rules (P0)

- Do **not** seed `ratingAverage`, `reviewCount`, `ratingDistribution`, or `dealEndsAt`.
- Public ratings come only from moderated `ProductReview` rows.
- Unsplash URLs are **placeholders** — alt text states this; replace before commercial launch (`docs/IMAGE_PLACEHOLDERS.md`).
- Attributes may set `demoCatalogue: true` and `mediaPlaceholder: true`.

## Commands

```bash
pnpm db:migrate
pnpm db:seed
pnpm db:validate
```

Safe on Neon non-production / local Postgres. Do not run against production.

## Totals (definitions)

| Metric | Value |
| --- | --- |
| Categories | 12 |
| Products defined | 121 (`SEED_PRODUCTS`) |
| Minimum per category | 10 |
| Demo sellers | 4 (home, fashion, tech, wellness) |
| Images per product | 3 Unsplash placeholder URLs |

Public storefront shows **approved** products only. Intentionally non-public: draft desk caddy, draft herbal gummies, submitted knee sleeve.

## Variety flags

- Low stock: several SKUs with `onHand` ≤ 5  
- Out of stock: mesh bags, wireless mouse, desktop cable clips  
- No discount: ice tray, lavender lotion, glass cleaner (MRP = selling)  
- High price: portable SSD, adjustable dumbbells  

## Seller map

| Key | Email | Trade name |
| --- | --- | --- |
| home | `seller@aspera.local` | Aspera Demo Mart |
| fashion | `seller.fashion@aspera.local` | Narmada Styles |
| tech | `seller.tech@aspera.local` | Silicon Bay Store |
| wellness | `seller.wellness@aspera.local` | Coastal Bloom |
