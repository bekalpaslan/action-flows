# afw-step-completed Hook - Test Examples

This document provides test cases and examples for validating the `afw-step-completed` hook implementation.

## Test Case 1: Successful Step Completion

### Input

```json
{
  "session_id": "sess-abc123",
  "agent_id": "agent-xyz789",
  "exit_status": "completed",
  "duration_ms": 5000,
  "output": "Step 1: code/\n\nResult: Implementation complete with 3 files modified"
}
```

### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-abc123',
  timestamp: '2026-02-06T12:34:56.789Z', // Current ISO time
  stepNumber: 1,
  duration: 5000,
  action: 'code',
  status: 'completed',
  result: 'Implementation complete with 3 files modified',
  learning: null,
  succeeded: true,
  outputLength: 108
}
```

### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-abc123",
  "agent_id": "agent-xyz789",
  "exit_status": "completed",
  "duration_ms": 5000,
  "output": "Step 1: code/\n\nResult: Implementation complete with 3 files modified"
}
EOF
```

---

## Test Case 2: Failed Step with Error Status

### Input

```json
{
  "session_id": "sess-def456",
  "agent_id": "agent-uv123",
  "exit_status": "error",
  "duration_ms": 2000,
  "output": "Step 2: review/\n\nError: File not found at path/to/file.ts"
}
```

### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-def456',
  timestamp: '2026-02-06T12:35:00.000Z',
  stepNumber: 2,
  duration: 2000,
  action: 'review',
  status: 'failed',
  result: 'Error: File not found at path/to/file.ts',
  learning: null,
  succeeded: false,
  outputLength: 89
}
```

### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-def456",
  "agent_id": "agent-uv123",
  "exit_status": "error",
  "duration_ms": 2000,
  "output": "Step 2: review/\n\nError: File not found at path/to/file.ts"
}
EOF
```

---

## Test Case 3: Step with Learning Extracted

### Input

```json
{
  "session_id": "sess-ghi789",
  "agent_id": "agent-mn456",
  "exit_status": "completed",
  "duration_ms": 8000,
  "output": "Step 3: audit/\n\nResult: Security audit complete\n\n## Learnings\n\nThe authentication flow needs to validate JWT expiry before caching tokens. This prevents edge cases where cached tokens persist beyond their validity window."
}
```

### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-ghi789',
  timestamp: '2026-02-06T12:35:10.000Z',
  stepNumber: 3,
  duration: 8000,
  action: 'audit',
  status: 'completed',
  result: 'Security audit complete',
  learning: 'The authentication flow needs to validate JWT expiry before caching tokens. This prevents edge cases where cached tokens persist beyond their validity window.',
  succeeded: true,
  outputLength: 312
}
```

### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-ghi789",
  "agent_id": "agent-mn456",
  "exit_status": "completed",
  "duration_ms": 8000,
  "output": "Step 3: audit/\n\nResult: Security audit complete\n\n## Learnings\n\nThe authentication flow needs to validate JWT expiry before caching tokens. This prevents edge cases where cached tokens persist beyond their validity window."
}
EOF
```

---

## Test Case 4: Cancelled Step

### Input

```json
{
  "session_id": "sess-jkl012",
  "agent_id": "agent-pq789",
  "exit_status": "cancelled",
  "duration_ms": 1500,
  "output": "Step 4: test/\n\nCancelled by user"
}
```

### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-jkl012',
  timestamp: '2026-02-06T12:35:15.000Z',
  stepNumber: 4,
  duration: 1500,
  action: 'test',
  status: 'skipped',
  result: 'Cancelled by user',
  learning: null,
  succeeded: false,
  outputLength: 54
}
```

### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-jkl012",
  "agent_id": "agent-pq789",
  "exit_status": "cancelled",
  "duration_ms": 1500,
  "output": "Step 4: test/\n\nCancelled by user"
}
EOF
```

---

## Test Case 5: Output with Multiple Sections (Complex Parsing)

### Input

```json
{
  "session_id": "sess-mno345",
  "agent_id": "agent-rs012",
  "exit_status": "completed",
  "duration_ms": 12000,
  "output": "Spawning Step 5: notify/\n\n## Execution Summary\nStarted at 2026-02-06T12:30:00Z\nCompleted at 2026-02-06T12:30:12Z\n\n## Result\nPosted notification to 5 channels successfully\n\n## Learnings\nSlack rate limiting should be respected with exponential backoff when posting to multiple channels concurrently."
}
```

### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-mno345',
  timestamp: '2026-02-06T12:35:20.000Z',
  stepNumber: 5,
  duration: 12000,
  action: 'notify',
  status: 'completed',
  result: 'Posted notification to 5 channels successfully',
  learning: 'Slack rate limiting should be respected with exponential backoff when posting to multiple channels concurrently.',
  succeeded: true,
  outputLength: 329
}
```

### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-mno345",
  "agent_id": "agent-rs012",
  "exit_status": "completed",
  "duration_ms": 12000,
  "output": "Spawning Step 5: notify/\n\n## Execution Summary\nStarted at 2026-02-06T12:30:00Z\nCompleted at 2026-02-06T12:30:12Z\n\n## Result\nPosted notification to 5 channels successfully\n\n## Learnings\nSlack rate limiting should be respected with exponential backoff when posting to multiple channels concurrently."
}
EOF
```

---

## Test Case 6: Minimal Output (Graceful Degradation)

### Input

```json
{
  "session_id": "sess-pqr678",
  "agent_id": "agent-tu345",
  "exit_status": "completed",
  "duration_ms": 3000,
  "output": "Done"
}
```

### Expected Output Event

```typescript
{
  type: 'step:completed',
  sessionId: 'sess-pqr678',
  timestamp: '2026-02-06T12:35:25.000Z',
  stepNumber: 1,              // Falls back to 1 (no Step N found)
  duration: 3000,
  action: null,               // No action pattern found
  status: 'completed',
  result: 'Done',             // Last line used as result
  learning: null,             // No learning section
  succeeded: true,
  outputLength: 4
}
```

### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-pqr678",
  "agent_id": "agent-tu345",
  "exit_status": "completed",
  "duration_ms": 3000,
  "output": "Done"
}
EOF
```

---

## Test Case 7: Invalid Input (JSON Parse Error)

### Input

```
This is not JSON at all!
```

### Expected Behavior

- Logs: `Failed to parse JSON from stdin`
- Exit code: 0
- Event: Not sent to backend

### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

echo "This is not JSON at all!" | node dist/afw-step-completed.js
```

---

## Test Case 8: Missing Required Field

### Input

```json
{
  "session_id": "sess-stu901",
  "agent_id": "agent-vw678",
  "exit_status": "completed"
}
```

### Expected Behavior

- Logs: `Invalid hook data format`
- Exit code: 0
- Event: Not sent to backend

### Run Test

```bash
export AFW_BACKEND_URL=http://localhost:3000

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-stu901",
  "agent_id": "agent-vw678",
  "exit_status": "completed"
}
EOF
```

---

## Test Case 9: Network Failure (Backend Unreachable)

### Input

```json
{
  "session_id": "sess-vwx234",
  "agent_id": "agent-yz901",
  "exit_status": "completed",
  "duration_ms": 5000,
  "output": "Step 1: code/"
}
```

### Expected Behavior

- Set `AFW_BACKEND_URL` to invalid URL (e.g., `http://unreachable:9999`)
- Logs: `Error posting event: [network error]`
- Exit code: 0 (silent failure)
- Event: Not sent (network failure)

### Run Test

```bash
export AFW_BACKEND_URL=http://unreachable:9999

cat << 'EOF' | node dist/afw-step-completed.js
{
  "session_id": "sess-vwx234",
  "agent_id": "agent-yz901",
  "exit_status": "completed",
  "duration_ms": 5000,
  "output": "Step 1: code/"
}
EOF
```

---

## Automated Test Script

Save as `test-hook.sh`:

```bash
#!/bin/bash

set -e

export AFW_BACKEND_URL=http://localhost:3000

echo "Testing afw-step-completed hook..."
echo ""

# Test 1: Successful completion
echo "Test 1: Successful completion"
echo '{"session_id":"test-1","agent_id":"a1","exit_status":"completed","duration_ms":5000,"output":"Step 1: code/\n\nResult: Success"}' | \
  node dist/afw-step-completed.js && \
  echo "✓ PASS" || echo "✗ FAIL"
echo ""

# Test 2: Failed step
echo "Test 2: Failed step"
echo '{"session_id":"test-2","agent_id":"a2","exit_status":"error","duration_ms":2000,"output":"Step 2: review/\n\nError: File not found"}' | \
  node dist/afw-step-completed.js && \
  echo "✓ PASS" || echo "✗ FAIL"
echo ""

# Test 3: Cancelled step
echo "Test 3: Cancelled step"
echo '{"session_id":"test-3","agent_id":"a3","exit_status":"cancelled","duration_ms":1000,"output":"Cancelled"}' | \
  node dist/afw-step-completed.js && \
  echo "✓ PASS" || echo "✗ FAIL"
echo ""

# Test 4: Invalid JSON
echo "Test 4: Invalid JSON (expect error log)"
echo 'not json' | \
  node dist/afw-step-completed.js && \
  echo "✓ PASS (silent failure)" || echo "✗ FAIL"
echo ""

echo "All tests completed!"
```

Run with:
```bash
chmod +x test-hook.sh
./test-hook.sh
```

---

## Verification Checklist

After running tests, verify:

- [ ] Hook exits with code 0 in all cases
- [ ] Valid events reach backend `/api/events` endpoint
- [ ] Invalid inputs produce appropriate error logs
- [ ] Network failures don't crash the hook
- [ ] Parsed fields match expected values
- [ ] Status enum values are correct
- [ ] Step numbers parse correctly
- [ ] Learning sections extract properly
- [ ] Graceful degradation works (missing fields = null)
- [ ] Silent failure mode functions correctly
