# Component Contract: SessionTree

**File:** `packages/app/src/components/SessionTree/SessionTree.tsx`
**Type:** widget
**Parent Group:** SessionTree/
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SessionTree
- **Introduced:** 2025-11-20
- **Description:** Expandable tree component displaying sessions for a user with attach/detach toggle functionality and status indicators.

---

## Render Location

**Mounts Under:**
- User-based session lists (legacy, may not be actively used in current architecture)

**Render Conditions:**
1. User has associated sessions
2. Parent renders SessionTree component

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders tree for user
- Sessions prop updates

**Key Effects:**
1. **Dependencies:** `[expanded]`
   - **Side Effects:** Syncs local `isExpanded` state with prop
   - **Cleanup:** None
   - **Condition:** Runs when `expanded` prop changes

**Cleanup Actions:**
- None (stateless component)

**Unmount Triggers:**
- Parent unmounts
- User removed from display

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| userId | `string` | ✅ | N/A | User identifier for the tree |
| sessions | `Session[]` | ✅ | N/A | Array of sessions for this user |
| attachedSessionIds | `string[]` | ✅ | N/A | Currently attached session IDs |
| onSessionAttach | `(sessionId: string) => void` | ✅ | N/A | Callback to attach session |
| onSessionDetach | `(sessionId: string) => void` | ✅ | N/A | Callback to detach session |
| expanded | `boolean` | ❌ | `false` | Initial expanded state |
| onToggle | `() => void` | ❌ | N/A | Callback when expand/collapse toggled |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSessionAttach | `(sessionId: string) => void` | User clicks unattached session → requests attach |
| onSessionDetach | `(sessionId: string) => void` | User clicks attached session → requests detach |
| onToggle | `() => void` | User toggles expand/collapse → notifies parent |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | N/A | Leaf component with internal buttons |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| isExpanded | `boolean` | `expanded` prop | setIsExpanded (toggle button, prop changes) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| N/A | N/A |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| N/A | N/A | N/A | N/A (uses helper functions) |

### Custom Hooks
- None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when user toggles sessions or clicks to attach/detach
- **Example:**
  ```tsx
  handleSessionClick(sessionId) → isAttached ? onSessionDetach : onSessionAttach
  ```

### Child Communication
- **Child:** None (renders own buttons)
- **Mechanism:** N/A
- **Data Flow:** N/A

### Sibling Communication
- **Sibling:** Other SessionTree instances (for different users)
- **Mechanism:** Independent
- **Description:** Each tree manages its own state

### Context Interaction
- **Context:** None
- **Role:** N/A
- **Operations:** N/A

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| N/A | N/A | N/A | N/A (handled by parent) |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A (handled by parent) |

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
- `.session-tree`
- `.session-tree-toggle`
- `.tree-chevron`
- `.tree-chevron.expanded`
- `.tree-label`
- `.session-tree-content`
- `.session-list`
- `.session-item`
- `.session-button`
- `.session-button.attached`
- `.session-content`
- `.session-id-wrapper`
- `.session-id`
- `.attached-checkmark`
- `.session-details`
- `.status-indicator`
- `.status-label`
- `.current-chain`
- `.session-timestamp`
- `.session-tree-empty`

**Data Test IDs:**
- N/A (use CSS selectors)

**ARIA Labels:**
- `aria-label="Collapse sessions" | "Expand sessions"` (toggle button)
- `aria-label="Attach session {id}" | "Detach session {id}"` (session buttons)

**Visual Landmarks:**
1. Toggle button with chevron (`.tree-chevron`) — ▶ collapsed, ▼ expanded
2. Session count in label (`.tree-label`) — Shows "Sessions (N)"
3. Attached checkmark (`.attached-checkmark`) — ✓ symbol next to attached sessions
4. Status indicator dot (`.status-indicator`) — Color-coded status
5. Empty state message (`.session-tree-empty`) — When no sessions

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-ST-001: Expand/Collapse Functionality
- **Type:** interaction
- **Target:** Toggle button expands/collapses list
- **Condition:** Clicking toggle shows/hides session list
- **Failure Mode:** Cannot view sessions
- **Automation Script:**
```javascript
// Find session tree
const tree = await page.locator('.session-tree').first();

// Verify initially collapsed (or expanded based on prop)
const isExpanded = await tree.locator('.tree-chevron.expanded').isVisible();

// Click toggle
await tree.locator('.session-tree-toggle').click();

// Verify state changed
const isNowExpanded = await tree.locator('.tree-chevron.expanded').isVisible();
if (isExpanded === isNowExpanded) {
  throw new Error('Toggle did not change expanded state');
}

// Verify content visibility matches
const contentVisible = await tree.locator('.session-tree-content').isVisible();
if (isNowExpanded !== contentVisible) {
  throw new Error('Content visibility does not match expanded state');
}
```

#### HC-ST-002: Attach/Detach Toggle
- **Type:** interaction
- **Target:** Session button toggles attach/detach
- **Condition:** Clicking session calls correct callback based on attach state
- **Failure Mode:** Cannot manage session attachment
- **Automation Script:**
```javascript
const tree = await page.locator('.session-tree').first();

// Expand tree
await tree.locator('.session-tree-toggle').click();

// Find unattached session
const unattachedSession = await tree.locator('.session-button').filter({
  hasNot: page.locator('.attached-checkmark')
}).first();

const sessionId = await unattachedSession.locator('.session-id').textContent();

// Click to attach
await unattachedSession.click();

// Verify checkmark appears
await tree.locator(`.session-button:has(.session-id:has-text("${sessionId}")) .attached-checkmark`).waitFor({ visible: true, timeout: 1000 });

// Click again to detach
await unattachedSession.click();

// Verify checkmark removed
await tree.locator(`.session-button:has(.session-id:has-text("${sessionId}")) .attached-checkmark`).waitFor({ state: 'hidden', timeout: 1000 });
```

#### HC-ST-003: Status Indicator Display
- **Type:** render
- **Target:** Status indicator with correct color
- **Condition:** Status indicator matches session status
- **Failure Mode:** Misleading status information
- **Automation Script:**
```javascript
const tree = await page.locator('.session-tree').first();
await tree.locator('.session-tree-toggle').click();

// Find active session
const activeSession = await tree.locator('.session-button').filter({
  has: page.locator('.status-indicator.status-active')
}).first();

const hasActiveStatus = await activeSession.locator('.status-label:has-text("Active")').isVisible();

if (!hasActiveStatus) {
  throw new Error('Status indicator does not match status label');
}
```

#### HC-ST-004: Empty State Display
- **Type:** render
- **Target:** Empty state when no sessions
- **Condition:** Shows "No sessions" message when sessions array is empty
- **Failure Mode:** Confusing blank tree
- **Automation Script:**
```javascript
// Find tree with zero sessions (if testable with mock data)
const emptyTree = await page.locator('.session-tree').filter({
  has: page.locator('.tree-label:has-text("Sessions (0)")')
}).first();

// Expand tree
await emptyTree.locator('.session-tree-toggle').click();

// Verify empty state visible
const emptyState = await emptyTree.locator('.session-tree-empty');
if (!await emptyState.isVisible()) {
  throw new Error('Empty state not showing when no sessions');
}
```

### Warning Checks (Should Pass)

#### HC-ST-005: Timestamp Formatting
- **Type:** data-integrity
- **Target:** Session timestamp relative format
- **Condition:** Recent timestamps show as "2m ago", "1h ago", etc.
- **Failure Mode:** Confusing time display

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 100 | ms | Time to render tree with 20 sessions |
| expand-animation | 200 | ms | Time for expand/collapse transition |
| toggle-response | 50 | ms | Time from click to state change |

---

## Dependencies

**Required Contexts:**
- None

**Required Hooks:**
- None

**Child Components:**
- None (self-contained)

**Required Props:**
- `userId`
- `sessions`
- `attachedSessionIds`
- `onSessionAttach`
- `onSessionDetach`

---

## Notes

- **Expand/collapse animation:** Smooth CSS transition for tree content
- **Attached indicator:** Checkmark (✓) shows next to attached sessions
- **Status mapping:** in_progress → active, completed → ended, pending → idle
- **Timestamp formatting:** Same relative time logic as SessionSidebarItem ("2m ago", "1h ago", dates)
- **ID truncation:** Session ID truncated to 8 chars for display
- **Empty state:** Shows when expanded with zero sessions
- **Keyboard accessibility:** Toggle button supports keyboard activation
- **Current chain display:** Shows chain title if session has one

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
