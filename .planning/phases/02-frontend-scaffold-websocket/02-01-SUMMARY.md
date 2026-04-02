---
phase: 02-frontend-scaffold-websocket
plan: 01
subsystem: ui
tags: [react, zustand, vite, workbench-shell, css-grid, design-tokens]

# Dependency graph
requires:
  - phase: 01-ts-contracts-backend
    provides: "shared types, backend services, design-tokens.css"
provides:
  - "3-region app shell (sidebar, workspace, chat placeholder)"
  - "7 workbench page placeholders (Work, Explore, Review, PM, Settings, Archive, Studio)"
  - "zustand UI store with activeWorkbench state"
  - "WorkbenchId union type and WORKBENCHES metadata constant"
  - "Clean src/ directory with no cosmic code remnants"
affects: [02-02, 02-03, 03-design-system, 04-layout-navigation]

# Tech tracking
tech-stack:
  added: [zustand ^5.0.12]
  removed: [reactflow 11.11.4, @reactflow/core 11.11.4]
  patterns: [zustand-singleton-store, css-grid-shell, design-token-only-css, page-map-rendering]

key-files:
  created:
    - packages/app/src/lib/types.ts
    - packages/app/src/stores/uiStore.ts
    - packages/app/src/workbenches/shell/AppShell.tsx
    - packages/app/src/workbenches/shell/AppShell.css
    - packages/app/src/workbenches/sidebar/SidebarPlaceholder.tsx
    - packages/app/src/workbenches/sidebar/SidebarPlaceholder.css
    - packages/app/src/workbenches/workspace/WorkspaceArea.tsx
    - packages/app/src/workbenches/workspace/WorkspaceArea.css
    - packages/app/src/workbenches/chat/ChatPlaceholder.tsx
    - packages/app/src/workbenches/chat/ChatPlaceholder.css
    - packages/app/src/workbenches/pages/WorkPage.tsx
    - packages/app/src/workbenches/pages/ExplorePage.tsx
    - packages/app/src/workbenches/pages/ReviewPage.tsx
    - packages/app/src/workbenches/pages/PMPage.tsx
    - packages/app/src/workbenches/pages/SettingsPage.tsx
    - packages/app/src/workbenches/pages/ArchivePage.tsx
    - packages/app/src/workbenches/pages/StudioPage.tsx
  modified:
    - packages/app/src/main.tsx
    - packages/app/src/App.tsx
    - packages/app/vite.config.ts
    - packages/app/package.json

key-decisions:
  - "No provider pyramid -- zustand stores are module singletons, no React context needed"
  - "WorkspaceArea keyed by activeWorkbench for clean unmount/remount on workbench switch"
  - "Page styles shared in WorkspaceArea.css rather than per-page CSS files"
  - "Kept monaco/xterm vite chunks for future phases despite removing reactflow/cosmic chunks"

patterns-established:
  - "zustand-singleton-store: UI state via module-level create(), no provider wrapper needed"
  - "design-token-only-css: all component CSS uses var(--token) references, zero raw hex values"
  - "page-map-rendering: Record<WorkbenchId, React.FC> lookup in WorkspaceArea for O(1) page selection"
  - "workbench-directory-structure: src/workbenches/{shell,sidebar,workspace,chat,pages}/ organization"

requirements-completed: [FOUND-04]

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 02 Plan 01: Workbench Shell Scaffold Summary

**Clean-slate 3-region workbench shell with zustand state, 7 navigable page placeholders, and full cosmic UI removal (834 files deleted)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-02T08:55:31Z
- **Completed:** 2026-04-02T09:00:16Z
- **Tasks:** 2
- **Files modified:** 849 (834 deleted, 4 modified, 11 created)

## Accomplishments
- Deleted entire cosmic-themed frontend (834 files across 13 directories) creating a clean foundation
- Built 3-region CSS grid shell: 220px sidebar, fluid workspace, 300px chat placeholder
- Installed zustand for state management, created UI store with workbench switching
- Created 7 workbench page placeholders with consistent design-token-only styling
- Zero TypeScript errors in src/ after full rebuild

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete cosmic frontend, install zustand, rewrite entry points** - `bd2f5c2` (feat)
2. **Task 2: Build workbench shell components** - `64dfc06` (feat)

## Files Created/Modified
- `packages/app/src/lib/types.ts` - WorkbenchId union type and WORKBENCHES metadata array
- `packages/app/src/stores/uiStore.ts` - Zustand store for activeWorkbench state
- `packages/app/src/workbenches/shell/AppShell.tsx` - Root 3-region CSS grid layout
- `packages/app/src/workbenches/shell/AppShell.css` - Grid template: 220px 1fr 300px
- `packages/app/src/workbenches/sidebar/SidebarPlaceholder.tsx` - 7-workbench nav with active state
- `packages/app/src/workbenches/sidebar/SidebarPlaceholder.css` - Sidebar styles with system-blue active indicator
- `packages/app/src/workbenches/workspace/WorkspaceArea.tsx` - PAGE_MAP lookup rendering active page
- `packages/app/src/workbenches/workspace/WorkspaceArea.css` - Workspace and shared page typography styles
- `packages/app/src/workbenches/chat/ChatPlaceholder.tsx` - Right panel placeholder for Phase 7
- `packages/app/src/workbenches/chat/ChatPlaceholder.css` - Chat placeholder centered text style
- `packages/app/src/workbenches/pages/*.tsx` - 7 page placeholders (Work, Explore, Review, PM, Settings, Archive, Studio)
- `packages/app/src/main.tsx` - Minimal React root (no animations, no cosmic imports)
- `packages/app/src/App.tsx` - Renders AppShell only (no provider pyramid)
- `packages/app/vite.config.ts` - Removed reactflow/cosmic chunks and optimizeDeps

## Decisions Made
- No provider pyramid: zustand module singletons replace 12 nested React context providers (per D-03 plan directive)
- WorkspaceArea receives `key={activeWorkbench}` to force clean unmount/remount on workbench switch (per PITFALLS P13)
- Shared page styles in WorkspaceArea.css rather than individual CSS files per page (7 pages share identical typography)
- Kept monaco-editor and xterm vite chunks in config despite removing reactflow/cosmic (needed in future phases)
- design-tokens.css imported directly in main.tsx in addition to the themes/index.css chain to ensure token availability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- TypeScript check via npx tsc fails in worktree due to pnpm node_modules resolution -- used absolute path to tsc binary as workaround
- Pre-existing Electron typing errors (5 errors in electron/main.ts and electron/preload.ts) are outside scope; zero errors in src/

## User Setup Required

None - no external service configuration required.

## Known Stubs

The 7 workbench pages are intentional placeholders. Each renders a heading and description only. These are scaffold pages that will be populated with real content in subsequent phases:
- Phase 3 (Design System) provides the component library
- Phase 4 (Layout & Navigation) adds resize panels and command palette
- Phase 5+ adds pipeline visualizer, WebSocket status, and workbench-specific content

## Next Phase Readiness
- Shell scaffold is complete and ready for Plan 02 (WebSocket multiplexing) and Plan 03 (Electron build pipeline)
- Phase 3 (Design System) can now build components targeting the workbench shell structure
- Phase 4 (Layout) can replace fixed widths with react-resizable-panels

## Self-Check: PASSED

- All 17 created files verified present on disk
- Both task commits (bd2f5c2, 64dfc06) verified in git log
- Zero TypeScript errors in src/
- Zero raw hex values in workbench CSS
- Zero cosmic imports in entry points or workbench code
- All 7 workbench pages confirmed on disk

---
*Phase: 02-frontend-scaffold-websocket*
*Completed: 2026-04-02*
