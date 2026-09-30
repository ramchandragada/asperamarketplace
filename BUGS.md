# Aspera Marketplace bug hunt

Audit date: 2026-09-29  
Code reviewed: production tip `cursor/home-products-for-you-10f6` (`8e1c0ec`), deployed at https://asperamarketplace.vercel.app  
Checks run locally: `pnpm lint`, `pnpm typecheck`, `pnpm test` (66 passed, 1 skipped), `pnpm build`, and click-through of home, browse, product detail, buy now, login redirect, cart, and seller/admin access on a local production server with a seeded database.

Status is **Fixed** when this branch contains the change, or **Not fixed** with the reason.

## Critical

### 1. Return approval refunds and restocks far more than the buyer purchased
- **Status:** Fixed
- **Location:** `src/modules/fulfilment/service.ts` (`createReturnRequest`, `reviewReturnRequest`)
- **Reproduce:** Buy 1 unit. `POST /api/returns` with `quantity: 99` for that line. Seller approves the return. Refund was `lineTotal / quantity * 99`, and inventory `onHand` increased by 99.
- **Impact:** A buyer could be refunded many times the amount paid, and stock counts would inflate.
- **Fix:** Require the line to belong to that order and seller. Cap the accepted quantity by units purchased minus open returns. Recompute the refund from the capped quantity.

### 2. Abandoned checkouts hold inventory forever
- **Status:** Fixed
- **Location:** `src/modules/cart/service.ts` (`confirmCheckout`), `src/modules/orders/service.ts` (`createOrderFromCheckout`), `src/modules/cart/reservations.ts`
- **Reproduce:** Confirm checkout (stock `reserved` increases, hold lasts 15 minutes). Do not pay. After `reservedUntil`, the checkout cannot become an order, but nothing decrements `reserved`. Repeat until the SKU shows as out of stock with no paid orders.
- **Impact:** Catalogue availability is wrong and later buyers cannot purchase the held units.
- **Fix:** When a reserved checkout passes `reservedUntil`, mark it `expired` and write a `release` stock movement. The sweep runs from the header, product pages, search, checkout confirm, and expired order creation.

### 3. Buy now never adds the selected product
- **Status:** Fixed
- **Location:** `src/components/product-purchase-panel.tsx`
- **Reproduce:** Open a product, choose a size, click Buy now. The control was a link to `/checkout` and did not post the variant to the cart. Checkout then showed an empty cart, or sent a guest to login with nothing reserved.
- **Impact:** The primary purchase button did not purchase anything.
- **Fix:** Buy now adds quantity 1 of the selected variant, then navigates to checkout. Guests are sent to `/login?next=/checkout`. Verified in the browser: size M on the handloom kurta lands on `/login?next=/checkout`, and after sign-in the kurta is in the cart.

### 4. Mobile purchase bar sits under the bottom tab bar
- **Status:** Fixed
- **Location:** `src/components/product-purchase-panel.tsx`, `src/components/mobile-bottom-nav.tsx`
- **Reproduce:** On a viewport narrower than `md`, open a product. Add to cart and Buy now were `fixed` at `bottom-0` with `z-30`. The Home / Categories / New / Cart / Account bar is also `bottom-0` at `z-40`, so it covered the purchase controls. The bar also became inline at `sm` while the tab bar remains until `md`.
- **Impact:** Shoppers on phones could not reliably tap Add to cart or Buy now.
- **Fix:** Keep the purchase bar fixed until `md`, offset it above the tab bar (including the safe area), and raise it to `z-50`. A 390px screenshot of the kurta page shows both buttons above the tab bar.

## High

### 5. Mock payment webhook accepts a public default secret
- **Status:** Fixed
- **Location:** `src/modules/payments/provider.ts`
- **Reproduce:** If `MOCK_PAYMENT_WEBHOOK_SECRET` is unset, signatures were computed with `aspera-mock-webhook-dev-only-not-secret`, which is in `.env.example`. Anyone who knows it can `POST /api/payments/webhook` and mark an order paid.
- **Impact:** Forged payments on any deployment that forgot to set the secret.
- **Fix:** In production, missing or default secrets are rejected. Development and test still use the documented fallback.

### 6. Product JSON-LD can break out of the script tag
- **Status:** Fixed
- **Location:** `src/app/products/[slug]/page.tsx`
- **Reproduce:** A seller title or description containing `</script>` was embedded with `JSON.stringify` inside `dangerouslySetInnerHTML`. After approval, that HTML runs for every product-page visitor.
- **Impact:** Stored cross-site scripting on the product page.
- **Fix:** Serialize JSON-LD with `<` escaped to `\u003c`.

### 7. Login has no lockout
- **Status:** Fixed
- **Location:** `src/modules/identity/service.ts`, `src/modules/identity/login-guard.ts`
- **Reproduce:** `POST /api/auth/login` with a known email and unlimited wrong passwords. Failures were logged and never consulted.
- **Impact:** Online password guessing against customer and seller accounts.
- **Fix:** After 8 failures for an email in 15 minutes, further attempts return 429. Verified against the local server (attempts 1–8 were 401, 9–10 were 429).

### 8. Shop and browse never show products past the first page
- **Status:** Fixed
- **Location:** `src/app/browse/page.tsx`, `src/app/shop/page.tsx`
- **Reproduce:** Open `/browse` or `/shop` with more than 24 products. The page said “Showing 1–24 of N” and did not pass `enableLoadMore`. `/popular` already did.
- **Impact:** Most of the catalogue was unreachable from the main shop routes.
- **Fix:** Enable load more on both routes. Browser check: load more on `/browse` advanced to page 2 and rendered additional products.

### 9. Customer-rating filter and rating sort ignore real reviews
- **Status:** Fixed
- **Location:** `src/modules/catalogue/service.ts`, `src/modules/catalogue/claims.ts`
- **Reproduce:** `resolveStorefrontRating` only accepts moderated `ProductReview` aggregates, but search never loaded them and then treated `ratingAverage` as 0. “4★ & above” returned nothing. Sort by rating did not change order. With a search query, rating sort was hard-coded to `published_at`, and rating/discount filters were skipped entirely.
- **Impact:** Rating and discount filters lied. “Top rated” and `/popular` were newest-first.
- **Fix:** Aggregate approved reviews before filtering and sorting, including the SQL search path. Discount filters apply in that query too. Homepage “Top rated picks” now links to `/browse?sort=rating`.

### 10. Sign-in drops the page the shopper was trying to reach
- **Status:** Fixed
- **Location:** `src/components/auth-form.tsx`, `src/app/login/page.tsx`, `src/lib/safe-path.ts`
- **Reproduce:** Add to cart or open checkout while signed out. The app sent people to `/login?next=/cart` or `/login?next=/checkout`, then always continued to `/account`.
- **Impact:** Guests lost their place after signing in, and Buy now could not complete.
- **Fix:** After login, follow a same-origin relative `next` path and reject protocol-relative or encoded open redirects. Browser check: `/login?next=/cart` with the seller account landed on `/cart`.

### 11. Customer registration always opens seller onboarding
- **Status:** Fixed
- **Location:** `src/components/auth-form.tsx`
- **Reproduce:** From Sign in, choose Register. The intent dropdown defaulted to Seller, and every successful registration redirected to `/seller/onboarding`, including Customer.
- **Impact:** Shoppers who create an account are dropped into seller KYC. The only register link in the storefront is on the login page; seller onboarding already has its own entry points.
- **Fix:** Default intent to Customer. Send seller intent to onboarding and everyone else to the account page (or a safe `next` path).

## Medium

### 12. Guest cart merge can exceed available stock
- **Status:** Fixed
- **Location:** `src/modules/cart/service.ts` (`mergeGuestCartIntoUser`)
- **Reproduce:** Put 5 units in a guest cart and 2 in a signed-in cart for a SKU with 3 available. Sign in. The merged line became 7 until checkout failed.
- **Impact:** The cart showed a quantity that could not be bought.
- **Fix:** Clamp the merged quantity to `onHand - reserved`. Drop the line when nothing is available.

### 13. Anyone signed in can review a product they never bought
- **Status:** Fixed
- **Location:** `src/modules/trust/service.ts` (`createProductReview`)
- **Reproduce:** `POST /api/trust/reviews` for any approved product. `orderId` was stored and not checked.
- **Impact:** Review queues and, after moderation, public ratings can be filled by people who never purchased.
- **Fix:** Require a paid order line for that product owned by the reviewer. An optional `orderId` must be one of those orders.

### 14. Anonymous analytics events can forge orders and sellers
- **Status:** Fixed
- **Location:** `src/app/api/analytics/events/route.ts`, `src/modules/analytics/service.ts`
- **Reproduce:** `POST /api/analytics/events` with `{ "eventName": "order_paid", "orderId": "<uuid>" }` and no session. The row was stored and could show up on dashboards.
- **Impact:** Metric pollution, including fake paid-order events.
- **Fix:** Accept only the public event names (`page_view`, `product_view`, `search`, `add_to_cart`, `checkout_start`, `seller_dashboard_view`). Do not persist client-supplied `orderId` or `sellerId`.

### 15. Duplicate checkout requests can both pass the idempotency check
- **Status:** Fixed
- **Location:** `src/platform/idempotency/store.ts`
- **Reproduce:** Send two parallel checkouts with the same idempotency key. Both could observe “no record”, and the loser hit a unique-constraint 503 instead of joining the first attempt.
- **Impact:** A double-submit could reserve stock twice or fail opaquely.
- **Fix:** On the unique-constraint race, re-read the row. Return the cached body when it finished, or 409 when it is still in progress.

### 16. Price, rating, and discount sorts only considered the first ~200 products
- **Status:** Fixed
- **Location:** `src/modules/catalogue/service.ts`
- **Reproduce:** Sort or filter by price, rating, or discount. The query loaded `min(200, pageSize * 8)` rows, then sorted in memory, so later products disappeared and `total` was capped.
- **Impact:** Shoppers could not page through a sorted catalogue once it grew past that window.
- **Fix:** Load the matching set, sort or filter, then page. Current seed is about 120 products. A much larger catalogue will use more memory on those sorts; that is a follow-up, not the previous silent truncation.

### 17. Wishlist control nested inside the product link
- **Status:** Fixed
- **Location:** `src/components/product-card.tsx`
- **Reproduce:** Activate the heart on a product card. It was a `<button>` inside `<a>`, which is invalid HTML and makes the accessible name and click target ambiguous.
- **Impact:** Assistive tech and some browsers treat the control incorrectly.
- **Fix:** The wishlist button is a sibling of the product link, positioned over the image.

### 18. Two elements used `id="content"`
- **Status:** Fixed
- **Location:** `src/app/layout.tsx`, `src/components/ui/page-shell.tsx`
- **Reproduce:** On shop and product pages, Skip to content targeted `#content`, but `PageShell` created a second element with the same id.
- **Impact:** The skip link’s destination was ambiguous.
- **Fix:** Keep a single `#content` on the layout wrapper and make it programmatically focusable.

### 19. Size chart link went nowhere
- **Status:** Fixed
- **Location:** `src/components/product-purchase-panel.tsx`
- **Reproduce:** On a product page, click Size Chart. `href="#size-chart"` matched no element.
- **Impact:** Dead control on every product that showed the link.
- **Fix:** The size selector is `#size-chart`. The link renders only when the product has multiple sizes.

### 20. Cart quantity field stayed on the typed value after the server responded
- **Status:** Fixed
- **Location:** `src/components/cart-panel.tsx`
- **Reproduce:** Blur a quantity above available stock. The input used `defaultValue`, so it kept the typed number after the cart state updated.
- **Impact:** The cart UI and the saved quantity disagreed.
- **Fix:** Remount the input when the server quantity changes.

### 21. Choosing a colour discarded the selected size
- **Status:** Fixed
- **Location:** `src/components/product-purchase-panel.tsx`
- **Reproduce:** On a colour × size product, pick a size, then pick a colour. The colour map stored one variant id per colour (the last one), so the selected SKU jumped to a different size.
- **Impact:** The shopper could add a different size than the one highlighted.
- **Fix:** Colour selection keeps the current size when that combination exists.

### 22. New accounts are marked email-verified immediately
- **Status:** Not fixed — needs an owner decision and a mailer. There is no verification token flow; clearing `emailVerifiedAt` without one would only change a timestamp nothing currently enforces.
- **Location:** `src/modules/identity/service.ts` (`registerUser`)
- **Reproduce:** Register any address. `emailVerifiedAt` is set in the same transaction.
- **Impact:** Any future feature that trusts `emailVerifiedAt` would treat unverified inboxes as verified.

## Low

### 23. Footer “Terms” opens the support page
- **Status:** Not fixed — there is no terms page or owner-approved legal copy. Pointing the link at a new empty page would invent policy text.
- **Location:** `src/components/site-chrome.tsx`
- **Reproduce:** Footer → Terms. The href is `/support`.
- **Impact:** Shoppers do not reach terms of use.

### 24. Homepage rails repeat tiles for the looping effect
- **Status:** Not fixed — the triple copy is what makes the rails loop. Hiding the extra copies from assistive tech is safe to do later; changing the motion in this pass risked the homepage animation.
- **Location:** `src/components/product-loop-rail.tsx`
- **Reproduce:** Move through Shop by category with a screen reader. Each tile is announced three times.
- **Impact:** Noisy, not a broken purchase path.

### 25. Mobile browse search has no visible submit button
- **Status:** Not fixed — low. The field submits on Enter. A button would be a small UX addition, not a broken search.
- **Location:** `src/components/catalogue-browse.tsx`
- **Reproduce:** On a narrow `/browse` viewport, type a query. There is no Search button beside the field.
- **Impact:** Shoppers who do not use the keyboard Enter key may not realise the field submits.

### 26. Content-Security-Policy still allows unsafe inline scripts
- **Status:** Not fixed — Next.js currently needs `'unsafe-inline'` and `'unsafe-eval'` in this app. Tightening the policy without a nonce/hash rollout can blank the storefront. Tracked as a launch item, not a one-line fix.
- **Location:** `next.config.ts`
- **Impact:** A successful XSS (such as bug 6, now fixed) would not be blocked by CSP.

### 27. README still says the public site is only the initial commit
- **Status:** Not fixed — documentation drift. Production is the stacked storefront branch, not `main`. Updating that sentence is an owner release note, not required for the fixes above.
- **Location:** `README.md`
- **Impact:** Someone following the README will think https://asperamarketplace.vercel.app is a 404.

## Checked and not reported as new defects

- Server prices are recomputed at checkout; a mismatched client total is rejected.
- Order, seller, admin, finance, and fulfilment routes check the signed-in actor. A non-admin seller opening `/admin/sellers` is sent to the account page.
- KYC upload reads stay under the storage root.
- Wishlist and privacy reads are scoped to the signed-in user.
- No live secrets are committed. `.env.example` has names only.
- Paise formatting divides by 100.
- Older production logs showed `carts.guest_token` missing on a deployment from before the guest-cart migration. That migration is in the current schema. It is an environment migration issue if an old database is still behind, not a bug in this tip.
