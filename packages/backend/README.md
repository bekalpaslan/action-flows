# ActionFlows Backend

Express.js backend API with WebSocket support for the ActionFlows Dashboard.

## Features

- Express HTTP API on port 3001 (configurable via `PORT` env)
- WebSocket server for real-time event broadcasting
- In-memory storage (Redis integration in Step 6)
- CORS enabled for Electron app integration
- Session, chain, event, and command management

## Architecture

```
packages/backend/src/
├── index.ts              # Main entry point, Express app setup
├── types.ts              # Backend-specific types
├── routes/
│   ├── events.ts        # POST /api/events - Store and manage events
│   ├── sessions.ts      # Session CRUD endpoints
│   └── commands.ts      # Command queue endpoints
├── ws/
│   └── handler.ts       # WebSocket connection handling
└── storage/
    └── memory.ts        # In-memory storage implementation
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Events
- `POST /api/events` - Receive and store events
- `GET /api/events/:sessionId` - Retrieve all events for a session
- `GET /api/events/:sessionId/recent` - Retrieve recent events

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - List all active sessions
- `GET /api/sessions/:id` - Get session details with chains
- `PUT /api/sessions/:id` - Update session status/summary
- `GET /api/sessions/:id/chains` - Get all chains in session
- `POST /api/sessions/:id/input` - Queue user input
- `GET /api/sessions/:id/input` - Poll for pending input (hook endpoint)

### Commands
- `POST /api/sessions/:id/commands` - Queue command for session
- `GET /api/sessions/:id/commands` - Poll for pending commands (hook endpoint)
- `POST /api/commands/:commandId/ack` - Acknowledge command execution

## WebSocket API

### Connection
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3001/ws');
```

### Message Types

#### Client -> Server
```typescript
// Subscribe to session
{
  type: 'subscribe',
  sessionId: 'session-123'
}

// Unsubscribe from session
{
  type: 'unsubscribe',
  sessionId: 'session-123'
}

// Send input
{
  type: 'input',
  sessionId: 'session-123',
  payload: { userInput: '...' }
}

// Heartbeat
{
  type: 'ping'
}
```

#### Server -> Client
```typescript
// Event broadcast
{
  type: 'event',
  sessionId: 'session-123',
  payload: { /* WorkspaceEvent */ }
}

// Command
{
  type: 'command',
  sessionId: 'session-123',
  payload: { /* Command */ }
}

// Subscription confirmation
{
  type: 'subscription_confirmed',
  payload: { clientId: '...', message: '...' }
}

// Pong response
{
  type: 'pong',
  clientId: '...'
}
```

## Development

### Setup
```bash
# Install dependencies
pnpm install

# Run in development mode (with ts-node-dev)
pnpm dev

# Build TypeScript
pnpm build

# Start production server
pnpm start

# Type check
pnpm type-check
```

### Environment Variables
- `PORT` - HTTP server port (default: 3001)
- `LOG_LEVEL` - Logging level (default: info)

## Storage

### In-Memory Storage (Current - Step 1)
- Uses JavaScript Map for fast access
- Perfect for development and testing
- Data is lost on server restart

### Future: Redis Integration (Step 6)
Will support:
- Persistent session storage
- Event persistence
- Distributed command queue
- Multi-instance scalability

## Type Safety

All endpoints use TypeScript with types imported from `@afw/shared`:
- `Session`, `Chain`, `ChainStep` - Domain models
- `WorkspaceEvent` - Event types
- `CommandPayload` - Command types
- `SessionId`, `UserId`, `Timestamp` - Branded types for type-safe IDs

## Integration Points

### From Hooks (packages/hooks)
- Sends events via `POST /api/events`
- Polls commands via `GET /api/sessions/:id/commands`
- Polls input via `GET /api/sessions/:id/input`

### From Dashboard (packages/app)
- Receives events via WebSocket
- Sends input via `POST /api/sessions/:id/input`
- Queues commands via `POST /api/sessions/:id/commands`

## Next Steps

- **Step 2**: Implement Dashboard integration
- **Step 3**: Add authentication/authorization
- **Step 4**: Implement data broadcasting to Dashboard
- **Step 5**: Integrate WebSocket broadcaster
- **Step 6**: Add Redis support
