#!/usr/bin/env bash
# seed-test-data.sh — Seeds the ActionFlows backend with test data for frontend E2E tests
# Usage: bash test/e2e/fixtures/seed-test-data.sh [BASE_URL]
#
# Prerequisites: Backend running at BASE_URL (default: http://localhost:3001)

set -euo pipefail

BASE="${1:-http://localhost:3001}"
NOW=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)

echo "=== Seeding ActionFlows test data at $BASE ==="

# ─── Helper ────────────────────────────────────────
post() {
  local path="$1"
  local body="$2"
  local resp
  resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE$path" \
    -H "Content-Type: application/json" \
    -d "$body")
  local code=$(echo "$resp" | tail -1)
  local data=$(echo "$resp" | sed '$d')
  if [[ "$code" -ge 400 ]]; then
    echo "  FAIL $path → HTTP $code"
    echo "  $data"
    return 1
  fi
  echo "  OK   $path → HTTP $code"
  echo "$data"
}

# ─── Session A: Active with 5-step chain ───────────
echo ""
echo "--- Session A: Active (in_progress) ---"

SESSION_A=$(post "/api/sessions" '{
  "cwd": "/projects/webapp",
  "hostname": "dev-machine",
  "platform": "linux",
  "userId": "user-alice-001"
}' | head -1)
SESSION_A_ID=$(echo "$SESSION_A" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Session A ID: $SESSION_A_ID"

# Session started event
post "/api/events" "{
  \"type\": \"session:started\",
  \"sessionId\": \"$SESSION_A_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {
    \"user\": \"alice\",
    \"cwd\": \"/projects/webapp\",
    \"hostname\": \"dev-machine\",
    \"platform\": \"linux\"
  }
}" > /dev/null

# Chain compiled event
post "/api/events" "{
  \"type\": \"chain:compiled\",
  \"sessionId\": \"$SESSION_A_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {
    \"chainId\": \"chain-a-001\",
    \"title\": \"Implement User Authentication\",
    \"source\": \"flow\",
    \"executionMode\": \"mixed\",
    \"estimatedDuration\": 120000,
    \"steps\": [
      {\"stepNumber\": 1, \"action\": \"plan/architecture\", \"model\": \"opus\", \"waitsFor\": [], \"description\": \"Design auth architecture\"},
      {\"stepNumber\": 2, \"action\": \"code/backend\", \"model\": \"sonnet\", \"waitsFor\": [1], \"description\": \"Implement JWT middleware\"},
      {\"stepNumber\": 3, \"action\": \"code/frontend\", \"model\": \"sonnet\", \"waitsFor\": [1], \"description\": \"Build login form component\"},
      {\"stepNumber\": 4, \"action\": \"test/integration\", \"model\": \"haiku\", \"waitsFor\": [2, 3], \"description\": \"Write integration tests\"},
      {\"stepNumber\": 5, \"action\": \"review/security\", \"model\": \"opus\", \"waitsFor\": [4], \"description\": \"Security review of auth flow\"}
    ]
  }
}" > /dev/null

# Chain started
post "/api/events" "{
  \"type\": \"chain:started\",
  \"sessionId\": \"$SESSION_A_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {
    \"chainId\": \"chain-a-001\",
    \"title\": \"Implement User Authentication\",
    \"stepCount\": 5
  }
}" > /dev/null

# Step 1: completed
post "/api/events" "{
  \"type\": \"step:started\",
  \"sessionId\": \"$SESSION_A_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {\"stepNumber\": 1, \"action\": \"plan/architecture\", \"model\": \"opus\"}
}" > /dev/null

post "/api/events" "{
  \"type\": \"step:completed\",
  \"sessionId\": \"$SESSION_A_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {
    \"stepNumber\": 1,
    \"action\": \"plan/architecture\",
    \"duration\": 15200,
    \"result\": {\"architecture\": \"JWT with refresh tokens, bcrypt password hashing, Redis session store\"},
    \"learning\": \"Architecture decisions documented in ADR-001\"
  }
}" > /dev/null

# Step 2: completed
post "/api/events" "{
  \"type\": \"step:started\",
  \"sessionId\": \"$SESSION_A_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {\"stepNumber\": 2, \"action\": \"code/backend\", \"model\": \"sonnet\"}
}" > /dev/null

post "/api/events" "{
  \"type\": \"step:completed\",
  \"sessionId\": \"$SESSION_A_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {
    \"stepNumber\": 2,
    \"action\": \"code/backend\",
    \"duration\": 45800,
    \"result\": {\"filesCreated\": [\"src/middleware/auth.ts\", \"src/routes/login.ts\"]},
    \"learning\": \"Used argon2 instead of bcrypt for better security\"
  }
}" > /dev/null

# Step 3: in_progress (currently executing)
post "/api/events" "{
  \"type\": \"step:started\",
  \"sessionId\": \"$SESSION_A_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {\"stepNumber\": 3, \"action\": \"code/frontend\", \"model\": \"sonnet\"}
}" > /dev/null

echo "  Session A seeded: 5-step chain, 2 completed, 1 in_progress, 2 pending"

# ─── Session B: Completed with 3-step chain ────────
echo ""
echo "--- Session B: Completed ---"

SESSION_B=$(post "/api/sessions" '{
  "cwd": "/projects/api-docs",
  "hostname": "dev-machine",
  "platform": "linux",
  "userId": "user-bob-002"
}' | head -1)
SESSION_B_ID=$(echo "$SESSION_B" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Session B ID: $SESSION_B_ID"

post "/api/events" "{
  \"type\": \"session:started\",
  \"sessionId\": \"$SESSION_B_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {\"user\": \"bob\", \"cwd\": \"/projects/api-docs\", \"hostname\": \"dev-machine\", \"platform\": \"linux\"}
}" > /dev/null

post "/api/events" "{
  \"type\": \"chain:compiled\",
  \"sessionId\": \"$SESSION_B_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {
    \"chainId\": \"chain-b-001\",
    \"title\": \"Generate API Documentation\",
    \"source\": \"composed\",
    \"executionMode\": \"sequential\",
    \"steps\": [
      {\"stepNumber\": 1, \"action\": \"analyze/endpoints\", \"model\": \"sonnet\", \"waitsFor\": [], \"description\": \"Scan all API endpoints\"},
      {\"stepNumber\": 2, \"action\": \"code/docs\", \"model\": \"sonnet\", \"waitsFor\": [1], \"description\": \"Generate OpenAPI spec\"},
      {\"stepNumber\": 3, \"action\": \"review/docs\", \"model\": \"haiku\", \"waitsFor\": [2], \"description\": \"Verify documentation accuracy\"}
    ]
  }
}" > /dev/null

post "/api/events" "{
  \"type\": \"chain:started\",
  \"sessionId\": \"$SESSION_B_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {\"chainId\": \"chain-b-001\", \"title\": \"Generate API Documentation\", \"stepCount\": 3}
}" > /dev/null

# All 3 steps completed
for STEP in 1 2 3; do
  ACTIONS=("analyze/endpoints" "code/docs" "review/docs")
  MODELS=("sonnet" "sonnet" "haiku")
  DURATIONS=(12000 34500 8200)
  IDX=$((STEP - 1))

  post "/api/events" "{
    \"type\": \"step:started\",
    \"sessionId\": \"$SESSION_B_ID\",
    \"timestamp\": \"$NOW\",
    \"payload\": {\"stepNumber\": $STEP, \"action\": \"${ACTIONS[$IDX]}\", \"model\": \"${MODELS[$IDX]}\"}
  }" > /dev/null

  post "/api/events" "{
    \"type\": \"step:completed\",
    \"sessionId\": \"$SESSION_B_ID\",
    \"timestamp\": \"$NOW\",
    \"payload\": {
      \"stepNumber\": $STEP,
      \"action\": \"${ACTIONS[$IDX]}\",
      \"duration\": ${DURATIONS[$IDX]},
      \"result\": {\"status\": \"success\"},
      \"learning\": \"Step $STEP completed successfully\"
    }
  }" > /dev/null
done

post "/api/events" "{
  \"type\": \"chain:completed\",
  \"sessionId\": \"$SESSION_B_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {
    \"chainId\": \"chain-b-001\",
    \"duration\": 54700,
    \"status\": \"completed\",
    \"summary\": \"API documentation generated successfully\",
    \"successfulSteps\": 3,
    \"failedSteps\": 0,
    \"skippedSteps\": 0
  }
}" > /dev/null

echo "  Session B seeded: 3-step chain, all completed"

# ─── Session C: Failed with error ──────────────────
echo ""
echo "--- Session C: Failed ---"

SESSION_C=$(post "/api/sessions" '{
  "cwd": "/projects/payments",
  "hostname": "dev-machine",
  "platform": "linux",
  "userId": "user-charlie-003"
}' | head -1)
SESSION_C_ID=$(echo "$SESSION_C" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Session C ID: $SESSION_C_ID"

post "/api/events" "{
  \"type\": \"session:started\",
  \"sessionId\": \"$SESSION_C_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {\"user\": \"charlie\", \"cwd\": \"/projects/payments\", \"hostname\": \"dev-machine\", \"platform\": \"linux\"}
}" > /dev/null

post "/api/events" "{
  \"type\": \"chain:compiled\",
  \"sessionId\": \"$SESSION_C_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {
    \"chainId\": \"chain-c-001\",
    \"title\": \"Fix Payment Processing Bug\",
    \"source\": \"composed\",
    \"executionMode\": \"sequential\",
    \"steps\": [
      {\"stepNumber\": 1, \"action\": \"analyze/bug\", \"model\": \"opus\", \"waitsFor\": [], \"description\": \"Analyze payment failure logs\"},
      {\"stepNumber\": 2, \"action\": \"code/fix\", \"model\": \"sonnet\", \"waitsFor\": [1], \"description\": \"Fix race condition in payment handler\"},
      {\"stepNumber\": 3, \"action\": \"test/regression\", \"model\": \"haiku\", \"waitsFor\": [2], \"description\": \"Run payment regression tests\"},
      {\"stepNumber\": 4, \"action\": \"review/code\", \"model\": \"sonnet\", \"waitsFor\": [3], \"description\": \"Code review the fix\"}
    ]
  }
}" > /dev/null

post "/api/events" "{
  \"type\": \"chain:started\",
  \"sessionId\": \"$SESSION_C_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {\"chainId\": \"chain-c-001\", \"title\": \"Fix Payment Processing Bug\", \"stepCount\": 4}
}" > /dev/null

# Step 1: completed
post "/api/events" "{
  \"type\": \"step:started\",
  \"sessionId\": \"$SESSION_C_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {\"stepNumber\": 1, \"action\": \"analyze/bug\", \"model\": \"opus\"}
}" > /dev/null

post "/api/events" "{
  \"type\": \"step:completed\",
  \"sessionId\": \"$SESSION_C_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {
    \"stepNumber\": 1,
    \"action\": \"analyze/bug\",
    \"duration\": 22400,
    \"result\": {\"rootCause\": \"Race condition in concurrent payment processing\"},
    \"learning\": \"Found duplicate charge bug triggered by double-click\"
  }
}" > /dev/null

# Step 2: FAILED
post "/api/events" "{
  \"type\": \"step:started\",
  \"sessionId\": \"$SESSION_C_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {\"stepNumber\": 2, \"action\": \"code/fix\", \"model\": \"sonnet\"}
}" > /dev/null

post "/api/events" "{
  \"type\": \"step:failed\",
  \"sessionId\": \"$SESSION_C_ID\",
  \"timestamp\": \"$NOW\",
  \"payload\": {
    \"stepNumber\": 2,
    \"action\": \"code/fix\",
    \"error\": \"TypeError: Cannot read properties of undefined (reading 'transactionId') at PaymentHandler.process (src/handlers/payment.ts:142:28)\",
    \"errorType\": \"TypeError\",
    \"isCritical\": true,
    \"isRetryable\": true,
    \"suggestion\": \"Add null check for transaction object before accessing transactionId\"
  }
}" > /dev/null

echo "  Session C seeded: 4-step chain, 1 completed, 1 failed, 2 pending"

# ─── Verify ────────────────────────────────────────
echo ""
echo "=== Verification ==="
SESSIONS=$(curl -s "$BASE/api/sessions")
COUNT=$(echo "$SESSIONS" | grep -o '"id"' | wc -l)
echo "  Total sessions: $COUNT (expected: 3+)"

echo ""
echo "=== Seeding complete ==="
echo "  Session A (active):    $SESSION_A_ID"
echo "  Session B (completed): $SESSION_B_ID"
echo "  Session C (failed):    $SESSION_C_ID"
