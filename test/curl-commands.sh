#!/bin/bash

#############################################################################
# ActionFlows Dashboard - E2E Manual Test Events Script
#
# This script sends a sequence of test events to the ActionFlows backend,
# simulating a real chain execution. Events are sent with realistic delays
# to match expected execution flow.
#
# Usage:
#   bash test/curl-commands.sh
#
# Prerequisites:
#   - Backend running on port 3001: pnpm -F @afw/backend dev
#   - Frontend running on port 5173: pnpm -F @afw/app dev
#   - Dashboard open in browser: http://localhost:5173
#
# Watch the Dashboard in real-time as events arrive and nodes appear!
#############################################################################

set -e  # Exit on error

BASE_URL="http://localhost:3001"
SESSION_ID="demo-session-$(date +%s)"
CHAIN_ID="chain-001"

echo "=========================================="
echo "ActionFlows Dashboard - E2E Test"
echo "=========================================="
echo ""
echo "Session ID: $SESSION_ID"
echo "Backend URL: $BASE_URL"
echo ""
echo "Make sure:"
echo "  1. Backend is running: pnpm -F @afw/backend dev"
echo "  2. Frontend is running: pnpm -F @afw/app dev"
echo "  3. Dashboard is open: http://localhost:5173"
echo ""
echo "Press Enter to begin, or Ctrl+C to cancel..."
read

send_event() {
  local event_type=$1
  local event_json=$2
  local delay=$3

  echo "[$(date '+%H:%M:%S')] Sending $event_type..."

  curl -s -X POST "$BASE_URL/events" \
    -H "Content-Type: application/json" \
    -d "$event_json" > /dev/null

  if [ $? -eq 0 ]; then
    echo "  ✓ $event_type sent successfully"
  else
    echo "  ✗ Failed to send $event_type"
    exit 1
  fi

  if [ ! -z "$delay" ]; then
    echo "  Waiting ${delay}ms..."
    sleep $(echo "scale=2; $delay / 1000" | bc)
  fi

  echo ""
}

# Event 1: SessionStarted
send_event "SessionStarted" '{
  "type": "SessionStarted",
  "sessionId": "'$SESSION_ID'",
  "timestamp": '$(date +%s%N)',
  "data": {
    "userId": "test-user-001",
    "orchestratorModel": "haiku",
    "requestSummary": "E2E Test Chain - Security Analysis"
  }
}' 500

# Event 2: ChainCompiled
send_event "ChainCompiled" '{
  "type": "ChainCompiled",
  "sessionId": "'$SESSION_ID'",
  "chainId": "'$CHAIN_ID'",
  "timestamp": '$(date +%s%N)',
  "data": {
    "chainName": "Security Analysis Chain",
    "description": "Analyze backend security, review findings, notify team",
    "numSteps": 3,
    "executionStrategy": "sequential",
    "steps": [
      {
        "stepId": "step-analyze",
        "actionName": "analyze/",
        "model": "sonnet",
        "inputs": {"scope": "backend", "aspect": "security"}
      },
      {
        "stepId": "step-review",
        "actionName": "review/",
        "model": "opus",
        "inputs": {"scope": "findings"}
      },
      {
        "stepId": "step-notify",
        "actionName": "notify/",
        "model": "haiku",
        "inputs": {"channel": "#cityzen-dev"}
      }
    ]
  }
}' 500

# Event 3: StepSpawned (analyze step)
send_event "StepSpawned [1/3]" '{
  "type": "StepSpawned",
  "sessionId": "'$SESSION_ID'",
  "chainId": "'$CHAIN_ID'",
  "stepId": "step-analyze",
  "timestamp": '$(date +%s%N)',
  "data": {
    "actionName": "analyze/",
    "model": "sonnet",
    "inputs": {"scope": "backend", "aspect": "security"},
    "status": "in-progress"
  }
}' 1500

# Event 4: StepCompleted (analyze step)
send_event "StepCompleted [1/3]" '{
  "type": "StepCompleted",
  "sessionId": "'$SESSION_ID'",
  "chainId": "'$CHAIN_ID'",
  "stepId": "step-analyze",
  "timestamp": '$(date +%s%N)',
  "data": {
    "actionName": "analyze/",
    "status": "complete",
    "duration": 2500,
    "result": "Found 3 security issues: SQL injection in user endpoint, missing CORS validation, weak password hashing",
    "errors": []
  }
}' 500

# Event 5: StepSpawned (review step)
send_event "StepSpawned [2/3]" '{
  "type": "StepSpawned",
  "sessionId": "'$SESSION_ID'",
  "chainId": "'$CHAIN_ID'",
  "stepId": "step-review",
  "timestamp": '$(date +%s%N)',
  "data": {
    "actionName": "review/",
    "model": "opus",
    "inputs": {"scope": "findings"},
    "status": "in-progress"
  }
}' 1800

# Event 6: StepCompleted (review step)
send_event "StepCompleted [2/3]" '{
  "type": "StepCompleted",
  "sessionId": "'$SESSION_ID'",
  "chainId": "'$CHAIN_ID'",
  "stepId": "step-review",
  "timestamp": '$(date +%s%N)',
  "data": {
    "actionName": "review/",
    "status": "complete",
    "duration": 3200,
    "result": "All 3 issues are HIGH severity and require immediate fixes. Provided remediation steps for each.",
    "errors": []
  }
}' 500

# Event 7: StepSpawned (notify step)
send_event "StepSpawned [3/3]" '{
  "type": "StepSpawned",
  "sessionId": "'$SESSION_ID'",
  "chainId": "'$CHAIN_ID'",
  "stepId": "step-notify",
  "timestamp": '$(date +%s%N)',
  "data": {
    "actionName": "notify/",
    "model": "haiku",
    "inputs": {"channel": "#cityzen-dev"},
    "status": "in-progress"
  }
}' 800

# Event 8: StepCompleted (notify step)
send_event "StepCompleted [3/3]" '{
  "type": "StepCompleted",
  "sessionId": "'$SESSION_ID'",
  "chainId": "'$CHAIN_ID'",
  "stepId": "step-notify",
  "timestamp": '$(date +%s%N)',
  "data": {
    "actionName": "notify/",
    "status": "complete",
    "duration": 600,
    "result": "Posted security findings to #cityzen-dev. Tagged 2 team members.",
    "errors": []
  }
}' 500

# Event 9: ChainCompleted
send_event "ChainCompleted" '{
  "type": "ChainCompleted",
  "sessionId": "'$SESSION_ID'",
  "chainId": "'$CHAIN_ID'",
  "timestamp": '$(date +%s%N)',
  "data": {
    "chainName": "Security Analysis Chain",
    "status": "complete",
    "totalDuration": 8700,
    "stepsCompleted": 3,
    "stepsFailed": 0,
    "summary": "Chain completed successfully. 3 steps executed, 3 issues identified and reviewed, team notified."
  }
}' 0

echo "=========================================="
echo "✓ All events sent successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Check the Dashboard at http://localhost:5173"
echo "  2. You should see a 3-node chain with status updates"
echo "  3. Click nodes to see details in the Inspector panel"
echo "  4. Watch the animation as each step progresses"
echo ""
echo "Session ID for reference: $SESSION_ID"
echo ""
