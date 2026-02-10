# Component Contract: SessionSidebar

**File:** `packages/app/src/components/SessionSidebar/SessionSidebar.tsx`
**Type:** feature
**Parent Group:** SessionSidebar/
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SessionSidebar
- **Introduced:** 2025-12-01
- **Description:** Static sidebar for session navigation showing active and recent sessions with notification badges and session management controls.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (conditionally via `canWorkbenchHaveSessions(activeWorkbench)`)

**Render Conditions:**
1. Workbench supports sessions (`canWorkbenchHaveSessions(activeWorkbench) === true`)
2. Always visible at 240px fixed width when condition 1 is met

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- WorkbenchLayout mounts and active workbench supports sessions
- Workbench switches to a session-supporting workbench

**Key Effects:**
1. **Dependencies:** `[]` (mount only)
   - **Side Effects:** useSessionSidebar hook fetches sessions via HTTP GET `/api/sessions`, subscribes to WebSocket events
   - **Cleanup:** WebSocket unsubscribe, abort fetch
   - **Condition:** Always runs on mount

**Cleanup Actions:**
- WebSocket event subscription cleanup (via useSessionSidebar)
- DiscussDialog unmount

**Unmount Triggers:**
- Workbench switches to non-session workbench
- WorkbenchLayout unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onAttachSession | `(sessionId: SessionId) => void` | ❌ | N/A | Callback when user clicks to attach session |
| activeSessionId | `SessionId` | ❌ | N/A | Currently active session ID for highlighting |
| onNewSession | `() => void` | ❌ | N/A | Callback when "+" button clicked |
| onSessionDeleted | `(sessionId: SessionId) => void` | ❌ | N/A | Callback when active session is deleted |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onAttachSession | `(sessionId: SessionId) => void` | User clicks session item → requests attach |
| onNewSession | `() => void` | User clicks "+" button → requests new session creation |
| onSessionDeleted | `(sessionId: SessionId) => void` | Active session deleted → notifies parent to clear |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onClick | `() => void` | SessionSidebarItem | Wraps `attachSession(sessionId)` call |
| onDelete | `(sessionId: SessionId) => Promise<void>` | SessionSidebarItem | HTTP DELETE handler for session |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| N/A | N/A | N/A | All state delegated to useSessionSidebar hook |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `registerChatInput`, `prefillChatInput` (via useDiscussButton) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| uniqueRecentSessions | `Session[]` | `[recentSessions, activeSessions]` | Filters recent sessions to exclude those already in active |
| totalCount | `number` | `[activeSessions.length, uniqueRecentSessions.length]` | Sum of active + unique recent |

### Custom Hooks
- `useSessionSidebar(onAttachSession)` — Fetches sessions, manages notifications, WebSocket subscription
- `useDiscussButton({ componentName, getContext })` — Discussion dialog state + send handler

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies WorkbenchLayout when user wants to attach/delete/create sessions
- **Example:**
  ```tsx
  handleSessionClick(sessionId) → onAttachSession(sessionId) → WorkbenchLayout.handleAttachSession
  ```

### Child Communication
- **Child:** SessionSidebarItem (multiple)
- **Mechanism:** props
- **Data Flow:** Passes `session`, `notificationCount`, `isActive`, `onClick`, `onDelete` to each item

### Sibling Communication
- **Sibling:** ChatPanel
- **Mechanism:** DiscussContext (prefillChatInput)
- **Description:** DiscussButton sends formatted message to ChatPanel's input field

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Prefills chat input when discuss dialog sends message

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/sessions` | GET | Mount (via useSessionSidebar) | Populates activeSessions/recentSessions |
| `/api/sessions/:sessionId` | DELETE | Delete button click | Removes session, notifies parent if active |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| `session:started` | Backend emits | useSessionSidebar adds to active list |
| `session:ended` | Backend emits | useSessionSidebar moves to recent list |
| `session:deleted` | Backend emits | useSessionSidebar removes from all lists |

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
- `.session-sidebar`
- `.sidebar-header`
- `.sidebar-title`
- `.sidebar-new-session-btn`
- `.session-section`
- `.section-title`
- `.session-list`
- `.sidebar-divider`
- `.sidebar-footer`
- `.session-count`
- `.empty-state`

**Data Test IDs:**
- N/A (use CSS selectors)

**ARIA Labels:**
- `aria-label="Session navigation sidebar"` (main sidebar)
- `aria-label="New session"` (+ button)
- `role="separator"` (divider)

**Visual Landmarks:**
1. Header with 📋 icon and "Sessions" title (`.sidebar-header`) — Always at top
2. "Active (N)" section title (`.section-title`) — Shows active session count
3. Divider line between sections (`.sidebar-divider`) — Only when both sections populated
4. Footer session count (`.sidebar-footer`) — Always at bottom

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SSB-001: Sessions Fetched on Mount
- **Type:** data-fetch
- **Target:** useSessionSidebar hook HTTP GET
- **Condition:** API call completes within 2s, returns 200 OK
- **Failure Mode:** Sidebar shows empty state indefinitely
- **Automation Script:**
```javascript
// Navigate to session-supporting workbench
await page.evaluate(() => {
  const workbenchContext = document.querySelector('[data-workbench="work"]');
  workbenchContext?.click();
});

// Wait for sidebar to appear
await page.waitForSelector('.session-sidebar', { timeout: 2000 });

// Verify sessions loaded (check for section-title or empty-state)
const hasActiveSessions = await page.locator('.section-title').count() > 0;
const hasEmptyState = await page.locator('.empty-state').isVisible();

if (!hasActiveSessions && !hasEmptyState) {
  throw new Error('Sessions not loaded');
}
```

#### HC-SSB-002: WebSocket Event Subscription
- **Type:** connection
- **Target:** useSessionSidebar subscribes to session events
- **Condition:** WebSocket subscribed within 500ms of mount
- **Failure Mode:** New sessions don't appear without refresh
- **Automation Script:**
```javascript
// Verify WebSocket connection active
const wsStatus = await page.evaluate(() => {
  return window.__wsContext?.status;
});

if (wsStatus !== 'connected') {
  throw new Error('WebSocket not connected');
}

// Create new session via backend, verify it appears
const newSessionId = await fetch('http://localhost:3001/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user: 'test-user' })
}).then(r => r.json()).then(d => d.id);

// Wait for session to appear in sidebar
await page.waitForSelector(`[data-session-id="${newSessionId}"]`, { timeout: 3000 });
```

#### HC-SSB-003: DiscussButton Integration
- **Type:** context-registration
- **Target:** DiscussContext prefillChatInput
- **Condition:** Discuss dialog opens, sends message, ChatPanel input prefills
- **Failure Mode:** Discuss messages don't reach ChatPanel
- **Automation Script:**
```javascript
// Open discuss dialog
await page.locator('.session-sidebar .discuss-button').click();
await page.waitForSelector('.discuss-dialog', { visible: true });

// Type and send message
await page.locator('.discuss-dialog textarea').fill('Test message from sidebar');
await page.locator('.discuss-dialog .send-btn').click();

// Verify dialog closes
await page.waitForSelector('.discuss-dialog', { state: 'hidden', timeout: 1000 });

// Verify ChatPanel input prefilled
const chatInput = await page.locator('.chat-panel__input-field').inputValue();
if (!chatInput.includes('Test message from sidebar')) {
  throw new Error('Message not prefilled in ChatPanel');
}
```

### Warning Checks (Should Pass)

#### HC-SSB-004: Session Count Accuracy
- **Type:** data-integrity
- **Target:** Footer session count matches rendered items
- **Condition:** `.session-count` text equals sum of active + recent items
- **Failure Mode:** Confusing UI, count mismatch

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| initial-render | 150 | ms | Time from mount to first paint |
| session-list-render | 100 | ms | Time to render 20 sessions |
| delete-response | 1000 | ms | Time from delete click to UI update |

---

## Dependencies

**Required Contexts:**
- DiscussContext (optional, for DiscussButton)

**Required Hooks:**
- `useSessionSidebar()`
- `useDiscussButton()`

**Child Components:**
- SessionSidebarItem
- DiscussButton
- DiscussDialog

**Required Props:**
- None (all optional, graceful degradation)

---

## Notes

- **Session deduplication:** Recent sessions filter out any already in active list to prevent duplicates
- **WebSocket dependency:** Real-time updates require WebSocket connection; gracefully degrades to manual refresh if WS fails
- **Delete confirmation:** Uses native `window.confirm()` for deletion safety (consider custom modal in future)
- **Empty state:** Shows friendly message when no sessions exist
- **Notification system:** Integrates with notification glow context for visual feedback

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
