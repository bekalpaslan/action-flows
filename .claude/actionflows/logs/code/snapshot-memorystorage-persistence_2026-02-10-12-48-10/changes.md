# Code Changes: Snapshot-Based MemoryStorage Persistence

## Summary
Implemented snapshot-based persistence for MemoryStorage, enabling dev mode state to survive process restarts. The system serializes all important storage state to gzipped JSON files on disk, with MD5 checksums, automatic rotation, and graceful error handling.

## Files Modified

| File | Change |
|------|--------|
| `packages/backend/src/storage/memory.ts` | Added `snapshot()` and `restore()` methods to serialize/deserialize all Maps to disk. Added methods to MemoryStorage interface. |
| `packages/backend/src/storage/index.ts` | Added `snapshot?()` and `restore?()` optional methods to Storage interface for memory-only persistence. |
| `packages/backend/src/storage/resilientStorage.ts` | Added proxy methods for `snapshot()` and `restore()` that delegate to fallback storage (MemoryStorage). |
| `packages/backend/src/index.ts` | Integrated SnapshotService: imports, initialization, loads snapshot on startup, starts periodic snapshots, saves on graceful shutdown. |
| `.gitignore` | Added `.actionflows-snapshot/` to ignore snapshot files from git. |

## Files Created

| File | Purpose |
|------|---------|
| `packages/backend/src/services/snapshotService.ts` | SnapshotService class that handles snapshot creation, compression (gzip), MD5 validation, rotation (keep last 3), and restoration. |

## Implementation Details

### SnapshotService Features
- **Periodic snapshots**: Every 5 minutes (configurable)
- **Shutdown snapshot**: On SIGTERM/SIGINT
- **Compression**: Gzip for space efficiency
- **Integrity**: MD5 checksums
- **Rotation**: Keep last 3 snapshots (configurable)
- **Graceful degradation**: Failed snapshot never crashes server
- **Telemetry**: All operations logged

### Snapshot Data Structure
```typescript
{
  version: 1,
  timestamp: "2026-02-10T12:48:10.123Z",
  checksum: "abc123...",
  data: {
    sessions: [...],
    events: {...},
    chains: {...},
    chatHistory: {...},
    sessionsByUser: {...},
    commandsQueue: {...},
    inputQueue: {...},
    followedSessions: [...],
    sessionWindowConfigs: {...},
    frequencies: {...},
    bookmarks: {...},
    patterns: {...},
    harmonyChecks: {...},
    harmonyChecksByProject: {...},
    dossiers: {...},
    suggestions: {...},
    telemetryEntries: [...],
    sessionTtlExtensions: {...}
  }
}
```

### Storage Lifecycle
1. **Startup**: Load latest valid snapshot → restore state → start periodic snapshots
2. **Runtime**: Periodic snapshots every 5 minutes, auto-rotation
3. **Shutdown**: Save final snapshot → stop service

### Error Handling
- Checksum validation prevents corrupted snapshots from loading
- If latest snapshot fails, tries next-newest
- If all snapshots fail, starts fresh
- Failed snapshot writes never crash the server

## Verification
- Type check: **PASS** (all snapshot-related type errors resolved)
- Notes: Frontend and lifecycle manager type errors are unrelated to this implementation

## Boundary Compliance
- ✅ Added snapshot/restore methods at END of MemoryStorage class (no modification to existing FIFO, TTL, freshness)
- ✅ Storage interface only added optional methods (no changes to lifecycle methods)
- ✅ Backend index.ts: snapshot startup/shutdown in different location than lifecycle manager routes
- ✅ No changes to shared/types.ts (snapshot types defined inline in MemoryStorage)
- ✅ ResilientStorage proxies snapshot methods correctly

## Testing Recommendations
1. Start backend → create session → stop backend → restart → verify session exists
2. Verify `.actionflows-snapshot/` directory created with gzipped files
3. Verify rotation keeps only last 3 snapshots
4. Verify Redis mode (AFW_REDIS_URL set) does NOT create snapshots
