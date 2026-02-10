# Component Contract: RightVisualizationArea

**File:** `packages/app/src/components/SessionPanel/RightVisualizationArea.tsx`
**Type:** utility
**Parent Group:** SessionPanel/
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** RightVisualizationArea
- **Introduced:** 2026-01-20
- **Description:** Container for HybridFlowViz, isolating visualization from left panel concerns, with empty/loading/error states.

---

## Render Location

**Mounts Under:**
- SessionPanelLayout (right side of split)

**Render Conditions:**
1. Session prop provided
2. Renders within `.session-panel-layout__right` div

**Positioning:** relative (fills parent)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- SessionPanelLayout mounts
- Session changes

**Key Effects:**
1. **Dependencies:** `[session.id]`
   - **Side Effects:** useActiveChain hook fetches chain from backend
   - **Cleanup:** Aborts fetch
   - **Condition:** Runs when session changes

**Cleanup Actions:**
- useActiveChain cleanup (aborts pending fetch)

**Unmount Triggers:**
- SessionPanelLayout unmounts
- Session detached

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| session | `Session` | ✅ | N/A | Session to display |
| onNodeClick | `(nodeId: string) => void` | ❌ | N/A | Callback when node clicked |
| onAgentClick | `(agentId: string) => void` | ❌ | N/A | Callback when agent clicked |
| showAgents | `boolean` | ❌ | `true` | Show agents overlay |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onNodeClick | `(nodeId: string) => void` | User clicks flow node → parent handles |
| onAgentClick | `(agentId: string) => void` | User clicks agent → parent handles |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onNodeClick | `(nodeId: string) => void` | HybridFlowViz | Node click → parent callback |
| onAgentClick | `(agentId: string) => void` | HybridFlowViz | Agent click → parent callback |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| N/A | N/A | N/A | State managed by useActiveChain hook |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| N/A | N/A |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| N/A | N/A | N/A | N/A |

### Custom Hooks
- `useActiveChain(session.id)` — Fetches active chain from backend

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when user interacts with visualization
- **Example:**
  ```tsx
  onNodeClick(nodeId) → parent shows StepInspector
  ```

### Child Communication
- **Child:** HybridFlowViz
- **Mechanism:** props
- **Data Flow:** Passes `sessionId`, `chain`, `chainId`, `onNodeClick`, `onAgentClick`, `showAgents`, `enableAnimations: true`

### Sibling Communication
- **Sibling:** LeftPanelStack
- **Mechanism:** None (independent)
- **Description:** N/A

### Context Interaction
- **Context:** None
- **Role:** N/A
- **Operations:** N/A

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/sessions/:sessionId/chains/active` | GET | Mount, session change (via useActiveChain) | Populates activeChain state |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A (handled by HybridFlowViz or parent) |

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
- `.right-visualization-area`
- `.right-visualization-area__empty-state`
- `.empty-state__icon`
- `.empty-state__title`
- `.empty-state__message`

**Data Test IDs:**
- N/A (use CSS selectors)

**ARIA Labels:**
- None specified (consider adding for accessibility)

**Visual Landmarks:**
1. Loading state (`.empty-state__icon:has-text("⏳")`) — Shows during fetch
2. Error state (`.empty-state__icon:has-text("⚠️")`) — Shows on fetch error
3. Empty state (`.empty-state__icon:has-text("📊")`) — Shows when no chain
4. HybridFlowViz (when chain exists) — Full flow visualization

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-RVA-001: Chain Fetch on Mount
- **Type:** data-fetch
- **Target:** useActiveChain hook HTTP GET
- **Condition:** API call completes within 2s
- **Failure Mode:** Shows loading state indefinitely
- **Automation Script:**
```javascript
const rightArea = await page.locator('.right-visualization-area').first();

// Wait for loading state
await rightArea.locator('.empty-state__icon:has-text("⏳")').waitFor({ visible: true, timeout: 500 });

// Wait for loading to complete (either viz or empty state)
await page.waitForFunction(() => {
  const area = document.querySelector('.right-visualization-area');
  const hasViz = area?.querySelector('.hybrid-flow-viz');
  const hasEmptyState = area?.querySelector('.empty-state__icon:has-text("📊")');
  return hasViz || hasEmptyState;
}, { timeout: 3000 });
```

#### HC-RVA-002: Empty State Display
- **Type:** render
- **Target:** Empty state when no chain
- **Condition:** Shows "No Active Chain" message
- **Failure Mode:** Blank or confusing display
- **Automation Script:**
```javascript
// Assume session has no chain (mock or test data)
const rightArea = await page.locator('.right-visualization-area').first();

const emptyState = rightArea.locator('.empty-state__icon:has-text("📊")');
const emptyTitle = rightArea.locator('.empty-state__title:has-text("No Active Chain")');

if (!await emptyState.isVisible() || !await emptyTitle.isVisible()) {
  throw new Error('Empty state not showing when no chain');
}
```

#### HC-RVA-003: Error State Display
- **Type:** render
- **Target:** Error state on fetch failure
- **Condition:** Shows error message with reason
- **Failure Mode:** No feedback on failure
- **Automation Script:**
```javascript
// Mock API failure (if testable)
// Or test with invalid session ID

const rightArea = await page.locator('.right-visualization-area').first();

const errorIcon = rightArea.locator('.empty-state__icon:has-text("⚠️")');
const errorTitle = rightArea.locator('.empty-state__title:has-text("Error Loading Chain")');

if (!await errorIcon.isVisible() || !await errorTitle.isVisible()) {
  throw new Error('Error state not showing on fetch failure');
}
```

#### HC-RVA-004: HybridFlowViz Integration
- **Type:** integration
- **Target:** HybridFlowViz renders when chain exists
- **Condition:** Component renders with correct props
- **Failure Mode:** No visualization shown
- **Automation Script:**
```javascript
// Assume session has active chain
const rightArea = await page.locator('.right-visualization-area').first();

// Wait for viz to render
await rightArea.locator('.hybrid-flow-viz').waitFor({ visible: true, timeout: 3000 });

// Verify ReactFlow rendered (HybridFlowViz uses ReactFlow)
const hasReactFlow = await rightArea.locator('.react-flow').isVisible();

if (!hasReactFlow) {
  throw new Error('HybridFlowViz not rendering ReactFlow');
}
```

### Warning Checks (Should Pass)

#### HC-RVA-005: Loading State Timeout
- **Type:** performance
- **Target:** Loading state resolves within 2s
- **Condition:** Fetch completes or errors within threshold
- **Failure Mode:** Poor user experience

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| chain-fetch | 1500 | ms | Time to fetch active chain |
| viz-render | 500 | ms | Time to render HybridFlowViz |
| empty-state-render | 50 | ms | Time to show empty state |

---

## Dependencies

**Required Contexts:**
- None

**Required Hooks:**
- `useActiveChain(sessionId)`

**Child Components:**
- HybridFlowViz (conditional, when chain exists)

**Required Props:**
- `session`

---

## Notes

- **State machine:** loading → (activeChain | error | empty)
- **Loading indicator:** Shows ⏳ icon with "Loading Chain..." message
- **Error handling:** Shows ⚠️ icon with error message text
- **Empty state:** Shows 📊 icon with "No Active Chain" when session has no chains
- **HybridFlowViz props:** Passes `enableAnimations: true` for animated flow visualization
- **useActiveChain hook:** Fetches from backend API, not from session prop (backend is source of truth)
- **Isolation principle:** Keeps visualization concerns separate from left panel chat/input logic
- **Full area rendering:** Container fills entire right panel width/height

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
