# Component Contract: SessionArchive

**File:** `packages/app/src/components/SessionArchive/SessionArchive.tsx`
**Type:** feature
**Parent Group:** SessionArchive/
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SessionArchive
- **Introduced:** 2025-12-15
- **Description:** Modal overlay panel displaying archived sessions with restore and delete actions for session lifecycle management.

---

## Render Location

**Mounts Under:**
- ArchiveWorkbench

**Render Conditions:**
1. User opens archive panel
2. Renders as full-screen overlay with modal panel

**Positioning:** fixed (overlay)
**Z-Index:** 1000 (modal layer)

---

## Lifecycle

**Mount Triggers:**
- User navigates to Archive workbench
- Archive panel explicitly opened

**Key Effects:**
1. **Dependencies:** `[]` (mount only)
   - **Side Effects:** useDiscussButton initializes context
   - **Cleanup:** None
   - **Condition:** Always runs on mount

**Cleanup Actions:**
- DiscussDialog unmount

**Unmount Triggers:**
- User closes archive panel
- User navigates away from Archive workbench

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| archivedSessions | `ArchivedSession[]` | ✅ | N/A | List of archived sessions |
| onRestore | `(sessionId: string) => void` | ✅ | N/A | Callback when restore clicked |
| onDelete | `(sessionId: string) => void` | ✅ | N/A | Callback when delete clicked |
| onClose | `() => void` | ✅ | N/A | Callback when close/overlay clicked |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onRestore | `(sessionId: string) => void` | User clicks Restore → parent restores session |
| onDelete | `(sessionId: string) => void` | User clicks Delete → parent deletes permanently |
| onClose | `() => void` | User clicks × or overlay → parent closes modal |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | N/A | No child components with callbacks |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| N/A | N/A | N/A | Stateless component (managed by useDiscussButton only) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `prefillChatInput` (via useDiscussButton) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| N/A | N/A | N/A | N/A |

### Custom Hooks
- `useDiscussButton({ componentName, getContext })` — Discussion dialog integration

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when user restores, deletes, or closes archive
- **Example:**
  ```tsx
  onRestore(sessionId) → parent.restoreSession() → moves from archive to active
  ```

### Child Communication
- **Child:** DiscussDialog
- **Mechanism:** props
- **Data Flow:** Opens dialog, sends context about archived sessions

### Sibling Communication
- **Sibling:** None
- **Mechanism:** N/A
- **Description:** Modal operates independently

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Prefills chat input with archive context

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| N/A | N/A | N/A | N/A (handled by parent) |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| N/A | N/A | N/A | N/A |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| N/A | N/A | N/A | N/A (handled by parent useSessionArchive hook) |

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
- `.session-archive-overlay`
- `.session-archive-panel`
- `.archive-header`
- `.archive-close-btn`
- `.archive-content`
- `.archive-empty`
- `.archive-list`
- `.archive-item`
- `.archive-item-header`
- `.archive-session-id`
- `.archive-status-badge`
- `.archive-item-details`
- `.detail-row`
- `.detail-label`
- `.detail-value`
- `.archive-item-actions`
- `.restore-btn`
- `.delete-btn`

**Data Test IDs:**
- N/A (use CSS selectors)

**ARIA Labels:**
- None specified (consider adding for accessibility)

**Visual Landmarks:**
1. Header with "Archived Sessions" title (`.archive-header`) — Top of panel
2. Close button × (`.archive-close-btn`) — Top right corner
3. Empty state message (`.archive-empty`) — Centered when no archives
4. Archive item cards (`.archive-item`) — Stacked vertically in scrollable list
5. Action buttons (`.archive-item-actions`) — Restore/Delete at bottom of each card

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SA-001: Modal Overlay Renders
- **Type:** render
- **Target:** Full-screen overlay with panel
- **Condition:** Overlay visible with correct z-index
- **Failure Mode:** Cannot access archive
- **Automation Script:**
```javascript
// Navigate to archive workbench
await page.locator('[data-workbench="archive"]').click();

// Verify archive panel visible
const panel = await page.locator('.session-archive-panel');
const isVisible = await panel.isVisible();

if (!isVisible) {
  throw new Error('Archive panel not visible');
}

// Verify overlay z-index
const zIndex = await page.locator('.session-archive-overlay').evaluate(el => {
  return window.getComputedStyle(el).zIndex;
});

if (parseInt(zIndex) < 1000) {
  throw new Error('Overlay z-index too low');
}
```

#### HC-SA-002: Restore Action
- **Type:** interaction
- **Target:** Restore button calls onRestore
- **Condition:** Clicking Restore triggers parent callback
- **Failure Mode:** Cannot restore sessions
- **Automation Script:**
```javascript
// Find first archived session
const firstItem = await page.locator('.archive-item').first();
const sessionId = await firstItem.locator('.archive-session-id').textContent();

// Click restore button
await firstItem.locator('.restore-btn').click();

// Verify parent callback was called (check if session removed from archive)
await page.waitForTimeout(500);
const stillInArchive = await page.locator(`.archive-session-id:has-text("${sessionId}")`).count();

if (stillInArchive > 0) {
  throw new Error('Restore action did not remove session from archive');
}
```

#### HC-SA-003: Delete Action
- **Type:** interaction
- **Target:** Delete button calls onDelete
- **Condition:** Clicking Delete triggers parent callback
- **Failure Mode:** Cannot delete archived sessions
- **Automation Script:**
```javascript
// Find first archived session
const firstItem = await page.locator('.archive-item').first();
const sessionId = await firstItem.locator('.archive-session-id').textContent();

// Click delete button
await firstItem.locator('.delete-btn').click();

// Verify session removed from archive list
await page.waitForTimeout(500);
const stillExists = await page.locator(`.archive-session-id:has-text("${sessionId}")`).count();

if (stillExists > 0) {
  throw new Error('Delete action did not remove session');
}
```

#### HC-SA-004: Close Button and Overlay Click
- **Type:** interaction
- **Target:** Close button and overlay background
- **Condition:** Both trigger onClose callback
- **Failure Mode:** Cannot exit archive modal
- **Automation Script:**
```javascript
// Test close button
await page.locator('.archive-close-btn').click();
await page.waitForSelector('.session-archive-overlay', { state: 'hidden', timeout: 500 });

// Reopen and test overlay click
await page.locator('[data-workbench="archive"]').click();
await page.waitForSelector('.session-archive-overlay', { visible: true });

await page.locator('.session-archive-overlay').click({ position: { x: 10, y: 10 } });
await page.waitForSelector('.session-archive-overlay', { state: 'hidden', timeout: 500 });
```

#### HC-SA-005: Empty State Display
- **Type:** render
- **Target:** Empty state when no archived sessions
- **Condition:** Shows "No archived sessions" message
- **Failure Mode:** Confusing blank panel
- **Automation Script:**
```javascript
// Mock empty archive state (if testable)
const isEmpty = await page.locator('.archive-empty').isVisible();
const hasItems = await page.locator('.archive-item').count() > 0;

if (!isEmpty && !hasItems) {
  throw new Error('Neither empty state nor items visible');
}

if (isEmpty && hasItems) {
  throw new Error('Empty state showing when items present');
}
```

### Warning Checks (Should Pass)

#### HC-SA-006: Session Details Accuracy
- **Type:** data-integrity
- **Target:** Archive item details match session data
- **Condition:** All detail fields populated correctly
- **Failure Mode:** Misleading information

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| modal-open | 150 | ms | Time to render modal overlay |
| list-render | 200 | ms | Time to render 50 archived sessions |
| action-response | 300 | ms | Time from button click to callback |

---

## Dependencies

**Required Contexts:**
- DiscussContext (optional, for DiscussButton)

**Required Hooks:**
- `useDiscussButton()`

**Child Components:**
- DiscussButton
- DiscussDialog

**Required Props:**
- `archivedSessions`
- `onRestore`
- `onDelete`
- `onClose`

---

## Notes

- **Overlay dismiss:** Clicking overlay background closes modal (stopPropagation on panel prevents bubbling)
- **Session ID truncation:** IDs longer than 40 chars truncated with ellipsis, full ID in title tooltip
- **Timestamp formatting:** Uses `toLocaleString()` for archived date display
- **Status badge:** Shows session.status as badge for quick reference
- **Detail rows:** Displays user, chains count, started date, archived date
- **Empty state:** Centered message when no archived sessions
- **Context calculation:** DiscussButton context includes count and date range (earliest/latest archived)
- **No confirmation:** Delete action immediate (consider adding confirmation in future)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
