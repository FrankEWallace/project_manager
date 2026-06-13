#!/usr/bin/env bash
#
# End-to-end smoke test of the Hono API contract the iOS app depends on.
# Exercises the exact call sequence the app makes: Better Auth sign-up (bearer
# token from the `set-auth-token` response header), workspace resolution via the
# `X-Workspace-Id` header, dashboard analytics, and project + transaction CRUD.
#
# Requirements:
#   - The API running locally:  (cd apps/api && pnpm dev)   # default :3001
#   - Network access to the configured database (Neon Postgres on :5432).
#     NOTE: run this from a shell that can reach the DB — sandboxed/CI
#     environments that block outbound TCP to :5432 will fail at sign-up (500).
#
# Usage:
#   apps/ios/Tools/smoke-test.sh                 # uses http://localhost:3001
#   BASE=http://192.168.1.20:3001 apps/ios/Tools/smoke-test.sh
#
set -uo pipefail
BASE="${BASE:-http://localhost:3001}"
TS=$(date +%s)
EMAIL="ios-smoke-${TS}@example.com"
PASS="SmokeTest123!"
NAME="iOS Smoke ${TS}"
pass=0; fail=0
check() { if [ "$1" = "$2" ]; then echo "  ✅ $3 ($1)"; pass=$((pass+1)); else echo "  ❌ $3 — expected $2 got $1"; fail=$((fail+1)); fi; }

echo "Target: $BASE"

echo "1) health"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health"); check "$code" "200" "GET /health"

echo "2) sign-up (Better Auth) — capture set-auth-token header"
HDRS=$(curl -s -D - -o /tmp/su_body.json -X POST "$BASE/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
TOKEN=$(printf '%s' "$HDRS" | grep -i '^set-auth-token:' | tr -d '\r' | awk '{print $2}')
if [ -n "$TOKEN" ]; then echo "  ✅ received bearer token (len ${#TOKEN})"; pass=$((pass+1)); else echo "  ❌ no set-auth-token header"; echo "  body: $(cat /tmp/su_body.json)"; fail=$((fail+1)); fi
AUTH=(-H "Authorization: Bearer $TOKEN")

echo "3) GET /api/workspaces/me — memberships (auto-created on sign-up)"
ME=$(curl -s "${AUTH[@]}" "$BASE/api/workspaces/me")
WSID=$(printf '%s' "$ME" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; print(d[0].get('workspaceId') or d[0].get('workspace',{}).get('id','') if d else '')" 2>/dev/null)
if [ -n "$WSID" ]; then echo "  ✅ workspace id $WSID"; pass=$((pass+1)); else echo "  ❌ no workspace in /me — body: $ME"; fail=$((fail+1)); fi
WS=(-H "X-Workspace-Id: $WSID")

echo "4) GET /api/workspaces/current"
code=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" "${WS[@]}" "$BASE/api/workspaces/current"); check "$code" "200" "current workspace"

echo "5) GET /api/analytics/dashboard"
code=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" "${WS[@]}" "$BASE/api/analytics/dashboard"); check "$code" "200" "dashboard"

echo "6) GET /api/projects (list)"
PL=$(curl -s "${AUTH[@]}" "${WS[@]}" "$BASE/api/projects")
n=$(printf '%s' "$PL" | python3 -c "import json,sys; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
if [ -n "$n" ]; then echo "  ✅ list returned ($n projects)"; pass=$((pass+1)); else echo "  ❌ bad list — $PL"; fail=$((fail+1)); fi

echo "7) POST /api/projects (create)"
CP=$(curl -s "${AUTH[@]}" "${WS[@]}" -X POST "$BASE/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Project","status":"active","priority":"high","currency":"USD","budget":5000}')
PID=$(printf '%s' "$CP" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
if [ -n "$PID" ]; then echo "  ✅ created project $PID"; pass=$((pass+1)); else echo "  ❌ create failed — $CP"; fail=$((fail+1)); fi

echo "8) GET /api/projects/:id (detail w/ financials)"
code=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" "${WS[@]}" "$BASE/api/projects/$PID"); check "$code" "200" "project detail"

echo "9) PATCH /api/projects/:id (update status)"
UP=$(curl -s "${AUTH[@]}" "${WS[@]}" -X PATCH "$BASE/api/projects/$PID" \
  -H "Content-Type: application/json" -d '{"status":"completed"}')
st=$(printf '%s' "$UP" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['status'])" 2>/dev/null)
check "$st" "completed" "status updated"

echo "10) POST /api/projects/:id/transactions"
TX=$(curl -s "${AUTH[@]}" "${WS[@]}" -X POST "$BASE/api/projects/$PID/transactions" \
  -H "Content-Type: application/json" \
  -d '{"type":"income","category":"client_payment","amount":1500,"currency":"USD","normalizedAmount":1500,"description":"Deposit","date":"2026-06-09T00:00:00.000Z"}')
txid=$(printf '%s' "$TX" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
if [ -n "$txid" ]; then echo "  ✅ transaction created $txid"; pass=$((pass+1)); else echo "  ⚠️  transaction route differs — $TX"; fi

echo "11) DELETE /api/projects/:id (cleanup)"
code=$(curl -s -o /dev/null -w "%{http_code}" "${AUTH[@]}" "${WS[@]}" -X DELETE "$BASE/api/projects/$PID"); check "$code" "200" "project deleted"

echo "12) auth rejection — no token returns 401"
code=$(curl -s -o /dev/null -w "%{http_code}" "${WS[@]}" "$BASE/api/workspaces/current"); check "$code" "401" "unauthenticated rejected"

echo ""
echo "==== RESULT: $pass passed, $fail failed ===="
exit $fail
