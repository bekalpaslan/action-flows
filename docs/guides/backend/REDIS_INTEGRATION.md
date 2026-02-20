# Redis Integration Guide

## Overview

The ActionFlows backend now supports Redis as a persistent storage backend, enabling multi-instance deployment and session persistence. By default, the backend uses in-memory storage, but you can easily switch to Redis by setting the `REDIS_URL` environment variable.

## Architecture

### Storage Abstraction Layer

The storage system is now abstracted into a factory pattern with two implementations:

1. **Memory Storage** (`storage/memory.ts`)
   - Default, in-process storage using Maps
   - Suitable for development and single-instance deployments
   - Data is lost when the server restarts

2. **Redis Storage** (`storage/redis.ts`)
   - Persistent, distributed storage using ioredis
   - Suitable for production and multi-instance deployments
   - Enables session sharing across multiple backend instances
   - Includes Pub/Sub for real-time event broadcasting

### Storage Factory (`storage/index.ts`)

The storage factory automatically selects the appropriate backend:
- If `REDIS_URL` environment variable is set → Uses Redis
- Otherwise → Uses in-memory storage

```typescript
// Automatically selects the right storage
const storage = createStorage();
```

## Key Data Structures

### Redis Keys

All Redis keys follow the pattern: `{prefix}:{type}:{identifier}`

| Type | Key Pattern | Usage |
|------|------------|-------|
| Sessions | `afw:sessions:{sessionId}` | Store complete Session objects (24hr TTL) |
| Events | `afw:events:{sessionId}` | LIST of events for a session (24hr TTL) |
| Chains | `afw:chains:{sessionId}` | LIST of chains for a session (24hr TTL) |
| Chains (by ID) | `afw:chain:{chainId}` | Fast lookup by chain ID (24hr TTL) |
| Commands | `afw:commands:{sessionId}` | LIST queue for pending commands (5min TTL) |
| Input | `afw:input:{sessionId}` | LIST queue for pending user input (5min TTL) |

### Pub/Sub Channels

| Channel | Purpose | Data Format |
|---------|---------|-------------|
| `afw:events` | Broadcast events to all instances | `{sessionId, event, timestamp}` |

## Configuration

### Environment Variables

```bash
# Enable Redis storage
REDIS_URL=redis://localhost:6379

# Optional: customize key prefix (default: "afw:")
REDIS_PREFIX=afw:

# Server port (default: 3001)
PORT=3001
```

### Example: Local Redis

```bash
# 1. Start Redis locally (using Docker)
docker run -p 6379:6379 redis:latest

# 2. Set environment variable
export REDIS_URL=redis://localhost:6379

# 3. Start the backend
npm run dev
```

### Example: Production Redis

```bash
# Using a managed Redis service
export REDIS_URL=redis://:password@redis-hostname:6379/0
npm run start
```

## Multi-Instance Deployment

When running multiple backend instances with Redis:

1. **All instances share session data** via Redis
2. **Events are broadcast via Pub/Sub** to all connected clients across instances
3. **Commands and input are queued** in Redis for the appropriate instance to process
4. **WebSocket clients can connect to any instance** and subscribe to sessions

### Example: Two-Instance Setup

```
┌─────────────────────────────────────────┐
│ Instance 1: ws://localhost:3001         │
│  - Storage: Redis                       │
│  - WebSocket client subscribed          │
│  - Pub/Sub listening                    │
└─────────────────────────────────────────┘
              ↓            ↑
        Shared Data    Event Broadcast
              ↓            ↑
     ┌────────────────────────────┐
     │ Redis Instance             │
     │  - Sessions                │
     │  - Events                  │
     │  - Pub/Sub: afw:events     │
     └────────────────────────────┘
              ↑            ↓
        Shared Data    Event Broadcast
              ↑            ↓
┌─────────────────────────────────────────┐
│ Instance 2: ws://localhost:3002         │
│  - Storage: Redis                       │
│  - WebSocket client subscribed          │
│  - Pub/Sub listening                    │
└─────────────────────────────────────────┘
```

## API Changes

### Async/Await Compatibility

All storage methods now support both sync and async operations:

```typescript
// Works with both Memory and Redis storage
await Promise.resolve(storage.addEvent(sessionId, event));

// Or without await (still works for memory storage)
storage.addEvent(sessionId, event);
```

This allows routes to work transparently with both storage backends.

### Storage Detection

Use the `isAsyncStorage()` helper to detect the backend type:

```typescript
import { storage, isAsyncStorage } from './storage';

if (isAsyncStorage(storage)) {
  console.log('Using Redis storage');
  // Can use storage.subscribe() and storage.publish()
} else {
  console.log('Using in-memory storage');
}
```

## WebSocket Event Broadcasting

### How It Works

1. **Event Posted to API**
   ```
   POST /api/events
   ```

2. **Event Stored in Redis**
   ```
   storage.addEvent(sessionId, event)
   ```

3. **Event Published to Pub/Sub**
   ```
   afw:events channel: {sessionId, event, timestamp}
   ```

4. **All Connected WebSocket Clients Receive Event**
   ```
   {type: 'event', sessionId, payload: event}
   ```

### Multi-Instance Broadcasting

When using multiple backend instances:

```
Instance 1                          Instance 2
  │ POST /api/events                  │
  ├─> Redis addEvent()                │
  │   └─> RPUSH afw:events:{id}       │
  └─> PUBLISH afw:events              │
      └─> Instance 2 receives         │
          └─> Broadcasts to WS clients
```

## TTL Management

Different data types have different expiration times:

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Sessions | 24 hours | Long-lived background processes |
| Events | 24 hours | Historical context for sessions |
| Chains | 24 hours | Related to session lifetime |
| Commands | 5 minutes | Time-sensitive, polled frequently |
| Input | 5 minutes | Time-sensitive, polled frequently |

### Manual Cleanup

You can manually delete sessions:

```bash
# Delete a specific session
redis-cli DEL afw:sessions:session-123
redis-cli DEL afw:events:session-123
redis-cli DEL afw:chains:session-123
```

## Error Handling

All Redis operations include error handling and logging:

```typescript
try {
  await redis.get(key);
} catch (error) {
  console.error('[Redis] Error:', error);
  // Operation fails gracefully
}
```

The backend continues to operate even if Redis is unavailable (requests will fail, but server stays up).

## Monitoring & Debugging

### Check Redis Connection

```bash
# Test Redis connection
redis-cli ping
# Expected output: PONG

# Check stored data
redis-cli KEYS "afw:*"
redis-cli HGETALL "afw:sessions:session-123"
redis-cli LRANGE "afw:events:session-123" 0 -1
```

### Logs

Look for these log messages to verify Redis is working:

```
[Storage] Using Redis backend
[Redis] Subscribed to channel: afw:events
[Redis] Received broadcast event: session-123
```

### Metrics

Monitor these for production deployments:
- Redis memory usage
- Connection count
- Pub/Sub subscriber count
- List sizes (commands, input queues)
- TTL expiration rate

## Performance Considerations

### Redis vs Memory Storage

| Metric | Memory | Redis |
|--------|--------|-------|
| Latency | < 1ms | 1-5ms (network) |
| Scalability | Single instance | Multi-instance |
| Data Persistence | No | Yes |
| Max Size | RAM available | Redis max memory |
| Cost | Free | Managed service cost |

### Optimization Tips

1. **Use Redis Persistence**
   - AOF (Append-Only File) for crash recovery
   - RDB (Snapshots) for backup

2. **Monitor Key Sizes**
   - Large event lists should be archived
   - Clean up old sessions regularly

3. **Tune TTL Values**
   - Shorter TTL reduces memory usage
   - Longer TTL provides more history

## Migration

### Switching from Memory to Redis

1. Stop the backend
2. Set `REDIS_URL` environment variable
3. Start the backend
4. Existing sessions are lost (not migrated)

### Switching from Redis to Memory

1. Stop the backend
2. Unset `REDIS_URL` environment variable
3. Start the backend
4. Previous Redis data is not accessed

## Troubleshooting

### Redis Connection Refused

```
Error: ECONNREFUSED
```

**Solution:**
- Verify Redis is running: `redis-cli ping`
- Check REDIS_URL is correct
- Verify firewall allows connection

### Events Not Broadcasting

```
[Redis] Received broadcast event but no subscribers
```

**Possible causes:**
- WebSocket clients not subscribed to session
- Pub/Sub channel not set up correctly
- Check browser WebSocket connection

### Memory Keeps Growing

**Causes:**
- TTL not set on keys (forgot `EXPIRE`)
- Many long-running sessions accumulating events
- Redis not configured with `maxmemory-policy`

**Solutions:**
- Check TTL on keys: `TTL afw:sessions:session-123`
- Archive old sessions manually
- Set Redis `maxmemory-policy` to `allkeys-lru`

## Testing

### Local Development

```bash
# Start Redis
docker run -p 6379:6379 redis:latest

# In another terminal, start backend
export REDIS_URL=redis://localhost:6379
npm run dev

# Test API
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-session","type":"test","timestamp":"2024-01-01T00:00:00Z"}'
```

### Integration Tests

```bash
# Would verify:
# 1. Data persists across server restarts
# 2. Multiple instances share data
# 3. Events broadcast to all instances
# 4. TTLs expire correctly
# 5. Graceful degradation if Redis unavailable
```

## Next Steps

1. **Add Redis Persistence Config** - Configure AOF or RDB for production
2. **Session Management UI** - Interface to view/delete sessions
3. **Metrics Endpoint** - Expose Redis stats at `/metrics`
4. **Database Migration** - Migrate historic data to external DB
5. **Session Archival** - Automatic archival of old sessions

---

## Appendix A: Overview & Deployment

### Executive Summary

Redis integration has been successfully added to the ActionFlows Dashboard backend, enabling:

✅ **Persistent Storage** - Sessions survive server restarts
✅ **Multi-Instance Support** - Multiple backend servers share data
✅ **Event Broadcasting** - Real-time event distribution via Pub/Sub
✅ **Zero Breaking Changes** - Backward compatible with existing code
✅ **Drop-in Replacement** - No code changes needed to use Redis

### What Changed

#### Core Architecture

**Before:**
```
Client → Express Routes → In-Memory Storage (Maps)
         Data lost on restart
         Single instance only
```

**After:**
```
Client → Express Routes → Storage Factory
                          ├─ Memory Storage (default)
                          └─ Redis Storage (if REDIS_URL set)

         With Redis: Multi-instance, Pub/Sub, Persistent
```

### Deployment Scenarios

#### Scenario 1: Local Development
- **Storage**: In-memory (default)
- **Instances**: 1
- **Persistence**: None
- **Use Case**: Rapid development iteration

#### Scenario 2: Development with Redis
- **Storage**: Redis (local or Docker)
- **Instances**: 1-2
- **Persistence**: Yes
- **Use Case**: Testing multi-instance, persistence

#### Scenario 3: Production Single Instance
- **Storage**: Redis (managed service)
- **Instances**: 1
- **Persistence**: Yes (with backups)
- **Use Case**: Single server deployment with data recovery

#### Scenario 4: Production Multi-Instance
- **Storage**: Redis (managed service)
- **Instances**: 2-10+
- **Persistence**: Yes (with replication)
- **Load Balancer**: Distributes traffic
- **Use Case**: High availability, load distribution

### Backward Compatibility

✅ **No Breaking Changes**
- Routes automatically use storage factory
- Existing memory-based code still works
- Configuration is optional (defaults to memory)
- TypeScript types updated but API unchanged

✅ **Migration Path**
- Start with memory storage (default)
- Add Redis later by setting environment variable
- No code changes required
- Existing sessions data not automatically migrated (expected)

### Performance Considerations

#### Memory Storage
- **Latency**: < 1ms
- **Scalability**: Single instance, limited by RAM
- **Persistence**: None
- **Multi-instance**: Not supported

#### Redis Storage
- **Latency**: 1-5ms (network dependent)
- **Scalability**: Multi-instance, limited by Redis capacity
- **Persistence**: Yes (configurable)
- **Multi-instance**: Fully supported
- **Network**: Bandwidth overhead for Pub/Sub

#### When to Use Each

| Factor | Memory | Redis |
|--------|--------|-------|
| Development | ✅ Perfect | ⚠️ Overkill |
| Production (1 instance) | ❌ No persistence | ✅ Recommended |
| Production (2+ instances) | ❌ No sharing | ✅ Required |
| High latency requirement | ✅ Best | ⚠️ 1-5ms |
| Large event streams | ❌ RAM limited | ✅ Better |

### Server Logs & Monitoring

#### Check Storage Type
```typescript
import { isAsyncStorage } from './storage';

if (isAsyncStorage(storage)) {
  console.log('Using Redis');
} else {
  console.log('Using Memory');
}
```

#### Server Logs
```
[Storage] Using Redis backend
[Redis] Subscribed to channel: afw:events
[Redis] Received broadcast event: session-123
```

#### Redis CLI
```bash
redis-cli
> KEYS "afw:*"
> DBSIZE
> MONITOR
```

### Extended Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Redis not running | Start Redis: `docker run -p 6379:6379 redis:latest` |
| Events not stored | Redis connection failed | Check `REDIS_URL` env var and Redis status |
| Memory keeps growing | No TTL on keys | Verify TTL values in redis.ts (24h/5m) |
| No events in memory mode | Expected | Add `REDIS_URL` to use persistent storage |
| Multi-instance issues | Not sharing Redis | Ensure both use same `REDIS_URL` |
| No events from other instances | Pub/Sub not working | Check Redis Pub/Sub: `redis-cli PUBSUB CHANNELS` |
| Connection pool exhausted | Too many connections | Reduce number of instances or increase Redis max connections |
| Data loss after restart | No persistence enabled | Set `REDIS_URL` to enable storage, configure persistence in Redis |

---

## Appendix B: Implementation Details

### Detailed Implementation Decisions

#### Storage Abstraction Pattern
The implementation uses a factory pattern rather than a simple conditional:
- **Why**: Allows for future extensions (MongoDB, PostgreSQL, etc.)
- **Benefit**: Clean separation of concerns
- **Trade-off**: Minimal code complexity

#### Async/Await Compatibility Strategy
Uses `Promise.resolve()` wrapper to handle both sync and async:
- **Why**: Memory storage is synchronous, Redis is asynchronous
- **Benefit**: Routes don't need to know which backend is in use
- **Pattern**: `await Promise.resolve(storage.operation())`

#### Pub/Sub Channel Design
Single channel (`afw:events`) for all event broadcasts:
- **Why**: Simplicity and reduced Redis overhead
- **Benefit**: All instances receive all events
- **Trade-off**: No filtering by session, but events include sessionId

#### TTL Configuration
Different TTLs for different data types:
- **Sessions/Events/Chains**: 24 hours (long-lived)
- **Commands/Input**: 5 minutes (time-sensitive)
- **Why**: Commands are polled frequently, need fresh data
- **Benefit**: Automatic cleanup reduces memory pressure

#### Client Registry Strategy
Clients stored in-memory per instance (not in Redis):
- **Why**: Clients are instance-specific, change frequently
- **Benefit**: Reduced Redis overhead
- **Trade-off**: Load balancer cannot share client list across instances

### Testing Checklist

- [ ] Install dependencies: `npm install`
- [ ] Type checking: `npm run type-check`
- [ ] Build: `npm run build`
- [ ] Dev server with memory storage: `npm run dev`
- [ ] Dev server with Redis:
  - Start Redis: `docker run -p 6379:6379 redis:latest`
  - Set env: `export REDIS_URL=redis://localhost:6379`
  - Run: `npm run dev`
  - Test POST /api/events with curl
  - Verify events appear in Redis: `redis-cli LRANGE afw:events:... 0 -1`
- [ ] WebSocket event broadcasting across instances
- [ ] Graceful shutdown handling
- [ ] Session persistence across restarts (with Redis)

### Future Enhancement Roadmap

#### Phase 1: Foundation (Completed)
- ✅ Redis storage adapter
- ✅ Storage factory pattern
- ✅ Pub/Sub event broadcasting
- ✅ Graceful shutdown

#### Phase 2: Observability
- Session metrics endpoint
- Redis performance monitoring
- Event throughput tracking
- Memory usage alerts

#### Phase 3: Advanced Features
- Session archival system
- Automatic data cleanup
- Database migration tools
- Session recovery mechanisms

#### Phase 4: Scale-out
- Redis cluster support
- Connection pooling optimization
- Multi-datacenter replication
- Geographic distribution
