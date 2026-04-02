# Phase 4: Layout & Navigation - Research

**Researched:** 2026-04-01
**Domain:** React resizable panel layout, sidebar navigation, command palette
**Confidence:** HIGH

## Summary

Phase 4 replaces the fixed CSS Grid layout (`grid-template-columns: 220px 1fr 300px`) in AppShell with a resizable 3-panel layout using react-resizable-panels, rebuilds the sidebar with collapse/expand behavior and lucide icons, adds a vertical pipeline/content split inside the workspace, and implements a command palette via cmdk. The two new dependencies (react-resizable-panels 4.8.0 and cmdk 1.1.1) are not currently installed and must be added.

The existing codebase is clean and well-structured for this upgrade. AppShell.tsx is 19 lines, SidebarPlaceholder.tsx is 29 lines, WorkspaceArea.tsx is 33 lines, ChatPlaceholder.tsx is 9 lines -- all small files with clear boundaries. The Phase 3 component library (Button, Tooltip, Badge, Dialog) provides the building blocks. The design token system (theme.css) and cn() utility are fully operational. The zustand uiStore currently has only `activeWorkbench` state and needs extension.

**Primary recommendation:** Install the two new packages, then build bottom-up: extend types/store first, then build the panel layout (AppShell rewrite), sidebar, workspace split, and command palette as independent components that compose into the shell.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LAYOUT-01 | 3-panel resizable layout: sidebar (~20%), workspace (~55%), chat panel (~25%) | react-resizable-panels PanelGroup with horizontal direction, percentage-based Panel sizes, autoSaveId for persistence |
| LAYOUT-02 | Sidebar navigation with 7 default workbenches (Work, Explore, Review, PM, Settings, Archive, Studio) | Rebuild SidebarPlaceholder as Sidebar with lucide icons, collapse/expand via panel collapsible prop, WorkbenchMeta.icon field |
| LAYOUT-03 | Workspace split: pipeline visualizer (top ~25%) + content area (bottom ~75%) | Nested vertical PanelGroup inside workspace Panel, PipelinePlaceholder for Phase 5, existing page routing preserved |
| LAYOUT-04 | Panels resizable with min/max constraints and collapse support | Panel minSize/maxSize props, collapsible + collapsedSize, onCollapse/onExpand callbacks synced to zustand |
| LAYOUT-05 | Command palette with keyboard navigation (Cmd+K / Cmd+P) | cmdk Command.Dialog with Radix Dialog integration, fuzzy filtering, workbench navigation + toggle actions |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-resizable-panels | 4.8.0 | 3-panel resizable layout with collapse | De facto library for IDE-like resizable panels in React. Powers shadcn/ui Resizable. Supports horizontal/vertical, min/max, collapse/snap, keyboard resize, localStorage persistence. |
| cmdk | 1.1.1 | Command palette component | Radix-based accessible command palette. Built-in fuzzy filtering, keyboard navigation, Command.Dialog for modal usage. Used by shadcn/ui Command. |

**Verified versions:**
- `react-resizable-panels`: 4.8.0 (confirmed via `npm view` on 2026-04-01)
- `cmdk`: 1.1.1 (confirmed via `npm view` on 2026-04-01)

### Supporting (already installed)

| Library | Version | Purpose | Phase 4 Usage |
|---------|---------|---------|---------------|
| lucide-react | 1.7.0 | Icon library | 7 workbench icons + UI action icons (ChevronLeft, ChevronRight, Search, PanelLeftClose, PanelRightClose, PanelTopClose) |
| zustand | 5.0.12 | State management | Extended with sidebar/chat/pipeline/commandPalette boolean state |
| @radix-ui/react-tooltip | 1.2.8 | Tooltips | Collapsed sidebar item tooltips |
| @radix-ui/react-dialog | 1.1.15 | Dialog primitive | cmdk Command.Dialog uses Radix Dialog internally (shared dependency) |
| class-variance-authority | 0.7.1 | Variant API | SidebarItem variants (active/inactive, expanded/collapsed) |
| clsx + tailwind-merge | 2.1.1 / 3.5.0 | Class composition | cn() utility for all new components |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-resizable-panels | allotment | Allotment is derived from VS Code split view. react-resizable-panels has better React ergonomics, is the shadcn/ui standard, and has more active v4 maintenance. |
| cmdk | kbar | kbar is a full command bar framework. cmdk is lighter, Radix-based, and better for custom styling. kbar ships its own animation system which conflicts with the project's token-based approach. |
| Nested PanelGroup | CSS flexbox for pipeline/content | Using a nested PanelGroup gives consistent resize UX across all splits. CSS flexbox would require building custom resize logic. |

**Installation:**
```bash
cd packages/app
pnpm add react-resizable-panels@^4.8.0 cmdk@^1.1.1
```

## Architecture Patterns

### Recommended Project Structure
```
packages/app/src/
  workbenches/
    shell/
      AppShell.tsx           # REWRITE: PanelGroup with 3 horizontal panels
      AppShell.css           # DELETE: replaced by Tailwind utilities
    sidebar/
      Sidebar.tsx            # NEW: replaces SidebarPlaceholder
      SidebarItem.tsx        # NEW: individual nav item with icon + tooltip
      SidebarPlaceholder.tsx # DELETE after migration
      SidebarPlaceholder.css # DELETE after migration
    workspace/
      WorkspaceArea.tsx      # REWRITE: nested vertical PanelGroup
      WorkspaceArea.css      # DELETE: replaced by Tailwind utilities
      PipelinePlaceholder.tsx # NEW: Phase 5 placeholder
    chat/
      ChatPlaceholder.tsx    # MODIFY: remove CSS import, add Tailwind classes
      ChatPlaceholder.css    # DELETE
    pages/                   # UNCHANGED: 7 workbench pages preserved
  components/
    command-palette/
      CommandPalette.tsx     # NEW: cmdk-based command palette
      CommandPaletteItem.tsx # NEW: individual command renderer
      useCommands.ts         # NEW: hook providing command list
  stores/
    uiStore.ts              # EXTEND: sidebar/chat/pipeline/palette state
  lib/
    types.ts                # EXTEND: WorkbenchMeta.icon field
```

### Pattern 1: react-resizable-panels Horizontal Layout

**What:** Replace CSS Grid with PanelGroup for the 3-column layout.
**When to use:** AppShell component.
**Critical constraint:** Panel and PanelResizeHandle elements must be direct DOM children of PanelGroup. No wrapper divs between PanelGroup and its children.

```typescript
// Source: react-resizable-panels API docs
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export function AppShell() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const chatCollapsed = useUIStore((s) => s.chatCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const setChatCollapsed = useUIStore((s) => s.setChatCollapsed);
  useWebSocket();

  return (
    <PanelGroup direction="horizontal" autoSaveId="app-layout">
      <Panel
        defaultSize={15}
        minSize={4}
        maxSize={25}
        collapsible
        collapsedSize={4}
        onCollapse={() => setSidebarCollapsed(true)}
        onExpand={() => setSidebarCollapsed(false)}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </Panel>
      <PanelResizeHandle className="drag-handle" />
      <Panel defaultSize={60} minSize={35}>
        <WorkspaceArea workbenchId={activeWorkbench} />
      </Panel>
      <PanelResizeHandle className="drag-handle" />
      <Panel
        defaultSize={25}
        minSize={0}
        maxSize={40}
        collapsible
        collapsedSize={0}
        onCollapse={() => setChatCollapsed(true)}
        onExpand={() => setChatCollapsed(false)}
      >
        <ChatPlaceholder />
      </Panel>
    </PanelGroup>
  );
}
```

### Pattern 2: Nested Vertical PanelGroup for Workspace

**What:** Split workspace into pipeline (top) and content (bottom).
**When to use:** WorkspaceArea component.

```typescript
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export function WorkspaceArea({ workbenchId }: { workbenchId: WorkbenchId }) {
  const pipelineCollapsed = useUIStore((s) => s.pipelineCollapsed);
  const setPipelineCollapsed = useUIStore((s) => s.setPipelineCollapsed);
  const Page = PAGE_MAP[workbenchId];

  return (
    <PanelGroup direction="vertical" autoSaveId="workspace-split">
      <Panel
        defaultSize={25}
        minSize={10}
        maxSize={50}
        collapsible
        collapsedSize={0}
        onCollapse={() => setPipelineCollapsed(true)}
        onExpand={() => setPipelineCollapsed(false)}
      >
        <PipelinePlaceholder />
      </Panel>
      <PanelResizeHandle className="drag-handle-horizontal" />
      <Panel defaultSize={75} minSize={50}>
        <main className="overflow-y-auto p-6" role="main">
          <Page />
        </main>
      </Panel>
    </PanelGroup>
  );
}
```

### Pattern 3: cmdk Command Palette with Dialog

**What:** Command palette as modal overlay using Command.Dialog.
**When to use:** CommandPalette component.
**Key point:** Command.Dialog composes Radix Dialog internally. The existing Dialog component in the project is NOT used -- cmdk provides its own dialog wrapper that integrates with Radix directly.

```typescript
import { Command } from 'cmdk';

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const commands = useCommands();

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
    >
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Empty>No commands match your search.</Command.Empty>
        <Command.Group heading="Navigation">
          {commands.navigation.map((cmd) => (
            <Command.Item key={cmd.id} onSelect={cmd.action} value={cmd.label}>
              <cmd.icon className="h-5 w-5 text-text-dim" />
              <span>{cmd.label}</span>
              {cmd.shortcut && <Badge variant="default" size="sm">{cmd.shortcut}</Badge>}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

### Pattern 4: Sidebar with Collapse/Expand

**What:** Sidebar that renders icon+label when expanded, icon-only with tooltips when collapsed.
**When to use:** Sidebar component.

```typescript
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui';

function SidebarItem({ workbench, isActive, collapsed, onSelect }: SidebarItemProps) {
  const Icon = workbench.icon;
  const content = (
    <li
      role="listitem"
      className={cn(
        'flex items-center h-11 cursor-pointer rounded-md transition-colors',
        collapsed ? 'justify-center px-3' : 'gap-2 px-4 py-2',
        isActive
          ? 'bg-surface-3 text-text border-l-[3px] border-l-accent'
          : 'text-text-dim hover:bg-surface-3 hover:text-text border-l-[3px] border-l-transparent'
      )}
      onClick={onSelect}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="text-caption font-semibold">{workbench.label}</span>}
    </li>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{workbench.label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
```

### Pattern 5: Imperative Panel Control

**What:** Programmatic collapse/expand from keyboard shortcuts and command palette.
**When to use:** When command palette toggles need to control panels.

```typescript
import { type ImperativePanelHandle } from 'react-resizable-panels';

// In AppShell, create refs for collapsible panels
const sidebarRef = useRef<ImperativePanelHandle>(null);
const chatRef = useRef<ImperativePanelHandle>(null);

// Pass ref to Panel
<Panel ref={sidebarRef} collapsible ... />

// Toggle from zustand action or keyboard handler
function toggleSidebar() {
  if (sidebarRef.current?.isCollapsed()) {
    sidebarRef.current.expand();
  } else {
    sidebarRef.current?.collapse();
  }
}
```

### Pattern 6: Global Keyboard Shortcuts

**What:** Register keyboard shortcuts that work across the app.
**When to use:** useKeyboardShortcuts hook called in AppShell.

```typescript
function useKeyboardShortcuts() {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setActiveWorkbench = useUIStore((s) => s.setActiveWorkbench);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd+K: toggle command palette
      if (mod && e.key === 'k') { e.preventDefault(); toggleCommandPalette(); }
      // Ctrl+B: toggle sidebar
      if (mod && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
      // Number keys 1-7: switch workbench (only when no input focused)
      if (!mod && e.key >= '1' && e.key <= '7' && !isInputFocused()) {
        const workbenches: WorkbenchId[] = ['work','explore','review','pm','settings','archive','studio'];
        setActiveWorkbench(workbenches[parseInt(e.key) - 1]);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette, toggleSidebar, setActiveWorkbench]);
}
```

### Anti-Patterns to Avoid

- **Wrapping Panel children in divs:** PanelGroup requires Panel and PanelResizeHandle as direct children. Any wrapper div between PanelGroup and Panel breaks the layout engine.
- **Using CSS grid alongside PanelGroup:** PanelGroup manages its own flex layout. Do not apply `display: grid` or override `display`, `flex-direction`, `flex-wrap`, or `overflow` on PanelGroup.
- **Separate localStorage for panel state:** Use `autoSaveId` on PanelGroup. Do not build custom localStorage persistence -- the library handles it.
- **Syncing panel sizes to zustand:** Only sync collapsed/expanded booleans to zustand (for conditional rendering). Panel pixel/percentage sizes are managed by react-resizable-panels internally via autoSaveId. Attempting to round-trip sizes through React state causes jank.
- **Building custom fuzzy search for cmdk:** cmdk has built-in filtering. Only override `shouldFilter={false}` if you need a completely custom backend search.
- **Using the project's Dialog component for command palette:** cmdk's Command.Dialog already wraps Radix Dialog internally. Using the project's Dialog component on top would create double-overlay, double-focus-trap issues.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resizable panel layout | Custom resize handles with mouse events | react-resizable-panels PanelGroup/Panel/PanelResizeHandle | Keyboard a11y (role="separator", arrow keys), touch support, collapse snapping, localStorage persistence, nested groups -- dozens of edge cases. |
| Layout persistence | localStorage get/set with debounce | autoSaveId prop on PanelGroup | Library handles serialization, deserialization, and layout restoration on mount. |
| Command palette search | Custom fuzzy match algorithm | cmdk's built-in filter | cmdk handles ranking, keyboard navigation, accessibility (listbox/option ARIA roles), empty state. |
| Modal overlay for palette | Custom portal + backdrop + focus trap | Command.Dialog (wraps Radix Dialog) | Focus trapping, scroll lock, escape handling, backdrop click, portal -- all built in. |
| Sidebar collapse animation | CSS transition on width | Panel collapsible + collapsedSize | react-resizable-panels handles the resize transition. Sidebar content switches between expanded/collapsed rendering based on a boolean. |
| OS-aware keyboard shortcuts | navigator.platform parsing | `e.metaKey \|\| e.ctrlKey` pattern | Covers Cmd (macOS) and Ctrl (Windows/Linux). cmdk auto-displays correct modifier in UI. |

**Key insight:** The two libraries (react-resizable-panels + cmdk) handle all the complex interaction patterns. The custom code is limited to: zustand state, component composition, Tailwind styling, and keyboard shortcut registration.

## Common Pitfalls

### Pitfall 1: PanelGroup Direct Children Constraint
**What goes wrong:** Adding a wrapper `<div>` between `<PanelGroup>` and `<Panel>` breaks layout completely.
**Why it happens:** react-resizable-panels uses a flex container model where Panel and PanelResizeHandle must be direct children.
**How to avoid:** Never wrap Panel/PanelResizeHandle in intermediary elements. If you need conditional rendering, use fragments or conditional Panel props.
**Warning signs:** Panels render at 0px width, or resize handles don't work.

### Pitfall 2: Panel onCollapse Fires on Mount
**What goes wrong:** `onCollapse` callback fires when the component mounts if the panel starts in collapsed state (from autoSaveId restore).
**Why it happens:** react-resizable-panels calls onCollapse/onExpand to sync initial state.
**How to avoid:** Initialize zustand state to match the expected initial collapsed state, or guard against redundant state updates in the callback.
**Warning signs:** Unexpected state flicker on page load.

### Pitfall 3: cmdk Command.Dialog vs Custom Dialog Double-Wrapping
**What goes wrong:** Using the project's Dialog component around Command.Dialog creates two overlays, two focus traps, and broken keyboard navigation.
**Why it happens:** Command.Dialog already wraps Radix Dialog internally.
**How to avoid:** Use Command.Dialog directly. Style the overlay and content using cmdk's data attributes (`[cmdk-dialog]`, `[cmdk-overlay]`) or the `className` prop. Do NOT wrap in the project's Dialog.
**Warning signs:** Escape key doesn't close palette, focus is trapped incorrectly, double backdrop.

### Pitfall 4: Keyboard Shortcut Conflicts with Inputs
**What goes wrong:** Number keys 1-7 for workbench switching fire when user is typing in an input field or the command palette search.
**Why it happens:** Global keydown listener doesn't check if an input element has focus.
**How to avoid:** Check `document.activeElement?.tagName` for INPUT, TEXTAREA, or contentEditable elements before handling number key shortcuts. Also skip when command palette is open.
**Warning signs:** Typing "123" in search switches workbenches.

### Pitfall 5: PanelGroup Styling Overrides
**What goes wrong:** Applying `display`, `flex-direction`, `flex-wrap`, or `overflow` styles to PanelGroup breaks the layout engine.
**Why it happens:** react-resizable-panels manages these CSS properties internally.
**How to avoid:** Only apply `className` for background, color, font, and height/width. Never override display or flex properties on PanelGroup.
**Warning signs:** Panels stack vertically when they should be horizontal, or content overflows.

### Pitfall 6: Missing TooltipProvider
**What goes wrong:** Tooltips on collapsed sidebar items don't render.
**Why it happens:** Radix Tooltip requires a `<TooltipProvider>` ancestor in the component tree.
**How to avoid:** Ensure `<TooltipProvider>` wraps the Sidebar (or is at the App level). The project already exports TooltipProvider from the UI library -- add it to App.tsx or AppShell.
**Warning signs:** Collapsed sidebar shows no tooltips on hover.

### Pitfall 7: CSS File Cleanup After Tailwind Migration
**What goes wrong:** Deleted CSS files still referenced via `import './AppShell.css'` cause build errors.
**Why it happens:** When replacing CSS files with Tailwind classes, the import statement is forgotten.
**How to avoid:** Delete both the CSS file AND its import statement in the same task. Search for all `.css` imports in workbenches/ and remove them.
**Warning signs:** Build fails with "Module not found" for .css files.

### Pitfall 8: WorkspaceArea key Prop Preservation
**What goes wrong:** WorkspaceArea stops clean-remounting when workbench changes, causing stale state in page components.
**Why it happens:** The current AppShell uses `<WorkspaceArea key={activeWorkbench}>` to force remount. If the key prop is lost during the rewrite, React reuses the component.
**How to avoid:** Preserve the `key={activeWorkbench}` prop on the workspace Panel or WorkspaceArea component.
**Warning signs:** Switching workbenches shows content from the previous workbench.

## Code Examples

### Drag Handle Styling (Tailwind)

```typescript
// Source: UI-SPEC drag handle contract
function DragHandle({ direction = 'vertical' }: { direction?: 'vertical' | 'horizontal' }) {
  return (
    <PanelResizeHandle
      className={cn(
        'relative flex items-center justify-center',
        'before:absolute before:rounded-full before:bg-transparent',
        'before:transition-[background-color] before:duration-fast before:ease-in-out',
        'hover:before:bg-border-strong/50',
        'active:before:bg-accent/30',
        direction === 'vertical'
          ? 'w-[10px] cursor-col-resize before:h-8 before:w-1'
          : 'h-[10px] cursor-row-resize before:h-1 before:w-8'
      )}
    />
  );
}
```

### Zustand Store Extension

```typescript
// Source: UI-SPEC state management contract
import { create } from 'zustand';
import type { WorkbenchId } from '../lib/types';

interface UIState {
  activeWorkbench: WorkbenchId;
  setActiveWorkbench: (id: WorkbenchId) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  chatCollapsed: boolean;
  setChatCollapsed: (collapsed: boolean) => void;
  toggleChat: () => void;

  pipelineCollapsed: boolean;
  setPipelineCollapsed: (collapsed: boolean) => void;
  togglePipeline: () => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeWorkbench: 'work',
  setActiveWorkbench: (id) => set({ activeWorkbench: id }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  chatCollapsed: false,
  setChatCollapsed: (collapsed) => set({ chatCollapsed: collapsed }),
  toggleChat: () => set((s) => ({ chatCollapsed: !s.chatCollapsed })),

  pipelineCollapsed: false,
  setPipelineCollapsed: (collapsed) => set({ pipelineCollapsed: collapsed }),
  togglePipeline: () => set((s) => ({ pipelineCollapsed: !s.pipelineCollapsed })),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
}));
```

### WorkbenchMeta Type Extension

```typescript
// Source: UI-SPEC workbench icons
import type { LucideIcon } from 'lucide-react';
import {
  Briefcase, Compass, ShieldCheck, LayoutDashboard,
  Settings, Archive, Palette
} from 'lucide-react';

export interface WorkbenchMeta {
  id: WorkbenchId;
  label: string;
  icon: LucideIcon;
}

export const WORKBENCHES: readonly WorkbenchMeta[] = [
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'review', label: 'Review', icon: ShieldCheck },
  { id: 'pm', label: 'PM', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'studio', label: 'Studio', icon: Palette },
] as const;
```

### useCommands Hook

```typescript
// Source: UI-SPEC command palette default groups
import type { LucideIcon } from 'lucide-react';
import { PanelLeftClose, PanelRightClose, PanelTopClose } from 'lucide-react';
import { WORKBENCHES } from '@/lib/types';
import { useUIStore } from '@/stores/uiStore';

interface CommandItem {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
  group: 'navigation' | 'actions';
}

export function useCommands(): CommandItem[] {
  const setActiveWorkbench = useUIStore((s) => s.setActiveWorkbench);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleChat = useUIStore((s) => s.toggleChat);
  const togglePipeline = useUIStore((s) => s.togglePipeline);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  const navigation: CommandItem[] = WORKBENCHES.map((wb, i) => ({
    id: `nav-${wb.id}`,
    label: wb.label,
    icon: wb.icon,
    shortcut: String(i + 1),
    action: () => { setActiveWorkbench(wb.id); setCommandPaletteOpen(false); },
    group: 'navigation',
  }));

  const actions: CommandItem[] = [
    { id: 'toggle-sidebar', label: 'Toggle sidebar', icon: PanelLeftClose, action: () => { toggleSidebar(); setCommandPaletteOpen(false); }, group: 'actions' },
    { id: 'toggle-chat', label: 'Toggle chat panel', icon: PanelRightClose, action: () => { toggleChat(); setCommandPaletteOpen(false); }, group: 'actions' },
    { id: 'toggle-pipeline', label: 'Toggle pipeline', icon: PanelTopClose, action: () => { togglePipeline(); setCommandPaletteOpen(false); }, group: 'actions' },
  ];

  return [...navigation, ...actions];
}
```

### Command Palette Styling via Data Attributes

```css
/* cmdk provides data attributes for styling. Apply via Tailwind @apply or direct utility classes. */
/* Key selectors: [cmdk-root], [cmdk-input], [cmdk-list], [cmdk-item], [cmdk-group-heading] */
/* [data-selected="true"] on items for highlighted state */
/* --cmdk-list-height CSS variable for animating list height changes */
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS Grid fixed columns | react-resizable-panels PanelGroup | Phase 4 (now) | Users can resize all panels, collapse sidebar/chat |
| BEM CSS classes (.sidebar__item) | Tailwind utility classes via cn() | Phase 3 established, Phase 4 migrates shell | All workbench CSS files deleted, replaced by Tailwind |
| Plain sidebar with text labels | Icon + text sidebar with collapse to icon-only | Phase 4 (now) | More compact navigation, VS Code-like UX |
| No command palette | cmdk-based Cmd+K palette | Phase 4 (now) | Keyboard-driven navigation across workbenches |

**Deprecated/outdated:**
- SidebarPlaceholder.tsx + SidebarPlaceholder.css: replaced by Sidebar.tsx + SidebarItem.tsx
- AppShell.css (fixed grid): replaced by PanelGroup in AppShell.tsx
- WorkspaceArea.css: replaced by Tailwind utilities
- ChatPlaceholder.css: replaced by Tailwind utilities

## Open Questions

1. **Panel imperative handle wiring**
   - What we know: react-resizable-panels provides `panelRef` with `collapse()`, `expand()`, `isCollapsed()`. The command palette "Toggle sidebar" action needs to call these.
   - What's unclear: Whether to pass refs up to AppShell and down to CommandPalette, or use zustand actions that trigger ref-based operations via useEffect.
   - Recommendation: Use zustand for the boolean state (sidebarCollapsed, etc.) and let the Panel's `onCollapse`/`onExpand` callbacks sync to zustand. For programmatic toggle from command palette, store the imperative handles in a module-level ref map or a dedicated zustand slice. The simplest approach: create a `panelHandles` module-level object that components register their refs into.

2. **Sidebar click-to-expand behavior in collapsed state**
   - What we know: UI-SPEC says "Click workbench item (collapsed) -> Switches workbench AND expands sidebar."
   - What's unclear: Whether to use the imperative `expand()` on the Panel ref, or to resize the sidebar by updating the PanelGroup layout.
   - Recommendation: Use the imperative handle. The SidebarItem onClick handler should call `setActiveWorkbench(wb.id)` AND call `sidebarPanelRef.expand()`. This requires the sidebar to have access to its parent Panel's imperative handle, which can be passed as a prop or stored in a module-level registry.

3. **WebSocketStatus component CSS migration**
   - What we know: WebSocketStatus currently uses `./WebSocketStatus.css` with BEM classes.
   - What's unclear: Whether to migrate WebSocketStatus to Tailwind in Phase 4 scope, or leave it with its CSS file.
   - Recommendation: Migrate it since the Sidebar component needs it to render correctly without the old CSS grid. It's small (19 lines of JSX) and the CSS is purely cosmetic.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.0 + @testing-library/react 14.1.2 |
| Config file | packages/app/vitest.config.ts (exists, references missing setup.ts) |
| Quick run command | `cd packages/app && pnpm test` |
| Full suite command | `cd packages/app && pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAYOUT-01 | 3-panel horizontal layout renders sidebar, workspace, chat | unit | `cd packages/app && pnpm vitest run src/workbenches/shell/AppShell.test.tsx` | No -- Wave 0 |
| LAYOUT-02 | Sidebar renders 7 workbenches, switches on click, shows icons | unit | `cd packages/app && pnpm vitest run src/workbenches/sidebar/Sidebar.test.tsx` | No -- Wave 0 |
| LAYOUT-03 | Workspace renders pipeline + content split, shows correct page | unit | `cd packages/app && pnpm vitest run src/workbenches/workspace/WorkspaceArea.test.tsx` | No -- Wave 0 |
| LAYOUT-04 | Panels collapse/expand, zustand state syncs with panel state | unit | `cd packages/app && pnpm vitest run src/stores/uiStore.test.ts` | No -- Wave 0 |
| LAYOUT-05 | Command palette opens on Cmd+K, filters commands, selects items | unit | `cd packages/app && pnpm vitest run src/components/command-palette/CommandPalette.test.tsx` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd packages/app && pnpm test`
- **Per wave merge:** `cd packages/app && pnpm test && pnpm type-check`
- **Phase gate:** Full suite green + type-check before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/app/src/__tests__/setup.ts` -- vitest setup file (referenced in config but doesn't exist; needs @testing-library/jest-dom setup)
- [ ] `packages/app/src/workbenches/shell/AppShell.test.tsx` -- covers LAYOUT-01
- [ ] `packages/app/src/workbenches/sidebar/Sidebar.test.tsx` -- covers LAYOUT-02
- [ ] `packages/app/src/workbenches/workspace/WorkspaceArea.test.tsx` -- covers LAYOUT-03
- [ ] `packages/app/src/stores/uiStore.test.ts` -- covers LAYOUT-04
- [ ] `packages/app/src/components/command-palette/CommandPalette.test.tsx` -- covers LAYOUT-05
- [ ] Mock for react-resizable-panels (PanelGroup, Panel, PanelResizeHandle render as divs in test env)

## Project Constraints (from CLAUDE.md)

- **Styling:** No raw CSS in agent output. Component library (Radix + Tailwind + CVA) is the only way to build UI. All workbench CSS files being deleted aligns with this.
- **Design tokens:** All colors via `var(--color-*)` tokens. No hex values in component code.
- **State management:** Zustand module singletons (not React context providers). Phase 4 extends the existing uiStore pattern.
- **Component patterns:** cn() utility with clsx + tailwind-merge for all class composition. CVA for variant definitions.
- **TypeScript:** Strict mode, no `as any`. All new interfaces properly typed.
- **Naming:** PascalCase for components, camelCase for hooks/functions, test files use `.test.ts(x)` suffix.
- **Build commands:** `pnpm type-check` must pass. `pnpm test` must pass.
- **Commit style:** Conventional commits (feat:, fix:, refactor:).

## Sources

### Primary (HIGH confidence)
- react-resizable-panels GitHub README (v4 API) -- PanelGroup, Panel, PanelResizeHandle props, imperative API, direct-children constraint
- cmdk GitHub README -- Command.Dialog, Command.Input, Command.List, Command.Item, Command.Group, Command.Empty, data attributes, filtering
- npm registry -- react-resizable-panels 4.8.0, cmdk 1.1.1 verified via `npm view`
- Project source code -- AppShell.tsx, SidebarPlaceholder.tsx, WorkspaceArea.tsx, ChatPlaceholder.tsx, uiStore.ts, types.ts, theme.css, globals.css, button.tsx, tooltip.tsx, badge.tsx, dialog.tsx, vitest.config.ts, package.json

### Secondary (MEDIUM confidence)
- [react-resizable-panels npm](https://www.npmjs.com/package/react-resizable-panels) -- version confirmation
- [cmdk npm](https://www.npmjs.com/package/cmdk) -- version confirmation
- [shadcn/ui Resizable](https://github.com/shadcn-ui/ui/issues/9197) -- v4 compatibility patterns

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - both packages verified via npm, API confirmed via official READMEs
- Architecture: HIGH - existing codebase fully audited, all files read, structure clear
- Pitfalls: HIGH - direct-children constraint, onCollapse-on-mount, and Dialog double-wrap are well-documented issues
- Code examples: HIGH - patterns derived from official API docs + project's existing conventions

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable libraries, unlikely to have breaking changes)
