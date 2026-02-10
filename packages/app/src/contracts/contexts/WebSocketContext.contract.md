# Component Contract: WebSocketContext

**File:** `packages/app/src/contexts/WebSocketContext.tsx`
**Type:** utility
**Parent Group:** contexts
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** WebSocketContext
- **Introduced:** 2026-01-15
- **Description:** Provides WebSocket connection management for real-time event streaming between frontend and backend (ws://localhost:3001/ws). Handles connection lifecycle, reconnection logic, heartbeat, and event callback registration.

---

## Render Location

**Mounts Under:**
- App.tsx (root level provider)

**Render Conditions:**
1. Always renders (root provider)

**Positioning:** N/A (context provider)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Application initialization

**Key Effects:**
1. **Dependencies:** `[url]`
   - **Side Effects:** Establishes WebSocket connection via useWebSocket hook, starts heartbeat timer (30s interval), enables automatic reconnection with exponential backoff (3s base)
   - **Cleanup:** Closes WebSocket connection, stops heartbeat timer, clears reconnection timeouts
   - **Condition:** On mount and when url prop changes

**Cleanup Actions:**
- Closes WebSocket connection
- Stops heartbeat ping timer
- Clears reconnection backoff timers
- HTTP polling fallback cleanup (if active)

**Unmount Triggers:**
- Application shutdown (never unmounts in normal operation)

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | ✅ | N/A | Child components to receive context |
| url | string | ❌ | `ws://localhost:3001/ws` | WebSocket server URL |

### Callbacks Up (to parent)
N/A (root provider)

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| send | `(message: WorkspaceEvent) => void` | All consumers | Sends message to WebSocket server |
| subscribe | `(sessionId: SessionId) => void` | All consumers | Subscribes to session-specific events |
| unsubscribe | `(sessionId: SessionId) => void` | All consumers | Unsubscribes from session events |
| onEvent | `(callback: (event: WorkspaceEvent) => void) => () => void` | All consumers | Registers event callback, returns unregister function |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| eventCallbacksRef | `Set<(event: WorkspaceEvent) => void>` | `new Set()` | registerEventCallback, returned unregister function |

### Context Consumption
N/A (this is a provider)

### Derived State
N/A

### Custom Hooks
- `useWebSocket({ url, onEvent, reconnectInterval, heartbeatInterval })` — Manages WebSocket connection lifecycle, returns { status, error, send, subscribe, unsubscribe }

---

## Interactions

### Parent Communication
- **Mechanism:** Props
- **Description:** Receives url prop from App.tsx, wraps entire component tree
- **Example:** `<WebSocketProvider url="ws://localhost:3001/ws"><App /></WebSocketProvider>`

### Child Communication
- **Child:** All components needing real-time updates
- **Mechanism:** Context value via useWebSocketContext()
- **Data Flow:** status, error, send(), subscribe(), unsubscribe(), onEvent() available to all consumers

### Sibling Communication
N/A (provider has no siblings at app root)

### Context Interaction
- **Context:** WebSocketContext
- **Role:** provider
- **Operations:** Provides connection status, send/subscribe/unsubscribe functions, event callback registration

---

## Side Effects

### API Calls
N/A (WebSocket only, no HTTP)

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| `open` | Connection established | Sets status to 'connected', starts heartbeat ping |
| `message` | Server sends event | Parses JSON, dispatches to all registered callbacks via handleEvent |
| `close` | Connection closed | Sets status to 'disconnected', initiates reconnection with backoff |
| `error` | Connection error | Sets status to 'error', stores error state, triggers reconnection |
| `ping` | Heartbeat timer | Sends ping message every 25s to keep connection alive |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| interval | 25000ms | Heartbeat ping to keep WebSocket alive | ✅ Cleared on unmount |
| timeout | 30000ms | Heartbeat timeout (detect stale connection) | ✅ Cleared on unmount |
| timeout | 3000-30000ms (exponential backoff) | Reconnection delay after disconnect | ✅ Cleared on unmount |
| interval | 5000ms | HTTP polling fallback (after 3 consecutive failures) | ✅ Cleared when WebSocket reconnects |

### LocalStorage Operations
N/A

### DOM Manipulation
N/A

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
N/A (context provider, no visual elements)

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
N/A

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-WS-001: Connection Established Within 5s
- **Type:** connection-timeout
- **Target:** WebSocket connection to ws://localhost:3001/ws
- **Condition:** `status === 'connected'` within 5000ms of mount
- **Failure Mode:** All real-time features will not work, should fall back to HTTP polling
- **Automation Script:**
```javascript
// Chrome MCP script
await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for providers to mount
const status = await evaluateScript(() => {
  const wsContext = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.findFiberByHostInstance?.(document.body)?.return?.return?.memoizedProps?.children?.props?.children?.type?._context?._currentValue?.status;
  return wsContext || 'unknown';
});
if (status !== 'connected') {
  throw new Error(`WebSocket not connected after 5s: status=${status}`);
}
```

#### HC-WS-002: Event Callback Registration
- **Type:** context-registration
- **Target:** onEvent callback registry
- **Condition:** onEvent function is callable and returns unregister function
- **Failure Mode:** Components cannot subscribe to WebSocket events, real-time updates break
- **Automation Script:**
```javascript
// Chrome MCP script
const result = await evaluateScript(() => {
  const wsContext = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.findFiberByHostInstance?.(document.body)?.return?.return?.memoizedProps?.children?.props?.children?.type?._context?._currentValue;
  if (typeof wsContext?.onEvent !== 'function') return { success: false, error: 'onEvent not a function' };
  const unregister = wsContext.onEvent(() => {});
  if (typeof unregister !== 'function') return { success: false, error: 'onEvent did not return unregister function' };
  unregister(); // Cleanup
  return { success: true };
});
if (!result.success) throw new Error(`Event callback registration failed: ${result.error}`);
```

#### HC-WS-003: Automatic Reconnection After Disconnect
- **Type:** resilience
- **Target:** Reconnection logic in useWebSocket hook
- **Condition:** After disconnect, status becomes 'connecting' then 'connected' within 10s
- **Failure Mode:** Permanent disconnection, no recovery without page reload
- **Automation Script:**
```javascript
// Chrome MCP script (requires manual disconnect trigger)
// Note: This test requires backend cooperation to trigger disconnect
const initialStatus = await evaluateScript(() => window.__wsStatus);
// Trigger disconnect (backend must support this)
await fetch('http://localhost:3001/api/test/disconnect-ws', { method: 'POST' });
await new Promise(resolve => setTimeout(resolve, 500)); // Wait for disconnect
const disconnectedStatus = await evaluateScript(() => window.__wsStatus);
if (disconnectedStatus !== 'disconnected' && disconnectedStatus !== 'connecting') {
  throw new Error(`Expected disconnect, got: ${disconnectedStatus}`);
}
// Wait for reconnection
await new Promise(resolve => setTimeout(resolve, 5000));
const reconnectedStatus = await evaluateScript(() => window.__wsStatus);
if (reconnectedStatus !== 'connected') {
  throw new Error(`Failed to reconnect after 5s: ${reconnectedStatus}`);
}
```

### Warning Checks (Should Pass)

#### HC-WS-W001: Heartbeat Active
- **Type:** health-monitoring
- **Target:** Heartbeat ping timer
- **Condition:** Ping sent every 25-30s when connected
- **Failure Mode:** Connection may become stale, longer time to detect disconnects

#### HC-WS-W002: HTTP Polling Fallback Activates
- **Type:** fallback-mechanism
- **Target:** HTTP polling after 3 consecutive WebSocket failures
- **Condition:** After 3 failures, polling interval starts at 5s
- **Failure Mode:** Complete loss of real-time updates if WebSocket permanently fails

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| connection-time | 2000 | ms | Time from mount to 'connected' status |
| reconnect-time | 5000 | ms | Time from disconnect to reconnect |
| event-dispatch-latency | 50 | ms | Time from message received to callbacks executed |
| heartbeat-interval | 30000 | ms | Max time between heartbeat pings |

---

## Dependencies

**Required Contexts:**
N/A (this is a root provider)

**Required Hooks:**
- `useWebSocket()`

**Child Components:**
N/A (wraps entire app)

**Required Props:**
- `children` (ReactNode)

---

## Notes

- WebSocket connection is established immediately on mount and maintained throughout app lifecycle
- Exponential backoff prevents reconnection storms: 3s → 6s → 12s → 24s → 30s (max)
- HTTP polling fallback (5s interval) activates after 3 consecutive WebSocket failures
- All event callbacks are stored in a Set ref to avoid re-renders on registration
- The onEvent registration pattern allows components to subscribe/unsubscribe without causing context re-renders
- Status enum: 'connecting' | 'connected' | 'disconnected' | 'error' | 'polling'
- useWebSocketContext() hook throws if used outside provider (defensive programming)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
