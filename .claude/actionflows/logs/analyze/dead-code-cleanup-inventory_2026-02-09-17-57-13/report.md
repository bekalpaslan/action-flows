# Dead Code and Stale Artifact Analysis

**Aspect:** Inventory
**Scope:** Full frontend (packages/app/src/components/), root-level docs, untracked artifacts
**Date:** 2026-02-09
**Agent:** analyze/agent

---

## Executive Summary

Following the multi-phase UI redesign (Self-Evolving UI, Context-Native Routing cleanup, Workbench Layout migration, SessionSidebar glow integration), this analysis identified **4 categories of dead/stale code** totaling **21 files to remove** and **168 lines of dead code** in AppContent.tsx to delete.

**Key Finding:** The `USE_NEW_LAYOUT` feature flag and all classic layout code (lines 132-300 in AppContent.tsx) are now dead code. The feature flag was supposed to be removed in Phase 5 but was missed.

---

## 1. Category: Untracked Temporary/Implementation Docs

These are temporary implementation documentation files that served their purpose during development but should not be committed to the repository.

| File | Purpose | Status | Reason to Delete |
|------|---------|--------|------------------|
| `IMPLEMENTATION_SUMMARY.md` (root) | Phase 1 contract implementation summary | Untracked | Temporary doc for contract implementation - superseded by CONTRACT.md |
| `packages/backend/IMPLEMENTATION_SUMMARY.md` | Backend skeleton summary | Untracked | Temporary setup doc - superseded by backend README |
| `WORKBENCH_LAYOUT_INTEGRATION.md` (root) | Workbench integration testing guide | Untracked | Temporary integration doc - feature flag removed, integration complete |
| `packages/app/src/components/Workbench/COMPONENT_HIERARCHY.txt` | SessionTile hierarchy diagram | Untracked | Temporary integration reference - should be in formal docs if needed |
| `packages/app/src/components/Workbench/INTEGRATION_SUMMARY.md` | SessionTile integration summary | Untracked | Temporary implementation doc - feature complete |

**Action:** Delete all 5 files.

---

## 2. Category: Example/Demo Files

These are example usage files created for documentation but should not be in the production codebase.

| File | Component | Status | Reason to Delete |
|------|-----------|--------|------------------|
| `packages/app/src/components/SessionSidebar/README.md` | SessionSidebarItem docs | Untracked | Example usage guide - belongs in external docs, not source tree |
| `packages/app/src/components/SessionSidebar/SessionSidebar.example.tsx` | SessionSidebar examples | Untracked | Demo code - not used in production |
| `packages/app/src/components/SessionSidebar/SessionSidebarItem.example.tsx` | SessionSidebarItem examples | Untracked | Demo code - not used in production |
| `packages/app/src/components/SessionTile/SessionCliPanel.example.tsx` | SessionCliPanel examples | Untracked | Demo code - not used in production |

**Action:** Delete all 4 files. If documentation is needed, create proper docs in `docs/components/` directory.

---

## 3. Category: Backup Files

Old backup files from documentation rewrites.

| File | Original | Status | Reason to Delete |
|------|----------|--------|------------------|
| `docs/FRD.md.backup2` | FRD.md | Untracked | Backup file - no longer needed |
| `docs/SRD.md.backup` | SRD.md | Tracked | Backup file - no longer needed |

**Action:** Delete both backup files.

---

## 4. Category: Accidental/Orphan Files

| File | Status | Size | Reason to Delete |
|------|--------|------|------------------|
| `nul` (root) | Untracked | 0 bytes | Accidental empty file (likely from Windows command error) |

**Action:** Delete file.

---

## 5. Category: Dead Code in Live Files

### AppContent.tsx - Classic Layout Code (Lines 132-300)

**Location:** `packages/app/src/components/AppContent.tsx`

**Dead Code Sections:**

1. **Feature Flag Definition (Lines 20-22):**
   ```typescript
   const USE_NEW_LAYOUT = import.meta.env.VITE_NEW_LAYOUT === 'true'
     || localStorage.getItem('afw-new-layout') === 'true';
   ```
   **Status:** DEAD - Feature flag removed in Phase 5, new layout is now default

2. **Feature Flag Check (Lines 127-130):**
   ```typescript
   if (USE_NEW_LAYOUT) {
     return <WorkbenchLayout />;
   }
   ```
   **Status:** DEAD - Should always use WorkbenchLayout

3. **Classic Layout Code (Lines 132-300):**
   - Entire JSX return block with old layout
   - Header with manual nav tabs
   - UserSidebar, FileExplorer, SplitPaneLayout, SessionWindowSidebar/Grid
   - NotificationManager, CodeEditor, TerminalTabs
   - SquadPanel toggle button (now handled by Workbench)

**Action:**
1. Remove lines 20-22 (feature flag constant)
2. Remove lines 127-130 (conditional check)
3. Remove lines 132-300 (entire classic layout code)
4. Make `return <WorkbenchLayout />;` the only return statement

**Result:** AppContent.tsx becomes a simple wrapper that returns WorkbenchLayout directly.

---

## 6. Category: Dead Component Files (Classic Layout Only)

These components are ONLY referenced by the dead classic layout code in AppContent.tsx. They should be removed after AppContent.tsx is cleaned up.

### Components to Remove

| Component Directory | Files | Used By | Dead? |
|---------------------|-------|---------|-------|
| `packages/app/src/components/UserSidebar/` | UserSidebar.tsx, UserSidebar.css, index.ts | AppContent classic layout only | ✅ YES |
| `packages/app/src/components/SplitPaneLayout/` | SplitPaneLayout.tsx, SplitPaneLayout.css, index.ts | AppContent classic layout only | ✅ YES |
| `packages/app/src/components/SessionWindowSidebar/` | SessionWindowSidebar.tsx, SessionItem.tsx, UserGroup.tsx, SessionWindowSidebar.css | AppContent classic layout only | ✅ YES |
| `packages/app/src/components/SessionWindowGrid/` | SessionWindowGrid.tsx, SessionWindowTile.tsx, SessionWindowGrid.css | AppContent classic layout only | ✅ YES |
| `packages/app/src/components/NotificationManager.tsx` | NotificationManager.tsx | AppContent classic layout only | ✅ YES |
| `packages/app/src/components/Terminal/` | TerminalTabs.tsx, TerminalPanel.tsx, index.ts | AppContent classic layout only | ⚠️ PARTIAL |

**Terminal Components Note:** TerminalTabs and TerminalPanel are only used in classic layout, but the Terminal directory contains shared terminal infrastructure. Investigate further before removing.

### Components to KEEP (Shared Subcomponents)

These components appear to be classic layout related but are actively used by new Workbench components:

| Component | Used By (New Workbench) | Keep? |
|-----------|-------------------------|-------|
| `FileExplorer/FileIcon.tsx` | ExploreWorkbench | ✅ KEEP |
| `FileExplorer/FileTree.tsx` | ExploreWorkbench (types) | ✅ KEEP |
| `FileExplorer/FileExplorer.tsx` | AppContent classic only | ❌ REMOVE |
| `CodeEditor/EditorTabs.tsx` | EditorWorkbench | ✅ KEEP |
| `CodeEditor/ConflictDialog.tsx` | EditorWorkbench | ✅ KEEP |
| `CodeEditor/CodeEditor.tsx` | AppContent classic only | ❌ REMOVE |
| `SquadPanel/*` | HybridFlowViz (SessionTile) | ✅ KEEP ALL |

**Action:**
1. Remove UserSidebar, SplitPaneLayout, SessionWindowSidebar, SessionWindowGrid directories entirely
2. Remove NotificationManager.tsx
3. Remove FileExplorer.tsx and FileExplorer.css (keep FileIcon, FileTree)
4. Remove CodeEditor.tsx and CodeEditor.css (keep EditorTabs, ConflictDialog, DiffView)
5. Investigate Terminal/ directory before removing (check if TerminalPanel/TerminalTabs have any indirect dependencies)

---

## 7. Category: Missing Git Tracking (NOT Dead Code)

These files are UNTRACKED but are ACTIVELY USED by the new Workbench layout. They should be ADDED to git, not removed.

| File | Used By | Action |
|------|---------|--------|
| `packages/app/src/components/TopBar/TopBar.css` | TopBar.tsx (line 6 import) | **ADD to git** |
| `packages/app/src/components/TopBar/index.ts` | WorkbenchLayout.tsx (imports from TopBar) | **ADD to git** |

**Critical:** These must be committed, not deleted!

---

## 8. Stale References Analysis

### Import Analysis

After removing classic layout code from AppContent.tsx, these imports will become unused:

```typescript
// Dead imports in AppContent.tsx (lines 7-13)
import { UserSidebar } from './UserSidebar';
import { FileExplorer } from './FileExplorer';
import { SplitPaneLayout } from './SplitPaneLayout';
import { NotificationManager } from './NotificationManager';
import { CodeEditor } from './CodeEditor';
import { TerminalTabs } from './Terminal';
import { SessionWindowSidebar } from './SessionWindowSidebar/SessionWindowSidebar';
import { SessionWindowGrid } from './SessionWindowGrid/SessionWindowGrid';
import { SquadPanel } from './SquadPanel'; // Keep this - used by HybridFlowViz
```

**Action:** Remove all imports except SquadPanel when cleaning AppContent.tsx.

---

## 9. Summary by Category

| Category | Count | Status | Action |
|----------|-------|--------|--------|
| Temporary Implementation Docs | 5 files | Untracked | Delete |
| Example/Demo Files | 4 files | Untracked | Delete |
| Backup Files | 2 files | Mixed | Delete |
| Accidental Files | 1 file | Untracked | Delete |
| Dead Code in AppContent.tsx | 168 lines | Tracked | Remove code |
| Dead Classic Layout Components | 6 directories (13+ files) | Tracked | Remove after AppContent cleanup |
| Missing Git Tracking | 2 files | Untracked | **ADD to git** |

**Total Files to Delete:** 12 untracked + 6 component directories (tracked) = **21 items**

**Total Dead Code Lines:** 168 lines in AppContent.tsx

---

## 10. Cleanup Execution Plan

### Phase 1: Delete Untracked Artifacts (Safe)
```bash
# Temporary docs
rm IMPLEMENTATION_SUMMARY.md
rm WORKBENCH_LAYOUT_INTEGRATION.md
rm packages/backend/IMPLEMENTATION_SUMMARY.md
rm packages/app/src/components/Workbench/COMPONENT_HIERARCHY.txt
rm packages/app/src/components/Workbench/INTEGRATION_SUMMARY.md

# Example files
rm packages/app/src/components/SessionSidebar/README.md
rm packages/app/src/components/SessionSidebar/SessionSidebar.example.tsx
rm packages/app/src/components/SessionSidebar/SessionSidebarItem.example.tsx
rm packages/app/src/components/SessionTile/SessionCliPanel.example.tsx

# Backup files
rm docs/FRD.md.backup2
git rm docs/SRD.md.backup

# Accidental file
rm nul
```

### Phase 2: Add Missing Files to Git (Critical)
```bash
git add packages/app/src/components/TopBar/TopBar.css
git add packages/app/src/components/TopBar/index.ts
```

### Phase 3: Remove Classic Layout Code from AppContent.tsx
1. Remove feature flag constant (lines 20-22)
2. Remove conditional check (lines 127-130)
3. Remove classic layout JSX (lines 132-300)
4. Remove dead imports (UserSidebar, FileExplorer, SplitPaneLayout, NotificationManager, CodeEditor, TerminalTabs, SessionWindowSidebar, SessionWindowGrid)
5. Simplify to return WorkbenchLayout directly

**Result:** AppContent.tsx becomes:
```typescript
import { useEffect } from 'react';
import { WorkbenchLayout } from './Workbench';

export default function AppContent() {
  return <WorkbenchLayout />;
}
```

### Phase 4: Remove Dead Component Directories
```bash
# Remove classic layout components
git rm -r packages/app/src/components/UserSidebar/
git rm -r packages/app/src/components/SplitPaneLayout/
git rm -r packages/app/src/components/SessionWindowSidebar/
git rm -r packages/app/src/components/SessionWindowGrid/
git rm packages/app/src/components/NotificationManager.tsx

# Remove wrapper components (keep subcomponents)
git rm packages/app/src/components/FileExplorer/FileExplorer.tsx
git rm packages/app/src/components/FileExplorer/FileExplorer.css
# Update FileExplorer/index.ts to remove FileExplorer export

git rm packages/app/src/components/CodeEditor/CodeEditor.tsx
git rm packages/app/src/components/CodeEditor/CodeEditor.css
# Update CodeEditor/index.ts to remove CodeEditor export

# Investigate Terminal before removing
# Check if TerminalPanel or TerminalTabs have indirect deps in SessionCliPanel or elsewhere
```

### Phase 5: Update Index Files
1. `packages/app/src/components/FileExplorer/index.ts` - Remove FileExplorer export
2. `packages/app/src/components/CodeEditor/index.ts` - Remove CodeEditor export

### Phase 6: Run Type Check and Tests
```bash
pnpm type-check
pnpm test
pnpm dev:app  # Verify app still works
```

---

## 11. Recommendations

### Immediate Actions (P0)
1. **Add missing TopBar files to git** - Blocks deployment if these are missing
2. **Delete untracked temporary docs** - Clean workspace
3. **Remove AppContent.tsx classic layout code** - Complete Phase 5 migration

### Follow-up Actions (P1)
4. **Remove dead component directories** - Cleanup tracked dead code
5. **Update component index files** - Fix exports
6. **Investigate Terminal components** - Determine if fully replaceable

### Documentation (P2)
7. **Update component hierarchy docs** - Remove references to deleted components
8. **Create proper component documentation** - Move example usage to docs/components/ if needed

### Testing (P3)
9. **E2E test coverage** - Ensure all Workbench flows work without classic layout
10. **Performance audit** - Verify no zombie event listeners or memory leaks from removed components

---

## 12. Risk Analysis

### Low Risk (Safe to Remove)
- Untracked temporary docs
- Example files
- Backup files
- Accidental files (nul)

### Medium Risk (Requires Validation)
- Classic layout code in AppContent.tsx (need to verify USE_NEW_LAYOUT is truly unused)
- Dead component directories (need to verify no indirect imports)

### High Risk (Investigate First)
- Terminal components (SessionCliPanel may have dependencies)
- FileExplorer/CodeEditor subcomponents (verify all workbench imports are correct)

### Critical (DO NOT DELETE)
- TopBar.css and TopBar/index.ts (MUST be added to git, not deleted)
- SquadPanel (actively used by HybridFlowViz)
- FileIcon, FileTree, EditorTabs, ConflictDialog (used by Workbench)

---

## Learnings

**Issue:** Feature flag `USE_NEW_LAYOUT` and classic layout code were supposed to be removed in Phase 5 but were missed.

**Root Cause:** AppContent.tsx modifications happened incrementally during multi-phase UI redesign, and final cleanup step was not tracked as an explicit task.

**Suggestion:** When introducing feature flags for parallel development:
1. Document flag removal date/phase in code comments
2. Add TODO with phase marker: `// TODO(Phase 5): Remove USE_NEW_LAYOUT and classic layout`
3. Create explicit "Feature Flag Cleanup" task in phase planning

[FRESH EYE] Discovered that TopBar.css and TopBar/index.ts are untracked but actively used - critical git tracking issue that could cause deployment failures. These should be added immediately before any other cleanup work.
