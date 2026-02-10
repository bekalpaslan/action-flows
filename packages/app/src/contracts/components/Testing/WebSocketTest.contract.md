# Component Contract: WebSocketTest

**File:** `packages/app/src/components/WebSocketTest.tsx`
**Type:** utility
**Parent Group:** Testing
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** WebSocketTest
- **Introduced:** 2025-11-15 (estimated)
- **Description:** Manual testing component for WebSocket real-time event system. Displays connection status, allows custom message sending, shows event statistics, filters events, and lists received events.

---

## Render Location

**Mounts Under:**
- Test routes only (not in production workbench)

**Render Conditions:**
1. Manually added to test route for WebSocket feature verification

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Developer navigates to test route

**Key Effects:**
None (relies on context and hooks)

**Cleanup Actions:**
None

**Unmount Triggers:**
- Developer navigates away

---

## Props Contract

### Inputs
None (self-contained test component)

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
None

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| testSessionId | SessionId | `brandedTypes.sessionId('test-session-' + Date.now())` | Generated on mount |
| customMessage | string | '' | Input onChange, cleared after send |
| eventTypeFilter | string | '' | Input onChange |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| WebSocketContext | `status`, `error`, `send`, `subscribe`, `unsubscribe` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| filteredEvents | WorkspaceEvent[] | `[events, eventTypeFilter]` | `events.filter(e => e.type.includes(eventTypeFilter))` |

### Custom Hooks
- `useEvents(testSessionId)` — Returns all events for test session
- `useLatestEvent(testSessionId, 'chain:completed')` — Returns latest chain completion event
- `useEventStats(testSessionId)` — Returns event statistics (total, byType, lastEventTime)

---

## Interactions

### Parent Communication
None (isolated test component)

### Child Communication
None (leaf component)

### Sibling Communication
None

### Context Interaction
- **Context:** WebSocketContext
- **Role:** consumer
- **Operations:** Reads connection status, sends test messages, subscribes/unsubscribes to test session

---

## Side Effects

### API Calls
None (uses WebSocket only)

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| All event types | WebSocket receives | `useEvents` hook collects into array |

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
None

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
None (inline styles, not production component)

**Data Test IDs:**
None

**ARIA Labels:**
None (test component)

**Visual Landmarks:**
1. Connection Status section — Shows status badge, error (if any), subscribe/unsubscribe buttons
2. Send Message section — Input field and Send button for custom messages
3. Event Statistics section — Total events, last event time, breakdown by type
4. Latest Chain Event section — Shows most recent chain:completed event (if any)
5. Event Filter section — Input to filter events by type
6. Events List section — Scrollable list of all events

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-WST-001: WebSocket Connection Active
- **Type:** connection
- **Target:** `WebSocketContext.status`
- **Condition:** Status is 'connected'
- **Failure Mode:** Events not received, send fails
- **Automation Script:**
```javascript
// Chrome MCP script
const statusBadge = document.querySelector('[style*="backgroundColor: #4caf50"]'); // Green = connected
if (!statusBadge || !statusBadge.textContent.includes('connected')) {
  throw new Error('WebSocket not connected');
}
```

#### HC-WST-002: Send Message Functional
- **Type:** interaction
- **Target:** Send button
- **Condition:** Clicking send calls `WebSocketContext.send()` with custom message
- **Failure Mode:** Cannot send test messages
- **Automation Script:**
```javascript
// Chrome MCP script
const input = document.querySelector('input[placeholder*="test message"]');
const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Send');
input.value = 'Test message';
input.dispatchEvent(new Event('input', { bubbles: true }));
sendBtn.click();
// Check if message cleared after send
setTimeout(() => {
  if (input.value !== '') console.warn('Input not cleared after send');
}, 100);
```

#### HC-WST-003: Event Statistics Update
- **Type:** render
- **Target:** Event statistics section
- **Condition:** Stats display total, lastEventTime, byType breakdown
- **Failure Mode:** Cannot monitor event activity
- **Automation Script:**
```javascript
// Chrome MCP script
const statsSection = document.querySelector('h3:contains("Event Statistics")');
const totalEvents = statsSection.nextElementSibling.querySelector('strong');
if (!totalEvents) throw new Error('Event statistics not rendering');
```

### Warning Checks (Should Pass)

#### HC-WST-004: Event Filter Works
- **Type:** interaction
- **Target:** Event type filter input
- **Condition:** Typing filter updates displayed event list
- **Failure Mode:** Cannot filter events

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 100 | ms | Time to mount test panel |
| event-display-latency | 50 | ms | Time from event received to displayed in list |

---

## Dependencies

**Required Contexts:**
- WebSocketContext

**Required Hooks:**
- `useEvents(sessionId)`
- `useLatestEvent(sessionId, eventType)`
- `useEventStats(sessionId)`

**Child Components:**
None (inline styled UI)

**Required Props:**
None

---

## Notes

**Test Session ID:**
- Generated dynamically on mount: `'test-session-' + Date.now()`
- Allows isolated testing without interfering with real sessions

**Connection Status Colors:**
- `connected`: Green (#4caf50)
- `disconnected`: Orange (#ff9800)
- `error`: Red (#f44336)
- `connecting`: Blue (#2196f3)

**Send Message:**
- Sends custom test messages to WebSocket
- Message format: `{ type: 'test', message, timestamp }`
- Input cleared after successful send
- Enter key also triggers send

**Event Statistics:**
- **Total Events**: Count of all events received for test session
- **Last Event Time**: Timestamp of most recent event
- **By Type**: Breakdown showing count per event type (e.g., `session:started: 1`, `chain:completed: 3`)

**Event Filter:**
- Case-sensitive substring match on `event.type`
- Updates filtered event list in real-time
- Shows "Showing X of Y events" count

**Events List:**
- Displays all events received for test session
- Format: `{type} - {timestamp} (User: {user})`
- Scrollable container (max 400px height)
- Empty state: "No events received yet. Subscribe to start receiving events."

**Subscribe/Unsubscribe:**
- Manual controls to test session subscription lifecycle
- Subscribe: Registers test session ID with WebSocket
- Unsubscribe: Removes test session ID from WebSocket subscriptions

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
