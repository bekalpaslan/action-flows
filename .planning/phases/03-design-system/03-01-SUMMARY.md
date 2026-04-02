---
phase: 03-design-system
plan: 01
subsystem: ui
tags: [tailwindcss-v4, radix-ui, cva, design-tokens, css, vite, cn-utility]

# Dependency graph
requires:
  - phase: 02-frontend-scaffold-websocket
    provides: Shell components (AppShell, Sidebar, Workspace, Chat) with var(--token) CSS
provides:
  - Complete Tailwind v4 @theme token system (palette, spacing, typography, radius, shadows, z-index, easing, glows, animations)
  - Dark/light theme switching via data-theme attribute with 13 semantic color tokens
  - globals.css entry point with Tailwind v4, dark custom-variant, sr-only utility, base reset
  - cn() utility for class merging (clsx + tailwind-merge)
  - Vite build pipeline with @tailwindcss/vite plugin
  - All Radix UI primitives installed for component library
affects: [03-02, 03-03, 03-04, 04-layout-system]

# Tech tracking
tech-stack:
  added: [tailwindcss@4.2, @tailwindcss/vite@4.2, class-variance-authority@0.7, clsx@2.1, tailwind-merge@3.5, lucide-react@1.7, sonner@2.0, @radix-ui/react-slot, @radix-ui/react-dialog, @radix-ui/react-tabs, @radix-ui/react-tooltip, @radix-ui/react-dropdown-menu, @radix-ui/react-popover, @radix-ui/react-checkbox, @radix-ui/react-radio-group, @radix-ui/react-select]
  patterns: [tailwind-v4-theme, semantic-css-vars, cn-utility, data-theme-switching]

key-files:
  created:
    - packages/app/src/styles/theme.css
    - packages/app/src/styles/globals.css
    - packages/app/src/lib/utils.ts
  modified:
    - packages/app/package.json
    - packages/app/vite.config.ts
    - packages/app/src/main.tsx
    - packages/app/src/workbenches/shell/AppShell.css
    - packages/app/src/workbenches/sidebar/SidebarPlaceholder.css
    - packages/app/src/workbenches/workspace/WorkspaceArea.css
    - packages/app/src/workbenches/chat/ChatPlaceholder.css
    - packages/app/src/status/WebSocketStatus.css

key-decisions:
  - "Tailwind v4 @theme with --*: initial clears all defaults for fully custom token system"
  - "Semantic tokens registered via @theme inline to generate Tailwind utility classes (bg-surface, text-text, etc.)"
  - "Shell CSS kept as CSS files with new var(--color-*) references rather than converting to className-based Tailwind (that is Phase 4 scope)"
  - "Duration tokens placed in :root (not @theme) since they are consumed only via CSS var(), not Tailwind utilities"

patterns-established:
  - "Token hierarchy: @theme (static palette/scale) -> @theme inline (semantic aliases) -> :root/[data-theme] (theme-specific values)"
  - "cn() utility pattern: import { cn } from '@/lib/utils' for conditional class merging"
  - "Data-theme switching: dark is default (:root), light via [data-theme='light']"
  - "Reduced motion: all --duration-* tokens zeroed via prefers-reduced-motion media query"

requirements-completed: [DESIGN-01, DESIGN-04, DESIGN-06]

# Metrics
duration: 6min
completed: 2026-04-02
---

# Phase 3 Plan 1: Token Foundation Summary

**Tailwind v4 token system with complete @theme (27 palette colors, 7 radius stops, 10 shadows + 4 glows, 10 z-index levels, 4 easings, 3 animations), dark/light themes via 13 semantic CSS variables, cn() utility, and all shell CSS migrated from old design-tokens.css**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-02T12:05:55Z
- **Completed:** 2026-04-02T12:12:52Z
- **Tasks:** 2
- **Files modified:** 17 (6 created/modified in Task 1, 11 deleted/modified in Task 2)

## Accomplishments
- Complete Tailwind v4 @theme token system replacing the 993-line design-tokens.css with all palette, spacing, typography, radius, shadow, z-index, easing, glow, and animation tokens
- Dark/light theme switching via data-theme attribute with 13 semantic color tokens
- cn() utility ready for component authors, Vite build pipeline wired with @tailwindcss/vite
- All 5 shell CSS files migrated from old var(--app-bg-*)/var(--text-primary)/var(--system-blue) tokens to new semantic variables
- 993-line design-tokens.css + dark.css + light.css + themes/index.css + index.css all deleted

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, create theme.css + globals.css + cn(), wire Vite plugin** - `59eebf0` (feat)
2. **Task 2: Delete old token files, update main.tsx imports, migrate shell CSS** - `841c914` (refactor)

## Files Created/Modified
- `packages/app/src/styles/theme.css` - Complete Tailwind v4 @theme with all design tokens
- `packages/app/src/styles/globals.css` - Tailwind v4 entry point with base reset, dark variant, sr-only
- `packages/app/src/lib/utils.ts` - cn() utility using clsx + tailwind-merge
- `packages/app/vite.config.ts` - Added @tailwindcss/vite plugin before react()
- `packages/app/package.json` - Added 16 new dependencies (Tailwind, Radix, CVA, utilities)
- `packages/app/src/main.tsx` - Replaced old CSS imports with single globals.css import
- `packages/app/src/workbenches/shell/AppShell.css` - Migrated to new semantic variables
- `packages/app/src/workbenches/sidebar/SidebarPlaceholder.css` - Migrated to new semantic variables
- `packages/app/src/workbenches/workspace/WorkspaceArea.css` - Migrated to new semantic variables
- `packages/app/src/workbenches/chat/ChatPlaceholder.css` - Migrated to new semantic variables
- `packages/app/src/status/WebSocketStatus.css` - Migrated status colors to new semantic variables
- `packages/app/src/styles/design-tokens.css` - DELETED (993 lines)
- `packages/app/src/styles/themes/dark.css` - DELETED
- `packages/app/src/styles/themes/light.css` - DELETED
- `packages/app/src/styles/themes/index.css` - DELETED
- `packages/app/src/index.css` - DELETED

## Decisions Made
- Tailwind v4 @theme with `--*: initial` clears all Tailwind defaults to establish a fully custom token system matching the UI-SPEC exactly
- Semantic tokens registered via `@theme inline` so Tailwind generates utility classes (bg-surface, text-text, etc.) that reference runtime CSS variables
- Shell CSS files kept as CSS with updated var() references rather than converting to Tailwind className (TSX component rewrite is Phase 4 scope)
- Duration tokens placed in :root outside @theme since they are consumed only via CSS var() and do not need Tailwind utility generation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Worktree was based on pre-Phase-2 commit; merged master to get workbench files before executing
- No build errors encountered; Tailwind v4 + Vite + Electron pipeline worked on first build

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all token values are real production values from the UI-SPEC, not placeholders.

## Next Phase Readiness
- Token system is complete and ready for component authors (Plan 02: core components)
- cn() utility available at @/lib/utils for all component implementations
- All Radix UI primitives installed and ready for wrapping
- CVA installed for variant-based component APIs
- Build pipeline verified working end-to-end

## Self-Check: PASSED

- All created files verified on disk (theme.css, globals.css, utils.ts)
- All deleted files confirmed absent (design-tokens.css, index.css, dark.css, light.css, themes/index.css)
- Both task commits verified in git log (59eebf0, 841c914)
- SUMMARY.md exists at expected path

---
*Phase: 03-design-system*
*Completed: 2026-04-02*
