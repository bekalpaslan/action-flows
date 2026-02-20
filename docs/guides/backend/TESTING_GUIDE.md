# Backend Testing Guide

## Overview

This guide covers the integration testing setup for the ActionFlows Backend, which verifies the complete event flow from webhook POST requests through storage persistence to WebSocket client broadcasts.

## Quick Start

### 1. Install Dependencies
```bash
# Using pnpm (recommended)
cd D:/ActionFlowsDashboard
pnpm install

# Or with npm (requires v7+)
npm install --workspaces
```

### 2. Run Tests
```bash
# From backend directory
cd packages/backend
pnpm test

# Or watch mode
pnpm test:watch

# From root to run all tests
cd ../..
pnpm test
```

## What's Been Created

### Test Files

#### `src/__tests__/integration.test.ts` (11.5 KB)
Comprehensive integration test suite with 6 main test groups:

1. **Hook POST → Storage → WebSocket broadcast**
   - Verifies event ingestion via HTTP POST
   - Confirms storage persistence
   - Validates WebSocket broadcast to connected clients

2. **Session Lifecycle**
   - Session creation via POST
   - Session retrieval and listing
   - Event association with sessions
   - Session status updates

3. **Command Queue Round-Trip**
   - Command queueing for sessions
   - Command retrieval
   - Command acknowledgment
   - Queue persistence

4. **Error Handling & Edge Cases**
   - Invalid event rejection
   - Missing session handling
   - Event filtering and retrieval
   - WebSocket disconnection

5. **Health Checks**
   - Server availability verification
   - Health endpoint validation

#### `src/__tests__/helpers.ts` (9.5 KB)
Test utilities providing:

- `createTestServer()` - Starts isolated test server on random port
- `createWebSocketClient()` - WebSocket test client with timeout
- `createMockEvent<T>()` - Event factory with full type support
- `cleanup()` - Graceful resource cleanup
- `waitFor()` - Async condition polling
- `waitForMessage()` - WebSocket message waiting

#### `src/__tests__/README.md`
Comprehensive testing documentation including:
- Test coverage details
- Endpoint verification list
- Event type reference
- Troubleshooting guide
- Future enhancements

### Configuration Files

#### `vitest.config.ts` (340 bytes)
Vitest configuration:
- Node test environment
- Global test APIs
- Coverage reporting setup
- Test timeout settings

#### `package.json` (Updated)
Added test dependencies:
- `vitest@^1.0.0` - Fast unit testing framework
- `supertest@^6.3.0` - HTTP assertion library
- `@types/supertest@^6.0.0` - TypeScript types
- `node-fetch@^3.3.2` - HTTP client

Added npm scripts:
- `test` - Run tests once
- `test:watch` - Watch mode for development

## Test Architecture

### Isolation & Cleanup
- Each test gets isolated server instance
- Random port assignment prevents conflicts
- Full cleanup after each test
- Supports parallel execution

### Event Type Coverage
Tests use all event types from `@afw/shared`:
- Session: started, ended
- Chain: compiled, started, completed
- Step: spawned, started, completed, failed
- Interaction: awaiting-input, input-received
- File: created, modified, deleted
- Registry: line-updated
- Execution: log-created
- Diagnostic: error-occurred, warning-occurred

### Storage Backend Support
- Memory storage (default) - Fast, no dependencies
- Redis storage - If `REDIS_URL` environment variable set
- Graceful switching in test environment

### WebSocket Testing
- Proper connection lifecycle
- Message listening with predicates
- Timeout handling
- Error propagation
- Graceful disconnection

## Endpoint Coverage

### Sessions API
- `POST /api/sessions` - Create session ✓
- `GET /api/sessions` - List all sessions ✓
- `GET /api/sessions/:id` - Get session details ✓
- `PUT /api/sessions/:id` - Update session ✓
- `GET /api/sessions/:id/chains` - List chains ✓
- `POST /api/sessions/:id/input` - Queue user input ✓
- `GET /api/sessions/:id/input` - Retrieve input ✓

### Events API
- `POST /api/events` - Ingest event ✓
- `GET /api/events/:sessionId` - Retrieve events ✓
- `GET /api/events/:sessionId/recent` - Get recent events ✓

### Commands API
- `POST /api/commands/:id/commands` - Queue command ✓
- `GET /api/commands/:id/commands` - Retrieve commands ✓
- `POST /api/commands/:commandId/ack` - Acknowledge command ✓

### System
- `GET /health` - Health check ✓
- `GET /ws` - WebSocket upgrade ✓

## Mock Event Factory

### Usage Example
```typescript
import { createMockEvent } from './helpers';
import type { StepSpawnedEvent } from '@afw/shared';

// Create event with defaults
const event = createMockEvent<StepSpawnedEvent>('step:spawned', {
  sessionId: mySessionId,
  stepNumber: 1,
  action: 'analyze',
  model: 'sonnet',
});

// Minimal event (uses all defaults)
const minimalEvent = createMockEvent<StepSpawnedEvent>('step:spawned', {
  sessionId: mySessionId,
});
```

### Supported Event Types
All 17 event types from `@afw/shared/events.ts` are supported with proper defaults for required fields.

## Running Specific Tests

### Run single test suite
```bash
pnpm test -- --grep "Hook POST"
```

### Run with coverage
```bash
pnpm test -- --coverage
```

### Run in watch mode with UI
```bash
pnpm test:watch
```

### Run with specific timeout
```bash
pnpm test -- --testTimeout=30000
```

## Environment Variables

### For Testing
No special environment variables required for memory storage tests.

### For Redis Testing
```bash
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=afw:test:
```

### For Debugging
```bash
DEBUG=afw:* pnpm test
```

## Troubleshooting

### "Cannot find module '@afw/shared'"
- Ensure dependencies are installed: `pnpm install`
- Check that packages are linked in monorepo

### "Port already in use"
- Tests use random ports, check for hanging processes
- `lsof -i :PORT` (macOS/Linux) to find process
- Tests run in parallel, may need more ports available

### "WebSocket timeout"
- Increase timeout in `createWebSocketClient()` for slower systems
- Check that server is starting correctly
- Verify network connectivity

### "Redis connection failed"
- Tests default to memory storage, Redis optional
- Only required if `REDIS_URL` is set
- Remove `REDIS_URL` to use memory storage

## Performance

### Expected Test Execution Time
- All tests: ~2-5 seconds (memory storage)
- With Redis: ~5-10 seconds
- Individual test: ~100-500ms

### Resource Usage
- RAM: ~50-100 MB for full test run
- Disk: Minimal (no persistence to disk)
- Network: None (memory storage) or local (Redis)

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Backend Tests
  run: cd packages/backend && pnpm test

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./packages/backend/coverage/coverage-final.json
```

### Pre-commit Hook
```bash
#!/bin/bash
cd packages/backend
pnpm test || exit 1
```

## Future Test Enhancements

- [ ] Performance benchmarking tests
- [ ] Load testing with concurrent sessions
- [ ] Redis Pub/Sub broadcast verification
- [ ] Event filtering and query tests
- [ ] Rate limiting tests
- [ ] Session persistence verification
- [ ] Time-range event filtering
- [ ] Chaos testing for error scenarios

## Files Modified/Created

### Created Files
- `D:/ActionFlowsDashboard/packages/backend/src/__tests__/integration.test.ts` (11.5 KB)
- `D:/ActionFlowsDashboard/packages/backend/src/__tests__/helpers.ts` (9.5 KB)
- `D:/ActionFlowsDashboard/packages/backend/src/__tests__/README.md` (8 KB)
- `D:/ActionFlowsDashboard/packages/backend/vitest.config.ts` (340 bytes)
- `D:/ActionFlowsDashboard/packages/backend/TESTING_GUIDE.md` (this file)

### Modified Files
- `D:/ActionFlowsDashboard/packages/backend/package.json` - Added test deps & scripts
- `D:/ActionFlowsDashboard/packages/backend/src/index.ts` - Added conditional startup

## Testing Best Practices

1. **Isolation**: Each test creates fresh server instance
2. **Cleanup**: Always call cleanup in afterEach()
3. **Mocking**: Use createMockEvent() for consistency
4. **Async**: Always await promises and WebSocket operations
5. **Types**: Leverage TypeScript for event type safety
6. **Documentation**: Update README.md when adding test types

## Support

For issues or questions:
1. Check `src/__tests__/README.md` for detailed docs
2. Review existing test cases for patterns
3. Check `helpers.ts` for available utilities
4. Verify environment setup and dependencies

---

**Last Updated**: 2026-02-06
**Test Framework**: Vitest 1.0+
**Node Version**: 18+ (for native fetch API)
