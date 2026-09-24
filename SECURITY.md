# Security

This note covers Phases 1–2. It is not a completed security review.

## Secrets

The repository is public. `.env.example` lists variable names and descriptions. Live values stay in `.env.local` or the host's environment settings. Git ignores `.env*`, private keys, certificate bundles, service-account files, database dumps, and `/uploads`.

`DATABASE_URL` must stay in host environment settings or a gitignored `.env` file. Seed passwords are fictional and documented in `README.md`.

## Authentication

Phase 2 uses first-party sessions. Passwords are bcrypt-hashed. Session tokens are random and stored only as SHA-256 hashes. Cookies are httpOnly, SameSite=Lax, and Secure in production. Login attempts are logged without passwords. Admin and ownership checks run in server policies. There is no MFA yet.

## KYC documents

Uploads are limited to PDF/JPEG/PNG and 5 MB. Files are written under a configurable local root outside Git. Only masked PAN/GSTIN values are stored in PostgreSQL.

## Database

Platform and identity/seller migrations were applied only to non-production `aspera_marketplace_dev`. Production has no database. See `docs/MIGRATIONS.md`.

## Logs

Logs are single-line JSON with redaction for credentials, tokens, card-like numbers, and sensitive field names. Do not log request bodies until an explicit allow-list exists.

## HTTP

`next.config.ts` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and a locked-down `Permissions-Policy`. `X-Powered-By` is disabled. A content security policy is not configured yet. `src/proxy.ts` assigns the correlation id and does not authenticate.

## Production

Do not treat this branch as a production identity system. MFA, managed IdP, hosted object storage, and privacy workflows are still open.
