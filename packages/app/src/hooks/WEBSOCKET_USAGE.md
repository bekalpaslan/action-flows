# WebSocket Integration Guide

This document explains how to use the WebSocket hooks and context for real-time event streaming in ActionFlows Dashboard.

## Overview

The WebSocket implementation provides:
- **Auto-reconnection** with exponential backoff
- **Connection status tracking** (connecting, connected, disconnected, error)
- **Session subscriptions** for fine-grained event filtering
- **Heartbeat detection** for stale connections
- **Type-safe event handling** with @afw/shared types

## Architecture

### useWebSocket Hook (Low-level)
Direct WebSocket management hook. Use this for custom connection handling.

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';
import type { WorkspaceEvent, SessionId } from '@afw/shared';

function MyComponent() {
  const { status, send, subscribe, unsubscribe, error } = useWebSocket({
    url: 'ws://localhost:3001/ws',
    onEvent: (event: WorkspaceEvent) => {
      console.log('Event received:', event);
    },
    reconnectInterval: 3000,
    heartbeatInterval: 30000,
  });

  const handleSubscribe = (sessionId: SessionId) => {
    subscribe(sessionId);
  };

  return (
    <div>
      <p>Status: {status}</p>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### WebSocketContext & Provider
Mid-level context for app-wide WebSocket management.

```typescript
import { WebSocketProvider } from '@/contexts/WebSocketContext';

function App() {
  return (
    <WebSocketProvider url="ws://localhost:3001/ws">
      <YourAppComponents />
    </WebSocketProvider>
  );
}
```

### useWebSocketContext Hook
Access WebSocket from anywhere within WebSocketProvider.

```typescript
import { useWebSocketContext } from '@/contexts/WebSocketContext';

function MonitorStatus() {
  const { status, error, subscribe, unsubscribe } = useWebSocketContext();

  return (
    <div>
      <p>Connection: {status}</p>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### useEvents Hook (High-level)
Simplified hook for subscribing to session events with local state management.

```typescript
import { useEvents, useLatestEvent, useEventStats } from '@/hooks/useEvents';
import type { SessionId } from '@afw/shared';

function SessionMonitor({ sessionId }: { sessionId: SessionId }) {
  // Get all events for the session
  const allEvents = useEvents(sessionId);

  // Get only specific event types
  const chainEvents = useEvents(sessionId, ['chain:started', 'chain:completed']);

  // Get the latest event of a type
  const latestChainEvent = useLatestEvent(sessionId, 'chain:completed');

  // Get event statistics
  const stats = useEventStats(sessionId);

  return (
    <div>
      <p>Total events: {allEvents.length}</p>
      <p>Chain events: {chainEvents.length}</p>
      {latestChainEvent && <p>Latest: {latestChainEvent.type}</p>}
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}
```

## Usage Examples

### Example 1: Simple Status Display

```typescript
import { useWebSocketContext } from '@/contexts/WebSocketContext';

function ConnectionStatus() {
  const { status } = useWebSocketContext();

  const statusColor = {
    connecting: 'yellow',
    connected: 'green',
    disconnected: 'orange',
    error: 'red',
  };

  return (
    <div style={{ color: statusColor[status] }}>
      {status}
    </div>
  );
}
```

### Example 2: Monitor Session Events

```typescript
import { useEvents } from '@/hooks/useEvents';
import type { SessionId } from '@afw/shared';

function SessionEvents({ sessionId }: { sessionId: SessionId }) {
  const events = useEvents(sessionId);

  return (
    <div>
      {events.map((event) => (
        <div key={event.eventId || event.timestamp}>
          <strong>{event.type}</strong>
          <p>{event.timestamp}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Filter Events by Type

```typescript
import { useEvents } from '@/hooks/useEvents';
import type { SessionId } from '@afw/shared';

function ChainProgress({ sessionId }: { sessionId: SessionId }) {
  // Only listen to chain events
  const chainEvents = useEvents(sessionId, [
    'chain:started',
    'chain:completed',
    'chain:compiled',
  ]);

  return (
    <div>
      <h3>Chain Events: {chainEvents.length}</h3>
      {chainEvents.map((event) => (
        <div key={event.eventId || event.timestamp}>
          {event.type}
        </div>
      ))}
    </div>
  );
}
```

### Example 4: Event Statistics

```typescript
import { useEventStats } from '@/hooks/useEvents';
import type { SessionId } from '@afw/shared';

function EventDashboard({ sessionId }: { sessionId: SessionId }) {
  const stats = useEventStats(sessionId);

  return (
    <div>
      <p>Total Events: {stats.total}</p>
      <h4>By Type:</h4>
      <ul>
        {Object.entries(stats.byType).map(([type, count]) => (
          <li key={type}>{type}: {count}</li>
        ))}
      </ul>
      {stats.lastEventTime && <p>Last Event: {stats.lastEventTime}</p>}
    </div>
  );
}
```

### Example 5: Custom Event Filtering

```typescript
import { useFilteredEvents } from '@/hooks/useEvents';
import type { SessionId, ChainCompletedEvent } from '@afw/shared';
import { eventGuards } from '@afw/shared';

function SuccessfulChains({ sessionId }: { sessionId: SessionId }) {
  const successfulChains = useFilteredEvents(
    sessionId,
    (event): event is ChainCompletedEvent =>
      eventGuards.isChainCompleted(event) && event.overallStatus === 'success'
  );

  return (
    <div>
      <h3>Successful Chains: {successfulChains.length}</h3>
      {successfulChains.map((event) => (
        <div key={event.eventId || event.timestamp}>
          {event.title || 'Untitled Chain'}
        </div>
      ))}
    </div>
  );
}
```

### Example 6: Send Custom Messages

```typescript
import { useWebSocketContext } from '@/contexts/WebSocketContext';

function CommandControl() {
  const { send } = useWebSocketContext();

  const pauseSession = (sessionId: string) => {
    send({
      type: 'command',
      command: 'pause',
      sessionId,
    });
  };

  return <button onClick={() => pauseSession('session-123')}>Pause</button>;
}
```

## Event Types

All events extend `BaseEvent` and include:
- `type` - Event type discriminator (e.g., 'chain:started')
- `sessionId` - Session identifier
- `timestamp` - ISO 8601 timestamp
- `user` - Optional user identifier
- `eventId` - Unique event ID for deduplication

### Common Event Categories

**Session Events:**
- `session:started` - Session initialized
- `session:ended` - Session completed

**Chain Events:**
- `chain:compiled` - Chain validation and compilation
- `chain:started` - Chain execution begins
- `chain:completed` - Chain execution finished
- `chain:failed` - Chain execution failed

**Step Events:**
- `step:spawned` - Step sent to agent
- `step:started` - Step execution begins
- `step:completed` - Step execution finished
- `step:failed` - Step execution failed

**Interaction Events:**
- `interaction:awaiting-input` - Waiting for user input
- `interaction:input-received` - User input received

**File Events:**
- `file:created` - File created
- `file:modified` - File modified
- `file:deleted` - File deleted

## Connection Status

The WebSocket connection has four states:

1. **connecting** - Initial connection or reconnecting
2. **connected** - Successfully connected and ready
3. **disconnected** - Lost connection, will attempt to reconnect
4. **error** - Connection error occurred

## Reconnection Strategy

- Uses **exponential backoff**: 3s → 6s → 12s → 24s → (capped at 30s)
- Automatically resubscribes to all sessions after reconnection
- Maintains subscription state during disconnects

## Best Practices

1. **Wrap app with WebSocketProvider:**
   ```typescript
   <WebSocketProvider url={process.env.WS_URL}>
     <App />
   </WebSocketProvider>
   ```

2. **Use useEvents for most cases:**
   ```typescript
   const events = useEvents(sessionId, ['chain:completed']);
   ```

3. **Check status before sending:**
   ```typescript
   const { status, send } = useWebSocketContext();
   if (status === 'connected') {
     send(message);
   }
   ```

4. **Handle errors gracefully:**
   ```typescript
   const { error } = useWebSocketContext();
   if (error) {
     showNotification(`Connection error: ${error.message}`);
   }
   ```

5. **Subscribe only what you need:**
   Use event type filtering to reduce memory usage in long-running sessions.

## Troubleshooting

### Connection fails
- Check WebSocket server is running on specified URL
- Verify firewall allows WebSocket connections
- Check browser console for error messages

### Events not received
- Verify session is subscribed: `subscribe(sessionId)`
- Check event type matches: `useEvents(sessionId, ['chain:started'])`
- Verify event filter predicate is correct

### Memory issues with long sessions
- Clear old events: implement event retention policy
- Use filtered views: `useFilteredEvents()` or `useLatestEvent()`
- Consider pagination for large event lists

## Type Safety

All hooks and context use TypeScript with full type inference:

```typescript
import type { WorkspaceEvent, SessionId } from '@afw/shared';
import { eventGuards } from '@afw/shared';

const event: WorkspaceEvent = /* ... */;

if (eventGuards.isChainCompleted(event)) {
  // TypeScript now knows event is ChainCompletedEvent
  console.log(event.overallStatus); // ✓ Type-safe
}
```
