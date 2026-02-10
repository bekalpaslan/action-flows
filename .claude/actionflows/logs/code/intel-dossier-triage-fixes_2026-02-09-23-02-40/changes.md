# Code Changes: Intel Dossier Triage Fixes

## Summary

Fixed 3 critical/high issues identified in the Intel Dossier Phase 1 review:

1. **API Response Format Mismatch (CRITICAL)** - Fixed hook to extract `dossiers` array from wrapped response
2. **HTTP Verb Inconsistency (HIGH)** - Changed `PATCH` to `PUT` to match backend route
3. **Missing WS Broadcast Init Check (HIGH)** - Verified guards already exist (no changes needed)

## Files Modified

| File | Change |
|------|--------|
| `packages/app/src/hooks/useDossiers.ts` | Fixed `fetchDossiers` to extract `data.dossiers` from wrapped API response (line 63) |
| `packages/app/src/hooks/useDossiers.ts` | Changed HTTP method from `PATCH` to `PUT` in `updateDossier` (line 105) |

## Files Created

None - triage fixes only modified existing files.

## Verification

- **Type check:** Pre-existing errors unrelated to changes. The modified file (`useDossiers.ts`) has correct syntax.
- **Backend routes verified:** All API response shapes in `packages/backend/src/routes/dossiers.ts` match hook expectations after fixes
- **WS broadcast guards:** Confirmed all broadcast calls have null-safety (`if (broadcastDossierEvent)`) at lines 59, 150, 184, 271

## Issue Details

### Issue 1: API Response Format Mismatch (CRITICAL)

**Root Cause:** Backend `GET /api/dossiers` returns `{ count, dossiers }` but hook tried to use response as plain array.

**Fix Applied:**
```typescript
// Before:
const data = await response.json();
setDossiers(data);

// After:
const data = await response.json();
setDossiers(data.dossiers || []);
```

**Verification:** Checked all other API calls - they parse correctly:
- POST /api/dossiers → returns plain `IntelDossier` ✓
- GET /api/dossiers/:id → returns plain `IntelDossier` ✓
- PUT /api/dossiers/:id → returns plain `IntelDossier` ✓
- DELETE /api/dossiers/:id → returns `{ success, dossierId }` (not parsed in hook, no issue)
- POST /api/dossiers/:id/analyze → returns `{ success, dossierId, status, analysisCount, message }` (not parsed in hook, no issue)

### Issue 2: HTTP Verb Inconsistency (HIGH)

**Root Cause:** Backend uses `router.put('/:id', ...)` but hook used `method: 'PATCH'`.

**Fix Applied:**
```typescript
// Before:
method: 'PATCH',

// After:
method: 'PUT',
```

### Issue 3: Missing WS Broadcast Init Check (HIGH)

**Status:** Already fixed - no changes needed.

**Verification:** All broadcast calls in `packages/backend/src/routes/dossiers.ts` have null-safety guards:
- Line 59: `if (broadcastDossierEvent) broadcastDossierEvent('dossier:created', ...)`
- Line 150: `if (broadcastDossierEvent) broadcastDossierEvent('dossier:updated', ...)`
- Line 184: `if (broadcastDossierEvent) broadcastDossierEvent('dossier:deleted', ...)`
- Line 271: `if (broadcastDossierEvent) broadcastDossierEvent('dossier:analyzing', ...)`

## Next Steps

1. Run integration tests to verify API/frontend communication
2. Test dossier CRUD operations in the UI
3. Verify WebSocket events propagate correctly on dossier changes
