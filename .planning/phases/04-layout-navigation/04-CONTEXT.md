# Phase 4: Layout & Navigation - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the fixed-width shell layout from Phase 2 with a fully resizable 3-panel layout using react-resizable-panels. Sidebar collapses to icon-only mode. Chat panel is collapsible. Workspace splits into pipeline region (top) and content area (bottom). Command palette (Cmd+K) provides full navigation + action access. All new UI uses the Phase 3 design system components.

</domain>

<decisions>
## Implementation Decisions

### Panel Resizing
- **D-01:** Sidebar collapses to icon-only mode below ~80px width. Hover or click to expand temporarily. Above 80px shows icon + label.
- **D-02:** Chat panel (right side) is collapsible — can collapse to a thin strip or hidden entirely. Workspace takes full width when chat is collapsed. Toggle to reopen.
- **D-03:** All panels use react-resizable-panels with min/max constraints and drag handles.

### Command Palette
- **D-04:** Full-featured command palette (Cmd+K / Ctrl+K) — navigation + actions: switch workbenches, run flows, toggle panels, change theme, search sessions. Power user tool from the start.

### Sidebar Design
- **D-05:** Expanded sidebar shows icon + text label for each workbench. Standard app sidebar pattern.
- **D-06:** When collapsed to icon-only mode, icons represent workbenches. Tooltip on hover shows name.

### Claude's Discretion
- Workspace pipeline/content split proportions and resize behavior
- Command palette library choice (cmdk recommended by research)
- Drag handle visual design
- Panel persistence (remember sizes across sessions via localStorage)
- Keyboard shortcuts beyond Cmd+K
- Active workbench indicator style (accent border, background, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System (Phase 3 output — use these components)
- `packages/app/src/components/ui/index.ts` — Barrel export of all 12 components
- `packages/app/src/components/ui/manifest.json` — Agent-readable component registry
- `packages/app/src/styles/theme.css` — Complete token system (Tailwind v4 @theme)
- `packages/app/src/lib/utils.ts` — cn() utility

### Current Shell (Phase 2 output — being upgraded)
- `packages/app/src/workbenches/shell/AppShell.tsx` — Current fixed-width 3-region grid
- `packages/app/src/workbenches/sidebar/SidebarPlaceholder.tsx` — Current sidebar with 7 workbenches
- `packages/app/src/workbenches/workspace/WorkspaceArea.tsx` — Current workspace
- `packages/app/src/workbenches/chat/ChatPlaceholder.tsx` — Current chat placeholder

### Project Research
- `.planning/research/STACK.md` — react-resizable-panels 4.8.0, cmdk v1 recommendations
- `.planning/research/FEATURES.md` — Command palette as table stakes

### Phase 2 UI-SPEC
- `.planning/phases/02-frontend-scaffold-websocket/02-UI-SPEC.md` — Original layout proportions and color specs

</canonical_refs>

<code_context>
## Existing Code Insights

### What Gets Upgraded
- `AppShell.tsx` — CSS grid with fixed widths → react-resizable-panels with drag handles
- `SidebarPlaceholder.tsx` — Fixed 220px → resizable with icon-only collapse mode
- `ChatPlaceholder.tsx` — Fixed 300px → collapsible panel
- `WorkspaceArea.tsx` — Add pipeline/content split (currently single region)

### What Gets Created
- Command palette component (cmdk-based)
- Panel layout with react-resizable-panels
- Icon-only sidebar mode
- Panel collapse/expand behavior
- localStorage persistence for panel sizes

### Available Components (from Phase 3)
- Button, Card, Badge, Avatar, Input, Select, Checkbox, Radio, Dialog, Tabs, Tooltip, Dropdown
- All using Tailwind v4 + cn() utility

### Integration Points
- `packages/app/src/stores/uiStore.ts` — Already has activeWorkbench state, extend with panel sizes/collapse state
- `packages/app/src/hooks/useWebSocket.ts` — Already wired in AppShell

</code_context>

<specifics>
## Specific Ideas

No specific references beyond the proportions defined in the original layout spec (~20% sidebar, ~55% workspace, ~25% chat). The command palette should feel like VS Code's Cmd+K — fast, searchable, keyboard-driven.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-layout-navigation*
*Context gathered: 2026-04-02*
