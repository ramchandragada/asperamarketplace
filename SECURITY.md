# Security

Covers engineering through Phase 10. This is not a completed external security audit and does not authorize production launch while A-20–A-28 remain open.

## Secrets

The repository is public. `.env.example` lists variable names and descriptions. Live values stay in `.env.local` or host environment settings. Git ignores `.env*`, private keys, certificate bundles, service-account files, database dumps, and `/uploads`.

`DATABASE_URL` and `MOCK_PAYMENT_WEBHOOK_SECRET` must stay out of Git. Seed passwords are fictional and documented in `README.md`.

## Authentication and authorization

First-party sessions: bcrypt passwords, SHA-256 session hashes, httpOnly cookies (Secure in production). Admin and seller ownership checks run in server policies (`src/modules/identity/policy.ts`). MFA and managed IdP remain open.

## Money, stock, and webhooks

Browser-supplied totals are rejected on mismatch. Inventory mutations write stock movements. Mock payment webhooks require HMAC signatures and reject replays. Ledger posts are server-side only.

## Uploads

KYC uploads limited to PDF/JPEG/PNG and size-capped; stored via local filesystem port. Production needs object storage.

## HTTP headers

`next.config.ts` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and a draft `Content-Security-Policy` (still allows `'unsafe-inline'` / `'unsafe-eval'` for Next.js). `X-Powered-By` is disabled.

## Database

Migrations apply to non-production Postgres (local and shared Neon). Do not migrate a true production credential set until A-06 separation and the launch checklist blockers clear. See `docs/MIGRATIONS.md` and `docs/LAUNCH_CHECKLIST.md`.

## Logs and observability

Stdout JSON logs with redaction for credentials, tokens, and sensitive field names. Hosted metrics/traces are not configured yet.

## Trust and privacy ops

Risk, counterfeit, review moderation, privacy requests, and compliance evidence are operational queues. They do not replace counsel for DPDP or category licences.

## Production stance

Do not treat preview or Neon shared URLs as production-hardened. Live payments, real PII, and public launch require closed legal assumptions and a separate production environment.
