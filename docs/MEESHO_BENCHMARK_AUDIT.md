# Meesho Benchmark Audit — Aspera Original Identity

Date: 2026-09-25  
Branch: `cursor/aspera-original-identity-10f6`  
Preview audited: `asperamarketplace-git-cursor-me-493eb0-ramchandragadas-projects.vercel.app`  
Benchmark: Meesho.com (functional UX only — **no clone**)

## Scope reminder

Meesho is used only as a **functional UX benchmark** (IA, discovery density, merchandising patterns). Aspera must ship an **original** visual identity, copy, category taxonomy, and component craft. No Meesho assets, trade dress, pink `#9f2089` system, or word-for-word labels.

---

## Phase 0 — Inspection snapshot

| Item | Finding |
| --- | --- |
| Package manager | `pnpm@10.33.3` + `pnpm-lock.yaml` |
| Next.js | `16.3.6` (App Router) |
| React | `19.2.8` |
| DB | Prisma `6.16.2` |
| UI kit | Hand-rolled `src/components/ui/*` (no shadcn CLI) |
| Auth | Cookie session `aspera_session` + RBAC in `modules/identity` |
| Images | Unsplash remotePatterns; QR via `api.qrserver.com` |
| Sitemap / robots / JSON-LD | **Missing** |
| Live tokens | Meesho purple `#9f2089` in `globals.css` (overrides older teal docs) |

### Routes (current)

- Storefront: `/`, `/browse`, `/shop`, `/popular`, `/products/[slug]`, `/shops/[slug]`, `/cart`, `/checkout`, `/wishlist`, `/orders`, `/account`, `/login`, `/register`, `/sell`, `/download-app`
- Seller: `/seller/*` (catalogue, fulfilment, finance, compliance, analytics)
- Admin: `/admin/*`
- Legal/content: `/about`, `/help`, `/support`, `/privacy`, `/returns`, `/shipping`, …

### Data models (usable)

`Seller`, `Category`, `Brand`, `Product`, `ProductImage`, `ProductVariant`, `InventoryItem`, `ProductReview` (+ cart/order/finance/trust stacks intact).

### Seed / images

`prisma/seed.ts` → `seed-catalogue-data.ts` / `seed-catalogue.ts`. Images are Unsplash placeholders (`w=900`). Ratings/`dealEndsAt` injected in seed — **countdown/badge claims must be gated** so fake campaigns do not ship.

---

## Existing strengths

1. Full marketplace backend (catalogue, cart pricing, checkout, mock payments, fulfilment, ledger, trust, analytics).
2. Seller RBAC and capability-gated seller shell.
3. Dense browse (`CatalogueBrowse`) with filters, sort, infinite scroll.
4. PDP gallery, variants, reviews UI, related rails.
5. Shared primitives: `Button`, `Badge`, `Card`, `PageShell`, `Skeleton`, `EmptyState`.
6. Mobile bottom nav + sticky header patterns already exist.

---

## Existing visual / brand weaknesses

1. **Meesho trade-dress risk**: purple `#9f2089`, pink trust strip, arched category tiles, “Original Brands”, “Trusted by Millions”, Mall badges, QR app hero mimicking Meesho campaign.
2. Category bar copies Meesho labels/order (`mega-menu.ts` comment admits exact Meesho IA).
3. Fabricated urgency: deal countdown without a first-class Campaign model.
4. Unsupported badges: Mall / Aspera Original / Verified checkmarks without programmes.
5. `DESIGN_SYSTEM.md` out of sync with live CSS.
6. Unsplash images often weakly related to SKU; some homepage rails reused imagery.
7. No sitemap/robots/JSON-LD; OG defaults weak.
8. Display/serif mix and multi-brand decorative fonts increase noise vs a calm commercial system.
9. Dark-mode tokens forced to Meesho light palette — confusing.
10. Horizontal scroll chrome / density tuned to Meesho, not Aspera.

---

## Reuse vs redesign

| Reuse (logic / structure) | Redesign (presentation / IA) |
| --- | --- |
| Prisma + modules (catalogue, cart, checkout, seller, admin) | `globals.css` tokens, typography |
| `CatalogueBrowse` data wiring | Header chrome + mega-menu labels |
| Cart/checkout panels (business logic) | Homepage merchandising stack |
| Seller layout + capability flags | Product card chrome / badges |
| Auth session helpers | Footer claims + trust copy |
| `product-card` price helpers | Hero, arches → original category tiles |
| Image remotePatterns (extend as needed) | Remove MeeshoAppHero / Original Brands wording |

---

## Data limitations

- No first-class `Campaign` / `Deal` table with `startAt`/`endAt` — countdowns must be removed until modelled.
- “Mall” / “Original Brands” / “Gold” are presentation-only, not programmes.
- Reviews exist but aggregateRating JSON-LD must only emit when moderated reviews exist.
- App download is marketing stub (`/download-app`) — no native store URLs.
- Seed Unsplash assets are **placeholders** for preview only.

---

## Image problems

- Repeated Unsplash photos across unrelated SKUs.
- Card images sometimes use large sources without tight `sizes`.
- Hero uses lifestyle portraits (campaign-like) rather than product merchandising.
- Empty/missing image fallbacks need branded surface, not raw “No image”.

---

## SEO / a11y / responsive gaps

- Missing `app/sitemap.ts`, `app/robots.ts`, Product/Breadcrumb JSON-LD.
- Mega-menu hover-first; keyboard coverage incomplete.
- Focus ring uses brand purple; needs new focus colour with AA contrast.
- Mobile category chips + bottom nav compete; touch targets mostly OK.
- Carousel/autoplay patterns in older hero code need reduced-motion respect.

---

## Implementation sequence (this branch)

1. **Design system** — Aspera teal/orange tokens, Inter, container 1280px, radii, type scale.
2. **IA** — Original category nav (Women, Men, Kids, Beauty, Home, …) mapped to existing slugs.
3. **Header** — Two-row professional marketplace header (not Meesho pink chrome).
4. **Homepage** — Announcement → hero → shop-by-category → campaigns → rails → sellers → trust → seller CTA → footer.
5. **Product cards** — Clean commercial cards; remove Mall/countdown/unsupported badges.
6. **Browse/PDP polish** — Accent swap to Aspera tokens; keep filter logic.
7. **Footer / trust copy** — Honest claims only.
8. **SEO** — metadata defaults, sitemap, robots; PDP JSON-LD when safe.
9. **Validate** — lint, typecheck, unit tests, build.

Out of scope for this pass (preserve logic): live payments, new Campaign schema migration, full seller dashboard visual redesign, full image re-licensing.

---

## Acceptance alignment

| Criterion | Plan |
| --- | --- |
| Serious Indian marketplace feel | Teal/orange commercial system + dense merchandising |
| Not a Meesho clone | Kill purple/pink trade dress, Meesho labels, QR twin hero |
| No fake timers / Mall / Trusted by Millions | Remove or replace with honest alternatives |
| Backend intact | Presentational + IA only where possible |
| Build green | Run lint/typecheck/tests before PR |

---

## Remaining limitations (expected after this slice)

- Unsplash placeholders remain until licensed product photography.
- Seller dashboard visual redesign is light-touch (tokens inherit).
- Cart/checkout get token restyle more than layout rewrite.
- Full Campaign model deferred — no countdown UI.
