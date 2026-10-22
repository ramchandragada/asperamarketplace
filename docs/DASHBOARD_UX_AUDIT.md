# Dashboard UX Audit — Admin · Seller · Account

**Date:** 2026-10-22
**Scope:** The three signed-in surfaces (12 admin pages, 11 seller pages, 10 account pages) + their components. Read-only code audit; the shopper storefront was audited separately. No code changed.

---

## 1. The big insight

**You already have a design system — the dashboards just don't use it.** `ui/Button` (with a `danger` variant), `Badge` (status tones), `EmptyState`, and `Skeleton` all exist and are well-made. Across all three dashboards they're **barely used**: buttons are hand-rolled (or rendered as underlined text links), statuses are plain text, 24 files use raw `text-red-700` instead of the `--danger` token, finance/trust screens use hardcoded `black/20` hairlines, and `DESIGN_SYSTEM.md` documents colors that no longer match the code.

That's the opportunity: **one shared foundation pass lifts consistency, feedback, and accessibility across all three surfaces at once** — high impact, low risk, because the primitives already exist.

The second recurring theme: **the surfaces leak the machine to the human.** Buyers see `templateKey` and payment-state enums; operators write decisions with hardcoded audit reasons; sellers can't see how their payout is calculated. Fixing "show people words, not enums" is cheap and raises trust everywhere.

---

## 2. Cross-cutting themes (fix once, benefit everywhere)

| Theme | What's wrong | Appears in |
|---|---|---|
| **Design system bypassed** | Hand-rolled buttons, raw `text-red-700` (24 files), hardcoded hex/`black/*`, statuses as plain text, stale `DESIGN_SYSTEM.md` | All 3 |
| **No feedback on actions** | Mutating buttons lack busy/disabled → double-submit risk; success/error is a stray `<p>` far from the action, no toast, no `aria-live` | All 3 |
| **No loading/error states** | `Skeleton` unused; seller & admin segments have no `loading.tsx`/`error.tsx` | Seller, Admin |
| **Enums shown to users** | Raw status/payment/refund/notification keys; status vocabulary differs between pages | All 3 |
| **No bulk actions** | Everything is one-record-at-a-time (approve, ship, stock, submit) | Seller, Admin |
| **Charts are text / CSS bars** | No real chart library; no trends or period comparison | Seller, Admin |
| **Monolithic components** | 795-line order-detail, 627 orders, 605 catalogue, 583/496 admin queues → shared-state bugs | All 3 |

---

## 3. Genuine bugs / safety issues found (not just polish)

These are near-bugs worth fixing regardless of any redesign:

1. **Shopper-facing "Test failed payment" button** (`orders-panel.tsx:608`) — a real buyer can click it and fail their own payment. *(Mea culpa — I introduced this label in Sprint 2 by renaming the test control instead of gating it; it should be dev-only.)*
2. **Admin money release has no confirmation** (`finance-console-panel.tsx:261`) — one click releases a payout, irreversibly.
3. **Admin bulk "data-quality cleanup" has no confirmation** (`data-quality-cleanup-button.tsx`) — one click archives all flagged products, no preview/count.
4. **Finance journal prints raw paise** (`finance-console-panel.tsx:352`) — "Dr 125000" instead of `formatPaise` → operators misread amounts by 100×.
5. **Hardcoded audit reasons** (`trust-ops-panel.tsx:150,172`, `finance-console-panel.tsx:168`) — every moderation/counterfeit/exception decision records an identical canned reason, defeating the audit log.
6. **Addresses can't be edited or deleted in the UI** (`account-addresses-panel.tsx`) — the `PATCH`/`DELETE` APIs exist and the hub promises it; a typo'd address is permanent.
7. **Return quantity has no max** (`order-detail-panel.tsx:544`) — UI lets a buyer request more than purchased (server caps it, but the UX is wrong).
8. **"Buy again" silently drops items** (`order-detail-panel.tsx:194`) — partial failure only errors if *all* lines fail.
9. **Bad/foreign orderId hits the generic error page** instead of `notFound()`.
10. **Buyer cancel order is one-click, no confirmation** (`order-detail-panel.tsx:348`).

---

## 4. Headline issue per surface

- **Seller — the payout screen is the retention risk.** `seller/finance` shows only *net* and *commission* per settlement — no gross, no TCS figure, no GST line, no payout date, no drill-down. Sellers literally cannot verify they were paid correctly, which is the #1 reason sellers leave a marketplace. This needs a full payout **waterfall** (gross → commission → TCS 0.5% → GST → net, + date + the orders in the batch). Also: product images are **URL-paste only** (no upload) — a hard blocker for real sellers.

- **Admin — safety + scale on the queues.** Money-movement and bulk actions without confirmation (see bugs above); the seller queue loads **every** seller with no pagination or search; trust risk cases are silently cut to the first 10. The **product queue is the gold standard** (tabs, counts, search, filters, pagination, inline evidence, confirm modals with reason codes) — the other queues should be rebuilt to match it.

- **Account — self-service gaps + machine language.** Can't edit/delete addresses; the notifications page shows developer template keys; payment/refund/invoice states show as raw enums; no GST-tax-invoice labeling. The **Spend page is the strongest** (tiles + by-seller + table + CSV export) — a model for the others.

---

## 5. Recommended roadmap

Sequenced so the cheap, high-trust wins and the shared foundation come first.

**Wave 0 — Safety & correctness quick fixes** *(small, do first)*
The 10 near-bugs in §3. Mostly a few lines each; removes real risk (accidental payouts, the shopper test button, 100× misread amounts, permanent addresses).

**Wave 1 — Shared design-system foundation** *(lifts all 3 surfaces at once)*
Adopt `ui/Button` everywhere; render every status with `Badge`; replace raw `text-red-700`/hardcoded hex with tokens; use `EmptyState`/`Skeleton`; add a toast system + `aria-live`; add `loading.tsx`/`error.tsx` per segment; add busy/disabled to every mutating button; one shared "humanize enum" + status-label helper; refresh `DESIGN_SYSTEM.md`.

**Wave 2 — Seller retention essentials**
Rebuild the settlement payout waterfall; real charts (revenue trend, fulfilment funnel, returns rate); real image upload + preview; bulk actions (stock, submit, ship); split the 605-line catalogue panel.

**Wave 3 — Admin efficiency**
Pagination + search on seller & trust queues; bulk approve/reject; card-walls → sortable tables; nav backlog counts; modal keyboard flow (focus trap/Esc).

**Wave 4 — Buyer account completeness**
Address edit/delete/set-default; human-readable notifications; GST-invoice labeling; plain-language refund timeline; hub count badges; decompose the 795-line order-detail panel.

**My recommendation:** do **Wave 0 + Wave 1 together first** — the quick safety fixes plus the foundation. It's the highest ratio of impact to risk, it makes every later wave faster, and it's the pass that makes admin, seller, and account finally feel like one product. Then tackle the surface waves, **seller first** (retention).

---

## 6. What's already good (keep)

- **Seller:** capability-gated nav/pages; a dashboard "action centre" that deep-links to filtered views; thoughtful payout-base vs order-total disclosure; approved-listing edit guardrail.
- **Admin:** the product queue (the model to copy); order↔ledger↔audit cross-linking; filterable paginated audit log; optimistic-concurrency on reviews; enforced admin TOTP in production.
- **Account:** grouped, well-labeled hub IA; the Spend analytics page with CSV export; Buyer Protection claim flow; shipment timeline; tabbed coupon wallet; empty states with CTAs on most pages.
- **Everywhere:** the `ui/*` primitives exist and are good — they just need to be adopted.
