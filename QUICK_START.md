# WebSocket Client - Quick Start Guide

## Overview

A complete WebSocket client implementation for real-time events in ActionFlows Dashboard.

## What Was Built

### Core Files (5 files)

1. **packages/app/src/hooks/useWebSocket.ts**
   - Low-level WebSocket management
   - Auto-reconnect with exponential backoff
   - Session subscriptions
   - Heartbeat detection

2. **packages/app/src/contexts/WebSocketContext.tsx**
   - React Context provider
   - Default URL: ws://localhost:3001/ws
   - Provides connection state to all children

3. **packages/app/src/hooks/useEvents.ts**
   - High-level event hook
   - Auto-subscribe/unsubscribe
   - Event filtering
   - Statistics utilities

4. **packages/app/src/components/AppContent.tsx**
   - Updated App.tsx integration
   - Real connection status display
   - Status color indicators (green/orange/red)

5. **packages/app/src/components/WebSocketTest.tsx**
   - Interactive testing component
   - Send custom messages
   - Monitor events in real-time
   - Perfect for QA

### Supporting Files

- **hooks/index.ts** - Export barrel
- **contexts/index.ts** - Export barrel
- **App.css** - Status styling updates
- **WEBSOCKET_USAGE.md** - Comprehensive guide
- **docs/status/implementation/websocket.md** - Technical details

## Key Features

✅ Auto-reconnect with exponential backoff
✅ Connection status tracking
✅ Session-based event filtering
✅ Heartbeat detection
✅ Type-safe using @afw/shared
✅ Zero external dependencies
✅ Full TypeScript support

## Quick Usage

### In Components

```typescript
import { useWebSocketContext } from '@/contexts'
import { useEvents } from '@/hooks'
import type { SessionId } from '@afw/shared'

// Check connection status
function Status() {
  const { status } = useWebSocketContext()
  return <p>Status: {status}</p>
}

// Monitor events
function EventMonitor({ sessionId }: { sessionId: SessionId }) {
  const events = useEvents(sessionId)
  return <p>Events: {events.length}</p>
}

// Filter events
function ChainMonitor({ sessionId }: { sessionId: SessionId }) {
  const chains = useEvents(sessionId, ['chain:started', 'chain:completed'])
  return <p>Chain Events: {chains.length}</p>
}
```

## Testing

Add WebSocketTest to a route:

```typescript
import { WebSocketTest } from '@/components/WebSocketTest'

<Route path="/test/ws" element={<WebSocketTest />} />
```

## Setup

1. **Start WebSocket server** on ws://localhost:3001/ws
2. **Run dashboard**: `npm run dev`
3. **Verify status** shows "Connected" in green
4. **Test with** WebSocketTest component

## Architecture

```
App (WebSocketProvider)
  └── AppContent (shows connection status)
      └── Any child can use useWebSocketContext()
          or useEvents(sessionId)
```

## Files Summary

| File | Purpose |
|------|---------|
| useWebSocket.ts | WebSocket connection |
| WebSocketContext.tsx | Context provider |
| useEvents.ts | Event management |
| AppContent.tsx | Status display |
| WebSocketTest.tsx | Test component |
| App.css | Styling updates |

**Total: ~1200 lines of production code + documentation**

## API Reference

### useWebSocketContext
```typescript
const { status, error, send, subscribe, unsubscribe } = useWebSocketContext()
```

### useEvents
```typescript
const events = useEvents(sessionId, eventTypes?)
```

### useLatestEvent
```typescript
const latest = useLatestEvent(sessionId, eventType)
```

### useEventStats
```typescript
const stats = useEventStats(sessionId)
// { total: number, byType: {}, lastEventTime: string }
```

## Next Steps

1. Start backend WebSocket server
2. Run app: `npm run dev`
3. Verify "Connected" status
4. Test with WebSocketTest component
5. Integrate event handlers in your components
6. Deploy when ready

---

See [docs/status/implementation/websocket.md](./docs/status/implementation/websocket.md) for complete documentation.
