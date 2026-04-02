---
phase: "04"
plan: "01"
subsystem: layout-navigation
tags: [dependencies, types, state-management, test-infrastructure]
dependency_graph:
  requires: []
  provides: [react-resizable-panels, cmdk, lucide-react, zustand, WorkbenchMeta, uiStore-panel-state, vitest-setup, test-stubs]
  affects: [packages/app/package.json, packages/app/src/lib/types.ts, packages/app/src/stores/uiStore.ts]
tech_stack:
  added: [react-resizable-panels@4.8.0, cmdk@1.1.1, lucide-react@1.7.0, zustand@5.0.12]
  patterns: [zustand-module-singleton, lucide-icon-type]
key_files:
  created:
    - packages/app/src/lib/types.ts
    - packages/app/src/stores/uiStore.ts
    - packages/app/src/__tests__/__mocks__/resizable-panels.ts
    - packages/app/src/workbenches/shell/AppShell.test.tsx
    - packages/app/src/workbenches/sidebar/Sidebar.test.tsx
    - packages/app/src/workbenches/workspace/WorkspaceArea.test.tsx
    - packages/app/src/stores/uiStore.test.ts
    - packages/app/src/components/command-palette/CommandPalette.test.tsx
  modified:
    - packages/app/package.json
    - packages/app/vitest.config.ts
    - pnpm-lock.yaml
key_decisions:
  - "Created new packages/app/src/lib/types.ts with simplified 7-workbench WorkbenchId (Phase 4 rebuild, separate from @afw/shared legacy types)"
  - "Added zustand and lucide-react as dependencies (plan only specified react-resizable-panels and cmdk, but types.ts and uiStore require them)"
  - "Kept existing test setup.ts intact (already had jest-dom import and matchMedia mock)"
metrics:
  duration: 4min
  completed: "2026-04-02T14:58:23Z"
  tasks_completed: 3
  tasks_total: 3
  files_created: 8
  files_modified: 3
---

# Phase 4 Plan 01: Foundation - Dependencies, Types, State & Test Infrastructure Summary

Installed Phase 4 dependencies (react-resizable-panels, cmdk, lucide-react, zustand), created WorkbenchMeta with LucideIcon field for all 7 workbenches, extended uiStore with sidebar/chat/pipeline/commandPalette collapse state, and scaffolded 5 Wave 0 test stubs all passing in vitest.

## Task Results

### Task 1: Install dependencies and extend types with lucide icons
- **Commit:** 4ee794a
- **Files:** packages/app/package.json, packages/app/src/lib/types.ts, pnpm-lock.yaml
- **Result:** Installed react-resizable-panels@^4.8.0, cmdk@^1.1.1, lucide-react@^1.7.0, zustand@^5.0.12. Created types.ts with WorkbenchId union type (7 workbenches), WorkbenchMeta interface with icon:LucideIcon field, and WORKBENCHES const array with Briefcase, Compass, ShieldCheck, LayoutDashboard, Settings, Archive, Palette icons.

### Task 2: Extend uiStore and create vitest test infrastructure
- **Commit:** 9cc917f
- **Files:** packages/app/src/stores/uiStore.ts, packages/app/src/__tests__/__mocks__/resizable-panels.ts, packages/app/vitest.config.ts
- **Result:** Created uiStore with 4 panel state groups (sidebar, chat, pipeline, commandPalette), each with boolean state + setter + toggle (12 new fields total). Created react-resizable-panels mock rendering PanelGroup/Panel/PanelResizeHandle as plain divs. Added mock alias to vitest.config.ts.

### Task 3: Create Wave 0 test stub files
- **Commit:** ae4a455
- **Files:** 5 test files across workbenches/shell, workbenches/sidebar, workbenches/workspace, stores, components/command-palette
- **Result:** All 5 test stubs created and passing. uiStore.test.ts includes real assertions on default state values. Other 4 stubs contain placeholder tests with TODO comments referencing their target requirements (LAYOUT-01 through LAYOUT-05).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added lucide-react and zustand as dependencies**
- **Found during:** Task 1
- **Issue:** Plan only specified react-resizable-panels and cmdk as install targets, but types.ts requires lucide-react (LucideIcon type + icon imports) and uiStore.ts requires zustand (create function). Neither was in package.json dependencies.
- **Fix:** Added lucide-react and zustand to the pnpm add command alongside the planned dependencies.
- **Files modified:** packages/app/package.json, pnpm-lock.yaml
- **Commit:** 4ee794a

**2. [Rule 3 - Blocking] Existing test setup.ts kept intact**
- **Found during:** Task 2
- **Issue:** Plan instructed creating packages/app/src/__tests__/setup.ts, but it already existed with jest-dom import plus matchMedia mock and WebSocket mock. Overwriting would lose those.
- **Fix:** Kept existing setup.ts unchanged. It already satisfies the requirement (has @testing-library/jest-dom/vitest import).
- **Files modified:** None (preserved existing file)

## Verification Results

- All 5 Wave 0 tests pass (5/5 green)
- New files have zero TypeScript errors (verified by grep of tsc output)
- react-resizable-panels@^4.8.0 installed
- cmdk@^1.1.1 installed
- lucide-react@^1.7.0 installed
- zustand@^5.0.12 installed
- WorkbenchMeta has icon:LucideIcon field with all 7 icons assigned
- uiStore has 12 new fields (4 booleans + 4 setters + 4 toggles)

## Known Stubs

None -- all files in this plan are either complete implementations (types.ts, uiStore.ts, mocks) or intentional test stubs for future plans to fill.

## Self-Check: PASSED

- [x] packages/app/src/lib/types.ts exists
- [x] packages/app/src/stores/uiStore.ts exists
- [x] packages/app/src/__tests__/__mocks__/resizable-panels.ts exists
- [x] packages/app/src/workbenches/shell/AppShell.test.tsx exists
- [x] packages/app/src/workbenches/sidebar/Sidebar.test.tsx exists
- [x] packages/app/src/workbenches/workspace/WorkspaceArea.test.tsx exists
- [x] packages/app/src/stores/uiStore.test.ts exists
- [x] packages/app/src/components/command-palette/CommandPalette.test.tsx exists
- [x] Commit 4ee794a exists
- [x] Commit 9cc917f exists
- [x] Commit ae4a455 exists
