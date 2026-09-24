# Testing

## Automated

`pnpm test` runs Vitest on `src/**/*.test.ts`. Foundation coverage:

- API success and failure envelopes
- Request id acceptance and replacement
- Log redaction of credentials, tokens, and card-like numbers
- Configuration defaults and rejection of an unknown log level without echoing the value
- Health payload status for configured and unavailable databases
- Integration: database connectivity and a transactional feature-flag write with audit log and outbox event, when `DATABASE_URL` is set

`pnpm typecheck`, `pnpm lint`, and `pnpm build` are required with the tests. GitHub Actions migrates a PostgreSQL 16 service, then runs the same checks.

## Local smoke, Phase 1 complete

Against `pnpm start --port 3000` with the local non-production database:

- `GET /` returned HTTP 200 and showed database Configured.
- `GET /api/health` returned HTTP 200 with `database: configured`.
- Integration tests wrote and cleaned up a temporary feature flag, audit row, and outbox event.

## Not covered yet

There is no browser end-to-end suite, authentication test, payment test, or production migration drill. Those arrive with later phases.
