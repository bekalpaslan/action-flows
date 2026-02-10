# Component Contract: ChainLiveMonitor

**File:** `packages/app/src/components/ChainLiveMonitor.tsx`
**Type:** feature
**Parent Group:** Canvas & Visualization
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ChainLiveMonitor
- **Introduced:** 2025-Q4
- **Description:** Real-time chain monitoring with WebSocket event integration, demonstrates useChainState + useChainEvents pattern.

---

## Render Location

**Mounts Under:**
- Feature component (embedded in pages/views)

**Render Conditions:**
1. Valid sessionId provided
2. WebSocket connection available

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent component renders with valid sessionId

**Key Effects:**
1. **Dependencies:** `[initialChain, chain, setChain]`
   - **Side Effects:** Initializes chain from initialChain prop if not already set
   - **Cleanup:** None
   - **Condition:** Runs on mount and when deps change

2. **Dependencies:** `[sessionId]` (from useChainEvents)
   - **Side Effects:** Registers 4 WebSocket event callbacks (spawned, completed, failed, skipped)
   - **Cleanup:** WebSocket unsubscribe
   - **Condition:** Runs when sessionId changes

**Cleanup Actions:**
- WebSocket event listeners unsubscribed

**Unmount Triggers:**
- Parent component unmounts or sessionId changes

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | SessionId | ✅ | N/A | Session to monitor |
| initialChain | any | ❌ | undefined | Initial chain data |

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | ChainDAG | Chain data passed as prop |

---

## State Ownership

### Local State
None (managed by custom hooks)

### Context Consumption
None (WebSocket handled via hook)

### Derived State
None

### Custom Hooks
- `useChainState()` — Manages chain state with updateStep/setChain methods
- `useChainEventSummary(sessionId)` — Tracks event metrics (totalEvents, lastEventTime)
- `useChainEvents(sessionId, onSpawned, onCompleted, onFailed, onSkipped)` — WebSocket event handlers

---

## Interactions

### Parent Communication
- **Mechanism:** prop
- **Description:** Receives sessionId and initialChain from parent
- **Example:** Parent passes session identifier for monitoring

### Child Communication
- **Child:** ChainDAG
- **Mechanism:** props
- **Data Flow:** Passes chain state for visualization

### Sibling Communication
None

### Context Interaction
None (uses hooks instead)

---

## Side Effects

### API Calls
None (event-driven only)

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| `step:spawned` | Step execution started | updateStep (status: in_progress, startedAt) |
| `step:completed` | Step finished successfully | updateStep (status: completed, duration, completedAt) |
| `step:failed` | Step encountered error | updateStep (status: failed, error, completedAt) |
| `step:skipped` | Step was skipped | updateStep (status: skipped) |

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
None

### Electron IPC
None

---

## Test Hooks

**CSS Selectors:**
- `.chain-live-monitor`
- `.monitor-header`
- `.event-status`
- `.indicator-dot.online`
- `.monitor-content`
- `.status-indicator`
- `.indicator-text`
- `.event-counter`

**Data Test IDs:**
None

**ARIA Labels:**
None

**Visual Landmarks:**
1. Header with "Live Chain Monitor" title (`.monitor-header`)
2. Online status indicator with green dot (`.indicator-dot.online`)
3. Event counter showing total events (`.event-counter`)
4. ChainDAG visualization area

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CLM-001: Component Render
- **Type:** render
- **Target:** ChainLiveMonitor container
- **Condition:** `.chain-live-monitor` exists
- **Failure Mode:** No monitoring UI
- **Automation Script:**
```javascript
const monitor = document.querySelector('.chain-live-monitor');
if (!monitor) throw new Error('Monitor not rendered');
return true;
```

#### HC-CLM-002: Status Indicator
- **Type:** render
- **Target:** Online status dot
- **Condition:** `.indicator-dot.online` exists
- **Failure Mode:** Connection status unclear
- **Automation Script:**
```javascript
const monitor = document.querySelector('.chain-live-monitor');
const statusDot = monitor.querySelector('.indicator-dot.online');
if (!statusDot) throw new Error('Status indicator missing');
return true;
```

#### HC-CLM-003: Event Counter
- **Type:** render
- **Target:** Event count display
- **Condition:** `.event-counter` exists
- **Failure Mode:** Cannot track event activity
- **Automation Script:**
```javascript
const monitor = document.querySelector('.chain-live-monitor');
const eventCounter = monitor.querySelector('.event-counter');
if (!eventCounter) throw new Error('Event counter missing');
return true;
```

### Warning Checks (Should Pass)

#### HC-CLM-004: WebSocket Connection
- **Type:** connection
- **Target:** WebSocket hook subscription
- **Condition:** useChainEvents successfully subscribes
- **Failure Mode:** No real-time updates

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 100 | ms | Time to first paint |
| event-latency | 500 | ms | Time from WebSocket event to UI update |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
- useChainState
- useChainEvents
- useChainEventSummary
- useMemo

**Child Components:**
- ChainDAG

**Required Props:**
- sessionId

---

## Notes

- This component demonstrates the full integration pattern for real-time chain monitoring
- If initialChain is not provided, shows loading state until chain data arrives
- Event summary updates automatically via useChainEventSummary hook
- All WebSocket event handling is abstracted into useChainEvents hook
- Loading state shows spinner and "Waiting for chain data..." message

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
