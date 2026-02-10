# Redis Quick Start Guide

## 5-Minute Setup

### Option 1: Development with Memory Storage (Default)

```bash
cd packages/backend
npm install
npm run dev
```

✅ Uses in-memory storage by default
✅ No Redis needed
✅ Perfect for local development
❌ Data lost on restart

### Option 2: Development with Local Redis

#### 1. Start Redis (Docker)
```bash
docker run -p 6379:6379 redis:latest
```

Or install Redis locally:
```bash
# macOS
brew install redis

# Linux
sudo apt-get install redis-server

# Windows - use WSL or Docker
```

#### 2. Set Environment Variable
```bash
export REDIS_URL=redis://localhost:6379
```

#### 3. Start Backend
```bash
cd packages/backend
npm install
npm run dev
```

✅ Redis persistent storage
✅ Multi-instance ready
✅ Events broadcast via Pub/Sub

### Option 3: Production with Managed Redis

```bash
export REDIS_URL=redis://user:password@redis.example.com:6379/0
npm run start
```

## Verify It Works

### Check Server is Running
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 1.234
}
```

### Create a Session
```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"cwd":"/home/user","platform":"darwin"}'
```

Expected response:
```json
{
  "id": "session-1704110400000-abc123",
  "cwd": "/home/user",
  "platform": "darwin",
  "status": "pending",
  "startedAt": "2024-01-02T00:00:00Z",
  "chains": []
}
```

### Post an Event
```bash
SESSION_ID="session-1704110400000-abc123"
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\":\"$SESSION_ID\",
    \"type\":\"test\",
    \"timestamp\":\"2024-01-02T00:00:01Z\"
  }"
```

### Check Events (with Redis)
```bash
# Using Redis CLI
redis-cli LRANGE "afw:events:session-1704110400000-abc123" 0 -1
```

## Environment Variables

```bash
# Redis connection (optional, defaults to memory)
export REDIS_URL=redis://localhost:6379

# Key prefix (optional, defaults to "afw:")
export REDIS_PREFIX=afw:

# Server port (optional, defaults to 3001)
export PORT=3001
```

## Multi-Instance Setup

### Terminal 1: First Instance
```bash
PORT=3001 REDIS_URL=redis://localhost:6379 npm run dev
```

### Terminal 2: Second Instance
```bash
PORT=3002 REDIS_URL=redis://localhost:6379 npm run dev
```

Both instances share data via Redis and broadcast events to all connected clients!

## Debugging

### Check Logs
```
[Storage] Using Redis backend
[Redis] Subscribed to channel: afw:events
[Redis] Received broadcast event: session-...
```

### View Redis Data
```bash
# Connect to Redis CLI
redis-cli

# See all keys
> KEYS "afw:*"

# Check session
> GET "afw:sessions:session-123"

# Check events
> LRANGE "afw:events:session-123" 0 -1

# Check Pub/Sub subscribers
> PUBSUB CHANNELS
```

### Monitor Events
```bash
redis-cli MONITOR
# Shows all Redis commands in real-time
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` | Redis not running. Start with `docker run -p 6379:6379 redis:latest` |
| Events not appearing | Check `redis-cli LRANGE "afw:events:..." 0 -1` to verify storage |
| Memory mode doesn't persist | That's expected! Set `REDIS_URL` to use persistent storage |
| High Redis memory | Check session count: `redis-cli DBSIZE` - old sessions accumulate |
| Port already in use | Change port: `PORT=3002 npm run dev` |

## Next Steps

1. Read [REDIS_INTEGRATION.md](REDIS_INTEGRATION.md) for comprehensive guide
2. Check [REDIS_INTEGRATION.md § Appendix B](REDIS_INTEGRATION.md) for technical details
3. Explore API routes in `src/routes/`
4. Set up WebSocket client to receive real-time events

## Commands Reference

```bash
# Development with memory
npm run dev

# Development with Redis
REDIS_URL=redis://localhost:6379 npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Production run
npm run start
```

## Quick Architecture

```
Client Request
    ↓
Express Route
    ↓
Storage Factory (smart selection)
    ├─ Memory Storage (default, fast, in-process)
    └─ Redis Storage (persistent, distributed, pub/sub)
    ↓
Response
```

## Files to Review

- `src/storage/index.ts` - Storage factory and selection logic
- `src/storage/redis.ts` - Redis implementation
- `src/storage/memory.ts` - Memory implementation (unchanged)
- `src/index.ts` - Pub/Sub initialization and broadcasting
- `.env.example` - Configuration template

---

**That's it!** You now have Redis-backed persistent storage with multi-instance support.
