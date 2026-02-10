# Component Contract: SessionSidebarItem

**File:** `packages/app/src/components/SessionSidebar/SessionSidebarItem.tsx`
**Type:** widget
**Parent Group:** SessionSidebar/
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SessionSidebarItem
- **Introduced:** 2025-12-01
- **Description:** Compact session list item displaying session metadata, status, notifications, and delete control with glow indicator wrapper.

---

## Render Location

**Mounts Under:**
- SessionSidebar (within `.session-list` div)

**Render Conditions:**
1. Session exists in activeSessions or recentSessions arrays
2. Wrapped in GlowIndicator component

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent SessionSidebar fetches sessions and renders list
- WebSocket event adds new session to list

**Key Effects:**
1. **Dependencies:** `[session.id]`
   - **Side Effects:** Fetches glow state from NotificationGlowContext
   - **Cleanup:** None
   - **Condition:** Runs when session.id changes

**Cleanup Actions:**
- None (stateless component)

**Unmount Triggers:**
- Session removed from list (deleted or filtered)
- Parent SessionSidebar unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| session | `Session` | ✅ | N/A | Session data to display |
| notificationCount | `number` | ✅ | N/A | Notification badge count (0 = no badge) |
| isActive | `boolean` | ✅ | N/A | Whether session is currently attached |
| onClick | `() => void` | ✅ | N/A | Handler for click-to-attach |
| onDelete | `(sessionId: SessionId) => void` | ❌ | N/A | Handler for session deletion |
| routingContext | `WorkbenchId` | ❌ | N/A | Routing context from session metadata |
| routingConfidence | `number` | ❌ | N/A | Routing confidence score (0-1) |
| routingMethod | `'automatic' \| 'disambiguated' \| 'manual'` | ❌ | N/A | How session was routed |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onClick | `() => void` | User clicks item → requests attach |
| onDelete | `(sessionId: SessionId) => void` | User confirms delete → requests deletion |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | N/A | Leaf component, no children with callbacks |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| N/A | N/A | N/A | Stateless component |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| NotificationGlowContext | `getSessionGlow(sessionId)` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| statusClass | `string` | `session.status` | Maps status to CSS class (in_progress → status-in-progress) |
| relativeTime | `string` | `session.startedAt` | Formats timestamp as relative ("2m ago", "1h ago", etc.) |
| sessionName | `string` | `session.metadata?.name, session.id` | Uses metadata.name or truncated ID |
| hasNotifications | `boolean` | `notificationCount > 0` | Whether to show notification badge |
| hasRouting | `boolean` | `!!routingContext` | Whether to show routing badge |
| confidenceClass | `string` | `routingConfidence` | Maps confidence to CSS class (high/medium/low) |
| glowState | `GlowState` | `session.id` | Fetches from NotificationGlowContext |

### Custom Hooks
- `useNotificationGlowContext()` — Fetches session-level glow state

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when user clicks item or deletes session
- **Example:**
  ```tsx
  onClick() → parent.handleSessionClick(sessionId) → onAttachSession(sessionId)
  ```

### Child Communication
- **Child:** GlowIndicator
- **Mechanism:** props
- **Data Flow:** Passes glow state (active, level, intensity, pulse) to wrapper

### Sibling Communication
- **Sibling:** Other SessionSidebarItem instances
- **Mechanism:** None (independent items)
- **Description:** N/A

### Context Interaction
- **Context:** NotificationGlowContext
- **Role:** consumer
- **Operations:** Reads glow state for this session

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| N/A | N/A | N/A | N/A (delete handled by parent) |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A (handled by parent hook) |

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
- `.session-sidebar-item`
- `.session-sidebar-item.active`
- `.status-dot`
- `.status-in-progress` / `.status-completed` / `.status-failed`
- `.session-info`
- `.session-name`
- `.session-time`
- `.routing-badge`
- `.notification-badge`
- `.session-delete-btn`
- `.session-sidebar-glow-wrapper`

**Data Test IDs:**
- N/A (use CSS selectors)

**ARIA Labels:**
- `role="button"` (main item)
- `tabIndex={0}` (keyboard accessible)
- `aria-label="Session {name}, {status}, {time}, {notifications}"` (full context)
- `aria-label="Delete session {name}"` (delete button)
- `aria-label="Routed to {context} context"` (routing badge)

**Visual Landmarks:**
1. Status dot (`.status-dot`) — Color-coded: green=in_progress, gray=completed, red=failed
2. Session name (`.session-name`) — Truncated with ellipsis, title shows full ID
3. Relative time (`.session-time`) — Bottom right, subtle gray text
4. Notification badge (`.notification-badge`) — Red circle with count, top right
5. Delete button (`.session-delete-btn`) — × symbol, appears on hover
6. Routing badge (`.routing-badge`) — Context name with confidence color

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SSI-001: Status Rendering
- **Type:** render
- **Target:** Status dot and class
- **Condition:** Status dot color matches session.status
- **Failure Mode:** Confusing visual feedback
- **Automation Script:**
```javascript
// Find active session item
const activeItem = await page.locator('.session-sidebar-item.status-in-progress').first();

// Verify status dot has correct class
const statusDot = activeItem.locator('.status-dot.status-in-progress');
const isVisible = await statusDot.isVisible();

if (!isVisible) {
  throw new Error('Status dot not visible or incorrect class');
}
```

#### HC-SSI-002: Click Handler
- **Type:** interaction
- **Target:** onClick callback
- **Condition:** Clicking item triggers onClick
- **Failure Mode:** Cannot attach sessions
- **Automation Script:**
```javascript
// Click session item
const sessionItem = await page.locator('.session-sidebar-item').first();
const sessionName = await sessionItem.locator('.session-name').textContent();

await sessionItem.click();

// Verify session panel opened (check for session-panel-layout)
await page.waitForSelector('.session-panel-layout', { timeout: 2000 });

// Verify active class applied
const hasActive = await sessionItem.evaluate(el => el.classList.contains('active'));
if (!hasActive) {
  throw new Error('Item not marked as active after click');
}
```

#### HC-SSI-003: Delete Confirmation
- **Type:** interaction
- **Target:** Delete button with confirmation
- **Condition:** Delete button shows confirm dialog before deletion
- **Failure Mode:** Accidental deletions
- **Automation Script:**
```javascript
// Set up confirm dialog handler
page.on('dialog', async dialog => {
  if (dialog.type() === 'confirm') {
    await dialog.accept();
  }
});

// Click delete button
const deleteBtn = await page.locator('.session-delete-btn').first();
await deleteBtn.click();

// Verify item removed from list
await page.waitForTimeout(500);
const itemStillExists = await page.locator('.session-delete-btn').count();
// Should be one less than before
```

#### HC-SSI-004: Notification Badge Display
- **Type:** render
- **Target:** Notification badge
- **Condition:** Badge visible when notificationCount > 0, hidden when 0
- **Failure Mode:** Missing notification indicators
- **Automation Script:**
```javascript
// Find item with notifications
const itemWithNotif = await page.locator('.session-sidebar-item .notification-badge').first();
const badgeText = await itemWithNotif.textContent();

if (!badgeText || parseInt(badgeText) === 0) {
  throw new Error('Notification badge not showing count');
}

// Verify badge not present when count is 0
const itemsWithZeroNotif = await page.locator('.session-sidebar-item').filter({
  has: page.locator('.notification-badge'),
  hasNot: page.locator('.notification-badge:has-text("0")')
}).count();
```

### Warning Checks (Should Pass)

#### HC-SSI-005: Glow Indicator Integration
- **Type:** visual-feedback
- **Target:** GlowIndicator wrapper
- **Condition:** Glow state reflects notification urgency
- **Failure Mode:** Reduced visual feedback for important events

#### HC-SSI-006: Keyboard Navigation
- **Type:** accessibility
- **Target:** Enter/Space key triggers onClick
- **Condition:** Pressing Enter or Space on focused item triggers onClick
- **Failure Mode:** Inaccessible for keyboard users

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 10 | ms | Time to render single item |
| hover-response | 50 | ms | Time to show delete button on hover |
| click-response | 100 | ms | Time from click to callback execution |

---

## Dependencies

**Required Contexts:**
- NotificationGlowContext (for glow state)

**Required Hooks:**
- `useNotificationGlowContext()`

**Child Components:**
- GlowIndicator

**Required Props:**
- `session`
- `notificationCount`
- `isActive`
- `onClick`

---

## Notes

- **Relative time formatting:** Auto-formats timestamps as "now", "2m ago", "1h ago", "3d ago", or date (MMM DD)
- **Name truncation:** Session ID truncated to 12 chars with ellipsis, full ID shown in title tooltip
- **Delete safety:** Uses native confirm() dialog with clear warning message
- **Status mapping:** in_progress → green, completed → gray, failed → red, pending/default → idle
- **Routing badge:** Shows context name with confidence-based color (high=green, medium=yellow, low=red)
- **Notification cap:** Displays "99+" when count exceeds 99
- **Keyboard accessibility:** Full keyboard navigation support (Enter/Space to activate)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
