# WebSocket Client Implementation

## Overview

Complete WebSocket client implementation for real-time event streaming in the ActionFlows Dashboard. Provides React hooks and context for managing WebSocket connections with automatic reconnection, session subscriptions, and type-safe event handling.

## Files Created

### Core WebSocket Implementation

1. **`packages/app/src/hooks/useWebSocket.ts`**
   - Low-level WebSocket management hook
   - Auto-reconnect with exponential backoff (3s → 6s → 12s → 24s → 30s max)
   - Connection status tracking (connecting, connected, disconnected, error)
   - Session subscription/unsubscription support
   - Heartbeat detection for stale connections (30s timeout)
   - Type-safe event parsing using @afw/shared types

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

2. **`packages/app/src/contexts/WebSocketContext.tsx`**
   - React Context Provider for app-wide WebSocket management
   - Wraps useWebSocket hook
   - Provides connection status and event handlers to all children
   - Default URL: ws://localhost:3001/ws
   - Supports custom URLs

   ```typescript
   <WebSocketProvider url="ws://localhost:3001/ws">
     <App />
   </WebSocketProvider>
   ```

3. **`packages/app/src/hooks/useEvents.ts`**
   - High-level hook for session event management
   - Auto-subscribe/unsubscribe on mount/unmount
   - Optional event type filtering
   - Local event history state
   - Additional utilities:
     - `useLatestEvent()` - Get most recent event of a type
     - `useFilteredEvents()` - Custom event filtering with predicates
     - `useEventStats()` - Event statistics and metadata

   ```typescript
   export function useEvents(
     sessionId: SessionId,
     eventTypes?: string[]
   ): WorkspaceEvent[]
   ```

### Component Updates

4. **`packages/app/src/App.tsx`** (Updated)
   - Wraps app in WebSocketProvider
   - Delegates rendering to AppContent component

5. **`packages/app/src/components/AppContent.tsx`** (New)
   - Main app content component
   - Displays real-time connection status (not hardcoded)
   - Status indicators:
     - Green "Connected" when ws status is 'connected'
     - Orange "Disconnected" when ws status is 'disconnected'
     - Red "Connection Error" when ws status is 'error'
     - Yellow pulsing "Connecting..." when ws status is 'connecting'

### Supporting Files

6. **`packages/app/src/hooks/index.ts`** (New)
   - Export barrel for hooks
   - Simplifies imports: `import { useWebSocket, useEvents } from '@/hooks'`

7. **`packages/app/src/contexts/index.ts`** (New)
   - Export barrel for contexts
   - Simplifies imports: `import { WebSocketProvider } from '@/contexts'`

8. **`packages/app/src/hooks/WEBSOCKET_USAGE.md`** (New)
   - Comprehensive usage guide
   - Multiple code examples
   - Best practices and troubleshooting

### Styling Updates

9. **`packages/app/src/App.css`** (Updated)
   - Added styles for connection status states:
     - `.status.connected` - Green background and indicator
     - `.status.error` - Red background and indicator
     - `.status.disconnected` - Orange background and indicator
     - `.status.connecting` - Pulsing animation
   - Maintains existing dark theme

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

## Architecture

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

## Dependencies

- React 18.2.0+
- TypeScript 5.4.0+
- @afw/shared (workspace package with event types)

No additional npm dependencies required.

## Configuration

### WebSocket URL
Default: `ws://localhost:3001/ws`

Override when creating provider:
```typescript
<WebSocketProvider url="ws://prod.example.com:3001/ws">
  <App />
</WebSocketProvider>
```

Or with environment variables:
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

## Error Handling

All components gracefully handle connection errors:

```typescript
const { status, error } = useWebSocketContext();

if (status === 'error') {
  console.error('WebSocket error:', error?.message);
  // Automatically reconnecting...
}
```

## Performance Considerations

1. **Event History**: Events are stored in component state. For long-running sessions, consider implementing:
   - Event retention policies
   - Pagination
   - Virtual scrolling

2. **Memory**: Each useEvents hook maintains its own event array. In high-throughput scenarios:
   - Use event type filtering
   - Use useLatestEvent() for single values
   - Implement cleanup strategies

3. **Network**: WebSocket reduces overhead compared to polling:
   - No HTTP headers per message
   - Persistent connection
   - Server push capability

## Testing

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

## Future Enhancements

1. **Event Persistence**: Store events in local storage or IndexedDB
2. **Event Playback**: Replay event history for debugging
3. **Batch Events**: Compress multiple events into batches
4. **Message Compression**: gzip compression for large payloads
5. **Custom Serialization**: Support for custom event serializers
6. **Event Middleware**: Pre/post processing hooks
7. **Optimistic Updates**: Instant UI updates with server confirmation
8. **Offline Support**: Queue messages while offline

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

## References

- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- React Context: https://react.dev/reference/react/useContext
- React Hooks: https://react.dev/reference/react
- Event Types: `packages/shared/src/events.ts`
- Usage Guide: `packages/app/src/hooks/WEBSOCKET_USAGE.md`
