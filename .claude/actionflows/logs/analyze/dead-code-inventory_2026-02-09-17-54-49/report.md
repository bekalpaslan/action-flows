# Dead Code & Stale Config Inventory

**Date:** 2026-02-09
**Agent:** analyze/
**Aspect:** inventory
**Scope:** all packages

---

## Executive Summary

This analysis identifies dead code, stale configuration, and orphaned references following the recent Context-Native Routing migration (departments → contexts) and workbench layout system introduction. The project has **14 categories of removable artifacts** spanning backup files, feature flag-gated dead code, deleted JS file references, and legacy type definitions.

### Risk Assessment

- **Critical (Remove Immediately):** 0 items
- **High (Remove in Next Cleanup):** 8 items (backup files, nul artifact, orphaned docs)
- **Medium (Coordinate with Feature Flag Removal):** 5 items (USE_NEW_LAYOUT gated code)
- **Low (Deprecation Path):** 7 items (department legacy compatibility layer)

### Total Removable Artifacts

- **7 files** (backups, orphaned docs, nul)
- **~300 lines of dead code** in AppContent.tsx (Session Window Mode + old layout)
- **15+ type/function exports** in shared package (department compatibility)
- **100+ references** in log/doc files (non-code, informational only)

---

## 1. Backup Files (HIGH PRIORITY)

### 1.1 Documentation Backups

| File | Size | Last Modified | Safe to Delete |
|------|------|---------------|----------------|
| `docs/FRD.md.backup2` | 53,260 bytes | 2026-02-08 17:59 | ✅ YES |
| `docs/SRD.md.backup` | 87,177 bytes | 2026-02-08 17:54 | ✅ YES |

**Current versions exist:**
- `docs/FRD.md` (55,058 bytes, 2026-02-08 23:25)
- `docs/SRD.md` (34,361 bytes, 2026-02-08 23:26)

**Recommendation:** Delete both backup files. Git history preserves older versions.

---

## 2. Windows Artifact (HIGH PRIORITY)

### 2.1 Null File Artifact

| File | Size | Last Modified | Safe to Delete |
|------|------|---------------|----------------|
| `nul` (project root) | 0 bytes | 2026-02-09 02:36 | ✅ YES |

**Root Cause:** Windows command redirection artifact from PowerShell/cmd session.

**Recommendation:** Delete immediately. Add to `.gitignore` if it recurs.

---

## 3. Orphaned Implementation Docs (HIGH PRIORITY)

### 3.1 Root-Level Implementation Summaries

| File | Purpose | Current Status | Safe to Delete |
|------|---------|----------------|----------------|
| `IMPLEMENTATION_SUMMARY.md` | Orchestrator contract Phase 1 summary | Completed Feb 8 | ⚠️ ARCHIVE |
| `WORKBENCH_LAYOUT_INTEGRATION.md` | Feature flag testing guide | Completed Feb 9 | ⚠️ ARCHIVE |
| `packages/backend/IMPLEMENTATION_SUMMARY.md` | Backend skeleton summary | Completed (old) | ⚠️ ARCHIVE |

**Recommendation:** Move to `.claude/actionflows/docs/completed/` or delete. These are one-time implementation reports, not living documentation.

---

## 4. Deleted SquadPanel JS Files (SAFE - Already Deleted)

### 4.1 Git Status Check

Git status shows 3 deleted files staged for commit:
```
D packages/app/src/components/SquadPanel/AgentLogPanel.js
D packages/app/src/components/SquadPanel/LogBubble.js
D packages/app/src/components/SquadPanel/types.js
```

### 4.2 Replacement Verification

All three files were **replaced with TypeScript versions** (commit `2fe0ee3`):

| Deleted (JS) | Replacement (TS/TSX) | Status |
|--------------|---------------------|--------|
| AgentLogPanel.js | AgentLogPanel.tsx | ✅ Exists |
| LogBubble.js | LogBubble.tsx | ✅ Exists |
| types.js | types.ts | ✅ Exists |

### 4.3 Reference Analysis

**Export Index:** All three exports updated to `.tsx`/`.ts` in `SquadPanel/index.ts`:
```typescript
export { AgentLogPanel } from './AgentLogPanel';  // ← .tsx implicit
export { LogBubble } from './LogBubble';          // ← .tsx implicit
export type { ... } from './types';               // ← .ts implicit
```

**Import Analysis (22 files reference these names):**
- All imports use module name without extension (✅ safe)
- No hardcoded `.js` extensions found
- All references point to TS/TSX versions

**Recommendation:** ✅ Safe to commit deletion. No remaining references to `.js` versions.

---

## 5. USE_NEW_LAYOUT Feature Flag (MEDIUM PRIORITY)

### 5.1 Feature Flag Definition

**Location:** `packages/app/src/components/AppContent.tsx:21-22`

```typescript
const USE_NEW_LAYOUT = import.meta.env.VITE_NEW_LAYOUT === 'true'
  || localStorage.getItem('afw-new-layout') === 'true';
```

**Purpose:** Gates new WorkbenchLayout vs old AppContent layout.

### 5.2 Dead Code Scope (if flag = true)

When `USE_NEW_LAYOUT === true`, the following code in `AppContent.tsx` becomes unreachable:

| Section | Lines | LOC | Description |
|---------|-------|-----|-------------|
| State declarations | 37-46 | 10 | useSessionWindowMode, activeTab, etc. |
| Event handlers | 61-98 | 38 | handleFileOpen, handleStartClaudeSession, etc. |
| Effects | 101-125 | 25 | Status mapping, getStatusClass |
| JSX return block | 133-300 | 168 | Entire old layout UI |

**Total Dead Code:** ~241 lines (73% of file)

### 5.3 Feature Flag Usage Analysis

| Location | Purpose | Active? |
|----------|---------|---------|
| `AppContent.tsx:128` | Route to WorkbenchLayout | ✅ YES (line 129) |
| `.env` / `.env.local` | Optional env var | ❌ Not set |
| localStorage | Runtime toggle | ❌ Not set (default false) |

**Current State:** Feature flag **defaults to FALSE** (old layout active).

### 5.4 Old Layout Dependencies (Will Become Dead)

Components imported but unused when `USE_NEW_LAYOUT === true`:

```typescript
import { UserSidebar } from './UserSidebar';
import { FileExplorer } from './FileExplorer';
import { SplitPaneLayout } from './SplitPaneLayout';
import { NotificationManager } from './NotificationManager';
import { CodeEditor } from './CodeEditor';
import { TerminalTabs } from './Terminal';
import { SessionWindowSidebar } from './SessionWindowSidebar/SessionWindowSidebar';
import { SessionWindowGrid } from './SessionWindowGrid/SessionWindowGrid';
import { SquadPanel } from './SquadPanel';
```

**9 component imports** only used in old layout branch.

### 5.5 Recommendation

**Option A (Conservative):** Wait for formal deprecation plan
- Keep feature flag for parallel development
- Remove after WorkbenchLayout stability confirmed
- Timeline: 1-2 weeks

**Option B (Aggressive):** Remove immediately if WorkbenchLayout is production-ready
- Delete lines 37-300 in AppContent.tsx
- Update AppContent to always render WorkbenchLayout
- Remove feature flag constant
- Clean up 9 unused imports (if not used in WorkbenchLayout)

**Suggested:** Option A until product decision confirms old layout is deprecated.

---

## 6. Session Window Mode (MEDIUM PRIORITY)

### 6.1 Feature Toggle

**Location:** `AppContent.tsx:43` (inside old layout code block)

```typescript
const [useSessionWindowMode, setUseSessionWindowMode] = useState<boolean>(false);
```

**UI Control:** Lines 172-185 (toggle button "Classic Mode" / "Session Window Mode")

### 6.2 Dead Code Analysis

This entire subsystem is **nested inside the old layout block** (lines 133-300), making it dead if `USE_NEW_LAYOUT === true`.

**Components Used Only in Session Window Mode:**
- `SessionWindowSidebar` (lines 214-219)
- `SessionWindowGrid` (lines 220-224)

**Hook Used Only Here:**
- `useSessionWindows` (line 32)

### 6.3 Cross-Reference Check

**useSessionWindows Hook:** Only imported in `AppContent.tsx:32`
- Not used in WorkbenchLayout
- Not exported from `hooks/index.ts`
- **Dead hook if old layout removed**

**SessionWindow Components:**
- `SessionWindowSidebar.tsx` — 23 references (mostly in logs/docs)
- `SessionWindowGrid.tsx` — 23 references (mostly in logs/docs)
- Only **1 real usage** each: `AppContent.tsx`

### 6.4 Recommendation

**If WorkbenchLayout replaces old layout:**
- Delete `useSessionWindows.ts` hook
- Delete `SessionWindowSidebar/` component directory
- Delete `SessionWindowGrid/` component directory
- Update `docs/` if Session Window Mode was documented

**Alternative:** Integrate Session Window Mode into WorkbenchLayout if feature is desired.

---

## 7. Department → Context Migration (LOW PRIORITY)

### 7.1 Framework Files

✅ **Already migrated** (completed 2026-02-09):
- `.claude/actionflows/CONTEXTS.md` — New context routing (6 routable contexts)
- `.claude/actionflows/ORCHESTRATOR.md` — References contexts, not departments

❌ **No ORGANIZATION.md file exists** (confirmed absence).

### 7.2 Shared Package Legacy Compatibility

**Location:** `packages/shared/src/contract/`

#### Type Aliases (Deprecated)

```typescript
// types/statusFormats.ts:74
export type DepartmentRoutingParsed = ContextRoutingParsed;
```

#### Pattern Aliases (Deprecated)

```typescript
// patterns/statusPatterns.ts:34
export const DepartmentRoutingPatterns = ContextRoutingPatterns;

// patterns/statusPatterns.ts:39
departmentRouting: DepartmentRoutingPatterns, // @deprecated
```

#### Parser Aliases (Deprecated)

```typescript
// parsers/statusParser.ts:130
export function parseDepartmentRouting(text: string): DepartmentRoutingParsed | null {
  // Implementation delegates to parseContextRouting
}
```

#### Guard Aliases (Deprecated)

```typescript
// guards.ts:238
export function isDepartmentRoutingParsed(obj: unknown): obj is DepartmentRoutingParsed {
  // Implementation delegates to isContextRoutingParsed
}
```

#### Index Re-exports (Deprecated)

```typescript
// contract/index.ts:59
DepartmentRoutingParsed, // @deprecated

// contract/index.ts:109
parseDepartmentRouting, // @deprecated

// contract/index.ts:148
isDepartmentRoutingParsed, // @deprecated
```

### 7.3 Usage Analysis

**Internal Usage:** ❌ None (all orchestrator code uses context variants)

**External Usage Check:**
- Backend: ❌ Not imported
- Frontend: ❌ Not imported
- MCP Server: ❌ Not imported
- Tests: ❌ Not used

**Status:** These are **compatibility shims with zero usage**.

### 7.4 Models.ts Department Field

**Location:** `packages/shared/src/models.ts:298-299`

```typescript
export interface FlowDefinition {
  // ...
  /** Department this flow belongs to */
  department: string;
  // ...
}
```

**Usage Check:**
- ❌ No flows are loaded from disk (no flow persistence yet)
- ❌ Dashboard does not parse FlowDefinition from API
- ❌ FlowDefinition is design-time only (not runtime)

**Status:** Unused field in unused interface.

### 7.5 Session Start Protocol Parser

**Location:** `packages/shared/src/contract/parsers/humanParser.ts:102-116`

```typescript
const departmentsMatch = text.match(HumanPatterns.sessionStartProtocol.departments);
// Parse departments list
const departments = departmentsMatch?.[2]
  ? departmentsMatch[2].split(',').map(d => d.trim())
  : null;

return {
  // ...
  departmentCount: departmentsMatch ? parseInt(departmentsMatch[1], 10) : null,
  departments,
};
```

**Pattern:** `HumanPatterns.sessionStartProtocol.departments`
```typescript
// patterns/humanPatterns.ts:34
departments: /^- Departments: (\d+) \((.+)\)$/m,
```

**Type:** `SessionStartProtocolParsed`
```typescript
// types/humanFormats.ts:68-72
/** Number of departments */
departmentCount: number | null;

/** List of department names */
departments: string[] | null;
```

**Status:** Orchestrator **never outputs this format** (uses contexts now). Parser is dead code.

### 7.6 Log/Doc References

**100+ references** found in `.claude/actionflows/logs/` and `docs/` mentioning "department".

**Categories:**
1. **Historical logs** — Past execution outputs (immutable archives)
2. **Backup docs** — `FRD.md.backup2`, `SRD.md.backup` (deletion candidates)
3. **Design docs** — Explaining the migration from departments to contexts
4. **Bootstrap.md** — Old onboarding guide (superseded by ORCHESTRATOR.md)

**Recommendation:** Do NOT edit logs (historical record). Update living docs only.

### 7.7 Recommendation (Deprecation Path)

**Phase 1 (Now):** Mark as deprecated
- ✅ Already done (comments in code)

**Phase 2 (After 1 month grace period):** Remove compatibility layer
- Delete `DepartmentRoutingParsed` type alias
- Delete `parseDepartmentRouting` function
- Delete `isDepartmentRoutingParsed` guard
- Delete `DepartmentRoutingPatterns` alias
- Remove from contract/index.ts exports

**Phase 3 (Coordinate with contract v2.0):** Clean up unused fields
- Remove `department` field from `FlowDefinition`
- Remove `departments`/`departmentCount` from `SessionStartProtocolParsed`
- Remove department pattern from `HumanPatterns`

**Justification:** Compatibility layer has **zero external consumers**. Can be removed safely after grace period.

---

## 8. Workbench Description String

### 8.1 Single Reference

**Location:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx:115`

```typescript
description: 'ActionFlows department and routing documentation',
```

**Context:** Hardcoded description for Settings workbench tile.

**Status:** Outdated string (should say "context and routing").

### 8.2 Recommendation

Change to:
```typescript
description: 'ActionFlows context and routing documentation',
```

**Priority:** Low (cosmetic fix).

---

## 9. Bootstrap.md Legacy References

### 9.1 File Analysis

**Location:** `.claude/bootstrap.md` (3,000+ lines)

**Purpose:** Original ActionFlows onboarding guide for new projects.

**Status:** Superseded by:
- `.claude/actionflows/ORCHESTRATOR.md` (active orchestrator instructions)
- `.claude/actionflows/README.md` (project-specific guide)

### 9.2 Department References

**Count:** 20+ references to "department" including:
- "Which departments to define"
- "department routing rules"
- "ORGANIZATION.md departments match flow directory structure"

### 9.3 Recommendation

**Option A:** Archive to `.claude/archive/bootstrap.md`
- File is no longer the source of truth
- Keep for historical reference
- Remove from active directory

**Option B:** Update to Context-Native Routing
- Replace all "department" → "context"
- Update references to ORGANIZATION.md → CONTEXTS.md
- Update flow examples to match current patterns

**Suggested:** Option A (archive). This file is for bootstrapping NEW projects, not maintaining THIS project.

---

## 10. No Dead Exports in shared/index.ts

### 10.1 Export Analysis

All exports in `packages/shared/src/index.ts` are either:
1. **Used in frontend** (App, contexts, components)
2. **Used in backend** (storage, ws handlers, routes)
3. **Documented in CONTRACT.md** (orchestrator contract types)
4. **Legacy compatibility** (department aliases, covered in Section 7)

**No orphaned exports detected.**

---

## 11. No Dead Hook Exports

### 11.1 Hook Index Analysis

**File:** `packages/app/src/hooks/index.ts`

All exported hooks are:
1. **Used in AppContent.tsx** (before workbench migration)
2. **Used in Workbench/** components
3. **Used in other component directories**

**Exception:** `useSessionWindows` (covered in Section 6) — only used in old layout.

---

## 12. No Dead SquadPanel Exports

### 12.1 Export Verification

**File:** `packages/app/src/components/SquadPanel/index.ts`

All exports (types, constants, components, hooks) are:
1. **Used in AppContent.tsx** (SquadPanel component)
2. **Used in WorkbenchLayout** (not yet, but structure supports it)
3. **Internal SquadPanel module dependencies**

**Status:** All exports are active. SquadPanel is fully wired.

---

## 13. Relative Import Audit (Clean)

### 13.1 Methodology

Searched for overly-nested relative imports (`../../..`) that indicate poor module organization.

### 13.2 Findings

**Sample Results:**
```
packages/app/src/components/ChainBadge/ChainBadge.tsx
packages/app/src/components/CodeEditor/CodeEditor.tsx
packages/app/src/components/CommandPalette/CommandPalette.tsx
...
```

All relative imports are **valid and intentional**:
- Components importing from `../contexts/` (1-2 levels up)
- Components importing from `../hooks/` (1-2 levels up)
- Shared package imports via `@afw/shared` (not relative)

**Status:** No anti-patterns detected.

---

## 14. Git Status Summary

### 14.1 Staged Deletions (Pending Commit)

```
D packages/app/src/components/SquadPanel/AgentLogPanel.js
D packages/app/src/components/SquadPanel/LogBubble.js
D packages/app/src/components/SquadPanel/types.js
```

**Status:** ✅ Safe to commit (covered in Section 4).

### 14.2 Staged Modifications

```
M .claude/actionflows/CONTRACT.md
M .claude/actionflows/ORCHESTRATOR.md
M .claude/actionflows/actions/_abstract/agent-standards/instructions.md
M .claude/actionflows/actions/analyze/agent.md
M .claude/actionflows/actions/brainstorm/agent.md
M .claude/actionflows/actions/review/agent.md
M packages/app/src/App.tsx
M packages/app/src/components/AppContent.tsx
M packages/app/src/hooks/index.ts
M packages/shared/src/index.ts
```

**Status:** Context-Native Routing migration and workbench integration in progress.

---

## Recommendations Summary

### Immediate Removals (High Priority)

1. ✅ Delete `docs/FRD.md.backup2`
2. ✅ Delete `docs/SRD.md.backup`
3. ✅ Delete `nul` (project root)
4. ✅ Commit SquadPanel JS file deletions

### Archive Candidates (High Priority)

5. ⚠️ Move `IMPLEMENTATION_SUMMARY.md` → `.claude/actionflows/docs/completed/`
6. ⚠️ Move `WORKBENCH_LAYOUT_INTEGRATION.md` → `.claude/actionflows/docs/completed/`
7. ⚠️ Delete `packages/backend/IMPLEMENTATION_SUMMARY.md` (old backend summary)

### Feature Flag Decision (Medium Priority)

8. **If WorkbenchLayout is stable:**
   - Remove `USE_NEW_LAYOUT` feature flag
   - Delete old layout code (lines 37-300 in AppContent.tsx)
   - Remove 9 unused component imports
   - Delete `useSessionWindows` hook
   - Delete `SessionWindowSidebar/` and `SessionWindowGrid/` components

### Deprecation Cleanup (Low Priority - After Grace Period)

9. **After 1 month:**
   - Remove department compatibility layer from `shared/src/contract/`
   - Remove 7 deprecated exports (types, parsers, guards, patterns)

10. **Cosmetic Fixes:**
    - Update WorkbenchLayout description: "department" → "context"

11. **Archive Legacy Docs:**
    - Move `.claude/bootstrap.md` → `.claude/archive/bootstrap.md`

---

## Metrics

### Files Analyzed

- **Total TypeScript files:** 187 (app package)
- **Total packages:** 5 (backend, app, shared, mcp-server, hooks)
- **Git status items:** 18 (10 modified, 3 deleted, 5 untracked)

### Dead Code Scope

| Category | Count | LOC | Risk |
|----------|-------|-----|------|
| Backup files | 2 | N/A | None |
| Orphaned docs | 3 | N/A | None |
| Windows artifact | 1 | N/A | None |
| Old layout (gated) | 1 file | ~241 lines | Medium |
| Session Window Mode | 3 files | ~400 lines | Medium |
| Department compat layer | 7 exports | ~50 lines | Low |
| Unused fields | 2 fields | ~5 lines | Low |

### Removal Impact

- **Safe to delete now:** 7 files (backups + docs + nul)
- **Requires product decision:** Feature flag removal
- **Requires deprecation period:** Contract v2.0 cleanup

---

## Learnings

**Issue:** Feature flags create dead code branches that are hard to track.

**Root Cause:** `USE_NEW_LAYOUT` defaults to `false`, making new layout code hidden and old layout code dominant. No automated dead code detection for gated branches.

**Suggestion:** Establish feature flag lifecycle policy:
1. Ship with flag = false (parallel development)
2. Test with flag = true (staging environment)
3. Flip default to true after 1 week stability
4. Remove flag + dead branch after 2 weeks at 100% adoption

**[FRESH EYE]** Bootstrap.md is 3,000 lines and references the old "department" system extensively. This file is for onboarding NEW ActionFlows projects, not maintaining THIS project. It should be archived or moved to a separate "project-templates" repo to avoid confusion.

---

## Appendix A: File Locations

### Backup Files
- `D:/ActionFlowsDashboard/docs/FRD.md.backup2`
- `D:/ActionFlowsDashboard/docs/SRD.md.backup`

### Orphaned Docs
- `D:/ActionFlowsDashboard/IMPLEMENTATION_SUMMARY.md`
- `D:/ActionFlowsDashboard/WORKBENCH_LAYOUT_INTEGRATION.md`
- `D:/ActionFlowsDashboard/packages/backend/IMPLEMENTATION_SUMMARY.md`

### Windows Artifact
- `D:/ActionFlowsDashboard/nul`

### Feature-Flagged Code
- `D:/ActionFlowsDashboard/packages/app/src/components/AppContent.tsx` (lines 37-300)

### Session Window Mode Components
- `D:/ActionFlowsDashboard/packages/app/src/hooks/useSessionWindows.ts`
- `D:/ActionFlowsDashboard/packages/app/src/components/SessionWindowSidebar/`
- `D:/ActionFlowsDashboard/packages/app/src/components/SessionWindowGrid/`

### Department Compatibility Layer
- `D:/ActionFlowsDashboard/packages/shared/src/contract/types/statusFormats.ts` (line 74)
- `D:/ActionFlowsDashboard/packages/shared/src/contract/patterns/statusPatterns.ts` (lines 34, 39)
- `D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/statusParser.ts` (line 130)
- `D:/ActionFlowsDashboard/packages/shared/src/contract/guards.ts` (line 238)
- `D:/ActionFlowsDashboard/packages/shared/src/contract/index.ts` (lines 59, 109, 148)
- `D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/humanParser.ts` (lines 102-116)
- `D:/ActionFlowsDashboard/packages/shared/src/models.ts` (lines 298-299)

### Legacy Onboarding
- `D:/ActionFlowsDashboard/.claude/bootstrap.md`

---

## Appendix B: Command Reference

### Safe Deletions (Execute Now)

```bash
cd D:/ActionFlowsDashboard

# Delete backup files
rm docs/FRD.md.backup2
rm docs/SRD.md.backup

# Delete Windows artifact
rm nul

# Archive implementation summaries
mkdir -p .claude/actionflows/docs/completed
mv IMPLEMENTATION_SUMMARY.md .claude/actionflows/docs/completed/
mv WORKBENCH_LAYOUT_INTEGRATION.md .claude/actionflows/docs/completed/
rm packages/backend/IMPLEMENTATION_SUMMARY.md

# Commit SquadPanel JS deletions
git add packages/app/src/components/SquadPanel/
git commit -m "refactor: Remove JS versions of SquadPanel components

Replaced with TypeScript versions in commit 2fe0ee3.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### Feature Flag Removal (Execute After Product Decision)

```bash
# This is a MANUAL edit task - requires code review
# 1. Open packages/app/src/components/AppContent.tsx
# 2. Delete lines 21-22 (USE_NEW_LAYOUT constant)
# 3. Delete lines 37-125 (old layout state + handlers)
# 4. Replace lines 128-300 with: return <WorkbenchLayout />;
# 5. Remove unused imports (9 components)
# 6. Delete useSessionWindows hook and components:
rm packages/app/src/hooks/useSessionWindows.ts
rm -rf packages/app/src/components/SessionWindowSidebar
rm -rf packages/app/src/components/SessionWindowGrid
```

---

**End of Report**
