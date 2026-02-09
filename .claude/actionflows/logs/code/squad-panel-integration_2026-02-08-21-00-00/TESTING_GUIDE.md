# SquadPanel Integration - Testing Guide

## Quick Start

### 1. Launch the App
```bash
pnpm dev:app
```

The app will start on `http://localhost:5173`

### 2. View Demo Mode (No Session Required)
1. **Don't attach any session** - keep the app in default state
2. Look for the **"Show Squad"** button in the top header (purple button)
3. The SquadPanel appears below FileExplorer in the left sidebar
4. You should see:
   - **Orchestrator** in the center (large card)
   - **4 Subagents** distributed on left and right sides:
     - Bash (dark green accent)
     - Read (blue accent)
     - Write (yellow accent)
     - Grep (bright green accent)

### 3. Interact with Demo Agents
- **Click any agent card** to expand its log panel
- **Hover over an agent** to see eye-tracking animation
- **Observe different statuses:**
  - Orchestrator: idle (waiting for tasks)
  - Bash agent: working (progress bar visible)
  - Read agent: thinking (thinking state)
  - Write agent: success (green success message)
  - Grep agent: error (red error message)

### 4. Toggle Visibility
- Click **"Show Squad"** button to hide the panel
- Click **"Hide Squad"** button to show it again

---

## Detailed Testing Scenarios

### Scenario A: Pure Demo Mode (Recommended First Test)

**Setup:** Don't start any sessions

**Expected Results:**
1. SquadPanel renders with demo agents
2. Each agent has appropriate status colors:
   - Green tint = success status
   - Red tint = error status
   - Purple tint = thinking status
   - Gray/neutral = idle/working
3. Each agent has 2-4 sample logs visible in expandable panels
4. Progress bars visible for working agent
5. No console errors

**Log Messages to Expect:**
```
Orchestrator logs:
  - "Session initialized and ready"
  - "Orchestrator standing by for tasks"

Bash logs:
  - "Task started"
  - "Processing in progress"
  - "All checks passed"
  - (if working) Progress updates

Read logs:
  - "Analyzing requirements..."
  - "Planning execution strategy"

Write logs:
  - "Task completed successfully"

Grep logs:
  - "Task failed: Resource not found"
  - Error status indicator
```

### Scenario B: Real Mode with Session

**Setup:**
1. Click **"New Session"** button
2. Wait for Claude CLI session to start and attach

**Expected Results:**
1. SquadPanel switches from demo agents to real agents
2. Agents appear as the session executes
3. Agent logs update in real-time from WebSocket events
4. Status changes reflect actual orchestrator/step events
5. When session completes, orchestrator returns to idle

**Events to Watch For:**
- `session:started` → Orchestrator appears (idle status)
- `step:spawned` → New subagent appears with appropriate role
- `step:started` → Agent status changes to working
- `step:completed` → Agent status changes to success
- `step:failed` → Agent status changes to error
- `chain:completed` → Orchestrator status changes

### Scenario C: Toggle Between Demo and Real

**Setup:**
1. Start a session (click "New Session")
2. Let it progress a bit
3. Click "Hide Squad" button
4. Click "Show Squad" button again

**Expected Results:**
1. Panel hides/shows without losing agent state
2. Real agents remain visible after toggle
3. No performance degradation or re-renders

### Scenario D: Multiple Sessions

**Setup:**
1. Attach multiple sessions
2. Open SquadPanel for each

**Expected Results:**
1. SquadPanel shows agents for the **first attached session**
2. Agents update as that session progresses
3. Switch sessions using session tabs
4. SquadPanel updates to show new session's agents

---

## Visual Inspection Checklist

Use this to verify correct rendering:

### Layout
- [ ] SquadPanel appears in left sidebar below FileExplorer
- [ ] Visual separator (border-top) between FileExplorer and SquadPanel
- [ ] Orchestrator is centered and larger than subagents
- [ ] Subagents distributed evenly on left/right sides

### Agent Cards
- [ ] Each card displays agent name and role
- [ ] Avatar with appropriate color scheme for role
- [ ] Status indicator (icon or color change)
- [ ] Progress bar visible for working agents
- [ ] Current action text displayed below agent

### Log Panels
- [ ] Expandable on click (single panel open at a time)
- [ ] Log entries display with timestamps
- [ ] Different log types have different colors:
  - Info: neutral blue
  - Success: green
  - Error: red
  - Warning: orange/yellow
  - Thinking: purple/gray

### Header Button
- [ ] Purple color when squad is visible
- [ ] Gray color when squad is hidden
- [ ] Text reads "Hide Squad" / "Show Squad" appropriately
- [ ] No layout shift when toggling

### Demo Mode Indicators
- [ ] Demo agents only appear when `sessionId === null`
- [ ] Demo agents have consistent IDs: `demo-agent-{role}-{index}`
- [ ] Orchestrator ID: `demo-orchestrator`
- [ ] Each demo agent has realistic logs matching its status

---

## Performance Testing

### Memory
- [ ] No memory leaks when toggling visibility
- [ ] Demo agents cleanup properly on unmount
- [ ] WebSocket cleanup works when switching modes

### Rendering
- [ ] SquadPanel re-renders smoothly on agent status changes
- [ ] No unnecessary re-renders when another component updates
- [ ] Expand/collapse animations are smooth (< 300ms)

### API Integration
- [ ] Demo mode doesn't require WebSocket connection
- [ ] Real mode properly subscribes to WebSocket events
- [ ] No duplicate event listeners on re-renders

---

## Common Issues & Troubleshooting

### Issue: SquadPanel Not Appearing
**Causes:**
- showSquadPanel state is false (click "Show Squad" button)
- Component not imported properly

**Fix:**
- Verify import in AppContent.tsx: `import { SquadPanel } from './SquadPanel'`
- Check browser console for errors

### Issue: Demo Agents Not Showing
**Causes:**
- sessionId is not null (session is attached)
- useDemoAgents hook not called

**Fix:**
- Detach all sessions (click X on session tabs)
- Ensure no "New Session" is running
- Check console for: `sessionId === null` condition

### Issue: Real Agents Not Showing
**Causes:**
- WebSocket not connected
- Session doesn't have agents yet
- sessionId not properly passed to SquadPanel

**Fix:**
- Check WebSocket status in header (should be "Connected")
- Wait for session to start (might take a few seconds)
- Start session with "New Session" button

### Issue: Logs Not Appearing
**Causes:**
- Agent not expanded
- Logs were cleared
- Agent status doesn't match expected logs

**Fix:**
- Click on agent card to expand log panel
- Check agent status color (should match log type)
- In real mode, wait for WebSocket events to arrive

### Issue: TypeScript Errors
**Causes:**
- Project TypeScript config issues (pre-existing)
- Import resolution issues

**Fix:**
- These are pre-existing config issues, not from this integration
- Try: `pnpm install` to ensure dependencies are correct

---

## Browser DevTools Inspection

### React DevTools
1. Open DevTools → React Components tab
2. Find `<SquadPanel>` component in tree
3. Check props:
   - `sessionId`: null for demo, SessionId for real
   - `placement`: "left"
   - `audioEnabled`: false
4. Check state in hooks:
   - `useAgentTracking`: orchestrator and subagents
   - `useAgentInteractions`: hoveredAgentId, expandedAgentId

### Network Tab
1. With demo mode: no WebSocket requests
2. With real mode: WebSocket connection on port 3001
3. Verify event messages being received

### Console
1. No errors when toggling visibility
2. No errors when expanding agent logs
3. No errors when switching between demo/real mode

---

## Expected Console Output

### Demo Mode (First Load)
```
[No console errors expected]
```

### Real Mode (After Session Start)
```
WebSocket event: session:started
WebSocket event: step:spawned
WebSocket event: step:started
[Agent logs update accordingly]
```

### During Toggle
```
[No errors - smooth state transition]
```

---

## Final Verification Checklist

- [ ] SquadPanel renders in left sidebar
- [ ] Demo agents show when no session attached
- [ ] Real agents show when session attached
- [ ] Agents can be expanded to show logs
- [ ] Status colors match agent status
- [ ] Toggle button works smoothly
- [ ] No console errors
- [ ] No TypeScript errors in modified files
- [ ] Memory/performance is acceptable
- [ ] Layout doesn't break with different session counts

---

## Documentation References

- **SquadPanel Component:** `packages/app/src/components/SquadPanel/SquadPanel.tsx`
- **Demo Hook:** `packages/app/src/components/SquadPanel/useDemoAgents.ts`
- **Tracking Hook:** `packages/app/src/components/SquadPanel/useAgentTracking.ts`
- **Integration:** `packages/app/src/components/AppContent.tsx`
- **Types:** `packages/app/src/components/SquadPanel/types.ts`

---

## Support

For issues or questions:
1. Check this guide's "Troubleshooting" section
2. Review the changes.md file for implementation details
3. Inspect component code for logic verification
4. Check browser console and DevTools for errors
