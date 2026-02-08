# WebSocket Implementation

Complete WebSocket client and real-time update implementation for ActionFlows Dashboard.

---

## Overview

Complete WebSocket client implementation for real-time event streaming in the ActionFlows Dashboard. Provides React hooks and context for managing WebSocket connections with automatic reconnection, session subscriptions, and type-safe event handling. Includes real-time step status updates in the DAG visualization with smooth animations and visual feedback.

---

## Files Created

### Core WebSocket Implementation

#### 1. `packages/app/src/hooks/useWebSocket.ts`

Low-level WebSocket management hook.

**Features:**
- Auto-reconnect with exponential backoff (3s → 6s → 12s → 24s → 30s max)
- Connection status tracking (connecting, connected, disconnected, error)
- Session subscription/unsubscription support
- Heartbeat detection for stale connections (30s timeout)
- Type-safe event parsing using @afw/shared types

**API:**
```typescript
export interface UseWebSocketOptions {
  url: string;
  onEvent?: (event: WorkspaceEvent) => void;
  reconnectInterval?: number; // default 3000ms
  heartbeatInterval?: number; // default 30000ms
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  send: (message: any) => void;
  subscribe: (sessionId: SessionId) => void;
  unsubscribe: (sessionId: SessionId) => void;
  error: Error | null;
}
```

#### 2. `packages/app/src/contexts/WebSocketContext.tsx`

React Context Provider for app-wide WebSocket management.

**Features:**
- Wraps useWebSocket hook
- Provides connection status and event handlers to all children
- Default URL: ws://localhost:3001/ws
- Supports custom URLs

**Usage:**
```typescript
<WebSocketProvider url="ws://localhost:3001/ws">
  <App />
</WebSocketProvider>
```

#### 3. `packages/app/src/hooks/useEvents.ts`

High-level hook for session event management.

**Features:**
- Auto-subscribe/unsubscribe on mount/unmount
- Optional event type filtering
- Local event history state
- Additional utilities:
  - `useLatestEvent()` - Get most recent event of a type
  - `useFilteredEvents()` - Custom event filtering with predicates
  - `useEventStats()` - Event statistics and metadata

**API:**
```typescript
export function useEvents(
  sessionId: SessionId,
  eventTypes?: string[]
): WorkspaceEvent[]
```

### Component Updates

#### 4. `packages/app/src/App.tsx` (Updated)

- Wraps app in WebSocketProvider
- Delegates rendering to AppContent component

#### 5. `packages/app/src/components/AppContent.tsx` (New)

Main app content component.

**Features:**
- Displays real-time connection status (not hardcoded)
- Status indicators:
  - Green "Connected" when ws status is 'connected'
  - Orange "Disconnected" when ws status is 'disconnected'
  - Red "Connection Error" when ws status is 'error'
  - Yellow pulsing "Connecting..." when ws status is 'connecting'

### Supporting Files

#### 6. `packages/app/src/hooks/index.ts` (New)

Export barrel for hooks. Simplifies imports:
```typescript
import { useWebSocket, useEvents } from '@/hooks';
```

#### 7. `packages/app/src/contexts/index.ts` (New)

Export barrel for contexts. Simplifies imports:
```typescript
import { WebSocketProvider } from '@/contexts';
```

#### 8. `packages/app/src/hooks/WEBSOCKET_USAGE.md` (New)

- Comprehensive usage guide
- Multiple code examples
- Best practices and troubleshooting

### Styling Updates

#### 9. `packages/app/src/App.css` (Updated)

Added styles for connection status states:
- `.status.connected` - Green background and indicator
- `.status.error` - Red background and indicator
- `.status.disconnected` - Orange background and indicator
- `.status.connecting` - Pulsing animation
- Maintains existing dark theme

---

## Real-Time Updates

The implementation provides real-time status updates for execution steps in the DAG (Directed Acyclic Graph) visualization. Steps transition through statuses (pending → in_progress → completed/failed) with smooth animations and visual feedback.

### Components

#### 1. useChainState Hook (`src/hooks/useChainState.ts`)

Manages the complete chain state and provides methods to update individual steps.

**Key Features:**
- Maintains immutable chain state using React hooks
- Updates single steps without re-rendering the entire chain
- Recalculates chain statistics (successfulSteps, failedSteps, etc.) on updates
- Updates overall chain status based on step statuses

**API:**
```typescript
const { chain, updateStep, setChain } = useChainState();

// Update a single step
updateStep(1, {
  status: 'in_progress',
  startedAt: timestamp,
  duration: 1000,
});

// Set entire chain
setChain(newChain);
```

#### 2. useChainEvents Hook (`src/hooks/useChainEvents.ts`)

Connects WebSocket events to chain state updates via callbacks.

**Key Features:**
- Listens for step lifecycle events (spawned, completed, failed, skipped)
- Filters events by session ID and type
- Provides callbacks for each event type
- Includes event summary hook for monitoring

**API:**
```typescript
const { chain, updateStep } = useChainState();

// Connect events to state updates
useChainEvents(
  sessionId,
  (stepNumber) => {
    // Step spawned - set to in_progress
    updateStep(stepNumber, { status: 'in_progress' });
  },
  (stepNumber, duration) => {
    // Step completed - set final status
    updateStep(stepNumber, { status: 'completed', duration });
  },
  (stepNumber, error) => {
    // Step failed - record error
    updateStep(stepNumber, { status: 'failed', error });
  },
  (stepNumber) => {
    // Step skipped
    updateStep(stepNumber, { status: 'skipped' });
  }
);
```

#### 3. ChainDAG Component Updates (`src/components/ChainDAG/ChainDAG.tsx`)

Enhanced to support real-time updates via callback prop.

**New Props:**
- `onStepUpdate?: (stepNumber: number, updates: any) => void` - Called when a step needs to be updated

#### 4. StepNode Component (`src/components/ChainDAG/StepNode.tsx`)

Enhanced with animations for status transitions.

**Features:**
- Fade-in animation when transitioning to in_progress or completed
- Pulsing animation for in_progress nodes
- Duration display when step completes
- Error indicator for failed steps

#### 5. CSS Animations (`src/components/ChainDAG/ChainDAG.css`)

Enhanced with smooth transitions and animations.

**New Keyframes:**
- `pulse-glow` - Expanding glow pulse for in-progress nodes
- `fadeIn` - Smooth fade and scale animation
- Smooth color transitions (0.3s ease) for status color changes

#### 6. ChainLiveMonitor Component (`src/components/ChainLiveMonitor.tsx`)

Complete integration of state management and event handling.

**Features:**
- Uses useChainState for state management
- Uses useChainEvents for event listening
- Displays event statistics
- Shows real-time status updates in ChainDAG
- Ready to connect to WebSocket backend

#### 7. ChainDemo Component (`src/components/ChainDemo.tsx`)

Interactive demo for testing status updates without a backend.

**Features:**
- Automated scenario runner
- Manual step controls (spawn, complete, fail, skip)
- Real-time visualization updates
- Useful for UI testing and demonstration

---

## Features

### Connection Management
- ✅ Auto-reconnect with exponential backoff
- ✅ Connection status tracking
- ✅ Heartbeat for stale connection detection
- ✅ Graceful error handling
- ✅ Automatic resubscription after reconnection

### Event Handling
- ✅ Type-safe event parsing using @afw/shared types
- ✅ Session-based event filtering
- ✅ Event type filtering
- ✅ Event deduplication via eventId
- ✅ Complete event history tracking

### Session Management
- ✅ Subscribe to specific sessions
- ✅ Unsubscribe from sessions
- ✅ Multi-session support
- ✅ Automatic cleanup on unmount

### Developer Experience
- ✅ Multiple abstraction levels (low to high)
- ✅ TypeScript with full type inference
- ✅ Comprehensive error messages
- ✅ Production-ready logging
- ✅ React best practices (hooks, context, cleanup)

---

## Usage Examples

### Basic Connection Status

```typescript
import { useWebSocketContext } from '@/contexts';

function StatusIndicator() {
  const { status, error } = useWebSocketContext();

  return (
    <div>
      <p>Status: {status}</p>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Monitor Session Events

```typescript
import { useEvents } from '@/hooks';
import type { SessionId } from '@afw/shared';

function SessionMonitor({ sessionId }: { sessionId: SessionId }) {
  const events = useEvents(sessionId);

  return (
    <div>
      <p>Events received: {events.length}</p>
      {events.map((event) => (
        <div key={event.eventId || event.timestamp}>
          {event.type}
        </div>
      ))}
    </div>
  );
}
```

### Filter Events by Type

```typescript
import { useEvents } from '@/hooks';

function ChainMonitor({ sessionId }: { sessionId: SessionId }) {
  // Only listen to chain events
  const chainEvents = useEvents(sessionId, [
    'chain:started',
    'chain:completed',
  ]);

  return <div>Chain Events: {chainEvents.length}</div>;
}
```

### Get Event Statistics

```typescript
import { useEventStats } from '@/hooks';

function EventStats({ sessionId }: { sessionId: SessionId }) {
  const stats = useEventStats(sessionId);

  return (
    <div>
      <p>Total: {stats.total}</p>
      {Object.entries(stats.byType).map(([type, count]) => (
        <p key={type}>{type}: {count}</p>
      ))}
    </div>
  );
}
```

### Basic Integration with Chain State

```tsx
import { useChainState, useChainEvents } from './hooks';
import { ChainDAG } from './components/ChainDAG';

function MyComponent({ sessionId, chain }) {
  const { chain: chainState, updateStep, setChain } = useChainState();

  // Initialize chain
  useEffect(() => {
    setChain(chain);
  }, [chain]);

  // Listen for events and update state
  useChainEvents(
    sessionId,
    (stepNumber) => updateStep(stepNumber, { status: 'in_progress' }),
    (stepNumber, duration) => updateStep(stepNumber, { status: 'completed', duration }),
    (stepNumber, error) => updateStep(stepNumber, { status: 'failed', error }),
    (stepNumber) => updateStep(stepNumber, { status: 'skipped' })
  );

  return <ChainDAG chain={chainState} />;
}
```

### Using ChainLiveMonitor (Recommended)

```tsx
import { ChainLiveMonitor } from './components/ChainLiveMonitor';
import { sampleChain } from './data/sampleChain';

function Dashboard() {
  return (
    <ChainLiveMonitor
      sessionId="session-123"
      initialChain={sampleChain}
    />
  );
}
```

### Testing with ChainDemo

```tsx
import { ChainDemo } from './components/ChainDemo';

function TestPage() {
  return <ChainDemo />;
}
```

---

## Supported Event Types

All events from @afw/shared are supported:

**Session Events:**
- session:started
- session:ended

**Chain Events:**
- chain:compiled
- chain:started
- chain:completed

**Step Events:**
- step:spawned
- step:started
- step:completed
- step:failed

**Interaction Events:**
- interaction:awaiting-input
- interaction:input-received

**File Events:**
- file:created
- file:modified
- file:deleted

**Registry & System Events:**
- registry:line-updated
- execution:log-created
- error:occurred
- warning:occurred

See `packages/shared/src/events.ts` for complete event definitions.

---

## Event Formats

### Step Spawned Event
```typescript
{
  type: 'step_spawned',
  sessionId: SessionId,
  data: {
    stepNumber: number,
    action: string,
  },
  timestamp: string,
}
```

### Step Completed Event
```typescript
{
  type: 'step_completed',
  sessionId: SessionId,
  data: {
    stepNumber: number,
    duration: number, // milliseconds
    result?: any,
  },
  timestamp: string,
}
```

### Step Failed Event
```typescript
{
  type: 'step_failed',
  sessionId: SessionId,
  data: {
    stepNumber: number,
    error: string,
    message?: string,
  },
  timestamp: string,
}
```

### Step Skipped Event
```typescript
{
  type: 'step_skipped',
  sessionId: SessionId,
  data: {
    stepNumber: number,
    reason?: string,
  },
  timestamp: string,
}
```

---

## Implementation Flow

### Event Flow

```
Backend Event (WebSocket)
      ↓
useChainEvents (listens)
      ↓
Callback triggered
      ↓
updateStep called
      ↓
Chain state updated
      ↓
ChainDAG re-renders
      ↓
Animations triggered
```

### State Update Flow

```
updateStep(stepNumber, updates)
      ↓
Find step in chain
      ↓
Merge updates with existing step
      ↓
Recalculate chain statistics
      ↓
Update overall chain status
      ↓
Return new chain object
      ↓
React triggers re-render
```

### Animation Flow

```
Status changes (pending → in_progress)
      ↓
CSS class updates (.step-node.status-in_progress)
      ↓
Transition animations begin (0.3s ease)
      ↓
Keyframe animations play (pulse-glow, pulse-border)
      ↓
User sees smooth, visual feedback
```

---

## Animation Details

### Status Transitions

1. **Pending → In Progress**
   - Color: gray → yellow
   - Animation: fadeIn (0.3s) + pulse-glow (1.5s loop)
   - Border: pulse effect every 2s

2. **In Progress → Completed**
   - Color: yellow → green
   - Animation: fadeIn (0.3s)
   - Shows duration badge

3. **In Progress → Failed**
   - Color: yellow → red
   - Animation: fadeIn (0.3s)
   - Shows error badge

4. **Any → Skipped**
   - Color: → gray with reduced opacity
   - Animation: fadeIn (0.3s)

### Animation Classes

- `.step-node.fade-in` - Smooth entry animation
- `.step-node.status-in_progress` - Pulsing glow effect
- `.step-node.status-completed` - Green success state
- `.step-node.status-failed` - Red error state
- `.step-node.status-skipped` - Grayed out state

---

## Architecture

### Component Hierarchy

```
App.tsx
└── WebSocketProvider (context)
    └── AppContent (uses useWebSocketContext)
        ├── Status Display
        └── Child Components (can use useEvents, useLatestEvent, etc.)

useWebSocket Hook
├── WebSocket Connection Management
├── Auto-reconnect Logic
├── Heartbeat Detection
├── Event Parsing
└── Session Subscription

WebSocketContext
├── Wraps useWebSocket
├── Provides to children
└── Manages event callbacks

useEvents Hook
├── Uses WebSocketContext
├── Auto-subscribe/unsubscribe
├── Local event state
└── Event filtering
```

### File Structure

```
packages/app/src/
├── hooks/
│   ├── useWebSocket.ts           # Core WebSocket hook
│   ├── useEvents.ts              # Event management hook
│   ├── useChainState.ts          # State management hook
│   ├── useChainEvents.ts         # Event listening hook
│   ├── WEBSOCKET_USAGE.md        # Usage documentation
│   └── index.ts                  # Re-exports
├── contexts/
│   ├── WebSocketContext.tsx      # WebSocket provider
│   └── index.ts                  # Re-exports
├── components/
│   ├── AppContent.tsx            # Main content component
│   ├── ChainDAG/
│   │   ├── ChainDAG.tsx          # Updated with status support
│   │   ├── StepNode.tsx          # Updated with animations
│   │   └── ChainDAG.css          # Enhanced animations
│   ├── ChainDemo.tsx             # Interactive demo
│   ├── ChainLiveMonitor.tsx      # Full integration example
│   └── ...
└── styles/
    ├── ChainDemo.css             # Demo styling
    └── ChainLiveMonitor.css      # Monitor styling
```

---

## Configuration

### WebSocket URL

**Default:** `ws://localhost:3001/ws`

**Override when creating provider:**
```typescript
<WebSocketProvider url="ws://prod.example.com:3001/ws">
  <App />
</WebSocketProvider>
```

**Or with environment variables:**
```typescript
<WebSocketProvider url={process.env.VITE_WS_URL || 'ws://localhost:3001/ws'}>
  <App />
</WebSocketProvider>
```

### Reconnection Settings

```typescript
const { /* ... */ } = useWebSocket({
  url: 'ws://localhost:3001/ws',
  reconnectInterval: 3000,     // Initial retry delay (ms)
  heartbeatInterval: 30000,    // Stale connection timeout (ms)
});
```

---

## Performance Considerations

### Event History

Events are stored in component state. For long-running sessions, consider implementing:
- Event retention policies
- Pagination
- Virtual scrolling

### Memory

Each useEvents hook maintains its own event array. In high-throughput scenarios:
- Use event type filtering
- Use useLatestEvent() for single values
- Implement cleanup strategies

### Network

WebSocket reduces overhead compared to polling:
- No HTTP headers per message
- Persistent connection
- Server push capability

### Real-Time Updates

1. **Immutable Updates**: Chain state is updated immutably, allowing React to efficiently determine what changed

2. **Selective Re-renders**: Only the affected step node re-renders, not the entire DAG

3. **Event Batching**: Multiple events can be processed in sequence without blocking the UI

4. **CSS Animations**: Hardware-accelerated animations (transform, opacity) for smooth performance

5. **Memoization**: Computed values (parallel groups, layout) are memoized to prevent unnecessary recalculation

---

## Dependencies

- React 18.2.0+
- TypeScript 5.4.0+
- @afw/shared (workspace package with event types)

No additional npm dependencies required.

---

## Error Handling

All components gracefully handle connection errors:

```typescript
const { status, error } = useWebSocketContext();

if (status === 'error') {
  console.error('WebSocket error:', error?.message);
  // Automatically reconnecting...
}
```

---

## Testing

### Unit Tests

Example test for useEvents:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useEvents } from '@/hooks';
import type { SessionId } from '@afw/shared';

describe('useEvents', () => {
  it('subscribes to session on mount', () => {
    const sessionId = 'test-session' as SessionId;
    const { result } = renderHook(() => useEvents(sessionId), {
      wrapper: WebSocketProvider,
    });

    expect(result.current).toEqual([]);
  });
});
```

Test useChainState:

```typescript
// Test useChainState
test('updateStep updates single step correctly', () => {
  const { result } = renderHook(() => useChainState());
  act(() => result.current.setChain(sampleChain));

  act(() => {
    result.current.updateStep(1, { status: 'in_progress' });
  });

  expect(result.current.chain?.steps[0].status).toBe('in_progress');
});
```

### Integration Tests

Test the full flow with ChainDemo:

1. Click "Run Full Scenario" button
2. Observe steps transitioning through statuses
3. Verify animations play smoothly
4. Check that stats update correctly

### Manual Testing

Use ChainDemo component to test:
- Individual step status transitions
- Animation smoothness
- Color transitions
- Duration display
- Error display
- Skip status

---

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 13+)
- Internet Explorer: Not supported (uses modern CSS and ES6+)

---

## Future Enhancements

1. **Event Persistence**: Store events in local storage or IndexedDB
2. **Event Playback**: Replay event history for debugging
3. **Batch Events**: Compress multiple events into batches
4. **Message Compression**: gzip compression for large payloads
5. **Custom Serialization**: Support for custom event serializers
6. **Event Middleware**: Pre/post processing hooks
7. **Optimistic Updates**: Instant UI updates with server confirmation
8. **Offline Support**: Queue messages while offline
9. **Event Recording**: Replay step transitions to debug issues
10. **Timeline View**: Show step execution timeline with durations
11. **Parallel Group Visualization**: Highlight parallel execution visually
12. **Step Metrics**: Display resource usage, execution time percentiles
13. **Failure Analysis**: Detailed error messages and stack traces
14. **Performance Profiling**: Track rendering performance metrics
15. **Custom Animations**: Allow theme customization for animations
16. **Step Dependencies**: Visual indication of dependency blocking

---

## Troubleshooting

### Connection fails immediately
- Verify WebSocket server is running
- Check URL is correct
- Verify firewall allows WebSocket

### Events not received
- Confirm session is subscribed: `subscribe(sessionId)`
- Check event type matches filter
- Verify server is sending events

### Memory grows unbounded
- Events accumulate in memory
- Implement retention policy
- Clear old events manually if needed

### TypeScript errors
- Ensure @afw/shared is installed
- Check SessionId is properly branded type
- Use eventGuards for type narrowing

### Status not updating
1. Check that WebSocket events are being received
2. Verify session ID matches between event and listener
3. Ensure useChainEvents callbacks are properly implemented
4. Check browser console for errors

### Animations not smooth
1. Verify CSS transitions are applied
2. Check for JavaScript errors blocking animations
3. Reduce other page animations that might compete
4. Profile in DevTools to check frame rate

### Chain state not syncing
1. Ensure chain is initialized with setChain
2. Verify updateStep is called with correct stepNumber
3. Check that step updates are valid according to ChainStep type
4. Review browser console for type errors

---

## References

- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- React Context: https://react.dev/reference/react/useContext
- React Hooks: https://react.dev/reference/react
- React Flow documentation: https://reactflow.dev
- CSS Animations: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations
- Event Types: `packages/shared/src/events.ts`
- Usage Guide: `packages/app/src/hooks/WEBSOCKET_USAGE.md`
- ActionFlows data types: See `@afw/shared` package
