---
phase: "04"
plan: "02"
subsystem: layout-navigation
tags: [react-resizable-panels, sidebar, lucide-react, tailwind, zustand, panel-layout]
dependency_graph:
  requires:
    - phase: "04-01"
      provides: [react-resizable-panels, lucide-react, zustand, WorkbenchMeta, uiStore-panel-state]
  provides:
    - 3-panel PanelGroup horizontal layout with autoSaveId persistence
    - Sidebar with 7 workbench icons, collapse/expand, active state accent border
    - SidebarItem with tooltips when collapsed, aria-current
    - panelHandles export for imperative panel control
    - WebSocketStatus migrated to Tailwind utility classes
  affects: [packages/app/src/workbenches/shell/AppShell.tsx, packages/app/src/workbenches/sidebar/, packages/app/src/status/WebSocketStatus.tsx]
tech_stack:
  added: []
  patterns: [react-resizable-panels-layout, imperative-panel-handle-export, sidebar-collapse-expand, tailwind-cn-migration]
key_files:
  created:
    - packages/app/src/workbenches/sidebar/Sidebar.tsx
    - packages/app/src/workbenches/sidebar/SidebarItem.tsx
  modified:
    - packages/app/src/workbenches/shell/AppShell.tsx
    - packages/app/src/status/WebSocketStatus.tsx
  deleted:
    - packages/app/src/workbenches/shell/AppShell.css
    - packages/app/src/workbenches/sidebar/SidebarPlaceholder.tsx
    - packages/app/src/workbenches/sidebar/SidebarPlaceholder.css
    - packages/app/src/status/WebSocketStatus.css
key_decisions:
  - "Exported panelHandles at module level for command palette imperative panel control (no React context needed)"
  - "Sidebar manages its own TooltipProvider internally -- App.tsx unchanged"
  - "Drag handle uses before pseudo-element for visual indicator with duration-fast design token"
patterns_established:
  - "PanelGroup layout: horizontal 3-panel with sidebar (15%, collapsible to 4%), workspace (60%), chat (25%, collapsible to 0%)"
  - "Sidebar items use Tooltip wrapping only when collapsed, not when expanded"
  - "CSS-to-Tailwind migration pattern: delete CSS file, replace BEM classes with cn() utility classes using design tokens"
requirements_completed: [LAYOUT-01, LAYOUT-02, LAYOUT-04]
metrics:
  duration: 3min
  completed: "2026-04-02T15:06:11Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
  files_deleted: 4
---

# Phase 4 Plan 02: AppShell Layout & Sidebar Summary

**3-panel resizable layout with react-resizable-panels replacing CSS Grid, full Sidebar with lucide icons and collapse/expand, WebSocketStatus migrated to Tailwind**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T15:02:55Z
- **Completed:** 2026-04-02T15:06:11Z
- **Tasks:** 2
- **Files changed:** 8 (2 created, 2 modified, 4 deleted)

## Accomplishments
- Replaced CSS Grid AppShell with react-resizable-panels PanelGroup (horizontal, 3 panels, autoSaveId persistence)
- Created Sidebar with 7 workbench items using lucide icons, collapse/expand toggle, active state with accent border, tooltips when collapsed
- Created SidebarItem with aria-current, tooltip wrapping in collapsed mode, proper touch targets
- Migrated WebSocketStatus from BEM CSS to Tailwind utility classes with cn()
- Cleaned up 4 obsolete CSS/placeholder files

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite AppShell with 3-panel PanelGroup layout and create Sidebar** - `1f6f423` (feat)
2. **Task 2: Migrate WebSocketStatus to Tailwind and clean up CSS imports** - `cb8fd0d` (refactor)

## Files Created/Modified

- `packages/app/src/workbenches/shell/AppShell.tsx` - Rewritten: PanelGroup with sidebar (15%, collapsible), workspace (60%), chat (25%, collapsible) panels
- `packages/app/src/workbenches/sidebar/Sidebar.tsx` - New: Sidebar nav with 7 workbenches, collapse toggle, WebSocketStatus
- `packages/app/src/workbenches/sidebar/SidebarItem.tsx` - New: Individual nav item with icon, label, active state, tooltip when collapsed
- `packages/app/src/status/WebSocketStatus.tsx` - Migrated: BEM CSS to Tailwind utility classes with cn()
- `packages/app/src/workbenches/shell/AppShell.css` - Deleted (replaced by Tailwind in AppShell.tsx)
- `packages/app/src/workbenches/sidebar/SidebarPlaceholder.tsx` - Deleted (replaced by Sidebar.tsx)
- `packages/app/src/workbenches/sidebar/SidebarPlaceholder.css` - Deleted (replaced by Tailwind in Sidebar.tsx)
- `packages/app/src/status/WebSocketStatus.css` - Deleted (replaced by Tailwind in WebSocketStatus.tsx)

## Decisions Made

- Exported `panelHandles` at module level for command palette imperative panel control -- avoids adding React context for a simple ref-forwarding case
- Sidebar manages its own TooltipProvider internally so App.tsx stays unchanged
- Drag handle uses `before:` pseudo-element with `duration-fast` design token (not hardcoded `duration-150`)
- WebSocketStatus uses `animate-pulse` Tailwind built-in for reconnecting/connecting states instead of custom keyframes

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None -- all components are complete implementations. The test stubs from Plan 01 (AppShell.test.tsx, Sidebar.test.tsx) remain placeholder tests but were created in Plan 01 and are not this plan's scope to fill.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- AppShell layout complete, ready for Plan 03 (WorkspaceArea rebuild with pipeline/content split)
- Plan 03 will rebuild WorkspaceArea with nested vertical PanelGroup
- Plan 04 will add CommandPalette using cmdk
- ChatPlaceholder and WorkspaceArea still have stale CSS imports (to be cleaned in Plan 03)

## Self-Check: PASSED

- [x] packages/app/src/workbenches/sidebar/Sidebar.tsx exists
- [x] packages/app/src/workbenches/sidebar/SidebarItem.tsx exists
- [x] packages/app/src/workbenches/shell/AppShell.tsx exists (rewritten)
- [x] packages/app/src/status/WebSocketStatus.tsx exists (migrated)
- [x] packages/app/src/workbenches/sidebar/SidebarPlaceholder.tsx deleted
- [x] packages/app/src/workbenches/sidebar/SidebarPlaceholder.css deleted
- [x] packages/app/src/workbenches/shell/AppShell.css deleted
- [x] packages/app/src/status/WebSocketStatus.css deleted
- [x] Commit 1f6f423 exists
- [x] Commit cb8fd0d exists

---
*Phase: 04-layout-navigation*
*Completed: 2026-04-02*
