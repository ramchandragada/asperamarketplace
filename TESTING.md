# Testing

## Automated

`pnpm test` runs Vitest on `src/**/*.test.ts`. The foundation tests cover:

- API success and failure envelopes
- Request id acceptance and replacement
- Log redaction of credentials, tokens, and card-like numbers
- Configuration defaults and rejection of an unknown log level without echoing the value

`pnpm typecheck`, `pnpm lint`, and `pnpm build` are required with the tests. GitHub Actions runs all four.

## Local smoke, 2026-09-24

Against `pnpm start --port 3000`:

- `GET /` returned HTTP 200 and the foundation status page at desktop and mobile widths.
- `GET /api/health` with a valid `x-request-id` returned that id in the header and body.
- `GET /api/health` with `x-request-id: not-a-uuid` returned a new UUID.
- The server log for those requests was JSON and contained `health.checked`.

## Not covered yet

There is no browser end-to-end suite, no database integration test, and no payment or authorization test. Those arrive with the slices that introduce the behavior.
