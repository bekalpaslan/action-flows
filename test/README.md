# ActionFlows Dashboard - E2E Testing

This directory contains test files and scripts for testing Phase 2 of the ActionFlows Dashboard project.

## Files

### `curl-commands.sh`
**Executable shell script** that sends a sequential series of test events to the backend, simulating a real chain execution.

**Usage:**
```bash
bash test/curl-commands.sh
```

**What it does:**
- Generates a unique session ID
- Sends 9 events in sequence with realistic delays:
  1. SessionStarted
  2. ChainCompiled (3-step chain)
  3. StepSpawned (step 1: analyze/)
  4. StepCompleted (step 1)
  5. StepSpawned (step 2: review/)
  6. StepCompleted (step 2)
  7. StepSpawned (step 3: notify/)
  8. StepCompleted (step 3)
  9. ChainCompleted
- Waits for your confirmation before starting
- Reports success/failure for each event

**Requirements:**
- Backend must be running on port 3001
- Frontend (app) must be running on port 5173
- Dashboard should be open in browser to see real-time updates

---

### `manual-test-events.json`
**JSON file** containing sample event payloads suitable for manual testing or reference.

**What it contains:**
- 8 events showing the full lifecycle of a test chain
- Realistic data structures matching ActionFlows event schema
- Security analysis scenario (analyze backend → review findings → notify team)
- Comprehensive event metadata (timestamps, step IDs, model names, inputs, results)

**How to use:**
1. Copy an event from this file
2. Manually curl it to the backend:
   ```bash
   curl -X POST http://localhost:3001/events \
     -H "Content-Type: application/json" \
     -d '{event JSON here}'
   ```
3. Or use `curl-commands.sh` for automated testing

**Event types documented:**
- SessionStarted
- ChainCompiled
- StepSpawned
- StepCompleted
- ChainCompleted
- Alternative types: StepFailed, ChainFailed, ChainCancelled

---

## Quick Start

1. **Open two terminals** (or terminal tabs)

2. **Terminal 1: Start Backend**
   ```bash
   pnpm -F @afw/backend dev
   ```
   Wait for: "Backend server running on http://localhost:3001"

3. **Terminal 2: Start Frontend**
   ```bash
   pnpm -F @afw/app dev
   ```
   Wait for: "local: http://localhost:5173/"

4. **Browser: Open Dashboard**
   Navigate to http://localhost:5173

5. **Terminal 3 (or new tab): Run Tests**
   ```bash
   bash test/curl-commands.sh
   ```
   Press Enter to start sending events

6. **Watch the Dashboard**
   - You should see a 3-node chain appear
   - Each node changes color as it progresses: gray → yellow → green
   - Click nodes to see details in the Inspector panel

---

## Convenience Scripts

From the project root, you can use these commands:

```bash
# Run the E2E test script
pnpm test:e2e

# See the E2E testing guide
pnpm test:e2e:docs
```

---

## Manual Testing Scenarios

### Scenario 1: One Event at a Time
```bash
# Terminal 1: Check event structure
cat test/manual-test-events.json | jq '.events[0]'

# Terminal 2: Send just that event
curl -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d '{...paste event JSON...}'

# Browser: Check Dashboard updates immediately
```

### Scenario 2: Custom Chain
Edit `manual-test-events.json` to create your own test chain:
- Change step names (analyze/ → audit/)
- Change model names (sonnet → opus)
- Add more steps to the numSteps field
- Update the events array with corresponding StepSpawned/StepCompleted events

### Scenario 3: Rapid-Fire Events
```bash
# Send all events in quick succession
for i in {0..8}; do
  curl -X POST http://localhost:3001/events \
    -H "Content-Type: application/json" \
    -d @test/manual-test-events.json | jq ".events[$i]"
done
```

---

## Expected Results

### Backend Console
You should see logs like:
```
[info] Event received: SessionStarted (session-id: demo-session-1707194400)
[info] Connected WebSocket clients: 1
[info] Broadcasting to 1 client(s)
[info] Event received: ChainCompiled (chain-id: chain-001)
...
```

### Frontend Console
Check browser DevTools → Console for:
- WebSocket connection messages
- Event received confirmations
- DAG render logs
- No errors or warnings

### Dashboard UI
- Empty canvas before tests start
- Nodes appear as events arrive
- Status colors update in real-time
- Inspector shows node details when clicked
- Final summary shows complete chain

---

## Troubleshooting

### "curl: (7) Failed to connect to localhost port 3001"
- Backend not running
- Check `pnpm -F @afw/backend dev` in terminal 1
- Ensure port 3001 is not in use

### Dashboard shows "Connecting..." forever
- WebSocket connection failing
- Check browser DevTools → Network → WS
- Verify backend is running and accessible
- Check CORS headers are present

### Events sent but Dashboard doesn't update
- WebSocket may be closed
- Reload page: Ctrl+R or Cmd+R
- Check browser console for JavaScript errors
- Try opening DevTools and checking Network tab

### "Permission denied" running curl-commands.sh
```bash
# Make script executable
chmod +x test/curl-commands.sh

# Then run it
bash test/curl-commands.sh
```

---

## For Phase 3 Development

Once real Claude integration is added, this test directory will be enhanced with:
- Integration tests for Claude Code hooks
- Automated tests for event schema validation
- Performance benchmarks for large chains
- Regression test suite

For now, manual testing with `curl-commands.sh` provides the foundation for Phase 2 validation.

---

## See Also

- **E2E_TEST_GUIDE.md** — Comprehensive testing guide with architecture overview
- **packages/backend/src/index.ts** — Backend event handling code
- **packages/app/src/components/DAG.tsx** — Frontend DAG visualization
