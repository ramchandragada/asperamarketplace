# Load test smoke (Phase 10)

Not a capacity certification. Confirms the health and browse paths survive a short concurrent smoke.

## Prerequisites

- Preview or local `pnpm start` after `pnpm build`.
- `BASE_URL` pointing at non-prod only.

## Script

```bash
BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
seq 1 40 | xargs -n1 -P8 -I{} curl -s -o /dev/null -w "%{http_code}\n" "$BASE_URL/api/health"
```

Optional browse smoke:

```bash
seq 1 20 | xargs -n1 -P4 -I{} curl -s -o /dev/null -w "%{http_code}\n" "$BASE_URL/browse"
```

## Pass criteria

- Majority of `/api/health` responses are HTTP 200.
- Process does not crash; logs remain JSON without secrets.
- No database connection exhaustion (health stays `configured`).

## Out of scope

- Authenticated checkout storm
- Payment webhook flood
- Production traffic
