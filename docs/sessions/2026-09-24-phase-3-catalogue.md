# Session: Phase 3 catalogue and discovery

Date: 2026-09-24  
Goal: Categories, products, variants, inventory, moderation, public browse, and PostgreSQL search so at least one approved seller listing is visible without login.  
Branch: `cursor/phase-3-catalogue-discovery-10f6`  
Starting commit: `191c380` on `cursor/phase-2-identity-seller-10f6`

## Risks

- Do not invent a regulated launch category (A-26). Seed a generic configurable category only.
- Prices and stock are server-owned integers (paise). Never trust browser totals.
- Only approved sellers may publish listings; listings need moderation before public visibility.

## Outcome

Catalogue schema and GIN search index migrated on local non-prod Postgres. Seller draft/submit and admin review APIs ship with audit + outbox. Public `/browse` and `/products/[slug]` work without login. Seed creates an approved seller and `cotton-tea-towel-set-demo` listing. Typecheck, lint, tests (including catalogue integration), and build passed locally. Production was not migrated.

## Next

Phase 4 cart/checkout after review. User may still need to merge earlier PRs and provision hosted non-prod Postgres for deploy continuity.
