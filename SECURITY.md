# Security

This note covers the foundation slice. It is not a completed security review.

## Secrets

The repository is public. `.env.example` lists variable names and descriptions. Live values stay in `.env.local` or the host's environment settings. Git ignores `.env*`, private keys, certificate bundles, service-account files, database dumps, and `/uploads`.

No payment, storage, or notification secret is read by this slice. `DATABASE_URL` is required for the platform tables and must stay in host environment settings or a gitignored `.env` file.

## Database

The first migration creates platform tables only. It was applied to a local non-production database named `aspera_marketplace_dev`. Production has no database. Do not apply migrations until the target environment is verified. See `docs/MIGRATIONS.md`.

## Logs

Logs are single-line JSON. The logger redacts these field names, regardless of punctuation or case: password, secret, token, authorization, cookie, API key, card number, CVV, PAN, Aadhaar, OTP, GSTIN, private key, credential, session, and PIN. String values are also scrubbed when they look like a bearer token, a JWT, or a 13 to 19 digit card number. Configuration errors name the invalid field and do not echo the supplied value.

Do not log request bodies until a later slice adds an explicit allow-list.

## HTTP

`next.config.ts` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and a locked-down `Permissions-Policy`. `X-Powered-By` is disabled. A content security policy is not configured yet.

`src/proxy.ts` assigns the correlation id. It does not authenticate anyone. There are no protected routes in this slice.

## Production

`main` still deploys the empty initial commit until this branch is merged. Do not put personal data or live credentials into this application before the privacy and authentication slices exist.
