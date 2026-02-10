# Intel Dossier Backend Implementation — Changes Summary

**Date:** 2026-02-09
**Agent:** code/backend/
**Task:** Implement Steps 2+3 from Intel Dossier plan: Zod Schemas + Storage Layer

---

## Changes Made

### Step 2: Zod Schemas (packages/backend/src/schemas/api.ts)

Added 4 new schema definitions with proper validation rules:

1. **createDossierSchema**
   - `name`: string, 1-200 chars (required)
   - `targets`: array of strings, 1-50 items, each 1-500 chars (required)
   - `context`: string, max 5000 chars (optional, defaults to empty string)

2. **updateDossierSchema**
   - All fields optional for PATCH operations
   - `name`: string, 1-200 chars
   - `targets`: array of strings, 1-50 items, each 1-500 chars
   - `context`: string, max 5000 chars

3. **triggerAnalysisSchema**
   - `force`: boolean (optional, defaults to false)

4. **createSuggestionSchema**
   - `dossierId`: string (required)
   - `needed`: string (required) - widget type needed
   - `reason`: string (required) - why widget was requested
   - `fallback`: object with `type` enum ('raw'|'markdown') and `content` string (required)

All schemas follow existing pattern conventions in the file with proper error messages and length limits.

---

### Step 3: Storage Layer

#### Modified: packages/backend/src/storage/index.ts

Added Intel Dossier storage methods to the Storage interface:

**Dossier Methods:**
- `getDossier(id: string)`: Get dossier by ID
- `setDossier(dossier: IntelDossier)`: Create/update dossier
- `listDossiers()`: List all dossiers
- `deleteDossier(id: string)`: Delete dossier
- `appendDossierHistory(id: string, entry: DossierHistoryEntry)`: Add history entry

**Suggestion Methods:**
- `getSuggestion(id: string)`: Get suggestion by ID
- `listSuggestions()`: List all suggestions
- `addSuggestion(suggestion: SuggestionEntry)`: Add suggestion
- `deleteSuggestion(id: string)`: Delete suggestion
- `incrementSuggestionFrequency(id: string)`: Increment frequency counter

#### Modified: packages/backend/src/storage/memory.ts

**Added Constants:**
- `MAX_DOSSIERS = 100`: Maximum dossiers in memory
- `MAX_DOSSIER_HISTORY = 50`: Maximum history entries per dossier
- `MAX_SUGGESTIONS = 500`: Maximum suggestions in memory

**Implemented all 10 methods with intelligent eviction strategies:**

1. **Dossier Storage:**
   - Uses `Map<string, IntelDossier>` for O(1) lookups
   - FIFO eviction by `createdAt` when limit reached
   - History auto-truncates to last 50 entries

2. **Suggestion Storage:**
   - Uses `Map<string, SuggestionEntry>` for O(1) lookups
   - Evicts least frequently used suggestion when limit reached
   - Tiebreaker: oldest timestamp wins on equal frequency

#### Modified: packages/backend/src/storage/redis.ts

**Implemented all 10 async methods using Redis patterns:**

1. **Dossier Storage:**
   - Individual keys: `afw:dossiers:{id}` (JSON serialized)
   - Set index: `afw:dossiers` (for listing)
   - History truncation enforced at 50 entries

2. **Suggestion Storage:**
   - Individual keys: `afw:suggestions:{id}` (JSON serialized)
   - Set index: `afw:suggestions` (for listing)
   - Frequency increment via read-modify-write

Both memory and Redis implementations follow the same Storage interface contract for drop-in compatibility.

---

## Verification

**Type Check:** ✅ Passed
```bash
pnpm -F @afw/backend type-check
```

All new schemas and storage methods compile without errors. Ready for integration with REST API routes in Step 4.

---

## Files Modified

1. `packages/backend/src/schemas/api.ts` — Added 4 Zod schemas + types
2. `packages/backend/src/storage/index.ts` — Extended Storage interface
3. `packages/backend/src/storage/memory.ts` — Implemented 10 methods
4. `packages/backend/src/storage/redis.ts` — Implemented 10 async methods

---

## Next Steps (from Intel Dossier Plan)

**Step 4:** REST API routes for dossiers and suggestions
**Step 5:** WebSocket events for real-time updates
**Step 6:** Frontend integration with Intel workbench
