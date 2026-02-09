# Registry API Implementation — Phase 3

## Summary

Implemented the Registry API endpoints as specified in SRD Section 4.4. The implementation includes 7 REST endpoints for managing the behavior registry system, with full support for entry querying, layer resolution, pack installation/uninstallment, and conflict detection.

## Changes

### Files Created

1. **`packages/backend/src/routes/registry.ts`** (NEW)
   - 7 REST endpoints for registry management
   - Full Zod validation for requests
   - Error handling with appropriate HTTP status codes
   - Comprehensive logging for debugging

### Files Modified

1. **`packages/backend/src/index.ts`**
   - Added imports for `registryStorage` and `createRegistryRoutes`
   - Registered registry routes at `/api/registry`
   - Added registry storage initialization on server startup
   - Updated startup banner to show registry status

## Endpoints Implemented

### 1. GET `/api/registry`
- Lists all registry entries with optional filtering
- Query parameters:
  - `type` (enum: button, pattern, modifier, pack)
  - `source` (enum: core, pack, project)
  - `status` (enum: active, inactive)
  - `search` (string, max 200 chars)
  - `projectId` (string, max 200 chars)
- Response: `RegistryEntry[]`

### 2. GET `/api/registry/:projectId/resolved`
- Gets resolved behaviors for a specific project
- Applies layer resolution algorithm (core < pack < project)
- Response: `ResolvedBehavior[]`

### 3. GET `/api/registry/packs`
- Lists all installed behavior packs
- Response: `BehaviorPack[]`

### 4. POST `/api/registry/packs`
- Installs a new behavior pack
- Validates pack structure with Zod
- Returns 201 on success with installed flag
- Handles conflicts (409) and validation errors (400)

### 5. DELETE `/api/registry/packs/:packId`
- Uninstalls a behavior pack
- Removes all entries from the pack
- Deletes pack file from disk

### 6. GET `/api/registry/:projectId/conflicts`
- Gets all detected layer conflicts for a project
- Shows which layer wins when same entry ID exists in multiple layers
- Response: `RegistryConflict[]`

### 7. GET `/api/registry/stats`
- Gets registry statistics (total entries, packs, breakdown by type/source)
- Response: Statistics object

## Validation & Error Handling

### Zod Schemas
- **registryQuerySchema** — Query parameter validation
- **behaviorPackSchema** — Pack installation request validation
  - Enforces semver format (X.Y.Z)
  - Validates required fields and string lengths
  - Supports optional tags, dependencies, and project types

### Error Responses
- **400** — Invalid request parameters or pack data
- **404** — Pack not found
- **409** — Pack already installed or entry conflict
- **500** — Server errors with meaningful messages

## Integration Points

### Services Used
- **RegistryStorage** — File-based storage with memory caching (packages/backend/src/services/registryStorage.ts)
- **LayerResolver** — Layer resolution engine (packages/backend/src/services/layerResolver.ts)

### Types Imported
From `@afw/shared`:
- `RegistryEntry`, `RegistryEntryId`
- `BehaviorPack`, `BehaviorPackId`
- `ResolvedBehavior`, `RegistryFilter`
- `RegistryConflict`, `ProjectId`

## Testing & Verification

✅ TypeScript type checking passed (`pnpm -F @afw/backend type-check`)
✅ Backend builds successfully (`pnpm -F @afw/backend build`)
✅ All imports resolve correctly
✅ Router exports correct type (Express Router)

## Logging

All endpoints include structured logging:
```
[Registry] Installed pack: {packName} ({packId})
[Registry] Uninstalled pack: {packId}
[Registry] Error listing entries: {error}
```

## Next Steps

1. Frontend integration — Create React components to consume these endpoints
2. E2E tests — Add test suite for all endpoints
3. Example behavior packs — Create sample packs for demonstration
4. Documentation — Add API documentation to docs/

## Notes

- Routes are automatically protected by existing authMiddleware (applied at /api level)
- Rate limiting applies via generalLimiter (applied at /api level)
- Registry storage is initialized on server startup with error handling
- The implementation follows existing Express Router patterns in the codebase

## Verification Results

### Build Status
✅ TypeScript type checking: PASSED
✅ Backend build: PASSED
✅ Module imports: VERIFIED

### Route Registration
✅ Routes mounted at `/api/registry`
✅ All 7 endpoints registered
✅ Proper route ordering (specific routes before parameterized routes)

### Integration
✅ RegistryStorage initialized on server startup
✅ Auth middleware applied to all endpoints
✅ Rate limiting applied to all endpoints
✅ Error handling with appropriate HTTP status codes
✅ Comprehensive logging for debugging

### Implementation Complete
The Registry API is fully implemented and ready for:
1. Frontend integration
2. E2E testing
3. Client implementation
4. Documentation updates
