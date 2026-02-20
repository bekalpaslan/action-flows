# Redis Integration - Documentation Index

## Documentation Guide

This directory now contains comprehensive Redis integration documentation. Here's how to navigate:

### Getting Started

**New to Redis integration?** Start here:

1. **[REDIS_QUICK_START.md](REDIS_QUICK_START.md)** (5 minutes)
   - Quick 5-minute setup guide
   - Three simple deployment scenarios
   - Immediate verification steps
   - Basic troubleshooting
   - **Best for**: Getting started immediately

2. **[REDIS_INTEGRATION.md](REDIS_INTEGRATION.md)** (Comprehensive Reference)
   - Complete architecture overview
   - All data structures explained
   - Configuration and environment setup
   - Multi-instance deployment guide
   - WebSocket event broadcasting
   - TTL management
   - Error handling and monitoring
   - Performance considerations
   - Full troubleshooting guide
   - Migration strategies
   - Deployment scenarios (Appendix A)
   - Implementation details (Appendix B)
   - **Best for**: Production deployment and comprehensive understanding

### Quick Reference

| Scenario | Read This |
|----------|-----------|
| I want to start now (5 min) | REDIS_QUICK_START.md |
| I need comprehensive guide (30 min) | REDIS_INTEGRATION.md |
| I need technical deep-dive | REDIS_INTEGRATION.md § Appendix B |
| I need deployment info | REDIS_INTEGRATION.md § Appendix A |

---

## What Was Done

### Core Implementation

- ✅ **Redis Storage Adapter** (`src/storage/redis.ts`)
  - Complete data persistence
  - Pub/Sub event broadcasting
  - Multi-instance support
  - 300+ lines of production code

- ✅ **Storage Factory** (`src/storage/index.ts`)
  - Smart backend selection
  - Auto-detection via environment
  - Universal interface
  - Backward compatible

- ✅ **Server Updates** (`src/index.ts`)
  - Redis Pub/Sub initialization
  - Event broadcasting setup
  - Graceful shutdown handling
  - WebSocket client tracking

- ✅ **Route Updates** (all 3 route files)
  - Async/await support
  - Factory pattern usage
  - Both backend compatibility

- ✅ **WebSocket Handler** (`src/ws/handler.ts`)
  - Async support
  - Type-safe interface
  - Promise.resolve() compatibility

### Configuration

- ✅ **.env.example** - Configuration template with all variables
- ✅ **Environment Detection** - Auto-select Redis or Memory
- ✅ **Graceful Degradation** - Works without Redis

### Documentation

- ✅ **REDIS_QUICK_START.md** - Quick setup guide
- ✅ **REDIS_INTEGRATION.md** - Comprehensive reference (includes Appendices A & B)
- ✅ **REDIS_INDEX.md** - This file (navigation guide)

---

## File Structure

```
packages/backend/
├── src/
│   ├── storage/
│   │   ├── memory.ts              (existing)
│   │   ├── redis.ts               (NEW)
│   │   └── index.ts               (NEW)
│   ├── routes/
│   │   ├── events.ts              (updated)
│   │   ├── commands.ts            (updated)
│   │   └── sessions.ts            (updated)
│   ├── ws/
│   │   └── handler.ts             (updated)
│   └── index.ts                   (updated)
├── package.json                   (updated)
├── .env.example                   (NEW)
├── REDIS_QUICK_START.md           (NEW)
├── REDIS_INTEGRATION.md           (NEW - consolidated with Appendices A & B)
└── REDIS_INDEX.md                 (this file)
```

---

## Key Features

### ✅ Zero Breaking Changes
- Existing code works unchanged
- Memory storage still available
- Backward compatible
- Optional Redis

### ✅ Transparent Backend Selection
```bash
npm run dev                    # Uses memory (default)
REDIS_URL=... npm run dev      # Uses Redis
```

### ✅ Multi-Instance Support
```bash
# Terminal 1
PORT=3001 REDIS_URL=redis://localhost:6379 npm start

# Terminal 2
PORT=3002 REDIS_URL=redis://localhost:6379 npm start

# Both instances share data and broadcast events
```

### ✅ Event Broadcasting
- Events publish to `afw:events` channel
- All instances receive and broadcast
- Real-time multi-instance updates
- WebSocket clients get instant updates

### ✅ Persistent Storage
- Sessions: 24-hour TTL
- Events: 24-hour TTL
- Chains: 24-hour TTL
- Commands: 5-minute TTL
- Input: 5-minute TTL

---

## Quick Start

### Development (No Setup)
```bash
npm run dev
```

### Development with Redis
```bash
docker run -p 6379:6379 redis:latest
export REDIS_URL=redis://localhost:6379
npm run dev
```

### Production
```bash
export REDIS_URL=redis://user:pass@redis.example.com:6379/0
npm run start
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_URL` | Not set | Redis connection (enables Redis) |
| `REDIS_PREFIX` | `afw:` | Key namespace prefix |
| `PORT` | `3001` | Server port |

---

## Testing

All endpoints work transparently with both backends:

```bash
# Create session
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"cwd":"/home/user"}'

# Add event
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"...","type":"test","timestamp":"2024-01-01T00:00:00Z"}'

# Check events (with Redis)
redis-cli LRANGE "afw:events:..." 0 -1
```

---

## Support & Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` | Redis not running: `docker run -p 6379:6379 redis:latest` |
| No data persistence | Set `REDIS_URL` environment variable |
| Events not broadcasting | Verify WebSocket connection and Redis Pub/Sub |
| Memory keeps growing | Check Redis TTL: `redis-cli TTL "afw:sessions:..."` |

### Getting Help

1. Check **REDIS_QUICK_START.md** for quick fixes
2. Search **REDIS_INTEGRATION.md** for detailed troubleshooting
3. Review **REDIS_INTEGRATION.md** (Appendix B) for technical details
4. Check server logs: `[Redis]` and `[Storage]` messages

---

## Next Steps

### Immediate
1. Read REDIS_QUICK_START.md
2. Run `npm install` (gets ioredis)
3. Test with `npm run dev`

### With Redis
1. Install Redis locally or use managed service
2. Set `REDIS_URL` environment variable
3. Restart server
4. Verify with `redis-cli`

### Production
1. Use managed Redis service
2. Configure multiple backend instances
3. Place behind load balancer
4. Monitor Redis metrics

---

## Documentation Statistics

| Document | Read Time | Target Audience |
|----------|-----------|-----------------|
| REDIS_QUICK_START.md | 5 min | Everyone - getting started |
| REDIS_INTEGRATION.md | 30 min | Production deployment, comprehensive reference |
| REDIS_INDEX.md | 5 min | Navigation guide |

**Total documentation**: Comprehensive guides covering quick start through production deployment

---

## Success Criteria - All Met ✅

- ✅ Redis dependencies installed
- ✅ Redis storage adapter implemented (300+ lines)
- ✅ Storage factory with smart selection
- ✅ Pub/Sub for multi-instance broadcasting
- ✅ All routes updated and async
- ✅ WebSocket handler updated
- ✅ Environment configuration
- ✅ Graceful shutdown
- ✅ Error handling throughout
- ✅ Zero breaking changes
- ✅ Backward compatible
- ✅ Comprehensive documentation

---

## Architecture

### Storage Layer
```
Application Routes
       ↓
Storage Factory (smart selection)
   ↙         ↖
Memory      Redis
(default)   (persistent)
```

### Event Broadcasting (Multi-Instance)
```
Instance 1          Instance 2          Instance 3
  ↓                   ↓                   ↓
Pub/Sub Channel (afw:events)
  ↑                   ↑                   ↑
All subscribe & broadcast to local WS clients
```

### Data Flow
```
HTTP Request
   ↓
Route Handler (async)
   ↓
Promise.resolve(storage.operation())
   ↓
Memory: Sync resolution
Redis: Async resolution
   ↓
Response
```

---

## Implementation Highlights

1. **Async/Await Compatibility**
   - Works with both sync (memory) and async (Redis)
   - Pattern: `Promise.resolve(storage.operation())`

2. **Automatic Backend Selection**
   - Check for `REDIS_URL` environment variable
   - Redis if set, memory otherwise

3. **Pub/Sub Broadcasting**
   - Events published to Redis channel
   - All instances receive and broadcast
   - Real-time multi-instance support

4. **Graceful Shutdown**
   - Proper Redis cleanup on SIGTERM/SIGINT
   - WebSocket client cleanup
   - Error handling

5. **TTL Management**
   - Sessions: 24 hours
   - Events: 24 hours
   - Commands: 5 minutes
   - Automatic cleanup via Redis expiration

---

## Version Information

- **ioredis**: ^5.3.0 (built-in TypeScript types)
- **Node.js**: Compatible with 14+
- **TypeScript**: Fully typed
- **Platform**: Linux, macOS, Windows (with WSL/Docker)

---

## Status

✅ **Implementation**: Complete
✅ **Testing**: Verified
✅ **Documentation**: Comprehensive
✅ **Production**: Ready

**Last Updated**: February 6, 2026

---

## Quick Navigation

- Want to start? → [REDIS_QUICK_START.md](REDIS_QUICK_START.md)
- Want overview? → [REDIS_INTEGRATION.md](REDIS_INTEGRATION.md) (Appendix A)
- Want details? → [REDIS_INTEGRATION.md](REDIS_INTEGRATION.md)
- Want technical? → [REDIS_INTEGRATION.md](REDIS_INTEGRATION.md) (Appendix B)

---

**Redis integration is complete and production-ready!**
