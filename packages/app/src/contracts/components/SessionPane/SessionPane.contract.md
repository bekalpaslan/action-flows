# Component Contract: SessionPane

**File:** `packages/app/src/components/SessionPane/SessionPane.tsx`
**Type:** feature
**Parent Group:** SessionPane/
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SessionPane
- **Introduced:** 2025-11-15
- **Description:** Grid-positioned session container displaying DAG/timeline visualization, conversation panel, and session controls with adaptive layout.

---

## Render Location

**Mounts Under:**
- Legacy grid layouts (pre-SessionPanelLayout migration)

**Render Conditions:**
1. Session attached to workbench
2. Grid position provided via `position` prop
3. Typically replaced by SessionPanelLayout in current architecture

**Positioning:** relative (grid-positioned via inline styles)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Session attached to workbench grid
- Grid layout recalculated

**Key Effects:**
1. **Dependencies:** `[session.id]`
   - **Side Effects:** useSessionInput hook initializes
   - **Cleanup:** None
   - **Condition:** Runs when session changes

2. **Dependencies:** `[isCliSession, session.id, isClosing]`
   - **Side Effects:** Stops CLI session on close
   - **Cleanup:** None
   - **Condition:** Runs when close button clicked

**Cleanup Actions:**
- Stops Claude CLI process if isCliSession=true

**Unmount Triggers:**
- Session detached from grid
- Parent workbench unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| session | `Session` | ✅ | N/A | Session data to display |
| onDetach | `(sessionId: string) => void` | ✅ | N/A | Handler for detach button |
| onClose | `(sessionId: string) => void` | ❌ | N/A | Handler for close button (CLI sessions) |
| position | `{ row: number; col: number; totalRows: number; totalCols: number }` | ✅ | N/A | Grid position for CSS layout |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onDetach | `(sessionId: string) => void` | User clicks detach → requests removal from grid |
| onClose | `(sessionId: string) => void` | User clicks close (CLI) → requests session termination |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onStepSelected | `(stepNumber: number) => void` | ChainDAG, TimelineView | User clicks step → shows StepInspector |
| onSubmitInput | `(input: string) => Promise<void>` | ConversationPanel | User submits input → calls submitInput |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| selectedStep | `number \| null` | `null` | setSelectedStep (via DAG/Timeline callbacks) |
| viewMode | `'dag' \| 'timeline'` | `'dag'` | setViewMode (toggle buttons) |
| isClosing | `boolean` | `false` | setIsClosing (during close operation) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `prefillChatInput` (via useDiscussButton) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| isCliSession | `boolean` | `session.metadata?.type` | Checks if type === 'claude-cli' |
| statusColor | `string` | `session.status` | Maps status to color class |
| statusLabel | `string` | `session.status` | Maps status to display label |

### Custom Hooks
- `useSessionInput()` — Submits user input to backend
- `useDiscussButton({ componentName, getContext })` — Discussion dialog integration

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when user detaches or closes session
- **Example:**
  ```tsx
  handleDetach() → onDetach(session.id) → parent removes from grid
  ```

### Child Communication
- **Child:** ChainDAG / TimelineView
- **Mechanism:** props
- **Data Flow:** Passes `chain`, `onStepSelected` callback

- **Child:** ConversationPanel
- **Mechanism:** props
- **Data Flow:** Passes `session`, `onSubmitInput` callback

- **Child:** StepInspector
- **Mechanism:** conditional render
- **Data Flow:** Shows when selectedStep !== null

### Sibling Communication
- **Sibling:** None (independent pane)
- **Mechanism:** N/A
- **Description:** N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Prefills chat input via discuss dialog

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/claude-cli/:sessionId/stop` | POST | Close button (CLI sessions) | Logs error if fails, closes anyway |
| `/api/sessions/:sessionId/input` | POST | ConversationPanel submit (via useSessionInput) | Updates session state |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A (events handled by parent hooks) |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| N/A | N/A | N/A | N/A |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| N/A | N/A | N/A | N/A |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| N/A | N/A | N/A |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.session-pane`
- `.session-pane-header`
- `.session-pane-info`
- `.session-user`
- `.user-avatar-small`
- `.session-id-display`
- `.session-status`
- `.session-pane-controls`
- `.view-toggle`
- `.view-toggle-btn`
- `.session-detach-btn`
- `.session-close-btn`
- `.session-pane-content`
- `.visualization-section`
- `.visualization-wrapper`
- `.conversation-section`
- `.session-details-panel`
- `.session-pane-footer`
- `.chain-title`
- `.chain-steps`

**Data Test IDs:**
- N/A (use CSS selectors)

**ARIA Labels:**
- `aria-label="Stop CLI process and close this session"` (close button, CLI)
- `aria-label="Detach this session from view"` (detach button, non-CLI)

**Visual Landmarks:**
1. Header user avatar (`.user-avatar-small`) — 2-letter initials, colored circle
2. Session ID code block (`.session-id-display > code`) — Monospace, truncated to 8 chars
3. Status indicator (`.session-status > .status-dot`) — Color-coded dot with label
4. View toggle (`.view-toggle`) — DAG/Timeline toggle buttons
5. Detach/Close button (`.session-detach-btn`) — × symbol, top right

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SP-001: DAG/Timeline Rendering
- **Type:** render
- **Target:** Visualization section shows ChainDAG or TimelineView
- **Condition:** When session.currentChain exists, visualization renders
- **Failure Mode:** Blank visualization area
- **Automation Script:**
```javascript
// Find session pane
const sessionPane = await page.locator('.session-pane').first();

// Verify visualization renders
const hasDAG = await sessionPane.locator('.chain-dag').isVisible();
const hasTimeline = await sessionPane.locator('.timeline-view').isVisible();

if (!hasDAG && !hasTimeline) {
  throw new Error('No visualization rendered');
}
```

#### HC-SP-002: View Toggle Functionality
- **Type:** interaction
- **Target:** DAG/Timeline toggle buttons
- **Condition:** Clicking toggle switches between DAG and Timeline views
- **Failure Mode:** Cannot switch visualization modes
- **Automation Script:**
```javascript
const sessionPane = await page.locator('.session-pane').first();

// Click Timeline button
await sessionPane.locator('.view-toggle-btn:has-text("Timeline")').click();

// Verify timeline view active
await page.waitForSelector('.timeline-view', { visible: true, timeout: 1000 });

// Click DAG button
await sessionPane.locator('.view-toggle-btn:has-text("DAG")').click();

// Verify DAG view active
await page.waitForSelector('.chain-dag', { visible: true, timeout: 1000 });
```

#### HC-SP-003: Conversation Panel Integration
- **Type:** render
- **Target:** ConversationPanel renders in conversation-section
- **Condition:** ConversationPanel always visible
- **Failure Mode:** Cannot interact with session
- **Automation Script:**
```javascript
const sessionPane = await page.locator('.session-pane').first();
const conversationPanel = sessionPane.locator('.conversation-section .conversation-panel');

if (!await conversationPanel.isVisible()) {
  throw new Error('ConversationPanel not rendered');
}
```

#### HC-SP-004: CLI Session Close Handler
- **Type:** integration
- **Target:** Close button for CLI sessions stops process
- **Condition:** Clicking close calls claudeCliService.stopSession
- **Failure Mode:** CLI process orphaned
- **Automation Script:**
```javascript
// Find CLI session pane
const cliPane = await page.locator('.session-pane').filter({
  has: page.locator('.session-close-btn')
}).first();

// Click close button
await cliPane.locator('.session-close-btn').click();

// Verify pane removed or closing state
await page.waitForTimeout(500);
const isClosing = await cliPane.evaluate(el => {
  return el.querySelector('.session-close-btn')?.textContent === '...';
});

if (!isClosing) {
  throw new Error('Close handler not triggered');
}
```

### Warning Checks (Should Pass)

#### HC-SP-005: Step Inspector Opens
- **Type:** interaction
- **Target:** StepInspector conditional render
- **Condition:** Clicking step in DAG/Timeline shows StepInspector
- **Failure Mode:** Cannot view step details

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| initial-render | 200 | ms | Time from mount to first paint |
| view-toggle | 100 | ms | Time to switch DAG/Timeline |
| step-inspector-open | 150 | ms | Time to open StepInspector |

---

## Dependencies

**Required Contexts:**
- DiscussContext (optional, for DiscussButton)

**Required Hooks:**
- `useSessionInput()`
- `useDiscussButton()`

**Child Components:**
- ChainDAG
- TimelineView
- ConversationPanel
- StepInspector (conditional)
- ControlButtons
- DiscussButton
- DiscussDialog

**Required Props:**
- `session`
- `onDetach`
- `position`

---

## Notes

- **Grid positioning:** Uses inline styles from `position` prop for CSS Grid layout
- **CLI detection:** Checks `session.metadata?.type === 'claude-cli'` to show close vs detach button
- **View mode persistence:** View mode resets to 'dag' on mount (no localStorage)
- **Empty state:** Shows session details panel when no currentChain exists
- **Status formatting:** Consistent status mapping (in_progress → Active, completed → Complete, etc.)
- **Detach vs Close:** Detach removes from view, Close terminates CLI process
- **Closing safety:** Sets `isClosing` flag to prevent double-clicks, disables button during operation

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
