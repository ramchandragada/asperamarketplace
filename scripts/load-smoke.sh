#!/usr/bin/env bash
# Non-prod load smoke for Phase 10. Never point at production.
set -euo pipefail
BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
echo "Smoke against $BASE_URL"
ok=0
fail=0
for code in $(seq 1 40 | xargs -n1 -P8 -I{} curl -s -o /dev/null -w "%{http_code}\n" "$BASE_URL/api/health"); do
  if [[ "$code" == "200" ]]; then
    ok=$((ok + 1))
  else
    fail=$((fail + 1))
  fi
done
echo "health ok=$ok fail=$fail"
if [[ "$fail" -gt 5 ]]; then
  echo "Too many failures" >&2
  exit 1
fi
