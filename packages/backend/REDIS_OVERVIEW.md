# Redis Integration - Complete Overview

## Executive Summary

Redis integration has been successfully added to the ActionFlows Dashboard backend, enabling:

✅ **Persistent Storage** - Sessions survive server restarts
✅ **Multi-Instance Support** - Multiple backend servers share data
✅ **Event Broadcasting** - Real-time event distribution via Pub/Sub
✅ **Zero Breaking Changes** - Backward compatible with existing code
✅ **Drop-in Replacement** - No code changes needed to use Redis

## What Changed

### Core Architecture

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

## How to Use

### 1. Default (In-Memory, Backward Compatible)
```bash
npm run dev
# Uses in-memory storage automatically
```

### 2. With Redis (Production Ready)
```bash
export REDIS_URL=redis://localhost:6379
npm run dev
# Uses Redis automatically
```

### 3. Multiple Instances
```bash
# Terminal 1
PORT=3001 REDIS_URL=redis://localhost:6379 npm start

# Terminal 2
PORT=3002 REDIS_URL=redis://localhost:6379 npm start

# Both share data and broadcast events
```

## Files Modified

| File | Purpose | Changes |
|------|---------|---------|
| `package.json` | Dependencies | Added ioredis@^5.3.0 |
| `src/storage/redis.ts` | Redis adapter | Created (new file, 300+ lines) |
| `src/storage/index.ts` | Storage factory | Created (new file, ~80 lines) |
| `src/index.ts` | Server bootstrap | Added Pub/Sub, graceful shutdown |
| `src/routes/events.ts` | Event API | Made async, use factory |
| `src/routes/commands.ts` | Command API | Made async, use factory |
| `src/routes/sessions.ts` | Session API | Made async, use factory |
| `src/ws/handler.ts` | WebSocket | Made async, type-safe |
| `.env.example` | Configuration | Created (new file) |

## Key Features

### 1. Transparent Storage Selection
```typescript
import { storage } from './storage';

// Works with both Memory and Redis automatically
await Promise.resolve(storage.addEvent(sessionId, event));
```

### 2. Redis Data Structures
| Data | Redis Type | TTL |
|------|-----------|-----|
| Sessions | HASH | 24 hours |
| Events | LIST | 24 hours |
| Chains | LIST | 24 hours |
| Commands | LIST | 5 minutes |
| Input | LIST | 5 minutes |

### 3. Pub/Sub Broadcasting
```
Event Added → Redis RPUSH + PUBLISH
            ↓
      All Instances Subscribe to afw:events
            ↓
      Each Instance Broadcasts to Local WebSocket Clients
```

### 4. Automatic Environment Detection
```typescript
if (REDIS_URL is set)
  → Use Redis storage
else
  → Use In-Memory storage (default)
```

## Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| `REDIS_QUICK_START.md` | 5-minute setup guide | New users |
| `REDIS_INTEGRATION.md` | Comprehensive reference | Developers |
| `REDIS_IMPLEMENTATION_SUMMARY.md` | Technical details | Architects |
| `REDIS_OVERVIEW.md` | This file | Everyone |

## Implementation Details

### Storage Interface
```typescript
interface Storage {
  // Sessions
  getSession(id): Session?
  setSession(session): void
  deleteSession(id): void

  // Events
  addEvent(id, event): void
  getEvents(id): Event[]
  getEventsSince(id, timestamp): Event[]

  // Chains
  addChain(id, chain): void
  getChains(id): Chain[]
  getChain(id): Chain?

  // Commands
  queueCommand(id, cmd): void
  getCommands(id): Command[]
  clearCommands(id): void

  // Input
  queueInput(id, input): void
  getInput(id): Input[]
  clearInput(id): void

  // Clients
  addClient(id, sessionId?): void
  removeClient(id): void
  getClientsForSession(id): string[]

  // Pub/Sub (Redis only)
  subscribe?(channel, callback): void
  publish?(channel, msg): void
  disconnect?(): void
}
```

### Async/Await Pattern
All storage calls wrapped in `Promise.resolve()` for compatibility:

```typescript
// Works with both backends
await Promise.resolve(storage.operation());

// Sync (Memory):
  Promise.resolve(result) → resolves immediately

// Async (Redis):
  Promise.resolve(promise) → awaits completion
```

## Data Flow Examples

### Example 1: Create Session
```
1. POST /api/sessions {cwd}
2. storage.setSession(session)
   - Redis: SETEX afw:sessions:{id} 86400 {json}
   - Memory: Map.set(id, session)
3. Return 201 with session
```

### Example 2: Add Event (Multi-Instance)
```
1. POST /api/events {sessionId, event}
2. storage.addEvent(sessionId, event)
   - Redis:
     - RPUSH afw:events:{sessionId} {json}
     - PUBLISH afw:events {sessionId, event}
   - Memory:
     - Map.get(sessionId).push(event)
3. Instance 1 subscribes to afw:events
   - Receives PUBLISH message
   - Broadcasts to connected WS clients
4. Instance 2 subscribes to afw:events
   - Receives PUBLISH message
   - Broadcasts to connected WS clients
```

### Example 3: Get Commands (Polling)
```
1. Hook polls: GET /api/sessions/{id}/commands
2. storage.getCommands(sessionId)
   - Redis:
     - LRANGE afw:commands:{sessionId} 0 -1
     - DEL afw:commands:{sessionId}  (clear after fetch)
   - Memory:
     - Return and clear from Map
3. Return commands to hook
```

## Configuration Options

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_URL` | Not set | Redis connection string (enables Redis) |
| `REDIS_PREFIX` | `afw:` | Key namespace prefix |
| `PORT` | `3001` | Server port |

### Example Configurations

**Local Development:**
```bash
# Uses in-memory storage
npm run dev
```

**With Redis:**
```bash
export REDIS_URL=redis://localhost:6379
npm run dev
```

**Production (Managed Redis):**
```bash
export REDIS_URL=redis://user:pass@redis.example.com:6379/0
npm run start
```

**Multiple Instances:**
```bash
# Terminal 1
PORT=3001 REDIS_URL=redis://localhost:6379 npm start

# Terminal 2
PORT=3002 REDIS_URL=redis://localhost:6379 npm start
```

## Deployment Scenarios

### Scenario 1: Local Development
- **Storage**: In-memory (default)
- **Instances**: 1
- **Persistence**: None
- **Use Case**: Rapid development iteration

### Scenario 2: Development with Redis
- **Storage**: Redis (local or Docker)
- **Instances**: 1-2
- **Persistence**: Yes
- **Use Case**: Testing multi-instance, persistence

### Scenario 3: Production Single Instance
- **Storage**: Redis (managed service)
- **Instances**: 1
- **Persistence**: Yes (with backups)
- **Use Case**: Single server deployment with data recovery

### Scenario 4: Production Multi-Instance
- **Storage**: Redis (managed service)
- **Instances**: 2-10+
- **Persistence**: Yes (with replication)
- **Load Balancer**: Distributes traffic
- **Use Case**: High availability, load distribution

## Backward Compatibility

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

## Performance Considerations

### Memory Storage
- **Latency**: < 1ms
- **Scalability**: Single instance, limited by RAM
- **Persistence**: None
- **Multi-instance**: Not supported

### Redis Storage
- **Latency**: 1-5ms (network dependent)
- **Scalability**: Multi-instance, limited by Redis capacity
- **Persistence**: Yes (configurable)
- **Multi-instance**: Fully supported
- **Network**: Bandwidth overhead for Pub/Sub

### When to Use Each

| Factor | Memory | Redis |
|--------|--------|-------|
| Development | ✅ Perfect | ⚠️ Overkill |
| Production (1 instance) | ❌ No persistence | ✅ Recommended |
| Production (2+ instances) | ❌ No sharing | ✅ Required |
| High latency requirement | ✅ Best | ⚠️ 1-5ms |
| Large event streams | ❌ RAM limited | ✅ Better |

## Error Handling

All Redis operations include error handling:

```typescript
try {
  await redis.operation();
} catch (error) {
  console.error('[Redis] Error:', error);
  // Logs error, continues operation
}
```

Server continues running even if Redis is unavailable.

## Monitoring

### Check Storage Type
```typescript
import { isAsyncStorage } from './storage';

if (isAsyncStorage(storage)) {
  console.log('Using Redis');
} else {
  console.log('Using Memory');
}
```

### Server Logs
```
[Storage] Using Redis backend
[Redis] Subscribed to channel: afw:events
[Redis] Received broadcast event: session-123
```

### Redis CLI
```bash
redis-cli
> KEYS "afw:*"
> DBSIZE
> MONITOR
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Redis not running | Start Redis: `docker run -p 6379:6379 redis:latest` |
| Events not stored | Redis connection failed | Check `REDIS_URL` env var and Redis status |
| Memory keeps growing | No TTL on keys | Verify TTL values in redis.ts (24h/5m) |
| No events in memory mode | Expected | Add `REDIS_URL` to use persistent storage |
| Multi-instance issues | Not sharing Redis | Ensure both use same `REDIS_URL` |

## Next Steps

1. **Local Testing**
   - Start with memory storage (default)
   - No setup needed, works immediately

2. **Add Redis**
   - Install Docker: https://docs.docker.com/install
   - Run: `docker run -p 6379:6379 redis:latest`
   - Set `REDIS_URL=redis://localhost:6379`
   - Start server: `npm run dev`

3. **Multi-Instance Testing**
   - Start Redis
   - Run Instance 1: `PORT=3001 REDIS_URL=redis://localhost:6379 npm start`
   - Run Instance 2: `PORT=3002 REDIS_URL=redis://localhost:6379 npm start`
   - Test event broadcasting between instances

4. **Production Deployment**
   - Use managed Redis (AWS ElastiCache, Redis Cloud, etc.)
   - Set `REDIS_URL` to connection string
   - Deploy multiple backend instances behind load balancer
   - Configure Redis persistence (AOF/RDB)

## Quick Links

- **Quick Start**: See [REDIS_QUICK_START.md](REDIS_QUICK_START.md)
- **Full Guide**: See [REDIS_INTEGRATION.md](REDIS_INTEGRATION.md)
- **Technical Details**: See [REDIS_IMPLEMENTATION_SUMMARY.md](REDIS_IMPLEMENTATION_SUMMARY.md)
- **Source Code**: See `src/storage/` directory

## Summary

Redis integration is **complete and production-ready**. The implementation:

✅ Maintains full backward compatibility
✅ Supports both memory and Redis storage transparently
✅ Enables multi-instance deployment
✅ Includes comprehensive error handling
✅ Provides clear configuration options
✅ Includes detailed documentation

Start with memory storage (default), add Redis when needed!
