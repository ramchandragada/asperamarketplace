# Testing

## Automated

`pnpm test` covers:

- API envelope, request ids, log redaction, config, health
- Password hashing and PAN/GSTIN masking
- Seller status transitions
- Local document storage validation
- Platform transactional writes
- Full seller onboarding: register → draft → upload → submit → admin approve, with audit and outbox assertions

## Manual smoke, Phase 2

1. `pnpm db:seed`
2. `pnpm start`
3. Sign in as `seller@aspera.local` / `AsperaSellerDevOnly1!`
4. Create a seller draft and confirm `/api/auth/me` is authenticated
5. Sign in as `admin@aspera.local` / `AsperaAdminDevOnly1!` and open `/admin/sellers`

## Not covered yet

Browser E2E, MFA, password reset, hosted object storage, and production IdP federation.
