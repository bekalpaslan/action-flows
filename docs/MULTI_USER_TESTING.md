# Multi-User Scenario Testing Guide

This guide provides comprehensive instructions for testing ActionFlows Workspace in multi-user scenarios to validate Phase 3 functionality.

## Prerequisites

- ActionFlows Workspace backend running (port 3001 by default)
- ActionFlows Workspace app running (Electron or browser)
- Multiple Claude Code sessions running with ActionFlows hooks installed
- Network connectivity between all components

## Test Environment Setup

### Option 1: Single Machine (Simulated Multi-User)

1. **Terminal 1: User Alice**
   ```bash
   export ACTIONFLOWS_USER=alice
   export ACTIONFLOWS_WORKSPACE_URL=http://localhost:3001
   cd /path/to/project-alice
   # Start Claude Code session
   ```

2. **Terminal 2: User Bob**
   ```bash
   export ACTIONFLOWS_USER=bob
   export ACTIONFLOWS_WORKSPACE_URL=http://localhost:3001
   cd /path/to/project-bob
   # Start Claude Code session
   ```

3. **Terminal 3: User Charlie**
   ```bash
   export ACTIONFLOWS_USER=charlie
   export ACTIONFLOWS_WORKSPACE_URL=http://localhost:3001
   cd /path/to/project-charlie
   # Start Claude Code session
   ```

### Option 2: Multiple Machines (True Multi-User)

1. **Machine 1 (Workspace Host)**
   - Run backend: `cd packages/backend && npm start`
   - Run app: `cd packages/app && npm run dev` or `npm run electron:dev`
   - Note IP address: `hostname -I` or `ipconfig`

2. **Machine 2 (Alice)**
   ```bash
   export ACTIONFLOWS_USER=alice
   export ACTIONFLOWS_WORKSPACE_URL=http://<workspace-host-ip>:3001
   # Start Claude Code session
   ```

3. **Machine 3 (Bob)**
   ```bash
   export ACTIONFLOWS_USER=bob
   export ACTIONFLOWS_WORKSPACE_URL=http://<workspace-host-ip>:3001
   # Start Claude Code session
   ```

## Test Scenarios

### Scenario 1: User Identity Verification

**Objective:** Verify that each user's events are tagged with correct user identity.

**Steps:**
1. Start Claude session for Alice
2. Trigger a simple chain (e.g., "Run framework-health flow")
3. Observe Workspace dashboard
4. Verify Alice appears in user sidebar
5. Repeat for Bob and Charlie
6. Verify all three users appear in sidebar

**Expected Results:**
- ✅ Each user appears with their correct username
- ✅ Session count badge shows correct number (1 for each)
- ✅ Online indicator (green dot) is visible for all users
- ✅ Users are sorted with online users at top

**Validation:**
```javascript
// Backend should show events tagged with user
{
  type: 'session:started',
  data: {
    id: 'session-123',
    user: 'alice',
    ...
  }
}
```

---

### Scenario 2: Session Tree Expansion

**Objective:** Verify that each user's sessions are expandable in the tree view.

**Steps:**
1. With all three users connected, click expand arrow on Alice's user entry
2. Observe session tree
3. Verify session appears with truncated ID
4. Verify session shows "Active" status indicator
5. Repeat for Bob and Charlie

**Expected Results:**
- ✅ Tree expands smoothly (animated chevron rotation)
- ✅ Session list displays under user
- ✅ Each session shows:
  - Truncated session ID (first 8 characters)
  - Status indicator (blue spinning circle for active)
  - "Active" label
  - Timestamp ("now" for recent, "Xm ago" for older)
- ✅ Clicking session highlights it

**Failure Modes:**
- ❌ Tree doesn't expand → Check SessionTree component, expanded state
- ❌ Sessions missing → Check backend /api/users/:id/sessions endpoint
- ❌ Wrong status → Verify session status updates from WebSocket events

---

### Scenario 3: Single Session Attachment

**Objective:** Verify that clicking a session attaches it to the main visualization area.

**Steps:**
1. Expand Alice's session tree
2. Click on Alice's active session
3. Observe main area

**Expected Results:**
- ✅ Main area displays Alice's session in full-width pane
- ✅ Session header shows:
  - Alice's avatar (initials "AL")
  - Username "alice"
  - Truncated session ID
  - Status indicator (blue "Active")
  - Detach button (X)
- ✅ DAG visualization shows Alice's current chain
- ✅ Footer shows chain title and step count
- ✅ Session is marked as "attached" in sidebar tree (checkmark ✓)

**Validation:**
- Main area grid: `grid-template-rows: 1fr` and `grid-template-columns: 1fr`
- Pane position: `row: 1, col: 1`

---

### Scenario 4: Two Session Split Pane

**Objective:** Verify that attaching a second session creates a 50/50 horizontal split.

**Steps:**
1. With Alice's session attached, expand Bob's session tree
2. Click on Bob's active session
3. Observe layout change

**Expected Results:**
- ✅ Main area splits into two equal panes side-by-side
- ✅ Alice's session pane on left (50% width)
- ✅ Bob's session pane on right (50% width)
- ✅ Both panes show their respective DAGs
- ✅ Both sessions marked as attached in sidebar
- ✅ Each pane has independent scroll
- ✅ Both sessions update in real-time

**Validation:**
- Main area grid: `grid-template-rows: 1fr` and `grid-template-columns: repeat(2, 1fr)`
- Alice position: `row: 1, col: 1`
- Bob position: `row: 1, col: 2`

---

### Scenario 5: Three Session Layout

**Objective:** Verify that attaching a third session creates 2-top + 1-bottom layout.

**Steps:**
1. With Alice and Bob attached, expand Charlie's session tree
2. Click on Charlie's active session
3. Observe layout change

**Expected Results:**
- ✅ Main area shows 2 panes on top row, 1 pane on bottom row
- ✅ Top row: Alice (left 50%), Bob (right 50%)
- ✅ Bottom row: Charlie (full width 100%)
- ✅ All three panes approximately equal in height
- ✅ All three sessions update independently

**Validation:**
- Main area grid: `grid-template-rows: repeat(2, 1fr)` and `grid-template-columns: repeat(2, 1fr)`
- Alice position: `row: 1, col: 1`
- Bob position: `row: 1, col: 2`
- Charlie position: `row: 2, col: 1` with `grid-column: span 2`

---

### Scenario 6: Four Session Grid

**Objective:** Verify that attaching a fourth session creates a 2x2 grid.

**Steps:**
1. Start a second session for Alice (in different project directory)
2. With Alice, Bob, and Charlie attached, attach Alice's second session
3. Observe layout change

**Expected Results:**
- ✅ Main area shows 2x2 grid (4 equal quadrants)
- ✅ Each pane is approximately 25% of total area
- ✅ All four sessions visible simultaneously
- ✅ Real-time updates work for all four

**Validation:**
- Main area grid: `grid-template-rows: repeat(2, 1fr)` and `grid-template-columns: repeat(2, 1fr)`
- Quadrants:
  - Top-left: Alice session 1
  - Top-right: Bob session 1
  - Bottom-left: Charlie session 1
  - Bottom-right: Alice session 2

---

### Scenario 7: Maximum Sessions Warning

**Objective:** Verify that attaching a 5th session displays a warning.

**Steps:**
1. With 4 sessions attached, start a session for user Dave
2. Attempt to attach Dave's session
3. Observe warning banner

**Expected Results:**
- ✅ Warning banner appears at top of main area
- ✅ Message: "Maximum 4 sessions recommended for optimal viewing. Layout may be crowded."
- ✅ Warning icon (⚠) displayed
- ✅ Layout adjusts to 2x3 grid (2 rows, 3 columns)
- ✅ Dave's session is attached despite warning

**Validation:**
- Warning banner has class `.layout-warning`
- Background color: rgba(251, 191, 36, 0.15) (amber/yellow)
- Grid becomes: `grid-template-rows: repeat(2, 1fr)` and `grid-template-columns: repeat(3, 1fr)`

---

### Scenario 8: Session Detachment

**Objective:** Verify that clicking the detach button removes a session from view.

**Steps:**
1. With multiple sessions attached, click the X button on Bob's session pane header
2. Observe layout adjustment

**Expected Results:**
- ✅ Bob's session pane disappears
- ✅ Remaining sessions expand to fill available space
- ✅ Layout recalculates based on remaining session count
- ✅ Bob's session no longer marked as "attached" in sidebar (checkmark removed)
- ✅ Bob's session remains in sidebar tree and can be re-attached

**Validation:**
- If 4 sessions → detach 1 → becomes 3-session layout (2-top + 1-bottom)
- If 2 sessions → detach 1 → becomes full-width single pane

---

### Scenario 9: Detach All Sessions

**Objective:** Verify empty state when all sessions are detached.

**Steps:**
1. With multiple sessions attached, detach all sessions one by one
2. Observe main area after last detachment

**Expected Results:**
- ✅ Main area shows empty state
- ✅ Empty state displays:
  - Large icon (📊)
  - Heading: "No Sessions Attached"
  - Message: "Click a session in the sidebar to view its visualization"
- ✅ No sessions marked as attached in sidebar

---

### Scenario 10: Concurrent Chain Execution

**Objective:** Verify that multiple users can run chains simultaneously and all update in real-time.

**Steps:**
1. Attach sessions for Alice, Bob, and Charlie (3 sessions)
2. In Alice's Claude: "Run framework-health flow"
3. Immediately in Bob's Claude: "Run audit backend security"
4. Immediately in Charlie's Claude: "Run coverage-analysis"
5. Observe all three panes

**Expected Results:**
- ✅ All three sessions show "Active" status
- ✅ All three DAGs appear and begin populating with steps
- ✅ Steps update independently as each chain progresses
- ✅ No cross-talk between sessions (Alice's steps don't appear in Bob's pane)
- ✅ All panes scroll independently
- ✅ Status indicators update correctly for each session

**Validation:**
- Check browser DevTools → Network → WS: Verify events arrive with correct sessionId
- Check events: `step_spawned`, `step_completed` events are tagged with correct session
- Verify DAG nodes change color: yellow (spawned) → green (completed)

---

### Scenario 11: Session Persistence

**Objective:** Verify that attached sessions persist across Workspace app restarts.

**Steps:**
1. Attach Alice and Bob's sessions
2. Close Workspace app
3. Reopen Workspace app
4. Observe main area

**Expected Results:**
- ✅ Alice and Bob's sessions are still attached
- ✅ Layout is restored (2-pane split)
- ✅ Sessions reconnect and show live state

**Validation:**
- localStorage key `afw:attached-sessions` contains `["alice-session-id", "bob-session-id"]`
- Sessions fetch fresh data from backend on app load

---

### Scenario 12: User Goes Offline

**Objective:** Verify that offline users are handled gracefully.

**Steps:**
1. With all three users attached, stop Alice's Claude session
2. Observe user sidebar and Alice's session pane

**Expected Results:**
- ✅ Alice's session status changes to "Ended"
- ✅ Status indicator in sidebar changes to gray with "Ended" label
- ✅ Alice's session pane shows "Ended" status
- ✅ Alice's user entry remains in sidebar (moves to "recent" section if implemented)
- ✅ Online indicator (green dot) disappears from Alice's avatar
- ✅ Session count decreases to 0

**Validation:**
- WebSocket event: `{ type: 'session:ended', data: { id: 'alice-session-id', ... } }`
- Session status updates to 'completed' or 'ended'

---

## Common Issues & Troubleshooting

### Issue: Users not appearing in sidebar

**Possible Causes:**
- Backend not receiving session events from hooks
- ACTIONFLOWS_USER environment variable not set
- WebSocket connection not established

**Debug:**
1. Check backend logs for incoming POST /api/events
2. Verify environment variable: `echo $ACTIONFLOWS_USER`
3. Check browser DevTools → Network → WS → Messages tab
4. Test manual event: `curl -X POST http://localhost:3001/api/events -d '{"type":"session:started","data":{"id":"test","user":"alice"}}'`

---

### Issue: Sessions not showing in tree

**Possible Causes:**
- GET /api/users/:userId/sessions endpoint failing
- Sessions not being stored in backend
- useUserSessions hook not fetching correctly

**Debug:**
1. Check backend logs for GET /api/users/:userId/sessions requests
2. Test endpoint: `curl http://localhost:3001/api/users/alice/sessions`
3. Check browser DevTools → Console for errors
4. Verify backend session storage (Redis or in-memory)

---

### Issue: Attached sessions not displaying DAG

**Possible Causes:**
- Session has no currentChain
- Chain data structure is invalid
- ChainDAG component error

**Debug:**
1. Check session object: Does `session.currentChain` exist?
2. Check chain structure: Does it have `id`, `title`, `steps`?
3. Check browser DevTools → Console for React errors
4. Verify WebSocket events include chain data

---

### Issue: Layout not splitting correctly

**Possible Causes:**
- SplitPaneLayout grid calculation incorrect
- CSS grid not applying
- Session count mismatch

**Debug:**
1. Inspect main area element → Check `grid-template-rows` and `grid-template-columns`
2. Verify `attachedSessions.length` matches expected count
3. Check browser console for errors in calculateLayout function
4. Test with different session counts: 1, 2, 3, 4

---

### Issue: Detach button not working

**Possible Causes:**
- onSessionDetach callback not wired correctly
- useAttachedSessions not updating state
- React state update not triggering re-render

**Debug:**
1. Add console.log in SessionPane detach handler
2. Verify onSessionDetach is called with correct sessionId
3. Check useAttachedSessions hook: Does detachSession update attachedIds?
4. Check React DevTools → Components → SplitPaneLayout → props.sessions

---

## Success Criteria

All scenarios pass when:

- ✅ Multiple users can connect simultaneously
- ✅ Each user's sessions appear in the sidebar tree
- ✅ Sessions can be attached and detached dynamically
- ✅ Layout adjusts correctly for 1-6 attached sessions
- ✅ All attached sessions update in real-time
- ✅ No cross-talk between sessions
- ✅ Detached sessions can be re-attached
- ✅ Empty state displays when no sessions attached
- ✅ Warning appears for >4 attached sessions
- ✅ User online/offline status updates correctly

---

## Automated Testing

For automated E2E testing, consider:

```typescript
// Playwright test example
test('Multi-user split-pane layout', async ({ page }) => {
  // Simulate multiple users connecting
  await simulateUser('alice', 'session-1');
  await simulateUser('bob', 'session-2');
  await simulateUser('charlie', 'session-3');

  // Attach sessions
  await page.click('[data-session-id="session-1"]');
  await page.click('[data-session-id="session-2"]');
  await page.click('[data-session-id="session-3"]');

  // Verify layout
  const layout = await page.locator('.split-pane-layout');
  await expect(layout).toHaveCSS('grid-template-rows', 'repeat(2, 1fr)');
  await expect(layout).toHaveCSS('grid-template-columns', 'repeat(2, 1fr)');

  // Verify all panes visible
  await expect(page.locator('.session-pane')).toHaveCount(3);
});
```

---

## Notes

- **Performance:** With 4+ attached sessions, monitor browser performance (CPU, memory)
- **Network:** All users must reach the same backend WebSocket endpoint
- **Firewall:** Ensure port 3001 is open for WebSocket connections
- **Browser:** Tested on Chrome, Firefox, Edge, Safari. Electron app uses Chromium.

---

## Next Steps

After validating multi-user scenarios, proceed to:
- **Phase 4:** Timeline view (alternative to DAG visualization)
- **Phase 5:** Control features (pause/resume/cancel commands)
- **Phase 6:** Conversation interface (inject input from Workspace)
