# LayerResolver Service Implementation

## Task
Create LayerResolver service in packages/backend/src/services/ for resolving effective behavior sets by merging layers.

## Context
- **SRD Section:** 4.3 Layer Resolution Engine
- **RegistryStorage:** Already exists at packages/backend/src/services/registryStorage.ts
- **Shared Types:** Import from @afw/shared (ProjectId, ButtonDefinition, PatternAction, etc.)

## Implementation Summary

### File Created
- **D:\ActionFlowsDashboard\packages\backend\src\services\layerResolver.ts**

### Key Methods

#### `resolve(projectId: ProjectId): Promise<ResolvedBehavior[]>`
- Loads all core entries (source.type === 'core')
- Merges installed packs (pack entries override core)
- Merges project overrides (project entries override pack/core)
- Returns merged set with provenance tracking
- Logs conflict resolution for debugging

#### `resolveButtons(projectId: ProjectId): Promise<ButtonDefinition[]>`
- Convenience method to resolve only button definitions
- Filters resolved entries by type 'button' and extracts definitions

#### `resolvePatterns(projectId: ProjectId): Promise<PatternAction[]>`
- Convenience method to resolve only pattern definitions
- Filters resolved entries by type 'pattern' and extracts definitions

#### `getConflicts(projectId: ProjectId): Promise<RegistryConflict[]>`
- Detects all conflicts between registry entries
- Groups entries by ID
- Identifies multiple definitions with different sources
- Returns conflict details with resolution reason

#### `isOverridden(entryId: string, projectId: ProjectId): Promise<boolean>`
- Checks if an entry is overridden by a higher layer
- Returns true if entry is not the winner in its conflict

#### `layerPriority(source: LayerSource): number`
- Private helper that assigns priority: core (1) < pack (2) < project (3)
- Used for sorting and conflict resolution

### Design Patterns

1. **Constructor Injection:** RegistryStorage passed via constructor for dependency injection
2. **Type Safety:** Full TypeScript with no `any` types
3. **Async/Await:** All operations are async to support storage provider pattern
4. **Logging:** Console logging for conflict resolution and debugging
5. **Immutability:** Returns new objects, does not modify storage directly

### Algorithm Details

**Layer Priority:**
- Core (lowest): Shipped behaviors, foundation layer
- Pack (middle): Installed behavior packs extend core
- Project (highest): Project-specific overrides

**Conflict Resolution:**
- Same entry ID from different sources: Higher layer wins
- Same entry ID from same source: Later version wins
- Conflicts tracked in ResolvedBehavior.overriddenBy and RegistryConflict arrays

**Project Filtering:**
- Project-specific entries (source.type === 'project') filtered to target projectId
- Prevents leaking overrides from other projects

## Testing Status
- ✅ TypeScript compilation: PASS
- ✅ All imports resolved correctly
- ✅ Type safety verified with `pnpm -F @afw/backend type-check`

## Implementation Follows
- Express + TypeScript backend patterns
- Zod-free service class (no validation needed for internal service)
- StorageProvider interface via RegistryStorage
- Branded types from @afw/shared
- Async/await for all operations

## Next Steps
1. Integrate LayerResolver into backend initialization (packages/backend/src/index.ts)
2. Create resolver routes if needed (e.g., GET /api/registry/resolve)
3. Add WebSocket support for real-time resolution updates
4. Create comprehensive test suite for conflict detection scenarios
