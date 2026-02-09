# WorkbenchLayout.tsx Wiring Consolidation

## Task
Verify and consolidate WorkbenchLayout.tsx wiring for all 8 new workbenches.

## Files Modified

### 1. `packages/app/src/components/Workbench/WorkbenchLayout.tsx`

**Changes:**

1. **Added missing imports (lines 12-13):**
   ```tsx
   import { ExploreWorkbench } from './ExploreWorkbench';
   import { ArchiveWorkbench } from './ArchiveWorkbench';
   ```

2. **Added `useSessionArchive` hook import (line 15):**
   ```tsx
   import { useSessionArchive } from '../../hooks/useSessionArchive';
   ```

3. **Added Archive Workbench state and handlers (lines 183-227):**
   - Destructured `archivedSessions`, `restoreSession`, `deleteArchive`, `clearAllArchives` from `useSessionArchive()` hook
   - Added `handleArchiveRestore` callback
   - Added `handleArchiveDelete` callback
   - Added `handleArchiveClearAll` callback
   - Added `handleFileSelect` callback for ExploreWorkbench
   - Added `handleFileOpen` callback for ExploreWorkbench

4. **Updated switch case for 'explore' (lines 397-404):**
   - Changed from placeholder `<div>` to:
   ```tsx
   <ExploreWorkbench
     sessionId={activeSessionId}
     onFileSelect={handleFileSelect}
     onFileOpen={handleFileOpen}
   />
   ```

5. **Updated switch case for 'archive' (lines 406-413):**
   - Changed from placeholder `<div>` to:
   ```tsx
   <ArchiveWorkbench
     archivedSessions={archivedSessions}
     onRestore={handleArchiveRestore}
     onDelete={handleArchiveDelete}
     onClearAll={handleArchiveClearAll}
   />
   ```

### 2. `packages/app/src/components/Workbench/index.ts`

**Changes:**

Added missing type exports for ArchiveWorkbench and ExploreWorkbench:
```tsx
export type { ArchiveWorkbenchProps } from './ArchiveWorkbench';
export type { ExploreWorkbenchProps } from './ExploreWorkbench';
```

## Workbench Wiring Status

| # | Workbench | Imported | Switch Case | Status |
|---|-----------|----------|-------------|--------|
| 1 | MaintenanceWorkbench | Yes | Yes | OK |
| 2 | ExploreWorkbench | Yes (fixed) | Yes (fixed) | OK |
| 3 | ReviewWorkbench | Yes | Yes | OK |
| 4 | ArchiveWorkbench | Yes (fixed) | Yes (fixed) | OK |
| 5 | SettingsWorkbench | Yes | Yes | OK |
| 6 | PMWorkbench | Yes | Yes | OK |
| 7 | HarmonyWorkbench | Yes | Yes | OK |
| 8 | EditorWorkbench | Yes | Yes | OK |

## Notes

- The TypeScript check reveals pre-existing type errors in the codebase unrelated to these changes
- The components `ExploreWorkbench` and `ArchiveWorkbench` were already fully implemented and exported from `index.ts`
- They were just not properly imported and wired in `WorkbenchLayout.tsx`

## Learnings

None -- execution proceeded as expected.
