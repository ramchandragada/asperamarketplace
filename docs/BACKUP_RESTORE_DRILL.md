# Backup and restore drill

Goal: prove a non-production Postgres can be dumped and restored without touching production.

## Scope

- Target: local `aspera_marketplace_dev` or Neon **non-prod** only.
- Never run against a production credential set.

## Drill steps

1. Confirm `DATABASE_URL` host is non-prod (`127.0.0.1` or known Neon branch).
2. Schema checkpoint already lives under `docs/schema-checkpoints/`.
3. Logical dump:

```bash
URL="${DATABASE_URL%%\?*}"
pg_dump --no-owner --no-acl "$URL" > /tmp/aspera-nonprod-drill.dump.sql
```

4. Restore into a disposable database (example local):

```bash
createdb aspera_marketplace_restore_drill
psql "postgresql://aspera_dev:aspera_dev_only_not_secret@127.0.0.1:5432/aspera_marketplace_restore_drill" \
  -f /tmp/aspera-nonprod-drill.dump.sql
pnpm exec prisma migrate status
```

5. Smoke: `pnpm test:unit` and open `/api/health`.
6. Drop the disposable database.
7. Record date, operator, source host (no passwords), and pass/fail in the session note.

## Pass criteria

- Dump completes without error.
- Restore applies.
- Health returns `database: configured`.
- No production URL was used.
