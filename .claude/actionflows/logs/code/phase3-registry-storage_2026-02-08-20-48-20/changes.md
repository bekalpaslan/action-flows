# RegistryStorage Service Implementation

## Task
Implement RegistryStorage service in `packages/backend/src/services/registryStorage.ts` following SRD Section 4.2.

## Summary
Successfully created a file-based registry storage service with memory caching that manages behavior registry entries and behavior packs for the ActionFlows Dashboard.

## Files Created

### packages/backend/src/services/registryStorage.ts
- **Lines:** 293
- **Status:** ✅ Complete and type-checked
- **Pattern:** Service class with singleton export

## Implementation Details

### Architecture
The RegistryStorage service implements a hybrid approach:
- **Memory Layer:** Maps for O(1) lookup and filtering
- **File Layer:** JSON files persisted to disk
- **Initialization:** Load all JSON files on startup, cache in memory
- **Mutations:** Write to file + update cache
- **Queries:** Memory-first access

### Storage Structure
```
data/registry/
├── core.json              # Core/built-in entries
├── packs/
│   ├── {packId}.json      # Individual behavior packs
│   └── ...
└── projects/
    └── (reserved for future)
```

### Key Features

#### Initialization
- `initialize()`: Async startup that loads all registry files
- Creates required directories if missing
- Gracefully handles missing files
- Logs summary statistics on completion

#### CRUD Operations
- `getEntry(id)`: Retrieve single entry by ID
- `listEntries(filter)`: Query entries with optional filtering:
  - By type (button, pattern, modifier, pack)
  - By source layer (core, pack, project)
  - By status (active, inactive)
  - Full-text search in name/description
- `addEntry(entry)`: Create new entry (prevents duplicates)
- `updateEntry(id, updates)`: Merge partial updates, auto-update timestamp
- `removeEntry(id)`: Delete entry and persist

#### Pack Operations
- `installPack(pack)`: Register behavior pack and all entries
- `uninstallPack(packId)`: Unregister pack and remove entries
- `getInstalledPacks()`: List all installed packs
- `getPack(packId)`: Retrieve specific pack

#### Persistence
- Atomic writes using temp file + rename pattern
- Write mutex prevents concurrent file access races
- Separate persistence for core entries and packs
- Automatic directory creation

#### Utilities
- `getStats()`: Returns registry statistics:
  - Total entries and packs
  - Breakdown by entry type (button, pattern, etc.)
  - Breakdown by source layer
- `isInitialized()`: Check initialization state

### Singleton Export
```typescript
export const registryStorage = new RegistryStorage();
```

## TypeScript Validation
✅ Passed type-check: `pnpm -F @afw/backend type-check`
- No type errors
- All imported types from @afw/shared properly used
- Branded types (RegistryEntryId, BehaviorPackId) enforced

## Code Patterns Applied
1. **Service Class Pattern**: Matches existing services (ProjectStorage)
2. **Async/Await**: All I/O operations use async patterns
3. **Error Handling**: Try-catch with informative logging
4. **Memory Bounds**: Efficient Map-based storage
5. **Atomic Operations**: Temp file + rename for consistency
6. **Write Mutex**: Prevents concurrent write races
7. **Directory Safety**: Automatic creation with recursive: true
8. **Singleton Export**: Matches project conventions

## Dependencies
- `fs/promises`: Node.js async file operations
- `path`: Path utilities
- `@afw/shared`: Typed imports
  - RegistryEntry, RegistryEntryId
  - BehaviorPack, BehaviorPackId
  - RegistryFilter, LayerSource

## Integration Points
The service is now available for:
- API routes for registry management
- WebSocket events for registry changes
- Backend initialization in index.ts
- Future integrations with layer resolution and conflict detection

## Testing Strategy (Not implemented, for future)
- Unit tests for CRUD operations
- Integration tests for file persistence
- Filtering behavior with various combinations
- Concurrency tests for write mutex
- Directory creation safety

## Logs & Monitoring
Service includes comprehensive logging at:
- Initialization with statistics
- Each file load (core, packs)
- Successful persistence
- Errors and warnings
- Entry operations (add, update, remove)
- Pack operations (install, uninstall)

## Learnings

**Issue:** N/A

**Root Cause:** N/A

**Suggestion:** N/A

None — execution proceeded as expected.

[FRESH EYE] The service follows established patterns from ProjectStorage but adds specialized features for registry management:
1. Discriminated union filtering (type-safe filtering by LayerSource)
2. Pack-aware operations (entries grouped by pack)
3. Statistics generation for monitoring

The write mutex pattern from ProjectStorage was correctly applied here to handle concurrent write scenarios safely.
