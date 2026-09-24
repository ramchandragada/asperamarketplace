# Architecture proposal

Status: the Phase 1 application shell is implemented. Domain modules, PostgreSQL, Prisma, and provider adapters remain proposed.

## System shape

Aspera Marketplace will be one modular monolith: a single Next.js application with explicit domain modules. Modules communicate through application services and an outbox table. They do not start as separate deployable services.

```text
Browser / seller app / admin
        |
        v
Next.js App Router  (Vercel)
  route handlers and server actions
  thin UI, no financial or authorization rules
        |
        v
Domain modules
  identity, catalogue, pricing, cart, orders,
  payments, inventory, tax, ledger, support, risk
        |
        +--> PostgreSQL (system of record, ledger, outbox)
        +--> object storage abstraction (KYC and product files)
        +--> provider ports
               payments, logistics, email, SMS, WhatsApp, search
```

Background work (outbox publish, reservation expiry, reconciliation, retention) runs as jobs in the same codebase. The first jobs can run on a scheduled Node entrypoint. A separate worker process is justified only when a job must outlive a web request. That worker stays in this repository.

## Why this shape

The repository has no stack, so the brief's default stack applies. A modular monolith keeps transactions around money and inventory in one database, which is required for atomic stock reservation, order creation, ledger posting, and outbox writes. Splitting those into microservices would add network failure between steps that must commit together.

PostgreSQL is the system of record. Redis, OpenSearch, and object storage are replaceable ports. Phase 1 search uses PostgreSQL. An OpenSearch adapter can be added later without changing catalogue ownership.

## Proposed runtime

| Concern | Choice | When it is introduced |
| --- | --- | --- |
| Application | Next.js App Router, TypeScript strict | Implemented in Phase 1 slice 1 |
| UI | Tailwind CSS and shadcn/ui | Tokens exist. Components arrive with real screens |
| Validation | Zod on every mutation, server-side | Envelope and public config exist. Mutations do not |
| Forms | React Hook Form | First authenticated form |
| Database | PostgreSQL | Phase 1, after a non-production database exists |
| ORM | Prisma | With the first migration, not before |
| Cache and queue port | Redis-compatible interface, in-memory adapter in development | When the first async job needs it |
| Files | S3-compatible port, local filesystem adapter in development | Seller KYC documents |
| Payments | Provider port, local mock first, Razorpay-compatible adapter later | Phase 5 |
| Logistics | Provider port, local mock | Phase 6 |
| Notifications | Email, SMS, WhatsApp, and in-app ports | Phase 5 transactional stubs |
| Search | PostgreSQL search first | Phase 3 |
| Analytics charts | Recharts inside admin and seller tools | Phase 9 |
| Observability | Structured logs and an OpenTelemetry-compatible port | JSON logs and redaction exist. Tracing waits for a collector |
| App hosting | Vercel project already linked to this repository | Existing |
| Data hosting | Railway PostgreSQL, separate per environment | When Phase 1 needs a database |

The repository pins Node.js 24.21.0 and pnpm 10.33.3. The Vercel project was already set to Node.js 24.x, so that project setting was not changed.

## Deployment split

Vercel builds the Next.js application from GitHub. Railway, when provisioned, holds PostgreSQL and any long-running worker. Secret values live only in the host's environment settings. The repository keeps names and descriptions in `.env.example`.

Environments are separate:

| Environment | Application | Database |
| --- | --- | --- |
| Development | Local Next.js | Local or personal Railway database |
| Preview | Vercel preview from the feature branch | Preview database, never production |
| Production | Vercel production from `main` | Production Railway database |

No environment exists beyond the empty Vercel production deployment today.

## Module boundaries

Each domain module owns its schema, Zod contracts, repository, policy, domain events, and tests. UI and route handlers call a module service. They do not calculate tax, price, stock, commission, or authorization.

Planned modules:

1. Identity and access
2. Customer profiles
3. Seller onboarding and KYC
4. Catalogue and product information
5. Search and discovery
6. Pricing and promotions
7. Cart and checkout
8. Orders and fulfilment
9. Payments and refunds
10. Inventory and reservations
11. Returns and disputes
12. Reviews and reputation
13. Commissions and settlements
14. Tax and invoicing
15. Notifications
16. Customer and seller support
17. Content and merchandising
18. Risk, fraud, and trust and safety
19. Analytics and reporting
20. Administration and audit
21. Feature flags and configuration
22. ONDC network adapter

The ONDC adapter is a port with no network calls until the company completes formal onboarding. Canonical seller, product, order, payment, and dispute models stay internal.

Suggested layout once Phase 1 starts:

```text
src/app/                      # routes and screens only
src/modules/<domain>/         # service, repository, schema, policy, events
src/platform/                 # config, db, errors, logging, outbox, idempotency
prisma/                       # schema and migrations, added with the first database
```

## Request and command rules

Mutations return:

- `data`
- `error`
- `code`
- `message`
- `fieldErrors`
- `requestId`

Commands that move money, stock, or order state require an idempotency key. The server loads price, tax, discount, stock, role, and seller from the database. Browser-supplied totals are display hints and are rejected when they disagree with the server snapshot.

Privileged actions write an audit record in the same transaction: actor, timestamp, target, before-state, after-state, reason, and correlation ID.

## Money and inventory

Order checkout writes, in one database transaction:

- a price and tax calculation snapshot
- stock reservations
- the order and per-seller fulfilment groups
- the payment attempt reference
- the outbox event

Payment success is accepted only after server-side verification of the provider payload. A browser redirect never posts the ledger.

The ledger is double-entry and append-only. A posted journal entry is reversed by a compensating entry. Minimum accounts:

- customer collection
- seller payable
- commission revenue
- shipping revenue and shipping payable
- tax collected
- refund liability
- promotional subsidy
- payment processing fee
- chargeback exposure
- settlement adjustment

TCS and GST treatment are configuration records with an explanation trace. They are not constants in code. Settlement release checks KYC, risk holds, refund exposure, and the configured release rule before any payout instruction.

Inventory quantities are derived from stock movements: available, reserved, damaged, returned, quarantined, and sellable. Reservation expiry and restock are movements, not silent updates.

## Order model

A checkout creates one parent order and one fulfilment group per seller. Partial cancellation, partial shipment, partial return, and partial refund are first-class. Order and inventory transitions live in explicit tables of allowed edges, actor permissions, and required reasons.

## Trust boundaries

| Boundary | Rule |
| --- | --- |
| Browser | Untrusted for price, tax, stock, role, seller, and totals |
| Payment provider | Untrusted until signature, timestamp, and replay checks pass |
| Seller uploads | Stored through the file port, scanned and access-controlled, never executed |
| Admin UI | Hidden controls are not authorization. Policies run on the server |
| ONDC | A future adapter. It does not own internal records |
| Logs | No passwords, tokens, card data, or raw KYC document bytes |

## Data model standard

Identifiers are UUIDs. Timestamps are stored in UTC. Soft delete is used where a regulator, dispute, or ledger may need the row. Financial, stock-movement, invoice-version, payment-event, and audit rows are immutable. Optimistic concurrency uses a version column on carts, inventory balances, and orders.

The physical schema is introduced by vertical slice. Phase 0 does not create tables. The first migration will be preceded by a committed schema checkpoint in Git, which is the only backup available until a database exists.

## What this proposal deliberately leaves open

Seller-of-record, invoice issuer, inventory ownership, foreign-investment status, TCS applicability, and Section 9(5) treatment are configuration and legal decisions. The architecture stores them as versioned policy. It does not pick a production answer. See `ASSUMPTIONS.md` and `DECISIONS.md`.
