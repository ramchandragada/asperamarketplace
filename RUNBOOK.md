# Runbook

Foundation operations only. There is no database to migrate, seed, or restore.

## Start locally

1. Install Node.js 24.21.0 and pnpm 10.33.3.
2. Run `pnpm install`.
3. Run `pnpm dev` for development, or `pnpm build` and `pnpm start` for the production build.
4. Open http://localhost:3000 and request http://localhost:3000/api/health.

A healthy response has HTTP 200, `code` `OK`, and `data.database` `not_configured`.

## Checks

`pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` are the local gate. The same commands run in `.github/workflows/ci.yml`.

## Deploy

Vercel builds this repository from GitHub. Production tracks `main`. This slice must not be treated as deployed until it is merged and a new deployment is recorded. The current production deployment is `dpl_DUinJHJE55SJ2CYBTkVF59xMfD98` of commit `bff8c57`, which has no application output.

Railway is not connected. Do not set `DATABASE_URL` to a shared or production database.

## Rollback

Application rollback is a Vercel promotion of the previous deployment. There is no schema rollback because there is no schema. Do not run destructive database commands. There is no database.

## Incident note for this slice

If `/api/health` fails, the process is down or the route failed before it could answer. Logs for `health.checked` include `requestId`. There is no queue, payment provider, or data store to repair.
