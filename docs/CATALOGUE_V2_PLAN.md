# Catalogue v2 — shared catalogue + seller offers

**Owner:** Claude Code (CTO session) · **Status:** in progress · **Flag:** `CATALOGUE_V2`

## Goal

Move from the current **clone-and-group** model (each seller owns a full `Product`,
siblings linked by `sharedListingKey`, catalogue facts copied then drift) to the
spec's **shared catalogue + offers** model:

- **CatalogueProduct** — marketplace-owned facts (title, brand, category,
  description, images, specs). Sellers cannot edit these.
- **CatalogueVariant** — shared "Blue / 128GB" definition. No price, no SKU.
- **SellerOffer** — per seller per variant: price, MRP, condition, dispatch,
  SKU, status, version. This is what a seller actually creates.
- **OfferInventory** — stock keyed by offer.
- Cart / order lines reference the **offer** (order lines keep their price snapshot).

All portal data is demo, so we re-seed cleanly into the new model rather than
backfilling divergent copies.

## Decisions (locked)

- **Condition:** `new / refurbished / used` (offers default `new`).
- **Offer status:** reuse `ProductStatus` (draft/submitted/approved/rejected/
  archived); seller-level suspension already exists on `SellerStatus`.
- **Canonical facts:** re-seed demo data in the new model when reads flip.
- **Rollout:** small, independently-shippable PRs behind `CATALOGUE_V2`, gates
  green, money paths (cart/order/inventory) touched last and alone.

## Phases

- [ ] **P1 — Additive schema.** New tables only; nothing reads them. Zero
      behaviour change, fully reversible. ← *this PR*
- [x] **P2 — Catalogue service v2.** `catalogue-v2.ts` read/write services
      (create catalogue product/variant, create seller offer + inventory,
      `getCatalogueProductBySlug`, `listOffersForCatalogueVariant`,
      `rankOffers` buy-box, `bestOfferPricePaise`) + `flags.ts`
      (`catalogueV2Enabled`, default OFF) + unit and integration tests.
- [~] **P3 — Re-point reads.** PDP, search, sibling-offer comparison read v2
      when `CATALOGUE_V2=true`. Flip on preview → prod. Rollback = flip off.
      - [x] **Backfill ready** (`catalogue-v2-backfill.ts`, `pnpm db:backfill:v2`):
        idempotently maps existing approved products (grouped by
        `sharedListingKey`) into catalogue products + variants + offers. Run
        this once against a DB before flipping the flag so v2 has data.
      - [ ] Adapt PDP / search / "other sellers" to read v2 behind the flag
        (offer-centric display). **Not done — larger UX change, do supervised.**
- [ ] **P4 — Re-point writes (money path).** Seller offer creation, cart,
      checkout, order lines, inventory reservation reference `offerId`. Heavy
      integration tests; shipped alone.
- [ ] **P5 — Retire + admin.** Remove old Product-as-listing; admin canonical
      catalogue editing + reversible duplicate-merge; search reindex.

## Invariants (never violate)

- Completed orders are never rewritten — order lines keep their price snapshot.
- Each phase ships with `pnpm typecheck && lint && test && build` green.
- Additive migrations only (they auto-run on deploy).
