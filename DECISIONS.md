# Decisions

Phase 0 decisions are about how the empty repository will be extended. They do not implement the marketplace.

## D-001 — Stay in this repository

Date: 2026-09-24  
Status: accepted

The local workspace is `ramchandragada/asperamarketplace` at commit `bff8c577c6b1348b4b9cd87bf47c073ea65068d6`. The working tree was clean. All future work continues here. A parallel demo app will not be generated.

## D-002 — Phase 0 is documentation only

Date: 2026-09-24  
Status: accepted

Phase 0 writes the audit, architecture proposal, plan, assumptions, risk register, and this decision log. It does not add Next.js, Prisma, a database, UI screens, or provider SDKs.

Prisma is the planned ORM for the first PostgreSQL migration. The audit found no database, so installing Prisma now would create a schema toolchain with nowhere to migrate. That install waits until Phase 1 has a non-production database and a committed migration checkpoint.

## D-003 — Modular monolith

Date: 2026-09-24  
Status: accepted

One Next.js application will own the domain modules. Money, inventory, and outbox writes share one PostgreSQL transaction. Microservices are deferred until a measured limit requires another process, and that process would still live in this repository.

## D-004 — Default stack, because no stack exists

Date: 2026-09-24  
Status: accepted as the Phase 1 target, not yet installed

The repository has no framework, ORM, or CSS system, so there is nothing sound to preserve. Phase 1 will introduce:

- Next.js App Router and TypeScript strict mode
- PostgreSQL and Prisma, when the database slice starts
- Zod for server-side validation
- Tailwind CSS and shadcn/ui
- React Hook Form on the first real form
- Recharts only when an internal analytics screen exists
- Ports for Redis, S3-compatible storage, payments, logistics, notifications, search, and OpenTelemetry

PostgreSQL full-text search is the first search implementation. A monorepo is not justified.

## D-005 — Vercel for the app, Railway later for data

Date: 2026-09-24  
Status: accepted as direction, not provisioned

The Vercel project `asperamarketplace` on team `ramchandragadas-projects` is already linked to this GitHub repository and has deployed `main`. That link stays. Application deploys come from Git, not from a local upload.

Railway has no project wiring in the repo and was not accessible from this session. PostgreSQL will be created only in a later slice, on a non-production instance first. Production credentials will exist only in host environment settings.

## D-006 — Empty production deploy is not a launch

Date: 2026-09-24  
Status: accepted

Deployment `dpl_DUinJHJE55SJ2CYBTkVF59xMfD98` is `READY` and serves no application. `https://asperamarketplace.vercel.app` returned HTTP 404 on 2026-09-24. `main` remains the production branch, so marketplace code merges there only after checks pass. Feature work uses a branch.

## D-007 — Commercial model stays configurable

Date: 2026-09-24  
Status: accepted

The platform is built as a facilitator. Seller-of-record, invoice issuer, inventory ownership, returns liability, and payment responsibility are versioned configuration. Phase 0 does not choose them. Open items are A-20 through A-28 in `ASSUMPTIONS.md`.

## D-008 — Mock providers before live money

Date: 2026-09-24  
Status: accepted

The first payment, logistics, email, SMS, and WhatsApp implementations are local mocks behind ports. Webhook authenticity is verified on the server. Card data is never stored. A live Razorpay account is out of scope until the payment-regulatory decision A-23 is closed.

## D-009 — No launch category yet

Date: 2026-09-24  
Status: accepted

Category, tax, commission, fulfilment, and returns policies are data. Seed data for a category waits until the business owner names the launch category (A-26). Phase 1 does not invent one.

## D-010 — Integer money and an append-only ledger

Date: 2026-09-24  
Status: accepted for the future ledger

Amounts are integer minor units. Posted journal lines are immutable and are corrected by compensating entries. Checkout persists a calculation snapshot so later policy edits cannot rewrite historical orders.

## D-011 — Server-enforced authorization

Date: 2026-09-24  
Status: accepted

Roles in the brief are enforced in policies on the server. Hiding a button is not authorization. Privileged mutations write an audit record with actor, time, target, before-state, after-state, reason, and correlation ID.

## D-012 — Baseline checks could not run

Date: 2026-09-24  
Status: accepted

No `package.json` existed at audit time, so typecheck, lint, test, and build scripts were undefined. The baseline is "not runnable", recorded in `IMPLEMENTATION_PLAN.md`. The Vercel build of `bff8c57` completed with an empty-output warning. That was the only build result available during Phase 0. Phase 1 slice 1 added the scripts and recorded a passing run.

## D-013 — Pin Node.js 24.21.0 and pnpm 10.33.3

Date: 2026-09-24  
Status: accepted

The Vercel project was already set to Node.js 24.x. Phase 1 pins the same major, specifically 24.21.0, in `.nvmrc`, `.node-version`, and `package.json` `engines`. The package manager is pnpm 10.33.3, recorded in `packageManager` and the lockfile. CI installs both. The Vercel Node setting was not edited, because it already matched and a setting change was not required for this slice.

## D-014 — Keep ESLint 9 with the Next.js config

Date: 2026-09-24  
Status: accepted

`eslint-config-next` 16.3.6 installed ESLint 9.39.5. npm reports that release as deprecated. The slice keeps the version the Next config installed. Moving to ESLint 10 is a separate change after that config supports it.

## D-015 — Prisma 6.16.2 and a local non-production Postgres

Date: 2026-09-24  
Status: accepted

Phase 1 slice 2 pins Prisma CLI and client to 6.16.2. Newer Prisma 7/8 pre-releases were rejected because the client and CLI must match and the release candidate pulled unrelated peer warnings.

A non-production PostgreSQL 16 database named `aspera_marketplace_dev` was created in this environment. `docker-compose.yml` provides the same database for machines with Docker. Railway remains the intended hosted path and is still not connected. No production database exists, and this migration was not applied to production.

## D-016 — Platform tables only in the first migration

Date: 2026-09-24  
Status: accepted

The first migration creates `audit_logs`, `idempotency_records`, `outbox_events`, `feature_flags`, and `platform_settings`. Domain tables for sellers, catalogue, orders, and money wait for the slice that implements them. A schema checkpoint was committed before `prisma migrate`.

## D-017 — First-party credential auth for Phase 2

Date: 2026-09-24  
Status: accepted

Phase 2 uses email/password accounts, bcrypt password hashes, and opaque httpOnly session cookies stored as SHA-256 hashes. This avoids blocking on an external identity provider while A-25 (data ownership / processors) remains open. A managed IdP such as Clerk can replace the credential store later behind the same session/actor boundary. Roles are enforced in server policies, not only in the UI.

## D-018 — Masked KYC identifiers and local document storage

Date: 2026-09-24  
Status: accepted

PAN and GSTIN are validated on input and stored only in masked form (`pan_last4`, `gstin_masked`). KYC files use a storage port with a local filesystem adapter under `uploads/kyc` (configurable via `DOCUMENT_STORAGE_PATH`). An S3-compatible adapter can replace the local adapter without changing seller services.


