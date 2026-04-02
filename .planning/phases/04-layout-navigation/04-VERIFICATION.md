---
phase: 04-layout-navigation
verified: 2026-04-01T17:30:00Z
status: gaps_found
score: 8/12 must-haves verified
gaps:
  - truth: "App renders a 3-panel horizontal layout with sidebar, workspace, and chat"
    status: failed
    reason: "AppShell.tsx imports PanelGroup, PanelResizeHandle, ImperativePanelHandle from react-resizable-panels — these symbols do not exist in v4.8.0. TypeScript compilation fails with 'Cannot find module react-resizable-panels' in the main project."
    artifacts:
      - path: "packages/app/src/workbenches/shell/AppShell.tsx"
        issue: "Uses old v2/v3 API: PanelGroup (should be Group), PanelResizeHandle (should be Separator), ImperativePanelHandle, direction='horizontal' (should be orientation), autoSaveId (not in v4.8), onCollapse/onExpand (not in v4.8, only onResize exists)"
    missing:
      - "Migrate AppShell.tsx from react-resizable-panels v2/v3 API to v4.8 API: replace PanelGroup with Group, PanelResizeHandle with Separator, direction with orientation, remove autoSaveId, replace onCollapse/onExpand with onResize callback, replace ImperativePanelHandle with GroupImperativeHandle"
  - truth: "Panels can be resized by dragging handles between them"
    status: failed
    reason: "AppShell uses PanelResizeHandle which does not exist in v4.8. WorkspaceArea uses Separator correctly (v4.8 API). Drag handles work in WorkspaceArea but the outer horizontal layout will fail."
    artifacts:
      - path: "packages/app/src/workbenches/shell/AppShell.tsx"
        issue: "PanelResizeHandle not in react-resizable-panels v4.8; should use Separator"
    missing:
      - "Replace PanelResizeHandle with Separator in AppShell.tsx"
  - truth: "Sidebar collapses to icon-only mode and expands back"
    status: partial
    reason: "Sidebar component and SidebarItem are correctly implemented. However AppShell.tsx wires the sidebar Panel with onCollapse/onExpand which do not exist in v4.8 (only onResize exists). The collapse/expand callback wiring to uiStore is broken."
    artifacts:
      - path: "packages/app/src/workbenches/shell/AppShell.tsx"
        issue: "Panel props onCollapse/onExpand do not exist in v4.8; only onResize is available. Imperative handle for Ctrl+B also uses old API (isCollapsed, expand, collapse methods do exist in v4.8 PanelImperativeHandle but the way to obtain it changed — panelRef instead of useRef<ImperativePanelHandle>)"
    missing:
      - "Replace onCollapse={() => setSidebarCollapsed(true)} with onResize callback that checks size == 0"
      - "Replace ImperativePanelHandle type with PanelImperativeHandle (v4.8 type)"
      - "Use panelRef prop on Panel instead of ref prop (v4.8 API change)"
  - truth: "WorkspaceArea vertical split pipeline/content — useDefaultLayout receives unsupported prop"
    status: partial
    reason: "WorkspaceArea correctly uses Group/Panel/Separator from v4.8 but passes { id: 'workspace-split', storage: localStorage } to useDefaultLayout. The v4.8 useDefaultLayout signature is { debounceSaveMs?, panelIds?, storage? } — there is no 'id' parameter. The id param is silently spread via ...rest so it won't throw but the storage key won't be derived from it."
    artifacts:
      - path: "packages/app/src/workbenches/workspace/WorkspaceArea.tsx"
        issue: "useDefaultLayout called with unsupported 'id' prop; v4.8 does not accept id parameter. Also Panel uses onCollapse/onExpand props which don't exist in v4.8 (WorkspaceArea correctly uses onResize but the pipeline Panel still has no onCollapse/onExpand)"
    missing:
      - "Fix useDefaultLayout call: remove id parameter, rely on storage parameter alone or remove the hook entirely and just use Group's defaultLayout prop directly"
human_verification:
  - test: "Open app in browser after running pnpm install in main project directory"
    expected: "3-panel layout renders with sidebar (icons), workspace, and chat placeholder visible"
    why_human: "Requires running dev server; also blocked by AppShell API fix"
  - test: "Press Cmd+K (or Ctrl+K) in the running app"
    expected: "Command palette dialog opens with search input and 10 commands (7 workbenches + 3 actions)"
    why_human: "Requires running browser session to test keyboard events"
  - test: "Click workbench items in sidebar when sidebar is collapsed and expanded"
    expected: "Collapsed: icon-only + tooltip on hover; expanded: icon + label. Clicking switches workspace."
    why_human: "Visual layout and hover tooltip require browser"
  - test: "Drag resize handles between panels"
    expected: "Panels resize smoothly; layout persists on page reload"
    why_human: "Requires browser interaction"
---

# Phase 04: Layout Navigation Verification Report

**Phase Goal:** Users see and interact with the 3-panel workbench layout with sidebar navigation and command palette
**Verified:** 2026-04-01T17:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | react-resizable-panels and cmdk are installed | PARTIAL | In lockfile + worktree node_modules. NOT installed in main project node_modules. |
| 2  | WorkbenchMeta includes LucideIcon icon field for all 7 workbenches | VERIFIED | types.ts line 17: `icon: LucideIcon`; all 7 entries in WORKBENCHES array have icons |
| 3  | uiStore has 4 panel state groups with setters and toggles | VERIFIED | uiStore.ts: sidebarCollapsed, chatCollapsed, pipelineCollapsed, commandPaletteOpen each have state + setter + toggle |
| 4  | All 5 Wave 0 test stubs exist and pass | VERIFIED | `pnpm test` in packages/app: 5/5 tests pass |
| 5  | App renders 3-panel horizontal layout | FAILED | AppShell uses v2/v3 API (PanelGroup, PanelResizeHandle) incompatible with installed v4.8 |
| 6  | Sidebar shows 7 workbenches with icons, clicking switches workspace | VERIFIED | Sidebar.tsx + SidebarItem.tsx are complete; wired to WORKBENCHES and uiStore |
| 7  | Sidebar collapses to icon-only mode | PARTIAL | Sidebar logic correct; AppShell onCollapse/onExpand props don't exist in v4.8 |
| 8  | Panels can be resized by dragging handles | FAILED | AppShell uses PanelResizeHandle (not in v4.8); WorkspaceArea uses Separator correctly |
| 9  | Workspace splits vertically (pipeline 25% + content 75%) | PARTIAL | WorkspaceArea correctly uses v4.8 Group/Separator but useDefaultLayout gets wrong props |
| 10 | Pipeline region is collapsible | PARTIAL | WorkspaceArea uses onResize workaround correctly but useDefaultLayout id prop is unsupported |
| 11 | Command palette opens with Cmd+K | VERIFIED | useKeyboardShortcuts handles Cmd+K; CommandPalette uses Command.Dialog |
| 12 | Command palette shows 7 nav + 3 action items | VERIFIED | useCommands.ts returns 10 items; verified WORKBENCHES (7) + actions (3) |

**Score:** 8/12 truths verified (3 FAILED, 2 PARTIAL, 7 VERIFIED)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/app/src/lib/types.ts` | WorkbenchMeta with icon field, 7 WORKBENCHES with lucide icons | VERIFIED | 28 lines; icon: LucideIcon; all 7 workbenches assigned |
| `packages/app/src/stores/uiStore.ts` | 4 panel state groups, exports useUIStore | VERIFIED | 49 lines; complete implementation |
| `packages/app/src/__tests__/setup.ts` | Vitest setup with jest-dom | VERIFIED | Has jest-dom import + matchMedia mock |
| `packages/app/src/__tests__/__mocks__/resizable-panels.ts` | Mock for react-resizable-panels | VERIFIED | Exports Group, Panel, Separator, useDefaultLayout (v4.8 API) |
| `packages/app/src/workbenches/shell/AppShell.test.tsx` | Test stub (LAYOUT-01) | VERIFIED | Exists; passes |
| `packages/app/src/workbenches/sidebar/Sidebar.test.tsx` | Test stub (LAYOUT-02) | VERIFIED | Exists; passes |
| `packages/app/src/workbenches/workspace/WorkspaceArea.test.tsx` | Test stub (LAYOUT-03) | VERIFIED | Exists; passes |
| `packages/app/src/stores/uiStore.test.ts` | Test stub with real assertion (LAYOUT-04) | VERIFIED | Tests default state values; passes |
| `packages/app/src/components/command-palette/CommandPalette.test.tsx` | Test stub (LAYOUT-05) | VERIFIED | Exists; passes |
| `packages/app/src/workbenches/shell/AppShell.tsx` | 3-panel PanelGroup layout | STUB/BROKEN | Uses v2/v3 API incompatible with installed v4.8 |
| `packages/app/src/workbenches/sidebar/Sidebar.tsx` | Sidebar with collapse/expand | VERIFIED | 69 lines; fully wired to uiStore and WORKBENCHES |
| `packages/app/src/workbenches/sidebar/SidebarItem.tsx` | Nav item with icon, tooltip, active state | VERIFIED | 49 lines; complete; uses Tooltip when collapsed |
| `packages/app/src/status/WebSocketStatus.tsx` | Tailwind-only, no CSS file | VERIFIED | Uses cn(); no CSS import; WebSocketStatus.css deleted |
| `packages/app/src/workbenches/workspace/WorkspaceArea.tsx` | Vertical PanelGroup split | PARTIAL | Uses v4.8 API (Group/Separator) correctly but useDefaultLayout call has wrong props |
| `packages/app/src/workbenches/workspace/PipelinePlaceholder.tsx` | Phase 5 placeholder | VERIFIED | "Pipeline -- Phase 5" text; bg-surface + border |
| `packages/app/src/workbenches/chat/ChatPlaceholder.tsx` | Tailwind-only, no CSS | VERIFIED | bg-surface-2; no CSS import |
| `packages/app/src/components/command-palette/CommandPalette.tsx` | cmdk Command.Dialog | VERIFIED | 90 lines; Command.Dialog, Command.Input, Command.List, Command.Item |
| `packages/app/src/components/command-palette/useCommands.ts` | Returns 10 commands | VERIFIED | 68 lines; 7 navigation + 3 action commands |
| `packages/app/src/hooks/useKeyboardShortcuts.ts` | Global keyboard handler | VERIFIED | 68 lines; Cmd+K, Ctrl+B, 1-7 with input focus guard |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| AppShell.tsx | react-resizable-panels | `import { PanelGroup }` | BROKEN | PanelGroup does not exist in v4.8; TypeScript error |
| AppShell.tsx | Sidebar.tsx | `import { Sidebar }` | WIRED | `<Sidebar collapsed={sidebarCollapsed}>` renders correctly |
| Sidebar.tsx | uiStore.ts | `useUIStore` | WIRED | sidebarCollapsed, toggleSidebar consumed |
| SidebarItem.tsx | ui/tooltip.tsx | `import { Tooltip }` | WIRED | Tooltip wraps collapsed items |
| WorkspaceArea.tsx | react-resizable-panels | `import { Group }` | WIRED | v4.8 API used correctly |
| WorkspaceArea.tsx | uiStore.ts | `useUIStore` | WIRED | setPipelineCollapsed consumed in onResize |
| WorkspaceArea.tsx | PipelinePlaceholder.tsx | `import { PipelinePlaceholder }` | WIRED | `<PipelinePlaceholder />` rendered in top panel |
| CommandPalette.tsx | cmdk | `import { Command }` | WIRED | Command.Dialog wraps entire palette |
| CommandPalette.tsx | uiStore.ts | `useUIStore` | WIRED | commandPaletteOpen + setCommandPaletteOpen |
| useCommands.ts | types.ts | `import { WORKBENCHES }` | WIRED | 7 nav items sourced from WORKBENCHES array |
| useKeyboardShortcuts.ts | uiStore.ts | `useUIStore` | WIRED | toggleCommandPalette, setActiveWorkbench |
| useKeyboardShortcuts.ts | AppShell.tsx | `import { panelHandles }` | WIRED | panelHandles.sidebar used for Ctrl+B |
| AppShell.tsx | CommandPalette.tsx | `import { CommandPalette }` | WIRED | `<CommandPalette />` outside PanelGroup |
| AppShell.tsx | useKeyboardShortcuts.ts | `useKeyboardShortcuts()` | WIRED | Called inside AppShell function body |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| Sidebar.tsx | activeWorkbench | uiStore.getState().activeWorkbench | Yes — Zustand store state | FLOWING |
| CommandPalette.tsx | commands | useCommands() → WORKBENCHES | Yes — 7 workbenches from types.ts constant | FLOWING |
| WorkspaceArea.tsx | Page | PAGE_MAP[workbenchId] | Yes — component map keyed by workbenchId prop | FLOWING |
| Sidebar.tsx | WORKBENCHES | types.ts constant | Yes — static but valid (7 workbenches defined) | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 5 Vitest test stubs pass | `cd packages/app && pnpm test` | 5/5 passing | PASS |
| uiStore default state | uiStore.test.ts assertions | sidebarCollapsed=false, chatCollapsed=false, pipelineCollapsed=false, commandPaletteOpen=false | PASS |
| TypeScript compilation | `pnpm --filter @afw/app exec tsc --noEmit` | FAIL — AppShell: Cannot find module 'react-resizable-panels'; WorkspaceArea: implicit any in onResize size param; Sidebar: Button variant/size type error (not critical) | FAIL |
| Vite build | `pnpm --filter @afw/app build` | FAIL — pre-existing: @tailwindcss/vite missing from node_modules | SKIP (pre-existing) |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| LAYOUT-01 | 04-01, 04-02 | 3-panel resizable layout (sidebar ~20%, workspace ~55%, chat ~25%) | BLOCKED | AppShell uses v2/v3 API incompatible with installed v4.8 |
| LAYOUT-02 | 04-01, 04-02 | Sidebar with 7 default workbenches, clicking switches workspace | SATISFIED | Sidebar.tsx + SidebarItem.tsx complete; WORKBENCHES wired; click handler sets activeWorkbench |
| LAYOUT-03 | 04-03 | Workspace split: pipeline (top ~25%) + content area (bottom ~75%) | PARTIAL | WorkspaceArea uses v4.8 Group correctly; useDefaultLayout id prop issue (non-critical behavior) |
| LAYOUT-04 | 04-01, 04-02, 04-03 | Panels resizable with min/max constraints and collapse support | BLOCKED | AppShell Panel API mismatch; onCollapse/onExpand don't exist in v4.8 |
| LAYOUT-05 | 04-04 | Command palette with Cmd+K and keyboard navigation | SATISFIED | CommandPalette.tsx + useKeyboardShortcuts.ts complete and wired; blocked at runtime only by AppShell compilation |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| AppShell.tsx | 2 | `import { PanelGroup, PanelResizeHandle, type ImperativePanelHandle }` | BLOCKER | These exports don't exist in react-resizable-panels v4.8; TypeScript compilation fails |
| AppShell.tsx | 49 | `<PanelGroup direction="horizontal" autoSaveId="app-layout">` | BLOCKER | PanelGroup → Group; direction → orientation; autoSaveId not in v4.8 |
| AppShell.tsx | 55-58 | `onCollapse/onExpand` on Panel | BLOCKER | These props don't exist in v4.8; only onResize callback available |
| WorkspaceArea.tsx | 32-35 | `useDefaultLayout({ id: 'workspace-split', storage: localStorage })` | WARNING | id param not in v4.8 useDefaultLayout signature; spread via ...rest silently ignored |
| WorkspaceArea.tsx | 50 | `(size) => { setPipelineCollapsed(size.asPercentage === 0) }` | WARNING | TS7006: implicit any for size param; should type as PanelSize from react-resizable-panels |

---

## Human Verification Required

### 1. 3-Panel Layout Visual Rendering

**Test:** After running `pnpm install` in the main project and fixing AppShell API, open http://localhost:5173
**Expected:** Three resizable panels visible (sidebar ~15%, workspace ~60%, chat ~25%); drag handles between panels work
**Why human:** Visual layout and drag interaction require browser; also blocked by AppShell fix

### 2. Sidebar Collapse/Expand Behavior

**Test:** Click the collapse button in the sidebar
**Expected:** Sidebar collapses to icon-only view (~4% width); workbench labels hidden; tooltips appear on hover; clicking an icon selects the workbench
**Why human:** Visual state and tooltip rendering require browser; collapse animation visual quality

### 3. Command Palette Keyboard Navigation

**Test:** Press Cmd+K (or Ctrl+K), type "work", press Enter; then Cmd+K, press number key 2
**Expected:** Palette opens with 10 commands; typing filters; Enter/click activates command and closes palette; number key 2 switches to Explore workbench
**Why human:** Keyboard events and cmdk fuzzy filter behavior require live browser session

### 4. Panel Resize Persistence

**Test:** Resize the sidebar panel, reload the page
**Expected:** Sidebar retains its resized width after reload (localStorage persistence)
**Why human:** Requires browser interaction + reload to verify localStorage round-trip

---

## Gaps Summary

**Root Cause: react-resizable-panels API mismatch (v2/v3 vs v4.8)**

The Phase 4 plans specified `react-resizable-panels@^4.8.0` and the plan's code examples used a v4.8-compatible API for WorkspaceArea (Plan 03). However, AppShell.tsx (Plan 02) was implemented using the v2/v3 API (`PanelGroup`, `PanelResizeHandle`, `ImperativePanelHandle`, `direction`, `autoSaveId`, `onCollapse`, `onExpand`). The installed package v4.8 exports `Group`, `Panel`, `Separator`, `useDefaultLayout` with `orientation` instead of `direction`, and `onResize` instead of `onCollapse`/`onExpand`.

**Impact:**
- AppShell.tsx does not compile against v4.8 (TypeScript errors confirmed)
- At runtime, the outer 3-panel layout will throw because PanelGroup is undefined
- Ctrl+B sidebar toggle won't work (ImperativePanelHandle type mismatch)
- Tests pass because the Vitest mock intercepts `react-resizable-panels` imports

**Non-blocking issues:**
- `pnpm install` needs to be run in main project (packages in lockfile; worktrees have them installed)
- WorkspaceArea `useDefaultLayout({ id })` — id param silently ignored, storage key generated differently
- WorkspaceArea `onResize` `size` parameter implicit `any` type

**What passes correctly:**
- All type definitions (types.ts, uiStore.ts)
- All test infrastructure (5 stubs, setup, mock)
- Sidebar and SidebarItem components (fully functional, correct API)
- WorkspaceArea (correct v4.8 API, minor useDefaultLayout prop issue)
- ChatPlaceholder, PipelinePlaceholder, WebSocketStatus (all Tailwind, no CSS)
- CommandPalette and useCommands (complete cmdk implementation)
- useKeyboardShortcuts (Cmd+K, Ctrl+B, 1-7 all wired)
- App.tsx → AppShell wiring correct

**Fix scope:** AppShell.tsx needs a targeted API migration from v2/v3 to v4.8 (approximately 15-20 line changes).

---

_Verified: 2026-04-01T17:30:00Z_
_Verifier: Claude (gsd-verifier)_
