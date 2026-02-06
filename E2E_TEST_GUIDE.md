# ActionFlows Dashboard - E2E Test Guide

This guide walks you through testing **Phase 2: Real Claude Session Integration** of the ActionFlows Dashboard. Learn how to verify that events flow from Claude Code sessions into the Dashboard's real-time visualization.

---

## Prerequisites

- **Node.js 20+** installed ([nodejs.org](https://nodejs.org))
- **pnpm 8.0+** installed (`npm install -g pnpm`)
- **Redis running** (optional, for event persistence between sessions)
  - Windows: Download from [Microsoft's Redis fork](https://github.com/microsoftarchive/redis) or use WSL
  - macOS: `brew install redis` then `redis-server`
  - Linux: `sudo apt-get install redis-server && redis-server`

---

## Setup Steps

### 1. Install Dependencies
```bash
cd D:/ActionFlowsDashboard
pnpm install
```

### 2. Build Shared Package
```bash
pnpm -F @afw/shared build
```

This compiles TypeScript and generates type definitions used by both backend and app.

### 3. Start Backend Server
```bash
pnpm -F @afw/backend dev
```

Expected output:
```
Backend server running on http://localhost:3001
WebSocket endpoint: ws://localhost:3001
```

**Keep this terminal open.** The backend listens for events and broadcasts them via WebSocket to connected clients.

### 4. Start Frontend App (in another terminal)
```bash
cd D:/ActionFlowsDashboard
pnpm -F @afw/app dev
```

Expected output:
```
VITE v5.x.x ready in XXX ms

➜  local:   http://localhost:5173/
```

Navigate to **http://localhost:5173** in your browser. You should see the ActionFlows Dashboard with an empty DAG canvas.

---

## Test Scenarios

### Scenario 1: Manual Event Injection via curl

**Purpose:** Verify that the backend correctly receives and broadcasts events, and that the frontend renders them in real-time.

#### Step-by-Step

1. **Open Dashboard** at http://localhost:5173
   - You should see an empty canvas with "No active chain" message

2. **In a new terminal, run test events:**
   ```bash
   cd D:/ActionFlowsDashboard
   bash test/curl-commands.sh
   ```

   This script injects a sequence of events simulating a real chain execution:
   - SessionStarted (establishes a session)
   - ChainCompiled (defines the execution plan)
   - StepSpawned (starts first step)
   - StepCompleted (finishes first step)
   - StepSpawned (starts second step)
   - StepCompleted (finishes second step)
   - ChainCompleted (finishes chain)

3. **Watch Dashboard in real-time:**
   - The DAG should appear with nodes for each step
   - Colors should transition: pending (gray) → in-progress (yellow) → complete (green)
   - The Inspector panel should show details for each step
   - Status badge should show "Complete" when finished

#### Sample curl Command (send individually)

```bash
# Start a session
curl -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SessionStarted",
    "sessionId": "session-001",
    "timestamp": "'$(date +%s%N)'",
    "data": {
      "userId": "user-123",
      "orchestratorModel": "haiku"
    }
  }'
```

**Response:** `{"success": true}`

#### Expected Results Checklist

- [ ] Backend receives event (check backend console for log)
- [ ] Frontend's DAG updates without page reload
- [ ] Status colors transition correctly
- [ ] Inspector shows step details when clicked
- [ ] All 7 events process in sequence (no dropped events)

---

### Scenario 2: Using ChainDemo Component

**Purpose:** Test automated chain execution through the UI demo component, simulating real workflow with multiple steps and status updates.

#### Step-by-Step

1. **Ensure Dashboard is running** at http://localhost:5173

2. **Navigate to Demo Section** (if available in UI):
   - Look for "Demo" or "Test Scenario" button in the Dashboard header
   - Or directly access: http://localhost:5173/?demo=true

3. **Click "Start Demo Chain"** button
   - This triggers the ChainDemo component
   - It injects a complete chain with 3-5 steps

4. **Watch the Visualization:**
   - Nodes appear one by one
   - Colors animate from pending → in-progress → complete
   - Each step shows duration in the Inspector
   - Final summary shows chain metrics

5. **Inspect Step Details:**
   - Click any node to see in the Inspector panel
   - Verify data like step name, status, timestamps
   - Check that action inputs are displayed correctly

#### Expected Results Checklist

- [ ] Demo button exists and is clickable
- [ ] DAG renders with 3-5 nodes
- [ ] Nodes animate smoothly as status changes
- [ ] Inspector updates when nodes are clicked
- [ ] No JavaScript errors in browser console
- [ ] Demo completes in 5-10 seconds
- [ ] Clear visual distinction between pending/in-progress/complete states

---

### Scenario 3: Real Claude Integration (Future Roadmap)

**Status:** Not yet implemented in Phase 2. This section documents the expected workflow once Phase 3 is complete.

#### Planned Flow

1. **Install Claude Code Hook** (future)
   - Add ActionFlows hook to Claude Code settings
   - Configure Dashboard URL and session token

2. **Run Chain in Claude** (future)
   - Execute any chain in Claude Code
   - Claude automatically sends events to Dashboard backend

3. **Verify Real-Time Sync** (future)
   - Each step in Claude triggers matching event
   - Dashboard updates as Claude progresses
   - Inspector shows live logs and outputs from Claude

#### Expected Integration Points

- Claude Code triggers: session start, chain compiled, step spawned, step completed, chain finished
- Dashboard receives: real-time updates via WebSocket
- Correlation: Claude's internal chain ID matches Dashboard's sessionId
- Authentication: Secure token exchange between Claude and Dashboard

---

## Expected Results Checklist

### Backend Startup
- [ ] Backend starts on port 3001
- [ ] WebSocket endpoint available at ws://localhost:3001
- [ ] CORS headers allow localhost connections
- [ ] Redis connection optional (events work without it)

### Frontend Startup
- [ ] App starts on port 5173
- [ ] No build errors or warnings
- [ ] Dashboard loads without errors
- [ ] Empty canvas with "No active chain" message

### Event Reception
- [ ] Backend logs incoming events
- [ ] WebSocket broadcasts events to all connected clients
- [ ] Events stored in Redis (if running)

### Visualization
- [ ] DAG renders with correct node layout
- [ ] Status colors: pending (gray), in-progress (yellow), complete (green), error (red)
- [ ] Chain type badges display correctly (serial, parallel, etc.)
- [ ] Zoom/pan controls work
- [ ] Inspector panel shows step details on click

### Data Accuracy
- [ ] All fields from event appear in Inspector
- [ ] Timestamps are accurate and formatted correctly
- [ ] Step duration calculated correctly
- [ ] Action names and inputs displayed properly

---

## Architecture Overview

```
Claude Code Session (Future)
         │
         ├─ SessionStarted event
         ├─ ChainCompiled event
         └─ StepSpawned/Completed events
                │
                ▼
        Backend (Express + WebSocket)
         ├─ Port 3001
         ├─ Receives events via /events endpoint
         └─ Broadcasts via WebSocket
                │
                ▼
        Frontend (React + Vite)
         ├─ Port 5173
         ├─ Connects via WebSocket
         └─ Real-time DAG visualization
```

### Data Flow

1. **Event Injection:** Event POST to `/events` endpoint
2. **Backend Processing:** Event validated, stored (if Redis available), broadcast via WebSocket
3. **Frontend Reception:** WebSocket message received, state updated
4. **Visualization:** React component re-renders DAG with new/updated nodes
5. **User Interaction:** Click node → Inspector displays details

---

## Troubleshooting

### WebSocket Connection Issues

**Symptom:** Dashboard shows "Connecting..." indefinitely, no events appear

**Diagnosis:**
```bash
# Check backend is running
curl http://localhost:3001/health

# Check WebSocket is accessible
wscat -c ws://localhost:3001
```

**Solutions:**
- Ensure backend is running: `pnpm -F @afw/backend dev`
- Check port 3001 isn't in use: `lsof -i :3001` (macOS/Linux) or `netstat -ano | findstr :3001` (Windows)
- Verify CORS: Backend should log incoming connections with origin

### CORS Errors

**Symptom:** Browser console shows "CORS policy blocked request"

**Diagnosis:**
```bash
# Backend should be sending CORS headers
curl -I http://localhost:3001/events
```

**Solutions:**
- Restart backend: `pnpm -F @afw/backend dev`
- Verify backend origin is `http://localhost:5173`
- Check backend/src/index.ts for CORS config

### Build Errors

**Symptom:** `pnpm install` or `pnpm build` fails

**Diagnosis:**
```bash
# Clear cache
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Solutions:**
- Ensure Node 20+ is installed: `node --version`
- Ensure pnpm 8+ is installed: `pnpm --version`
- Try full clean rebuild: `pnpm install && pnpm build`

### Events Not Appearing

**Symptom:** curl commands succeed, but Dashboard shows no change

**Diagnosis:**
```bash
# Check backend is receiving events (look for log output)
# Enable verbose logging if available
DEBUG=* pnpm -F @afw/backend dev
```

**Solutions:**
- Verify event JSON matches expected schema (see test/manual-test-events.json)
- Check browser console for JavaScript errors
- Verify WebSocket is connected (browser DevTools → Network → WS)
- Try reloading Dashboard page

### Redis Connection Issues

**Symptom:** Backend starts but shows Redis connection warnings

**Solutions:**
- Redis is optional. Backend works without it (in-memory only)
- To enable persistence, start Redis and ensure ioredis connects
- Check Redis is running: `redis-cli ping` (should return "PONG")

---

## Advanced: Manual Event Testing

For detailed manual control, use the provided test files:

### Method 1: Shell Script (Recommended)
```bash
bash test/curl-commands.sh
```
Runs a pre-sequenced chain with realistic delays between events.

### Method 2: Individual curl Commands
```bash
# Edit test/manual-test-events.json for custom events
# Send manually:
curl -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d @test/manual-test-events.json
```

### Method 3: JavaScript (in Node.js or Browser)
```javascript
// In browser DevTools console
const event = {
  type: "SessionStarted",
  sessionId: "custom-001",
  timestamp: Date.now(),
  data: { userId: "test" }
};
fetch('http://localhost:3001/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(event)
});
```

---

## Performance & Limits

- **Max Concurrent Sessions:** 10 (browser connections)
- **Max Events per Session:** 100 (before DAG becomes unwieldy)
- **WebSocket Message Size:** 1 MB
- **Event Processing Latency:** <50ms (backend to browser)

For testing with large chains, monitor browser DevTools for memory usage.

---

## Next Steps

After completing E2E testing:

1. **Validate Phase 2 Checklist:**
   - [ ] Backend listens on port 3001
   - [ ] WebSocket connects at ws://localhost:3001
   - [ ] Manual curl injection works
   - [ ] Demo scenario visualizes correctly
   - [ ] All 6 event types handled

2. **Prepare for Phase 3:**
   - Review Claude Code hook integration design
   - Plan session authentication/tokens
   - Design event schema versioning

3. **Document Findings:**
   - Note any UI/UX improvements needed
   - Record performance metrics
   - Identify missing features

---

## Questions?

For issues, questions, or improvements to this guide:
- Check backend logs: `pnpm -F @afw/backend dev`
- Check browser DevTools → Console and Network tabs
- Review this guide's Troubleshooting section

