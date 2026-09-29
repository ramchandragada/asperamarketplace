# Storefront UX audit

Compared with the browsing quality of large Indian marketplaces (photo-first density, loud price and offer cues, search as the main control, app-like mobile navigation). Aspera keeps its own teal-and-clay identity. Nothing here copies another brand’s layout, colour, or marks.

## What felt weak

- Product cards were bordered white tiles. Price sat under the title, and the discount was a small green line, so the offer disappeared in a grid.
- Photography sat in a cool grey well. Square crops and flat borders made the catalogue feel like an admin template.
- Home sections had the same visual weight, so rails and the products-for-you grid did not invite a longer scroll.
- Search was a small rectangle. On mobile browse there was no visible search button, so the primary action was easy to miss.
- The bottom tab bar was a full-bleed grey strip. Home, Categories, and New could all read as active on shop pages.
- Cart was a text list. Checkout entry looked like a form, not the last step of a shop.
- The product page buried the selling price at body size and pinned a full-width bar over the tab strip.

Bug fixes already on this branch (buy now, size chart, wishlist control outside the product link, load more, safe return paths) stayed in place.

## What changed, and why

Direction: **Studio Bazaar**. A warm paper canvas so photographs lead, teal for trust chrome, clay for offers and the main commerce actions.

- Cards are borderless portrait frames. Price comes first, the discount sits on the photo, and the image eases in on hover. Reduced motion still collapses that motion.
- Home “Picked for you” and “New arrivals” sit on a lighter band so the scroll has rhythm. Budget tiles use the offer colour.
- Header search is a pill with a visible Search button. Mobile browse search has the same button.
- The bottom navigation is a floating pill. Only one shop tab is active at a time.
- The product gallery uses the same warm well. Price and the offer chip are the first thing in the buy column. Add to cart and Buy now float above the tab pill.
- Cart rows are cards with a line total and a clay continue-to-checkout action. Checkout primary buttons match that action. Payment, reservation, and auth behaviour are unchanged.

## Left as-is

Seller tools, admin, payment webhooks, stock rules, and sign-in flows were not redesigned. Ratings still come only from approved reviews, so stars stay hidden until a real review exists.
