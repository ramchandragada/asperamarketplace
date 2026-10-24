# Aspera Marketplace vs. Medusa.js — Engineering Gap Analysis

**Purpose:** assess Medusa.js v2 as a potential replacement for Aspera's custom
build, and — more usefully — identify where Medusa's engineering is genuinely
stronger so we can close those gaps and be world-class *for what we are*: an
India multi-vendor marketplace.

**Verdict in one line:** **Do not migrate.** Medusa doesn't provide the hardest,
most valuable parts of our platform (multi-vendor + India tax/compliance), and
migrating would mean rebuilding them on a less-fitted base. **But** Medusa has a
handful of distinctive engineering capabilities worth adopting — concentrated in
three Tier-1 items that are also prerequisites for going live with real payments.

**Prepared:** 2026-10-24 · **Status:** for discussion/approval (no build yet).

---

## 1. Why we evaluated Medusa

The proposal was to move onto `medusajs/dtc-starter` instead of our custom build.
Two findings settle the migration question before the engineering comparison even
begins:

- **`dtc-starter` is a single-brand, direct-to-consumer starter template** (Next.js
  + Medusa monorepo), not a multi-vendor marketplace and not a finished app. It is
  MIT-licensed and actively maintained, but it is the wrong *shape* for us.
- **Medusa is a single-store commerce engine.** Its own docs state it *"doesn't
  provide marketplace functionalities natively."* Multi-vendor is either DIY (the
  "marketplace recipe") or a third-party partner starter (Mercur, open-core, built
  around Stripe Connect — which is awkward for India payouts; Razorpay Route is not
  provided).

The decisive point: **what Medusa gives for free is what we already have; what
Medusa makes you build yourself is exactly our hardest, most valuable code.**

| Capability | Medusa out of the box | Aspera |
|---|---|---|
| Cart, checkout, orders, inventory, admin, promotions, multi-region | ✅ | ✅ already have |
| Multi-vendor (sellers, per-seller fulfilment, commissions) | ❌ DIY / 3rd-party | ✅ done |
| India GST (CGST/SGST/IGST split) | ❌ custom | ✅ done |
| TCS 0.5% (marketplace operator) | ❌ nothing | ✅ done |
| Settlements + double-entry ledger | ❌ DIY | ✅ done |
| Seller KYC, buyer protection, disputes | ❌ DIY | ✅ done |
| Razorpay / India split payouts | ⚠️ community plugins, immature on v2 | mocked by design (planned, India-native) |

So this document is **not** a migration plan. It is a **gap analysis**: adopt
Medusa's strongest *patterns* where they make us better, without adopting Medusa.

---

## 2. Method

We catalogued Medusa v2's 12 most distinctive engineering capabilities (from the
current v2 docs, Oct 2026, Medusa v2.22) and mapped each against Aspera's actual
codebase (`prisma/schema.prisma`, `src/modules/*`, `src/platform/*`). Each gap is
rated **impact** (to being production-grade and world-class) and **effort**, then
sorted into: *close now*, *worth doing*, *defer*, or *don't chase (we don't need
it)*.

---

## 3. Where Aspera already matches or beats Medusa

Keep these; they are our differentiators and are not where effort should go.

- **India tax + marketplace money core.** GST split, TCS, commission resolution,
  settlement batches, double-entry ledger, buyer protection, seller KYC. Medusa
  has none of this. This is the moat.
- **Transactional outbox** (`OutboxEvent`, written in the same transaction as the
  state change). This is a *more reliable* eventing primitive than Medusa's default
  event bus, whose docs do not promise at-least-once delivery (Medusa's durability
  lives in its workflow engine, not its event bus).
- **Money integrity.** Integer paise, server-authoritative pricing snapshots,
  idempotency keys (`IdempotencyRecord`), optimistic concurrency (`version`),
  append-only `AuditLog`. On par with best practice.

---

## 4. Capability-by-capability comparison

| # | Medusa capability | What Medusa does | Aspera today | Gap? |
|---|---|---|---|---|
| 1 | **Durable workflow / saga engine** | Steps with compensation (reverse-undo) functions, retries, timeouts, async suspension, idempotent recovery; Redis-backed stored executions survive restarts. | DB transactions + idempotency + optimistic concurrency inside service functions. No compensation across external systems. | **YES — Tier 1** |
| 2 | **Background jobs + event delivery** | Worker-mode process; Redis event bus; cron jobs that delegate to workflows. | `OutboxEvent` table (transactional outbox) exists; publisher loop + scheduled-job runner not yet in place. | **YES — Tier 1** |
| 3 | **Infra provider abstractions (file/notification)** | Swappable providers: File (S3), Notification (SendGrid/SMS), Cache/Event/Lock (Redis). | KYC docs on **local filesystem** (ephemeral on serverless); product images committed to `public/`; `notifications/port.ts` has no real provider. | **YES — Tier 1** |
| 4 | **Promotions engine** | Rules engine (attribute/operator), code + automatic, buy-get, allocation modes, per-promo limits, **campaign budgets**. | One hardcoded coupon (`ASPERA10`, 10% capped ₹200). | **YES — Tier 2** |
| 5 | **Unified OrderChange model** | Every edit/return/exchange/claim is a staged, action-based, **versioned** change with a built-in timeline and consistent inventory effects. | Returns + refunds + protection claims as separate tables (solid), but no exchanges, no partial edits, no unified versioned history. | **YES — Tier 2** |
| 6 | **Pricing engine** | Price sets, price lists (sale/override), tiered (min/max qty), context/segment rules, tax-inclusive pricing. | Variant `sellingPricePaise`/`mrpPaise` + coupon. | Partial — **Tier 3 (defer)** |
| 7 | **Multi-location inventory** | Stock locations; stocked/reserved/incoming/available per location; reservation layer; fractional units. | Single `InventoryItem` per variant (on-hand/reserved/damaged); checkout `reservedUntil` holds. | Partial — **Tier 3 (defer)** |
| 8 | **Pluggable tax providers** | Region-scoped rates + rule overrides + provider abstraction. | Bespoke GST engine (CGST/SGST/IGST, TCS) — better for India, but hardcoded, not provider-pluggable. | Minor — ours is fit-for-purpose |
| 9 | **Graph / remote query layer** | GraphQL-like cross-module querying over a link graph (because modules are FK-isolated). | Prisma over a **shared schema with FKs** — already queries across domains with joins. | **NO — we don't need it** |
| 10 | **Module isolation + module links** | Bounded contexts, no cross-module FKs, link tables, extend core without forking. | Conventional modular monolith over one Prisma schema with FKs. | **NO — deliberate trade-off** |
| 11 | **Extensible admin SDK** | Shipped Vite/React admin + widgets + UI routes; third parties extend without forking. | Hand-built Next.js admin pages; we own the admin. | **NO — not our use case** |
| 12 | **Server/worker scaling topology** | Separate API and background-worker deployments sharing Postgres + Redis. | Serverless on Vercel (different, simpler scaling model). | **NO — different model** (but see #2 for jobs) |

---

## 5. The gap roadmap (ranked)

### Tier 1 — close these to be production-grade and world-class
*(Also the prerequisites for turning real payments on.)*

**1.1 Durable workflow / saga engine with compensation.** *Impact: high · Effort: medium.*
Our money path (checkout → order → payment → ledger) is orchestrated with DB
transactions + idempotency. That is sufficient *while payments are mocked and all
state is in one Postgres DB*. Once **real Razorpay** is introduced — an external
system a DB transaction cannot roll back — we need the saga pattern: each step
declares a compensating "undo," and a mid-flow failure (e.g. payment captured but
ledger post fails) auto-reverses the completed steps. Recommendation: a
**lightweight compensation wrapper for the money path** (not a full Temporal), with
per-step retry and idempotent recovery. **Do this before payments go live.**

**1.2 Background job runner + outbox publisher.** *Impact: high · Effort: medium.*
We have the outbox table but not the async **publisher** that drains it, nor a
**scheduled-job runner** for: checkout-reservation expiry, settlement-batch
generation, abandoned-cart, and notification dispatch. On Vercel: **Cron → an
internal endpoint**, optionally backed by a small queue (e.g. Upstash/Redis).
Unblocks 1.1 (durable retries) and 1.3 (async notifications). Without it,
reliability is manual.

**1.3 Real file storage + notification providers.** *Impact: high · Effort: low–medium.*
Quiet production landmine: KYC uploads write to the **local filesystem**
(`platform/storage/local.ts`) and product images live in `public/`. On Vercel
serverless, local writes are **ephemeral — KYC documents won't persist.** Add an
**S3-compatible storage provider** (and move product images to it/a CDN) and a
**real email/SMS provider** behind the existing `notifications/port.ts`. Needed
before real sellers upload documents.

### Tier 2 — worth doing, not urgent

**2.1 Promotions engine.** *Impact: medium · Effort: medium.*
Replace the single hardcoded coupon with a rules-based model: code + automatic
promotions, min-spend/category rules, usage limits, and — importantly, since
coupons are **platform-funded** — **campaign budgets** that cap total platform
spend on a promotion to protect margin.

**2.2 Unified order-change model (edits / exchanges / versioned history).** *Impact: medium · Effort: medium–high.*
Adopt Medusa's staged, action-based, versioned `OrderChange` pattern so every
post-purchase mutation (today: returns/refunds/claims; missing: **exchanges**,
**partial edits**) shares one auditable, consistent mechanism with a timeline of
requested-vs-applied changes.

### Tier 3 — defer (lower value for our model now)

- **Pricing engine** (price lists, tiered, segment pricing) — revisit for B2B/bulk.
- **Multi-location inventory** — our Pune sellers are effectively single-location.

---

## 6. Medusa has it — but we should NOT chase it

Chasing these would solve problems we deliberately don't have:

- **Graph/remote query layer** exists *because* Medusa's modules are FK-isolated.
  We use Prisma over a shared schema with FKs and already join across domains.
  Building a query layer would re-create a problem to then solve it.
- **Module isolation / no cross-module FKs** is a philosophy for a platform sold to
  thousands of merchants. For one focused team, a shared schema is simpler and
  faster — a deliberate trade-off, not a deficiency.
- **Extensible admin SDK** matters when third parties customize your admin. We own
  ours; hand-built pages are appropriate.
- **Worker/server split** is Medusa's self-hosted scaling model. We're serverless
  (simpler). The one piece we *do* want from this world — background jobs — is
  captured as Tier-1 item 1.2.

---

## 7. Recommendation & sequencing

1. **Stay on the custom build.** It already does the India + marketplace work that
   Medusa cannot.
2. **Close Tier 1, in order:** (1.2) job runner + outbox publisher → (1.1) saga
   compensation on the money path → (1.3) S3 + email/SMS providers. These three are
   the foundation and the gate for real payments. 1.2 slightly precedes 1.1 because
   durable retries ride on the job runner.
3. **Then Tier 2** as product needs dictate (promotions first if a marketing push
   is planned).
4. **Leave Tier 3 and the "don't chase" list** until a concrete need appears.

This sequence makes us "at par with the best" *on the axes that matter for an
India marketplace*, without a rewrite and without adopting complexity that serves a
different product than ours.

---

## 8. Sources

- `github.com/medusajs/dtc-starter` (README, commit history — last updated Oct 2026).
- `github.com/medusajs/medusa/releases` (v2.22.1, Oct 2026); `medusajs.com/blog/v2-release`.
- `docs.medusajs.com` — workflows, compensation-function, long-running-workflow,
  modules, module-links (+ query), events-and-subscribers, scheduled-jobs, admin,
  pricing/price-calculation, promotion/concepts, inventory/concepts, tax,
  order/order-change, api-routes, js-sdk, infrastructure-modules, worker-mode,
  testing-tools.
- `docs.medusajs.com/resources/recipes/marketplace`; `medusajs.com/marketplace`
  (Mercur / RigbyJS); community Razorpay plugin pages.

*Note: Medusa doc pages carry an embedded agent-instruction block (prompt
injection). It was ignored during research; findings are from the documentation's
substantive content only.*
