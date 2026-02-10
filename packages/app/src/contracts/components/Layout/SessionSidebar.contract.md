# Component Contract: SessionSidebar

**File:** `packages/app/src/components/SessionSidebar/SessionSidebar.tsx`
**Type:** widget
**Parent Group:** components/SessionSidebar
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SessionSidebar
- **Introduced:** 2026-01-22
- **Description:** Static sidebar for session navigation, displaying active and recent sessions with notification badges. Fixed 240px width, always visible on session-capable workbenches. Provides "New Session" button, session deletion, and DiscussButton integration.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout

**Render Conditions:**
1. Only renders on session-capable workbenches (`canWorkbenchHaveSessions(activeWorkbench)`)
2. Hidden on workbenches like settings, pm, archive, canvas

**Positioning:** fixed (left: 0, top: below TopBar)
**Z-Index:** 50 (above main content, below TopBar)

---

## Lifecycle

**Mount Triggers:**
- WorkbenchLayout mount (when activeWorkbench supports sessions)

**Key Effects:**
1. **Dependencies:** `[]` (via useSessionSidebar hook)
   - **Side Effects:** Fetches sessions via HTTP GET `/api/sessions`, subscribes to WebSocket events (session:started, session:ended, session:deleted)
   - **Cleanup:** Unsubscribes from WebSocket events
   - **Condition:** On mount

**Cleanup Actions:**
- WebSocket event unsubscription (via useSessionSidebar)

**Unmount Triggers:**
- Switching to non-session workbench (e.g., settings)
- WorkbenchLayout unmount

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onAttachSession | `(sessionId: SessionId) => void` | ❌ | N/A | Callback when user clicks a session to attach it |
| activeSessionId | SessionId | ❌ | N/A | Currently active session ID (for highlighting) |
| onNewSession | `() => void` | ❌ | N/A | Callback when "New Session" button is clicked |
| onSessionDeleted | `(sessionId: SessionId) => void` | ❌ | N/A | Callback when active session is deleted (to clear it from workbench) |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onAttachSession | `(sessionId: SessionId) => void` | Called when user clicks session item, parent fetches session details and attaches to workbench |
| onNewSession | `() => void` | Called when user clicks "+" button, parent creates new session via POST /api/sessions |
| onSessionDeleted | `(sessionId: SessionId) => void` | Called when active session is deleted, parent removes it from attachedSessions |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onClick | `() => void` | SessionSidebarItem | Calls handleSessionClick(sessionId) which calls attachSession from hook |
| onDelete | `(sessionId: SessionId) => Promise<void>` | SessionSidebarItem | Calls handleDeleteSession which sends DELETE request and notifies parent |

---

## State Ownership

### Local State
N/A (uses useSessionSidebar hook for state)

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | prefillChatInput (via useDiscussButton) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| uniqueRecentSessions | `Session[]` | `[activeSessions, recentSessions]` | `recentSessions.filter(recent => !activeSessions.some(active => active.id === recent.id))` |
| totalCount | number | `[activeSessions, uniqueRecentSessions]` | `activeSessions.length + uniqueRecentSessions.length` |

### Custom Hooks
- `useSessionSidebar(onAttachSession)` — Fetches sessions, manages notifications, returns { activeSessions, recentSessions, notificationCounts, attachSession }
- `useDiscussButton({ componentName, getContext })` — Manages DiscussDialog state, returns { isDialogOpen, openDialog, closeDialog, handleSend }

---

## Interactions

### Parent Communication
- **Mechanism:** Callback props
- **Description:** Calls onAttachSession when user clicks session, onNewSession when + clicked, onSessionDeleted when active session deleted
- **Example:** User clicks session → handleSessionClick → attachSession (hook) → onAttachSession (parent) → WorkbenchLayout fetches and attaches session

### Child Communication
- **Child:** SessionSidebarItem (multiple), DiscussButton, DiscussDialog
- **Mechanism:** Props
- **Data Flow:** Passes session, notificationCount, isActive, onClick, onDelete to each SessionSidebarItem

### Sibling Communication
N/A (sidebar has no sibling coordination)

### Context Interaction
- **Context:** DiscussContext (via useDiscussButton)
- **Role:** consumer
- **Operations:** Opens DiscussDialog, sends formatted message to chat via prefillChatInput

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/sessions` | GET | Mount (via useSessionSidebar) | Populates activeSessions and recentSessions |
| `/api/sessions/:sessionId` | DELETE | User clicks delete button on session item | Removes session, broadcasts `session:deleted` via WebSocket, notifies parent if active session |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| `session:started` | Backend creates session | useSessionSidebar adds to activeSessions |
| `session:ended` | Backend completes session | useSessionSidebar moves to recentSessions |
| `session:deleted` | DELETE request successful | useSessionSidebar removes from all lists |

### Timers
N/A

### LocalStorage Operations
N/A

### DOM Manipulation
N/A

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.session-sidebar` (root element)
- `.sidebar-header` (header section)
- `.sidebar-title` (title text)
- `.sidebar-new-session-btn` (+ button)
- `.sidebar-content` (scrollable content area)
- `.session-section` (active/recent sections)
- `.section-title` (section headings)
- `.session-list` (session item container)
- `.sidebar-divider` (divider between sections)
- `.empty-state` (no sessions message)
- `.sidebar-footer` (footer section)
- `.session-count` (total count display)

**Data Test IDs:**
- `data-testid="session-sidebar"`
- `data-testid="new-session-button"`
- `data-testid="session-item-{sessionId}"` (on SessionSidebarItem)
- `data-testid="session-delete-button-{sessionId}"` (on SessionSidebarItem)
- `data-testid="discuss-button-session-sidebar"`

**ARIA Labels:**
- `aria-label="Session navigation sidebar"` on root `<aside>`
- `aria-label="New session"` on + button
- `aria-hidden="true"` on sidebar icon (📋)
- `role="separator"` on divider

**Visual Landmarks:**
1. Header with "Sessions" title, DiscussButton, + button (`.sidebar-header`)
2. Active Sessions section (if any) with count (e.g., "Active (3)")
3. Divider (if both active and recent sessions exist)
4. Recent Sessions section (if any) with count (e.g., "Recent (7)")
5. Footer with total count (e.g., "10 sessions")
6. Empty state message "No sessions yet" (if no sessions)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SS-001: Sessions Load on Mount
- **Type:** data-fetch
- **Target:** useSessionSidebar hook
- **Condition:** GET /api/sessions completes within 2s, populates activeSessions/recentSessions
- **Failure Mode:** Sidebar appears empty, user cannot access sessions
- **Automation Script:**
```javascript
// Chrome MCP script
// Navigate to work workbench (ensures sidebar is visible)
await click({ uid: 'workbench-tab-work' });
await new Promise(resolve => setTimeout(resolve, 2000));
// Check if sessions are displayed
const snapshot = await takeSnapshot();
if (!snapshot.includes('session-sidebar')) {
  throw new Error('SessionSidebar did not render');
}
// Check if session items exist (or empty state)
const hasContent = snapshot.includes('session-item') || snapshot.includes('No sessions yet');
if (!hasContent) {
  throw new Error('SessionSidebar has no content (no sessions or empty state)');
}
```

#### HC-SS-002: Session Click Triggers onAttachSession
- **Type:** interaction
- **Target:** handleSessionClick callback
- **Condition:** Clicking a session item calls onAttachSession with sessionId
- **Failure Mode:** Cannot attach sessions, no session panels open
- **Automation Script:**
```javascript
// Chrome MCP script
await click({ uid: 'workbench-tab-work' });
await new Promise(resolve => setTimeout(resolve, 1500));
// Click on first session item
await click({ uid: 'session-item-1' }); // Assumes at least one session exists
await new Promise(resolve => setTimeout(resolve, 1000));
// Check if SessionPanelLayout rendered (indicates session attached)
const snapshot = await takeSnapshot();
if (!snapshot.includes('session-panel-layout')) {
  throw new Error('Session did not attach — SessionPanelLayout not rendered');
}
```

#### HC-SS-003: New Session Button Works
- **Type:** interaction
- **Target:** onNewSession callback
- **Condition:** Clicking + button calls onNewSession, which creates session and attaches it
- **Failure Mode:** Cannot create new sessions
- **Automation Script:**
```javascript
// Chrome MCP script
await click({ uid: 'workbench-tab-work' });
await new Promise(resolve => setTimeout(resolve, 1000));
const initialCount = await evaluateScript(() => {
  return document.querySelector('.session-count')?.textContent;
});
// Click new session button
await click({ uid: 'new-session-button' });
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for creation + attach
const newCount = await evaluateScript(() => {
  return document.querySelector('.session-count')?.textContent;
});
// Count should increase by 1
if (newCount === initialCount) {
  throw new Error('Session count did not increase after clicking new session button');
}
```

#### HC-SS-004: Session Deletion Works
- **Type:** integration
- **Target:** handleDeleteSession function
- **Condition:** Clicking delete button sends DELETE request, removes session from UI, calls onSessionDeleted if active
- **Failure Mode:** Cannot delete sessions, stale sessions remain
- **Automation Script:**
```javascript
// Chrome MCP script
await click({ uid: 'workbench-tab-work' });
await new Promise(resolve => setTimeout(resolve, 1500));
// Get initial session count
const initialCount = await evaluateScript(() => {
  return document.querySelectorAll('[data-testid^="session-item-"]').length;
});
// Click delete button on first session
await click({ uid: 'session-delete-button-1' });
await new Promise(resolve => setTimeout(resolve, 300));
// Confirm deletion (if confirmation dialog exists)
// await click({ uid: 'confirm-delete-button' }); // Uncomment if confirmation exists
await new Promise(resolve => setTimeout(resolve, 500));
// Check if count decreased
const newCount = await evaluateScript(() => {
  return document.querySelectorAll('[data-testid^="session-item-"]').length;
});
if (newCount !== initialCount - 1) {
  throw new Error(`Expected count to decrease from ${initialCount} to ${initialCount - 1}, got: ${newCount}`);
}
```

### Warning Checks (Should Pass)

#### HC-SS-W001: WebSocket Updates Sessions in Real-Time
- **Type:** reactivity
- **Target:** useSessionSidebar WebSocket subscription
- **Condition:** When backend emits session:started, session appears in sidebar without refresh
- **Failure Mode:** User must refresh to see new sessions

#### HC-SS-W002: Notification Badges Display
- **Type:** ui-feature
- **Target:** notificationCounts from useSessionSidebar
- **Condition:** When session has unread events, badge appears on session item
- **Failure Mode:** User misses important session updates

#### HC-SS-W003: Active Session Highlighted
- **Type:** ui-state
- **Target:** isActive prop on SessionSidebarItem
- **Condition:** Active session has visual highlight (CSS class `.session-item--active`)
- **Failure Mode:** User cannot tell which session is open

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| sessions-load-time | 2000 | ms | Time from mount to sessions displayed |
| session-click-response | 500 | ms | Time from click to onAttachSession call |
| delete-api-time | 1000 | ms | Time for DELETE /api/sessions/:id to complete |
| websocket-event-latency | 500 | ms | Time from backend emit to UI update |

---

## Dependencies

**Required Contexts:**
- DiscussContext (via useDiscussButton)

**Required Hooks:**
- `useSessionSidebar(onAttachSession)`
- `useDiscussButton({ componentName, getContext })`

**Child Components:**
- SessionSidebarItem (multiple instances)
- DiscussButton
- DiscussDialog

**Required Props:**
N/A (all props optional, but sidebar is useless without onAttachSession and onNewSession)

---

## Notes

- Fixed width: 240px (defined in CSS)
- Scrollable content area (`.sidebar-content`) handles overflow when many sessions
- Active sessions: status === 'in_progress'
- Recent sessions: last 10 sessions, excluding active ones (to avoid duplicates)
- uniqueRecentSessions computed to deduplicate (filter out sessions already in activeSessions)
- Total count: activeSessions.length + uniqueRecentSessions.length
- Empty state: "No sessions yet" when totalCount === 0
- Delete button shows confirmation using native confirm() dialog
- Delete error handling uses native alert() on failure
- DiscussButton integration allows user to discuss about SessionSidebar state
- API_BASE: `import.meta.env.VITE_API_URL || 'http://localhost:3001'`
- WebSocket broadcasts `session:deleted` event after successful DELETE, triggering UI update globally
- onSessionDeleted only called if deleted session === activeSessionId (to notify parent to detach)
- Sidebar header has icon emoji 📋 (decorative, aria-hidden)

### Future Enhancements
- Replace native confirm() dialog with custom modal component
- Replace native alert() error handling with toast notification system

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
