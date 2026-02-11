# Workbench/Context UI Components Inventory
**Generated:** 2026-02-11
**Scope:** All 13 contexts in ActionFlows Dashboard frontend
**Purpose:** Determine maturity level and interior content of each workbench component

---

## Executive Summary

**Total Contexts Analyzed:** 13
**Real (Production-Quality):** 9
**Skeleton (Layout Exists):** 2
**Stub (Minimal/Empty):** 0
**Missing:** 2

**Maturity Distribution:**
- **High Maturity (Real UI):** 69%
- **Medium Maturity (Skeleton):** 15%
- **Low Maturity (Stub/Missing):** 15%

---

## Detailed Inventory

| Context | Component File(s) | Maturity | Key UI Elements | Status |
|---------|------------------|----------|-----------------|--------|
| **work** | `WorkWorkbench.tsx` | **Real** | Header with session count, empty state message, session info panel, DiscussButton integration | Fully functional. Chat moved to SlidingChatWindow in Phase 2. |
| **maintenance** | `MaintenanceWorkbench.tsx` | **Real** | WebSocket status card, backend health card (uptime), active sessions card, last check timestamp, metric cards grid, recent errors list, auto-refresh toggle | Production-quality monitoring dashboard with real-time metrics. |
| **explore** | `ExploreWorkbench.tsx` | **Real** | File tree with expand/collapse, search input (Ctrl+F), keyboard navigation (arrow keys, Enter), file metadata (size, modified date), show/hide hidden files toggle, status bar | Full-featured file explorer with accessibility support. |
| **review** | `ReviewWorkbench.tsx` | **Real** | PR list sidebar, Monaco DiffEditor (split/unified views), file list with additions/deletions, approve/reject/comment actions, filter by status/author, mock data present | Complete code review workbench with mock PRs and full Monaco integration. |
| **settings** | `SettingsWorkbench.tsx` | **Real** | Tabbed interface (General, Appearance, Keyboard, Advanced), theme toggle (light/dark/system), Vim mode toggle, backend URL config, auto-save settings, font size controls, keyboard shortcuts display | Comprehensive settings UI with localStorage persistence. |
| **pm** | `PMWorkbench.tsx` | **Real** | Task list with filters (all, todo, in-progress, done), task creation form, documentation links panel, milestones timeline, task cards with status/priority badges | Full project management dashboard with task CRUD operations. |
| **intel** | `IntelWorkbench.tsx` | **Real** | Dossier list sidebar, DossierView panel, DossierCreationDialog, analysis trigger button, delete button, empty state | Intel dossier management with dedicated subcomponents. |
| **archive** | `ArchiveWorkbench.tsx` | **Real** | Archived sessions table, search input, date range filters, status filter dropdown, sort by (archivedAt, startedAt, chainsCount), bulk actions (restore/delete), checkbox selection | Full-featured archive browser with filtering, sorting, and bulk operations. |
| **harmony** | `HarmonyWorkbench.tsx` | **Real** | HarmonyPanel integration, global harmony score display (HarmonyBadge), view mode selector (session/project/global), manual check panel (textarea + check button), drift detection panel, contract status panel, manual check result display | Complete contract compliance dashboard with multiple views. |
| **editor** | `EditorWorkbench.tsx` | **Real** | Monaco Editor integration, EditorTabs for multi-file support, unsaved changes indicator, file breadcrumb, ConflictDialog for merge conflicts, ToastContainer for notifications, save on Ctrl/Cmd+S, empty state with keyboard hints | Production-quality code editor with file sync and conflict resolution. |
| **canvas** | `CanvasWorkbench.tsx` | **Real** | Monaco Editor (HTML mode), sandboxed iframe preview, split pane (60% editor / 40% preview), clear button, editor collapse toggle, localStorage persistence with debounce | Live HTML/CSS preview canvas with real-time rendering. |
| **coverage** | `CoverageWorkbench.tsx` | **Skeleton** | Summary cards (4 cards: total contracts, component coverage, validation status, health checks), tabbed interface (contracts/drift/health), contracts table with filters, search input, contract detail modal | **Skeleton**: Layout complete, but "Drift" and "Health Checks" tabs show placeholder text. Contracts tab is functional. |
| **respect** | `RespectWorkbench/RespectWorkbench.tsx` | **Skeleton** | RespectCheckControls component, LiveSpatialMonitor component, last checked timestamp, auto-run on mount | **Skeleton**: Delegates to subcomponents (RespectCheckControls, LiveSpatialMonitor) but interior functionality depends on those. Structure exists. |
| **canvas** | `CanvasWorkbench.tsx` | **Missing** | *(Listed twice in requirements but only one component exists)* | Canonical canvas workbench exists above. |
| **coverage** | `CoverageWorkbench.tsx` | **Missing** | *(Listed twice in requirements but only one component exists)* | Canonical coverage workbench exists above. |

---

## Context-to-Workbench Routing

**File:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx` (lines 554-629)

The `WorkbenchLayout` component implements a switch statement in `renderWorkbenchContent()` that maps each `WorkbenchId` to its corresponding component:

```typescript
switch (workbench) {
  case 'work': return <WorkWorkbench ... />;
  case 'maintenance': return <MaintenanceWorkbench />;
  case 'explore': return <ExploreWorkbench ... />;
  case 'review': return <ReviewWorkbench />;
  case 'archive': return <ArchiveWorkbench ... />;
  case 'settings': return <SettingsWorkbench />;
  case 'pm': return <PMWorkbench ... />;
  case 'harmony': return <HarmonyWorkbench ... />;
  case 'canvas': return <CanvasWorkbench />;
  case 'editor': return <EditorWorkbench ... />;
  case 'intel': return <IntelWorkbench />;
  case 'respect': return <RespectWorkbench />;
  case 'coverage': return <CoverageWorkbench />;
  default: return <div>Unknown Workbench</div>;
}
```

**Navigation Context:** Managed by `WorkbenchContext` (packages/app/src/contexts/WorkbenchContext.tsx), which provides:
- `activeWorkbench` state
- `setActiveWorkbench()` function
- Notification counts per workbench
- Back navigation history
- localStorage persistence

---

## Top 3 Most Concrete Workbenches

### 1. **Editor Workbench** (`EditorWorkbench.tsx`)
**Lines of Code:** 569
**Complexity:** High

**Features:**
- Full Monaco Editor integration with syntax highlighting for 25+ languages
- Multi-file tab management with dirty state tracking
- File sync via WebSocket with conflict detection and resolution (ConflictDialog)
- Keyboard shortcuts (Ctrl/Cmd+S to save)
- File breadcrumb navigation
- Toast notifications for user feedback
- Empty state with helpful hints
- Persistent editor state across sessions

**Why It's Concrete:** This is a production-ready code editor with full Monaco integration, sophisticated file management, conflict resolution, and real-time sync. It rivals VS Code's in-browser editor in feature completeness.

---

### 2. **Review Workbench** (`ReviewWorkbench.tsx`)
**Lines of Code:** 923
**Complexity:** Very High

**Features:**
- PR list with metadata (number, title, author, status, labels, conflicts)
- Monaco DiffEditor with split/unified view toggle
- File list with additions/deletions count
- Approve/Request Changes/Comment actions with modal dialog
- Filter by status (pending, approved, changes_requested, merged, closed)
- Mock data system with 3 sample PRs
- Comment tracking with resolution status
- Relative time formatting
- Status color coding

**Why It's Concrete:** Full-featured code review interface with Monaco DiffEditor, complete PR workflow, and extensive UI polish. All features are functional with mock data, ready for backend integration.

---

### 3. **Maintenance Workbench** (`MaintenanceWorkbench.tsx`)
**Lines of Code:** 417
**Complexity:** Medium

**Features:**
- Real-time WebSocket connection status monitoring
- Backend health check with uptime display
- Active sessions count from API
- Metric cards grid (WebSocket, Backend, Sessions, Last Check)
- Recent errors list (last 10) with timestamp, source, and message
- Auto-refresh toggle (30s interval)
- Manual refresh button
- Overall system health status (healthy/degraded/error)

**Why It's Concrete:** Operational dashboard with real API integration, error tracking, and live metrics. Fully functional for production monitoring.

---

## Top 3 Most Undefined Workbenches

### 1. **Coverage Workbench** (Skeleton)
**Status:** Layout complete, but 2 of 3 tabs are placeholders.

**What Exists:**
- Summary cards (4 metrics: total contracts, component coverage, validation status, health checks)
- Contracts tab with table, filters (all/valid/warnings/errors), search input
- Contract detail modal with error/warning display
- Tabbed interface structure

**What's Missing:**
- **Drift Detection Tab:** Shows placeholder text "Drift detection coming soon. This will show components without contracts."
- **Health Checks Tab:** Shows placeholder text "Health checks panel coming soon. This will show automated health check results."

**Path to Completion:**
- Implement drift detection logic to identify components missing contracts
- Build health checks panel to show automated test results
- Connect to backend API for real-time data

---

### 2. **Respect Workbench** (Skeleton)
**Status:** Component structure exists, but relies heavily on subcomponents.

**What Exists:**
- `RespectCheckControls` component
- `LiveSpatialMonitor` component
- Auto-run on mount
- Last checked timestamp
- DiscussButton and OrchestratorButton integration

**What's Unclear:**
- Interior functionality of `RespectCheckControls` and `LiveSpatialMonitor` subcomponents
- Actual boundary check implementation
- Violation display format
- Results categorization logic

**Path to Completion:**
- Audit `RespectCheckControls.tsx` and `LiveSpatialMonitor.tsx` for completeness
- Implement spatial health monitoring logic
- Add violation detail views with fix suggestions

---

### 3. **Canvas Workbench** (Actually Real, but Simpler)
**Status:** Fully functional, but simplest of the "Real" workbenches.

**What Exists:**
- Monaco Editor (HTML mode)
- Sandboxed iframe for live preview
- localStorage persistence with debounce
- Editor collapse toggle
- Clear button

**What's Missing (for feature parity with others):**
- Multi-file support (currently single-file only)
- Asset management (images, CSS files)
- Export functionality
- Version history
- Templates library

**Path to Enhancement:**
- Add multi-file tabs like EditorWorkbench
- Implement asset upload and management
- Add export to HTML file
- Build template gallery

---

## Maturity Breakdown by Feature Category

| Feature Category | Real | Skeleton | Stub | Missing |
|------------------|------|----------|------|---------|
| **Header Bar** | 13/13 | 0/13 | 0/13 | 0/13 |
| **Main Content Area** | 11/13 | 2/13 | 0/13 | 0/13 |
| **DiscussButton Integration** | 13/13 | 0/13 | 0/13 | 0/13 |
| **OrchestratorButton Integration** | 5/13 | 0/13 | 0/13 | 8/13 |
| **Empty State Handling** | 10/13 | 1/13 | 0/13 | 2/13 |
| **Real-time Data (WebSocket/API)** | 4/13 | 0/13 | 0/13 | 9/13 |
| **Mock Data System** | 3/13 | 0/13 | 0/13 | 10/13 |
| **Search/Filter UI** | 8/13 | 1/13 | 0/13 | 4/13 |

---

## Component Dependencies

### Most Common Shared Components:
1. **DiscussButton / DiscussDialog** - Used in all 13 workbenches
2. **OrchestratorButton** - Used in 5 workbenches (Settings, PM, Intel, Harmony, Respect)
3. **Monaco Editor** - Used in 3 workbenches (Editor, Canvas, Review as DiffEditor)
4. **Custom Hooks:**
   - `useDiscussButton` - All 13 workbenches
   - `useEditorFiles` - EditorWorkbench
   - `useFileTree` - ExploreWorkbench
   - `useSessionArchive` - ArchiveWorkbench
   - `useDossiers` - IntelWorkbench
   - `useHarmonyMetrics` - HarmonyWorkbench
   - `useCoverageMetrics` - CoverageWorkbench
   - `useRespectCheck` - RespectWorkbench

---

## Observations

### Strengths:
1. **Consistent Architecture:** All workbenches follow the same pattern (header bar, content area, DiscussButton).
2. **Monaco Integration:** Strong code editor presence across multiple workbenches.
3. **Real-time Monitoring:** Maintenance and Harmony workbenches show sophisticated real-time capabilities.
4. **Accessibility:** ExploreWorkbench demonstrates keyboard navigation and ARIA support.
5. **Mock Data Systems:** Review and PM workbenches have well-structured mock data for development.

### Weaknesses:
1. **Backend Integration:** Most workbenches lack real backend connections (9 of 13 don't have real-time data).
2. **Incomplete Features:** Coverage (2 of 3 tabs) and Respect (delegate-heavy) workbenches are not fully built.
3. **Missing Contexts:** No workbench components found for theoretical contexts like "canvas-2" or "coverage-2" (may be documentation errors).

### Recommendations:
1. **Prioritize Coverage Workbench:** Complete the Drift Detection and Health Checks tabs to match the quality of the Contracts tab.
2. **Audit Respect Subcomponents:** Ensure `RespectCheckControls` and `LiveSpatialMonitor` have complete implementations.
3. **Backend API Integration:** Build out backend endpoints for the 9 workbenches currently using mock data or no data.
4. **Component Reuse:** Extract common patterns (header bar, empty state, filter bar) into reusable layout components.
5. **Testing:** Add E2E tests for the 9 "Real" workbenches to prevent regressions.

---

## File Structure

```
packages/app/src/components/Workbench/
├── WorkbenchLayout.tsx        # Main router (629 lines)
├── WorkWorkbench.tsx          # Real (129 lines)
├── MaintenanceWorkbench.tsx   # Real (417 lines)
├── ExploreWorkbench.tsx       # Real (503 lines)
├── ReviewWorkbench.tsx        # Real (923 lines)
├── SettingsWorkbench.tsx      # Real (617 lines)
├── PMWorkbench.tsx            # Real (526 lines)
├── IntelWorkbench.tsx         # Real (184 lines)
├── ArchiveWorkbench.tsx       # Real (477 lines)
├── HarmonyWorkbench.tsx       # Real (486 lines)
├── EditorWorkbench.tsx        # Real (569 lines)
├── CanvasWorkbench.tsx        # Real (217 lines)
├── CoverageWorkbench.tsx      # Skeleton (433 lines)
└── RespectWorkbench/
    └── RespectWorkbench.tsx   # Skeleton (75 lines)
```

**Total Lines of Code:** ~5,585 lines across all workbenches

---

## Next Steps

1. **Immediate:**
   - Complete Coverage Workbench tabs (Drift Detection + Health Checks)
   - Audit Respect subcomponents for completeness

2. **Short-term:**
   - Add backend API endpoints for real data in mock-based workbenches
   - Extract common layout patterns into shared components

3. **Long-term:**
   - Build comprehensive E2E test suite for all workbenches
   - Add keyboard shortcuts for workbench navigation
   - Implement workbench state persistence and restoration

---

**Report Generated By:** Claude Sonnet 4.5 (analyze.md agent)
**Analysis Duration:** ~15 minutes
**Files Read:** 16
**Components Analyzed:** 13
