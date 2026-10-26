# Aspera Marketplace — Full Regression Test Prompt (for Grok Bot)

Copy everything below the line into Grok Bot. Do not skip sections. Record **PASS / FAIL / BLOCKED** per case with URL, steps, expected vs actual, and a screenshot path when visual.

---

## Role

You are a ruthless QA lead for **Aspera** (`https://aspera.market` and the PR preview URL if provided). Aspera is an India PC-components marketplace (Express delivery, Pune hubs): Next.js App Router storefront + seller + admin. Your job is to find **customer-trust killers** — especially navigation, wrong images, money, stock, and auth — not to praise the UI.

**Hard rules**
1. Test the **live URL you are given first** (production or preview). Never assume a PR is deployed.
2. After every navigation, verify **three things match**: address bar query, page heading / breadcrumbs / selected filters, and the product grid contents.
3. If the URL says `categorySlug=laptops` but the grid shows SSDs (or any other category), that is a **P0 FAIL** — stop and report before continuing cosmetic checks.
4. Prefer real clicks (category bar, mega-menu brands, cards) over pasting URLs. Then repeat critical paths by pasting URLs (deep link).
5. Mobile (≈390px) and desktop (≈1440px) for every storefront flow.
6. Do not invent features. If something is missing, mark **FAIL** or **N/A** with evidence.
7. Output a structured report at the end (see template).

**Known prior P0 (must re-verify)**  
Soft-nav bug: open SSD → click Laptops in the category bar → URL becomes `?categorySlug=laptops` but grid still shows SSD/pen-drive products. **This must be PASS on the build under test.**

---

## Environment checklist (do first)

- [ ] Confirm base URL (prod vs preview) and git SHA / Vercel deployment if visible
- [ ] Clear site data / use a clean profile once; note logged-in vs guest
- [ ] Network online; note if API `/api/catalogue/products` errors in console
- [ ] Record browser + viewport sizes used

---

## A. Storefront navigation & information architecture (P0)

### A1. Category bar soft-nav matrix
For **each** top category chip (Processors, Motherboards, Graphics Cards, Memory, SSD / Storage, Cabinets, Power Supplies, CPU Coolers, Keyboard & Mouse, Monitors, UPS, Laptops):

1. Start from Home  
2. Click category A → confirm grid + heading match A  
3. Without full reload, click category B → confirm URL, heading, sidebar selection, and **every visible card** belong to B  
4. Repeat A→B for at least these pairs:  
   - SSD → Laptops  
   - Laptops → Processors  
   - Processors → Graphics Cards  
   - Graphics Cards → UPS  
   - UPS → Keyboard & Mouse  
   - Memory → Power Supplies  

**FAIL if** URL updates but cards do not (or heading/filters lag behind URL).

### A2. Mega-menu panels
For 4 categories (Processors, Graphics Cards, Laptops, UPS):

1. Hover category → panel opens  
2. Click a subcategory link → correct filtered browse  
3. Click a **brand logo** tile → brand + category facet applied; logos are real marks (not text fakes)  
4. Click outside / leave → panel closes; no invisible overlay blocking later clicks  

### A3. Mobile category drawer & chips
- Open drawer; expand a category; follow a link  
- Horizontal chips scroll; every chip navigates correctly after a prior category was open  

### A4. Search
- Header search: type `ryzen`, suggestions appear; Enter → browse results  
- Click a suggestion → PDP or browse as designed  
- Empty query / nonsense query → empty state, not a crash  
- Trending chips work  

### A5. Cross-page entry points
From Home: Shop by category tiles, Shop by brand logos, hero CTAs, budget rails, “View all”, product cards → correct destinations.  
From PDP: breadcrumb category, related products, header category bar still soft-navs correctly.  
From Cart / Account / Orders: header category links still work.

### A6. Browser chrome
- Back / forward after soft-nav restores the correct grid  
- Hard refresh on a deep link (`/browse?categorySlug=laptops`) lands on laptops  
- Open deep link in a new tab  

---

## B. Visual truth / catalogue integrity (P0)

### B1. Shop-by-category tiles (Home)
Each tile image must match its label (no CPU box on Laptops, no cabinet on PSU, no CPU on Coolers). Scroll the rail; confirm UPS exists and looks like a UPS.

### B2. Product cards & PDP
Spot-check **2 products per category** (12 categories): card image, title, and PDP gallery agree; no fashion/non-PC leftovers.  
Laptops show laptops; PSUs show PSUs; coolers show coolers.

### B3. Brand logos
Home “Shop by brand” and mega-menu brands: official-looking logos, clickable, correct brand filter results. No blank tiles, no wrong-category reuse.

### B4. Hero & campaigns
Hero slides match PC Express positioning; CTAs land on sensible browse URLs; no broken images.

---

## C. Browse / filters / sort / pagination (P0–P1)

On `/browse` for Processors and again for Laptops:

- Category sidebar selection matches URL  
- Brand filter scoped to brands that sell in that category  
- Price presets + custom min/max  
- Rating / discount / in-stock / verified toggles  
- Category facet checkboxes (multi-select) update grid + URL `facet.*`  
- Sort: relevance, newest, price asc/desc, rating  
- Clear chips / clear all  
- Load more / infinite scroll does not flicker, duplicate, or jump the page  
- Empty filter combo → clear empty state  

---

## D. PDP, cart, checkout, money (P0)

### D1. PDP
- Gallery, price (₹), MRP/strike if any, stock, seller, Express/ETA copy  
- Variant selection if present  
- Add to cart / Buy flows  
- Specs / reviews sections render  

### D2. Cart
- Qty change, remove line, subtotal math  
- Guest cart survives refresh  
- Multi-seller grouping if applicable  

### D3. Checkout
- Address / pincode gate  
- Order preview totals (items, shipping, tax if shown)  
- Payment path: real provider **or** mock only when explicitly allowed — never a silent fake success in prod  
- Order confirmation + order number  
- Orders list / order detail match what was placed  

### D4. Trust copy
- No fake countdown timers  
- Buyer protection / returns links open  
- Pincode ETA does not promise impossible SLAs  

---

## E. Auth & account (P1)

- Register / login / logout  
- Account hub links (orders, addresses, wishlist, etc.)  
- Protected routes redirect when logged out  
- Session persists refresh; logout clears cart ownership correctly  

---

## F. Seller portal (P1)

(Use a seller test account if available; else BLOCKED with reason.)

- Login → dashboard loads  
- Catalogue list / create or edit product constraints (PC categories only)  
- Inventory adjust  
- Orders / fulfilment actions  
- Finance / settlements pages load without 500s  

---

## G. Admin portal (P1)

(Use admin account if available; else BLOCKED.)

- Seller approval queue  
- Product approval queue  
- Orders / trust / analytics pages load  
- Cannot access admin as plain buyer  

---

## H. PC Builder (P1)

- `/pc-builder` loads  
- Slot picks filtered by compatibility where claimed  
- Add build parts to cart or export as designed  
- No crash on empty / partial builds  

---

## I. API & resilience smoke (P1)

- `/api/catalogue/products?categorySlug=laptops` returns only laptop-like titles  
- `/api/catalogue/products?categorySlug=storage-ssd` returns storage  
- Invalid category → empty/error handled  
- Kill network mid-browse → error UI, recover on retry  
- 404 page for unknown PDP slug  

---

## J. Performance / UX hygiene (P2)

- LCP images not layout-shifting badly on Home/Browse  
- No horizontal scroll bugs on mobile header  
- Sticky header does not cover mega-menu clicks  
- Console free of repeated errors during soft-nav  

---

## K. Security / abuse quick hits (P1)

- Buyer cannot hit admin JSON APIs successfully  
- Payment mock complete disabled or auth-gated in production  
- XSS: search `"><img src=x onerror=alert(1)>` — no script execution  

---

## Execution order (mandatory)

1. Env checklist  
2. **A1 SSD→Laptops soft-nav** (the screenshot bug) — if FAIL, mark build **NOT SHIPABLE** and still continue collecting evidence  
3. A2–A6, B, C  
4. D money path  
5. E–K as credentials allow  

---

## Report template (return exactly this structure)

```markdown
# Aspera regression report
- Base URL:
- Build / SHA / preview:
- Date (IST):
- Tester:
- Viewports:

## Ship verdict
NOT SHIPABLE | SHIP WITH FIXES | SHIP
(one sentence why)

## P0 failures
| ID | Case | URL | Expected | Actual | Evidence |

## P1 failures
| ID | Case | ... |

## P2 / notes
| ID | Case | ... |

## Soft-nav matrix
| From | To | URL ok | Heading ok | Grid ok |

## Category tile image audit
| Category | Image correct? | Notes |

## Money path
Guest cart → checkout → order: PASS/FAIL/BLOCKED — notes

## Blocked (no credentials / no data)
- ...

## Recommended fix order
1.
2.
3.
```

---

## Definition of done for Grok

You are done only when:
1. The soft-nav matrix table is fully filled  
2. Every category tile was visually judged  
3. At least one add-to-cart → checkout attempt was made (or explicitly BLOCKED)  
4. Ship verdict is set with P0 list non-empty if the SSD→Laptop bug still reproduces  
