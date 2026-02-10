# Session UI E2E Test Plan

**Version:** 1.0.0
**Created:** 2026-02-10
**Test Type:** Chrome MCP E2E Tests
**Target:** ActionFlows Dashboard Session UI Functionality

## Overview

This test plan covers comprehensive E2E testing of the session UI components using Chrome DevTools MCP. Tests validate the complete user journey from session creation through interaction and deletion.

## Prerequisites

- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`
- Chrome DevTools MCP server connected
- Clean state (no existing sessions preferred for isolation)

## Test Organization

Tests are organized into **6 test suites** covering different aspects of session UI:

1. **Session Lifecycle** (`session-lifecycle.test.ts`)
2. **Session Sidebar** (`session-sidebar.test.ts`)
3. **Session Info Panel** (`session-info-panel.test.ts`)
4. **Conversation Panel** (`conversation-panel.test.ts`)
5. **Session Archive** (`session-archive.test.ts`)
6. **Multi-Session Management** (`multi-session.test.ts`)

---

## Suite 1: Session Lifecycle Tests

**File:** `test/e2e/session-lifecycle.test.ts`
**Purpose:** Test complete session lifecycle from creation to deletion
**Duration:** ~60 seconds
**Dependencies:** None (can run independently)

### Test Cases

#### LIFECYCLE-001: Create New Session

**Group:** `describe('Session Creation')`

**Prerequisites:**
- Navigate to `http://localhost:5173`
- Take snapshot to verify empty state

**Steps:**
1. Verify "No sessions yet" empty state message exists
2. Locate new session button (`.sidebar-new-session-btn`)
3. Click new session button
4. Wait for session creation (network request to POST `/api/sessions`)

**Assertions:**
- Empty state message is visible before creation
- New session button is clickable
- POST `/api/sessions` returns 201 status
- Response contains session ID
- Session appears in sidebar within 2 seconds

**Selectors:**
- `.sidebar-new-session-btn` (button)
- `.empty-message` (text: "No sessions yet")
- `.session-sidebar-item` (session item)

**Chrome MCP Tools:**
- `navigate_page` → Load app
- `take_snapshot` → Verify empty state
- `click` → Click new session button
- `list_network_requests` → Find POST request
- `get_network_request` → Extract session ID
- `wait_for` → Wait for session to appear

---

#### LIFECYCLE-002: Session Status Progression

**Group:** `describe('Session Status')`

**Prerequisites:**
- Create session via API: `POST /api/sessions { userId: 'test-user' }`
- Capture session ID

**Steps:**
1. Verify initial status is `pending` (status dot gray)
2. Update status to `in_progress` via API: `PUT /api/sessions/:id { status: 'in_progress' }`
3. Wait for status dot color change (gray → blue)
4. Verify "ACTIVE" section header appears
5. Update status to `completed` via API: `PUT /api/sessions/:id { status: 'completed' }`
6. Wait for status dot color change (blue → green)
7. Verify session moves to "RECENT" section

**Assertions:**
- Status dot reflects current session status
- Session appears in correct section based on status
- Visual indicator updates within 1 second of status change

**Selectors:**
- `.status-dot` (status indicator)
- `.session-sidebar-item` (session item)
- Text: "ACTIVE" or "RECENT" (section headers)

**Chrome MCP Tools:**
- `evaluate_script` → Update session status via API
- `take_snapshot` → Verify status changes
- `wait_for` → Wait for section headers

---

#### LIFECYCLE-003: Session Deletion

**Group:** `describe('Session Deletion')`

**Prerequisites:**
- Create 2 sessions via API
- Capture both session IDs

**Steps:**
1. Take snapshot to verify 2 sessions exist
2. Hover over first session item
3. Locate delete button (`.session-delete-btn`)
4. Click delete button
5. Wait for DELETE request to complete
6. Verify session removed from sidebar
7. Verify session count decremented

**Assertions:**
- Delete button appears on hover
- DELETE `/api/sessions/:id` returns 200 or 204
- Session removed from UI within 1 second
- Session count updates correctly
- Remaining session still visible

**Selectors:**
- `.session-sidebar-item` (session item)
- `.session-delete-btn` (delete button)
- `.session-count` (footer counter)

**Chrome MCP Tools:**
- `hover` → Show delete button
- `click` → Click delete
- `list_network_requests` → Verify DELETE request
- `take_snapshot` → Verify removal

---

## Suite 2: Session Sidebar Tests

**File:** `test/e2e/session-sidebar.test.ts`
**Purpose:** Test sidebar navigation, filtering, and display
**Duration:** ~45 seconds
**Dependencies:** None

### Test Cases

#### SIDEBAR-001: Active Sessions Section

**Group:** `describe('Active Sessions')`

**Prerequisites:**
- Create 3 sessions via API with status `in_progress`

**Steps:**
1. Navigate to app
2. Take snapshot
3. Verify "ACTIVE" section header exists
4. Count session items in active section
5. Verify all 3 sessions are visible
6. Verify each has blue status dot

**Assertions:**
- "ACTIVE" section header is visible
- Exactly 3 session items under "ACTIVE"
- Each session has `.status-dot` with blue color
- Sessions are ordered by creation time (newest first)

**Selectors:**
- Text: "ACTIVE"
- `.session-sidebar-item`
- `.status-dot`

**Chrome MCP Tools:**
- `navigate_page`
- `take_snapshot`
- `evaluate_script` → Count elements and verify colors

---

#### SIDEBAR-002: Recent Sessions Section

**Group:** `describe('Recent Sessions')`

**Prerequisites:**
- Create 5 sessions via API with status `completed`

**Steps:**
1. Navigate to app
2. Take snapshot
3. Verify "RECENT" section header exists
4. Count session items in recent section
5. Verify all 5 sessions are visible
6. Verify divider between ACTIVE and RECENT sections

**Assertions:**
- "RECENT" section header is visible
- Exactly 5 session items under "RECENT"
- `.sidebar-divider` separates sections
- Sessions are ordered by last activity (most recent first)

**Selectors:**
- Text: "RECENT"
- `.session-sidebar-item`
- `.sidebar-divider`

**Chrome MCP Tools:**
- `navigate_page`
- `take_snapshot`
- `evaluate_script` → Verify section structure

---

#### SIDEBAR-003: Session Click Navigation

**Group:** `describe('Session Selection')`

**Prerequisites:**
- Create 2 sessions via API

**Steps:**
1. Navigate to app
2. Take snapshot to identify session items
3. Click first session item
4. Verify session becomes active (`.session-sidebar-item.active`)
5. Verify session info panel updates
6. Click second session item
7. Verify active state switches

**Assertions:**
- Only one session has `.active` class at a time
- Clicking session updates active state immediately
- Session info panel reflects selected session

**Selectors:**
- `.session-sidebar-item`
- `.session-sidebar-item.active`
- `.info-panel-header` (in session info panel)

**Chrome MCP Tools:**
- `click` → Select sessions
- `take_snapshot` → Verify active state
- `evaluate_script` → Check active class

---

#### SIDEBAR-004: Notification Badges

**Group:** `describe('Notification Badges')`

**Prerequisites:**
- Create session via API
- Send WebSocket event: `{ type: 'step:completed', sessionId, data: {...} }`

**Steps:**
1. Navigate to app
2. Emit WebSocket event for session
3. Wait 500ms for badge update
4. Take snapshot
5. Verify notification badge appears on session item
6. Click session item
7. Verify badge clears

**Assertions:**
- `.notification-badge` appears after event
- Badge shows count > 0
- Badge clears when session is selected

**Selectors:**
- `.notification-badge`
- `.session-sidebar-item`

**Chrome MCP Tools:**
- `evaluate_script` → Emit WebSocket event
- `wait_for` → Wait for badge
- `take_snapshot` → Verify badge

---

#### SIDEBAR-005: Session Count Footer

**Group:** `describe('Session Count')`

**Prerequisites:**
- Create varying numbers of sessions (0, 1, 5, 10)

**Steps:**
1. Start with 0 sessions → verify "No sessions yet"
2. Create 1 session → verify count shows "1 session"
3. Create 4 more → verify count shows "5 sessions"
4. Delete 2 sessions → verify count shows "3 sessions"

**Assertions:**
- Count updates in real-time
- Pluralization is correct (1 session vs 5 sessions)
- Empty state message when count = 0

**Selectors:**
- `.session-count`
- `.empty-message`

**Chrome MCP Tools:**
- `evaluate_script` → Create/delete sessions via API
- `take_snapshot` → Verify count

---

## Suite 3: Session Info Panel Tests

**File:** `test/e2e/session-info-panel.test.ts`
**Purpose:** Test session metadata display and collapse/expand
**Duration:** ~30 seconds
**Dependencies:** Requires at least 1 session

### Test Cases

#### INFO-001: Panel Display

**Group:** `describe('Info Panel Display')`

**Prerequisites:**
- Create session with metadata:
  ```json
  {
    "userId": "test-user",
    "status": "in_progress",
    "metadata": {
      "routing": { "context": "work", "department": "engineering" }
    }
  }
  ```

**Steps:**
1. Navigate to app and select session
2. Take snapshot
3. Verify panel title "Session Info"
4. Verify status badge shows "in_progress"
5. Verify routing badge shows "work → engineering"
6. Verify session ID is visible

**Assertions:**
- `.panel-title` contains "Session Info"
- `.status-badge` shows correct status
- `.routing-badge` shows context and department
- `.session-id-button` is clickable
- All info chips are visible

**Selectors:**
- `.info-panel-header`
- `.panel-title`
- `.status-badge`
- `.routing-badge`
- `.session-id-button`
- `.info-chip`

**Chrome MCP Tools:**
- `take_snapshot`
- `evaluate_script` → Verify badge content

---

#### INFO-002: Collapse/Expand Toggle

**Group:** `describe('Panel Collapse')`

**Prerequisites:**
- Create and select a session

**Steps:**
1. Verify panel is expanded by default
2. Locate collapse toggle (`.collapse-toggle`)
3. Click collapse toggle
4. Verify panel collapses (height decreases)
5. Click toggle again
6. Verify panel expands

**Assertions:**
- Panel is expanded on load
- Clicking toggle collapses panel
- Clicking again expands panel
- Toggle icon rotates (▼ → ▶)

**Selectors:**
- `.collapse-toggle`
- `.info-panel-header`

**Chrome MCP Tools:**
- `click` → Toggle collapse
- `evaluate_script` → Check panel height
- `take_screenshot` → Visual verification

---

#### INFO-003: Freshness Indicator

**Group:** `describe('Freshness Indicator')`

**Prerequisites:**
- Create session with `lastActivity` timestamp 30 seconds ago

**Steps:**
1. Select session
2. Verify freshness indicator shows "30s ago"
3. Wait 30 seconds
4. Verify indicator updates to "1m ago"

**Assertions:**
- `.freshness-indicator` displays time since last activity
- Updates every 10 seconds
- Shows human-readable format (30s, 1m, 5m, 1h, etc.)

**Selectors:**
- `.freshness-indicator`

**Chrome MCP Tools:**
- `take_snapshot`
- `wait_for` → Wait for time update
- `evaluate_script` → Verify timestamp

---

#### INFO-004: Session ID Copy

**Group:** `describe('Session ID Copy')`

**Prerequisites:**
- Create and select a session

**Steps:**
1. Locate session ID button (`.session-id-button`)
2. Click session ID button
3. Verify clipboard contains session ID
4. Verify visual feedback (toast/flash)

**Assertions:**
- Clicking button copies ID to clipboard
- Visual feedback confirms copy action

**Selectors:**
- `.session-id-button`

**Chrome MCP Tools:**
- `click` → Click ID button
- `evaluate_script` → Read clipboard via `navigator.clipboard.readText()`
- `wait_for` → Wait for toast

---

## Suite 4: Conversation Panel Tests

**File:** `test/e2e/conversation-panel.test.ts`
**Purpose:** Test chat interaction and message display
**Duration:** ~45 seconds
**Dependencies:** Requires session in `awaiting_input` state

### Test Cases

#### CONV-001: Message Display

**Group:** `describe('Message Display')`

**Prerequisites:**
- Create session
- Add conversation history via API:
  ```json
  {
    "messages": [
      { "role": "assistant", "content": "Hello! How can I help?", "timestamp": "2026-02-10T10:00:00Z" },
      { "role": "user", "content": "Test message", "timestamp": "2026-02-10T10:01:00Z" }
    ]
  }
  ```

**Steps:**
1. Navigate and select session
2. Take snapshot
3. Verify 2 messages are displayed
4. Verify first message has `.message-assistant` class
5. Verify second message has `.message-user` class
6. Verify message content matches

**Assertions:**
- Messages are displayed in chronological order
- Assistant messages use `.message-assistant` styling
- User messages use `.message-user` styling
- Message content is rendered correctly

**Selectors:**
- `.messages-container`
- `.message`
- `.message-assistant`
- `.message-user`
- `.message-role`
- `.message-content`

**Chrome MCP Tools:**
- `take_snapshot`
- `evaluate_script` → Count messages, verify classes

---

#### CONV-002: Send Message

**Group:** `describe('Send Message')`

**Prerequisites:**
- Create session with `conversationState: 'awaiting_input'`

**Steps:**
1. Navigate and select session
2. Locate chat input (`.chat-panel__input-field`)
3. Type test message: "Test input from E2E"
4. Locate send button (`.chat-panel__send-btn`)
5. Click send button
6. Wait for message to appear in chat
7. Verify POST to `/api/sessions/:id/input` succeeded

**Assertions:**
- Input field is enabled when `awaiting_input`
- Send button is enabled when input has text
- Message appears in chat after send
- API receives the message
- Input field clears after send

**Selectors:**
- `.chat-panel__input-field` (textarea)
- `.chat-panel__send-btn` (button)
- `.message-user`

**Chrome MCP Tools:**
- `fill` → Type message
- `click` → Send message
- `wait_for` → Wait for message to appear
- `list_network_requests` → Verify POST request
- `take_snapshot` → Verify message displayed

---

#### CONV-003: Quick Response Buttons

**Group:** `describe('Quick Responses')`

**Prerequisites:**
- Create session with quick response prompt:
  ```json
  {
    "lastPrompt": {
      "question": "Proceed with changes?",
      "quickResponses": ["yes", "no", "skip"]
    }
  }
  ```

**Steps:**
1. Navigate and select session
2. Take snapshot
3. Verify 3 quick response buttons are visible
4. Click "yes" button
5. Verify POST to `/api/sessions/:id/input` with value "yes"
6. Verify button disappears after selection

**Assertions:**
- Quick response buttons appear when `lastPrompt` exists
- Clicking button sends response to backend
- Buttons disappear after selection
- Chat shows user selected "yes"

**Selectors:**
- `.quick-response-btn`

**Chrome MCP Tools:**
- `take_snapshot`
- `click` → Click quick response
- `list_network_requests` → Verify API call
- `wait_for` → Wait for UI update

---

#### CONV-004: Awaiting Input State

**Group:** `describe('Conversation State')`

**Prerequisites:**
- Create session with `conversationState: 'idle'`

**Steps:**
1. Navigate and select session
2. Verify chat input is disabled
3. Verify send button is disabled
4. Verify "Not awaiting input" notice is visible
5. Update session to `conversationState: 'awaiting_input'` via API
6. Wait for UI update
7. Verify input is now enabled
8. Verify send button is enabled

**Assertions:**
- Input disabled when not awaiting
- Input enabled when awaiting
- Visual indicator shows current state
- State changes reflect in UI immediately

**Selectors:**
- `.chat-panel__input-field[disabled]`
- `.chat-panel__send-btn[disabled]`
- `.not-awaiting-notice`
- `.awaiting-badge`

**Chrome MCP Tools:**
- `take_snapshot`
- `evaluate_script` → Update conversation state
- `wait_for` → Wait for state change

---

#### CONV-005: Message Scrolling

**Group:** `describe('Message Scrolling')`

**Prerequisites:**
- Create session with 20+ messages (enough to overflow)

**Steps:**
1. Navigate and select session
2. Take snapshot
3. Verify messages container is scrollable
4. Verify scroll is at bottom (newest messages visible)
5. Send new message
6. Verify auto-scroll to bottom

**Assertions:**
- Messages container scrolls when overflow
- New messages auto-scroll to bottom
- Scroll position preserved when switching sessions

**Selectors:**
- `.messages-container`

**Chrome MCP Tools:**
- `evaluate_script` → Check scroll position, scrollHeight
- `fill` → Type message
- `click` → Send message
- `evaluate_script` → Verify scroll to bottom

---

## Suite 5: Session Archive Tests

**File:** `test/e2e/session-archive.test.ts`
**Purpose:** Test session archival, restoration, and permanent deletion
**Duration:** ~40 seconds
**Dependencies:** None

### Test Cases

#### ARCHIVE-001: Archive Session

**Group:** `describe('Archive Session')`

**Prerequisites:**
- Create 2 sessions with status `completed`

**Steps:**
1. Navigate to app
2. Open session archive panel
3. Verify 2 archived sessions are listed
4. Verify each has `.archive-item` class
5. Verify restore button (`.restore-btn`) is visible
6. Verify delete button (`.delete-btn`) is visible

**Assertions:**
- Archive panel shows completed sessions
- Each item shows session metadata (ID, timestamp, status)
- Restore and delete buttons are available

**Selectors:**
- `.session-archive-overlay`
- `.session-archive-panel`
- `.archive-item`
- `.restore-btn`
- `.delete-btn`

**Chrome MCP Tools:**
- `click` → Open archive panel
- `take_snapshot` → Verify archived sessions

---

#### ARCHIVE-002: Restore Session

**Group:** `describe('Restore Session')`

**Prerequisites:**
- Create archived session (status: `completed`)

**Steps:**
1. Open archive panel
2. Locate archived session
3. Click restore button (`.restore-btn`)
4. Verify session moves to sidebar
5. Verify session status updates to `in_progress`
6. Verify session removed from archive

**Assertions:**
- Restore button triggers status update
- Session appears in sidebar after restore
- Session removed from archive list
- API receives PUT `/api/sessions/:id` with new status

**Selectors:**
- `.restore-btn`
- `.session-sidebar-item`
- `.archive-item`

**Chrome MCP Tools:**
- `click` → Click restore
- `wait_for` → Wait for sidebar update
- `list_network_requests` → Verify API call
- `take_snapshot` → Verify session moved

---

#### ARCHIVE-003: Permanent Delete

**Group:** `describe('Permanent Delete')`

**Prerequisites:**
- Create archived session

**Steps:**
1. Open archive panel
2. Locate archived session
3. Click delete button (`.delete-btn`)
4. Verify confirmation dialog appears
5. Confirm deletion
6. Verify DELETE request to `/api/sessions/:id`
7. Verify session removed from archive
8. Verify session count decremented

**Assertions:**
- Delete requires confirmation
- DELETE API call succeeds
- Session permanently removed
- No way to restore after permanent delete

**Selectors:**
- `.delete-btn`
- Confirmation dialog (browser native `confirm()`)

**Chrome MCP Tools:**
- `click` → Click delete
- `handle_dialog` → Confirm deletion
- `list_network_requests` → Verify DELETE
- `take_snapshot` → Verify removal

---

## Suite 6: Multi-Session Management Tests

**File:** `test/e2e/multi-session.test.ts`
**Purpose:** Test managing multiple sessions concurrently
**Duration:** ~60 seconds
**Dependencies:** None

### Test Cases

#### MULTI-001: Switch Between Sessions

**Group:** `describe('Session Switching')`

**Prerequisites:**
- Create 3 sessions with different statuses:
  - Session A: `in_progress`
  - Session B: `completed`
  - Session C: `in_progress`

**Steps:**
1. Navigate to app
2. Verify all 3 sessions in sidebar
3. Click Session A → verify active
4. Verify Session A info panel displays
5. Click Session B → verify active state switches
6. Verify Session B info panel displays
7. Click Session C → verify active state switches
8. Verify Session C info panel displays

**Assertions:**
- Only one session active at a time
- Active state switches immediately on click
- Info panel updates to reflect selected session
- Conversation panel updates to show correct messages
- No data bleed between sessions

**Selectors:**
- `.session-sidebar-item`
- `.session-sidebar-item.active`
- `.info-panel-header`
- `.messages-container`

**Chrome MCP Tools:**
- `click` → Switch sessions
- `take_snapshot` → Verify active state
- `evaluate_script` → Verify panel content

---

#### MULTI-002: Concurrent Status Updates

**Group:** `describe('Real-time Updates')`

**Prerequisites:**
- Create 2 active sessions

**Steps:**
1. Navigate to app
2. Update Session A status to `completed` via API
3. Wait 500ms for UI update
4. Verify Session A moves to RECENT section
5. Update Session B status to `failed` via API
6. Wait 500ms for UI update
7. Verify Session B status dot turns red
8. Verify both sessions still selectable

**Assertions:**
- Status updates reflect in UI via WebSocket
- Multiple sessions can update concurrently
- No race conditions or UI flickering
- Session order updates correctly

**Selectors:**
- `.session-sidebar-item`
- `.status-dot`
- Text: "ACTIVE", "RECENT"

**Chrome MCP Tools:**
- `evaluate_script` → Update statuses via API
- `wait_for` → Wait for updates
- `take_snapshot` → Verify changes

---

#### MULTI-003: Bulk Session Creation

**Group:** `describe('Bulk Operations')`

**Prerequisites:**
- Start with 0 sessions

**Steps:**
1. Navigate to app
2. Verify empty state
3. Create 5 sessions rapidly via UI (click new session 5 times)
4. Wait for all sessions to appear
5. Verify 5 sessions in sidebar
6. Verify each has unique ID
7. Verify session count shows "5 sessions"

**Assertions:**
- Multiple sessions can be created quickly
- No duplicate IDs
- All sessions render correctly
- UI remains responsive

**Selectors:**
- `.sidebar-new-session-btn`
- `.session-sidebar-item`
- `.session-count`

**Chrome MCP Tools:**
- `click` → Create sessions (x5)
- `wait_for` → Wait for all to appear
- `take_snapshot` → Verify count
- `evaluate_script` → Verify unique IDs

---

#### MULTI-004: Session Filtering (Future Feature)

**Group:** `describe('Session Filtering')`
**Status:** 🚧 PLANNED (not yet implemented)

**Prerequisites:**
- Create 10 sessions with various statuses and contexts

**Steps:**
1. TBD - Filter by status
2. TBD - Filter by context
3. TBD - Search by session ID
4. TBD - Sort by date/status

---

## Setup & Teardown Strategy

### Global Setup (Before All Tests)

```typescript
async function globalSetup() {
  // 1. Verify backend health
  const backendHealth = await fetch('http://localhost:3001/health');
  if (!backendHealth.ok) throw new Error('Backend not running');

  // 2. Verify frontend loaded
  await navigate('http://localhost:5173');
  const snapshot = await takeSnapshot();
  if (!snapshot.includes('Sessions')) throw new Error('Frontend not loaded');

  // 3. Clear existing sessions (optional - for clean slate)
  const sessions = await fetch('http://localhost:3001/api/sessions').then(r => r.json());
  for (const session of sessions) {
    await fetch(`http://localhost:3001/api/sessions/${session.id}`, { method: 'DELETE' });
  }
}
```

### Test Setup (Before Each Test)

```typescript
async function testSetup(testId: string) {
  // 1. Create unique test context
  const testContext = {
    testId,
    sessionId: undefined,
    elementUids: {},
    networkReqIds: {},
    stepResults: {},
  };

  // 2. Navigate to clean state
  await navigate('http://localhost:5173');
  await waitFor('Sessions', { timeout: 5000 });

  return testContext;
}
```

### Test Teardown (After Each Test)

```typescript
async function testTeardown(context: TestContext) {
  // 1. Clean up test sessions
  if (context.sessionId) {
    await fetch(`http://localhost:3001/api/sessions/${context.sessionId}`, {
      method: 'DELETE',
    });
  }

  // 2. Clear any test data
  // (WebSocket events, localStorage, etc.)

  // 3. Reset UI to default state
  await navigate('http://localhost:5173');
}
```

### Global Teardown (After All Tests)

```typescript
async function globalTeardown() {
  // 1. Final cleanup of any orphaned sessions
  const sessions = await fetch('http://localhost:3001/api/sessions').then(r => r.json());
  for (const session of sessions) {
    if (session.userId?.includes('e2e-test')) {
      await fetch(`http://localhost:3001/api/sessions/${session.id}`, { method: 'DELETE' });
    }
  }

  // 2. Take final screenshot for debugging
  await takeScreenshot({ filePath: 'test/e2e/reports/final-state.png' });
}
```

---

## Test Execution Order

### Recommended Execution Sequence

**Phase 1: Foundation (Run First)**
1. `session-lifecycle.test.ts` - LIFECYCLE-001 (Create New Session)
2. `session-sidebar.test.ts` - SIDEBAR-001 (Active Sessions Section)

**Phase 2: Core Functionality**
3. `session-lifecycle.test.ts` - All remaining tests
4. `session-sidebar.test.ts` - All remaining tests
5. `conversation-panel.test.ts` - All tests

**Phase 3: Advanced Features**
6. `session-info-panel.test.ts` - All tests
7. `session-archive.test.ts` - All tests

**Phase 4: Integration**
8. `multi-session.test.ts` - All tests

### Dependencies

- **LIFECYCLE-001** must pass before other lifecycle tests
- **SIDEBAR-001** must pass before sidebar navigation tests
- **CONV-002** (Send Message) depends on LIFECYCLE-001
- **ARCHIVE-001** depends on LIFECYCLE-003 (session deletion working)
- **MULTI-001** depends on SIDEBAR-003 (session selection working)

### Parallel Execution

These test suites can run in parallel:
- `session-info-panel.test.ts` (independent)
- `conversation-panel.test.ts` (independent)
- `session-sidebar.test.ts` (independent after LIFECYCLE-001)

These must run sequentially:
- `session-lifecycle.test.ts` → `multi-session.test.ts` (ordering dependency)

---

## Chrome MCP Tool Mapping

### Navigation & Loading
- **`navigate_page`** - Load app URL, navigate between pages
- **`wait_for`** - Wait for specific text/element to appear

### Page Inspection
- **`take_snapshot`** - Get text-based a11y tree (fast, preferred)
- **`take_screenshot`** - Get visual image (slower, for debugging)
- **`list_console_messages`** - Check for errors/warnings

### Element Interaction
- **`click`** - Click buttons, links, session items
- **`fill`** - Type into input/textarea fields
- **`hover`** - Show hover states (e.g., delete button)
- **`press_key`** - Keyboard shortcuts (Enter, Escape, etc.)

### Network & API
- **`list_network_requests`** - Get all network requests since navigation
- **`get_network_request`** - Get details of specific request (body, headers, status)
- **`evaluate_script`** - Run JavaScript to call APIs, check state, manipulate DOM

### State Verification
- **`evaluate_script`** - Check element properties, class names, computed styles
- **`list_console_messages`** - Verify no errors logged

---

## Test Data Strategy

### Session Creation Patterns

**Minimal Session:**
```json
{
  "userId": "e2e-test-user"
}
```

**Full Session:**
```json
{
  "userId": "e2e-test-user",
  "status": "in_progress",
  "conversationState": "awaiting_input",
  "metadata": {
    "routing": {
      "context": "work",
      "department": "engineering"
    }
  },
  "lastPrompt": {
    "question": "Test question?",
    "quickResponses": ["yes", "no"]
  },
  "messages": [
    {
      "role": "assistant",
      "content": "Test message from Claude",
      "timestamp": "2026-02-10T10:00:00Z"
    }
  ]
}
```

### Test User IDs

All E2E tests use user IDs with `e2e-test` prefix for easy cleanup:
- `e2e-test-user-001`
- `e2e-test-user-002`
- `e2e-test-lifecycle-001`

### Message Templates

**Assistant Message:**
```json
{
  "role": "assistant",
  "content": "I'll help you with that. Here's my analysis...",
  "timestamp": "2026-02-10T10:00:00Z",
  "stepNumber": 1
}
```

**User Message:**
```json
{
  "role": "user",
  "content": "Please proceed with the changes",
  "timestamp": "2026-02-10T10:01:00Z"
}
```

---

## Assertions & Validation

### Snapshot Assertions

**Text Content:**
```typescript
{
  check: 'snapshot_contains_text',
  target: 'Sessions',
  expected: true,
  message: 'Should find "Sessions" heading'
}
```

**Element Exists:**
```typescript
{
  check: 'snapshot_has_element',
  target: '.session-sidebar-item',
  expected: true,
  message: 'Should have session item in sidebar'
}
```

### Network Assertions

**Request Exists:**
```typescript
{
  check: 'network_request_exists',
  target: 'POST',
  expected: '/api/sessions',
  message: 'Should find POST request to create session'
}
```

**Status Code:**
```typescript
{
  check: 'network_status_code',
  expected: 201,
  message: 'Session creation should return 201'
}
```

**Response Contains:**
```typescript
{
  check: 'response_contains',
  target: 'id',
  expected: true,
  message: 'Response should contain session ID'
}
```

### Element State Assertions

**Truthy Check:**
```typescript
{
  check: 'truthy',
  expected: true,
  message: 'Element should be visible'
}
```

**WebSocket Connected:**
```typescript
{
  check: 'websocket_connected',
  expected: true,
  message: 'WebSocket should be connected'
}
```

---

## Failure Handling Strategy

### Critical Failures (onFailure: 'abort')

**Use for:**
- Navigation failures
- Backend health check failures
- Session creation failures (tests depend on this)
- Element not found (core UI missing)

**Example:**
```typescript
{
  tool: 'navigate_page',
  onFailure: 'abort', // Stop entire test suite
}
```

### Retriable Failures (onFailure: 'retry')

**Use for:**
- Network requests (may be slow)
- WebSocket connections (may take time to establish)
- Element interactions (may need time to become interactive)

**Example:**
```typescript
{
  tool: 'click',
  onFailure: 'retry', // Retry once before failing
}
```

### Non-Critical Failures (onFailure: 'continue')

**Use for:**
- Optional checks (WebSocket status)
- Cleanup operations (session deletion in teardown)
- Nice-to-have validations (freshness indicator)

**Example:**
```typescript
{
  tool: 'evaluate_script',
  onFailure: 'continue', // Log failure but continue test
}
```

---

## Screenshot Strategy

### When to Screenshot

**Always Screenshot:**
- After navigation (`navigate_page`)
- Before/after critical interactions (click new session, send message)
- On test failures (automatic)

**Optional Screenshot:**
- API-only checks (no visual change)
- Intermediate verification steps (snapshot is faster)

**Screenshot Naming:**
```
test/e2e/reports/screenshots/
  lifecycle-001-step-01-navigate.png
  lifecycle-001-step-04-session-created.png
  sidebar-003-step-05-active-state.png
```

### Screenshot Configuration

```typescript
{
  tool: 'take_screenshot',
  params: {
    filePath: `test/e2e/reports/screenshots/${testId}-step-${stepNum}.png`,
    format: 'png',
    fullPage: false, // Viewport only (faster)
  },
}
```

---

## Context Data Extraction

### Extracting Session IDs

```typescript
captureFrom: (response: unknown, context: TestContext) => {
  const data = response as { id: string };
  return { sessionId: data.id };
}
```

### Extracting Element UIDs

```typescript
captureFrom: (response: unknown, context: TestContext) => {
  // Claude manually identifies UID from snapshot
  // Then sets: context.elementUids.newSessionBtn = 'uid-123'
  return {};
}
```

### Extracting Network Request IDs

```typescript
captureFrom: (response: unknown, context: TestContext) => {
  const requests = response as NetworkRequest[];
  const createSessionReq = requests.find(r =>
    r.method === 'POST' && r.url.includes('/api/sessions')
  );
  return { networkReqIds: { createSession: createSessionReq?.id } };
}
```

---

## Test Coverage Summary

### Total Test Cases: 26

**By Suite:**
- Session Lifecycle: 3 tests
- Session Sidebar: 5 tests
- Session Info Panel: 4 tests
- Conversation Panel: 5 tests
- Session Archive: 3 tests
- Multi-Session Management: 4 tests (1 planned)

**By Priority:**
- **P0 (Critical):** 12 tests - Core functionality that must work
- **P1 (Important):** 10 tests - Key features that should work
- **P2 (Nice-to-have):** 4 tests - Enhanced UX features

### Coverage Matrix

| Component | Creation | Display | Interaction | Deletion | Real-time Updates |
|-----------|----------|---------|-------------|----------|-------------------|
| SessionSidebar | ✅ | ✅ | ✅ | ✅ | ✅ |
| SessionSidebarItem | ✅ | ✅ | ✅ | ✅ | ✅ |
| SessionInfoPanel | N/A | ✅ | ✅ | N/A | ✅ |
| ConversationPanel | N/A | ✅ | ✅ | N/A | ✅ |
| SessionPane | N/A | ✅ | ✅ | N/A | ⏳ |
| SessionArchive | N/A | ✅ | ✅ | ✅ | N/A |
| ClaudeCliTerminal | N/A | ⏳ | ⏳ | N/A | N/A |

**Legend:**
- ✅ Covered by tests
- ⏳ Partial coverage
- N/A Not applicable

---

## Execution Timeline

### Full Suite Execution
**Total Duration:** ~4-5 minutes

**Breakdown:**
- Setup: ~10s (backend/frontend health checks)
- Suite 1 (Lifecycle): ~60s
- Suite 2 (Sidebar): ~45s
- Suite 3 (Info Panel): ~30s
- Suite 4 (Conversation): ~45s
- Suite 5 (Archive): ~40s
- Suite 6 (Multi-Session): ~60s
- Teardown: ~10s

### Parallel Execution (Recommended)
**Total Duration:** ~2-3 minutes

**Parallel Groups:**
- **Group A:** Lifecycle + Multi-Session (sequential) → ~120s
- **Group B:** Sidebar + Conversation (parallel) → ~45s
- **Group C:** Info Panel + Archive (parallel) → ~40s

---

## Test Maintenance Notes

### When to Update Tests

**Add new tests when:**
- New UI components added
- New user interactions added
- New API endpoints added
- Critical bugs discovered

**Update existing tests when:**
- CSS class names change
- API endpoints change
- UI layout restructured
- Timing/timeouts need adjustment

### Brittle Test Indicators

**Watch out for:**
- Hard-coded element UIDs (should use snapshot)
- Fixed wait times (use `wait_for` instead)
- Absolute positioning (use semantic selectors)
- Hardcoded session IDs (use dynamic creation)

### Test Flakiness Prevention

**Best Practices:**
- Always wait for network requests to complete
- Use `wait_for` instead of fixed timeouts
- Verify element exists before interaction
- Clean up test data in teardown
- Use unique test user IDs

---

## Success Metrics

### Test Health Indicators

**Healthy Test Suite:**
- ✅ 100% pass rate on clean environment
- ✅ < 5% flakiness rate (same test passes/fails intermittently)
- ✅ < 5 minutes total execution time
- ✅ Zero false positives (failures that aren't real bugs)

**Unhealthy Test Suite:**
- ❌ < 90% pass rate
- ❌ > 10% flakiness rate
- ❌ > 10 minutes execution time
- ❌ Frequent false positives requiring re-runs

### Coverage Goals

**Current Coverage:** ~70% of user-facing features
**Target Coverage:** 90% of user-facing features

**Priority Coverage:**
1. Session CRUD operations (100% ✅)
2. User input/output (100% ✅)
3. Real-time updates (80% ⏳)
4. Error states (40% 🚧)
5. Edge cases (20% 🚧)

---

## Future Enhancements

### Phase 2 Test Additions (Planned)

1. **Error State Testing**
   - Network failures
   - Invalid session states
   - Malformed API responses

2. **Performance Testing**
   - Large session lists (100+ sessions)
   - Message history pagination
   - WebSocket message throughput

3. **Accessibility Testing**
   - Keyboard navigation
   - Screen reader compatibility
   - Focus management

4. **Cross-Browser Testing**
   - Firefox support
   - Safari support
   - Edge support

### Test Infrastructure Improvements

1. **Visual Regression Testing**
   - Screenshot comparison
   - CSS regression detection
   - Layout shift detection

2. **Test Reporting**
   - HTML test reports
   - Coverage reports
   - Performance metrics

3. **CI/CD Integration**
   - Automated test runs on PR
   - Nightly full suite runs
   - Slack notifications

---

## Resources

### Documentation
- [Chrome MCP E2E README](./README.md)
- [Chrome MCP Utils](./chrome-mcp-utils.ts)
- [Happy Path Test Example](./chrome-mcp-happy-path.test.ts)

### API Documentation
- Backend API: `packages/backend/src/routes/`
- WebSocket Events: `packages/shared/src/events.ts`
- Session Types: `packages/shared/src/types.ts`

### Component Source
- SessionSidebar: `packages/app/src/components/SessionSidebar/`
- ConversationPanel: `packages/app/src/components/ConversationPanel/`
- SessionInfoPanel: `packages/app/src/components/SessionPanel/`

---

**End of Test Plan**
