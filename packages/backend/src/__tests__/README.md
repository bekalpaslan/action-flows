# Backend Integration Tests

This directory contains comprehensive integration tests for the ActionFlows Backend API, verifying the complete flow from webhook POST requests through storage to WebSocket client broadcasts.

## Test Files

### `integration.test.ts`
Main integration test suite covering:

1. **Hook POST → Storage → WebSocket broadcast**
   - Tests the complete event flow
   - Verifies events are stored correctly
   - Confirms WebSocket clients receive broadcasts
   - Validates event data integrity

2. **Session Lifecycle**
   - Session creation and retrieval
   - Event association with sessions
   - Session status updates
   - Event history tracking within sessions

3. **Command Queue Round-Trip**
   - Command queueing for sessions
   - Command retrieval and listing
   - Command acknowledgment
   - Queue status management

4. **Error Handling & Edge Cases**
   - Invalid event validation
   - Missing session handling
   - Event retrieval filtering
   - WebSocket disconnection handling

5. **Health Checks**
   - Server availability verification
   - Health endpoint response validation

### `helpers.ts`
Test utilities and helper functions:

- `createTestServer()` - Starts a temporary test server on a random available port
- `createWebSocketClient()` - Establishes WebSocket connection to test server
- `createMockEvent()` - Factory for generating properly-typed test events
- `cleanup()` - Graceful shutdown of test resources
- `waitFor()` - Utility for waiting on async conditions
- `waitForMessage()` - Utility for waiting on WebSocket messages

## Running Tests

### Install Dependencies
```bash
# With pnpm (recommended for this monorepo)
pnpm install

# Or with npm (requires npm v7+)
npm install --workspaces
```

### Run Tests
```bash
# Run all tests once
pnpm -r test

# Or specifically in backend package
cd packages/backend
pnpm test

# Watch mode for development
pnpm test:watch
```

### Run Type Checks
```bash
pnpm type-check
```

## Test Coverage

The integration tests verify:

- **API Endpoints**
  - `POST /api/events` - Event ingestion
  - `GET /api/events/:sessionId` - Event retrieval
  - `GET /api/sessions` - Session listing
  - `POST /api/sessions` - Session creation
  - `GET /api/sessions/:id` - Session details
  - `PUT /api/sessions/:id` - Session updates
  - `POST /api/commands/:id/commands` - Command queueing
  - `GET /api/commands/:id/commands` - Command retrieval
  - `POST /api/commands/:commandId/ack` - Command acknowledgment
  - `GET /health` - Health checks

- **WebSocket Flow**
  - Client connection establishment
  - Event broadcast reception
  - Connection lifecycle management
  - Message format validation

- **Storage Operations**
  - Event persistence
  - Session persistence
  - Command queueing
  - Data consistency

- **Event Types**
  - `StepSpawnedEvent` - Step creation
  - `StepCompletedEvent` - Step completion
  - `SessionStartedEvent` - Session initialization
  - Session lifecycle events
  - And all other event types from `@afw/shared`

## Event Mock Factory

The `createMockEvent()` helper generates properly-typed events for all event types:

```typescript
import { createMockEvent } from './helpers';

// Create a StepSpawnedEvent
const event = createMockEvent<StepSpawnedEvent>('step:spawned', {
  sessionId: 'my-session',
  stepNumber: 1,
  action: 'code',
  model: 'haiku',
});

// Create a StepCompletedEvent with custom values
const completed = createMockEvent<StepCompletedEvent>('step:completed', {
  sessionId: 'my-session',
  stepNumber: 1,
  status: 'completed',
  duration: 1500,
});
```

Supported event types:
- Session events: `session:started`, `session:ended`
- Chain events: `chain:compiled`, `chain:started`, `chain:completed`
- Step events: `step:spawned`, `step:started`, `step:completed`, `step:failed`
- Interaction events: `interaction:awaiting-input`, `interaction:input-received`
- File events: `file:created`, `file:modified`, `file:deleted`
- Registry events: `registry:line-updated`
- Execution events: `execution:log-created`
- Diagnostic events: `error:occurred`, `warning:occurred`

## Test Architecture

### Server Isolation
Each test gets its own isolated server instance running on a random port:
- Prevents port conflicts
- Enables parallel test execution
- Full cleanup between tests

### Storage Backend
Tests work with both storage backends:
- **Memory Storage** (default) - Fast, no external dependencies
- **Redis Storage** - If `REDIS_URL` environment variable is set

### WebSocket Testing
Tests include proper WebSocket lifecycle management:
- Connection establishment with timeout
- Message listening and filtering
- Graceful disconnection
- Error handling

## Troubleshooting

### Port Already In Use
Tests use random available ports. If you see "Port already in use":
- Increase the timeout in `createTestServer()`
- Check for hanging Node processes
- Run tests in isolation

### WebSocket Connection Timeout
If tests timeout waiting for WebSocket connection:
- Verify the test server is starting correctly
- Check network configuration
- Increase timeout in `createWebSocketClient()` (default: 5s)

### Memory Usage
Long test runs with many sessions/events may accumulate memory:
- Verify `cleanup()` is called after each test
- Check for unclosed WebSocket connections
- Monitor file descriptor limits

## Future Enhancements

Potential additions:
- Performance benchmarking tests
- Load testing with multiple concurrent sessions
- Redis Pub/Sub integration testing
- Custom event type validation tests
- API rate limiting tests
- Session persistence across restarts
- Event filtering and time-range queries

## Development Notes

### Adding New Tests
1. Create test case in `integration.test.ts`
2. Use `createTestServer()` in `beforeEach()`
3. Use `createMockEvent()` for test data
4. Call `cleanup()` in `afterEach()`

### Updating Helpers
When updating event types in `@afw/shared/events.ts`:
1. Update `createMockEvent()` factory with new event fields
2. Add new event type cases as needed
3. Update supported events list in this README

### Type Safety
All tests are fully typed using types from `@afw/shared`:
- `WorkspaceEvent` - Base event type
- `Session` - Session model
- Event-specific types (e.g., `StepSpawnedEvent`)

## Dependencies

- **vitest** ^1.0.0 - Fast unit test framework
- **supertest** ^6.3.0 - HTTP assertion library
- **node-fetch** ^3.3.2 - HTTP client (Node 18+ includes global fetch)
- **ws** ^8.14.2 - WebSocket client/server
- **@afw/shared** - Shared types and models

See `package.json` for complete dependency list.
