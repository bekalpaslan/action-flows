# App Layout Specification

> Canonical reference for the panel-based layout system.
> See `layout-demo.html` for a live interactive demo.

## Global Spacing

All spacing between panels is controlled by a single CSS variable:

```css
--gap: 20px;  /* configurable — change once, affects everything */
```

This value controls:
- Padding between the app shell edge and all panels
- Column gap between sidebar and main content area
- Row gap between the top row (sidebar, workbench, chat) and the command center
- Internal padding within panels (toolbar, content area, chat messages, input areas)
- Gap between cards, chat bubbles, and other inner elements

## Panel Architecture

The app shell is a CSS grid with 4 independent panels. Every panel is its own rounded-rect container with `border-radius: 10px`, separated by `--gap` on all sides.

```
App shell (CSS grid, 2 columns × 2 rows)
│
├── Row 1, Column 1: Sidebar (AppSidebar)
│   - Fixed width: 260px
│   - Contains: logo/header, search, new session button, star navigation, user footer
│   - Does NOT span into row 2
│
├── Row 1, Column 2: Main Content (flex container)
│   ├── Workbench Panel (WorkbenchLayout) — flex: 1
│   │   ├── Star Toolbar (inside panel, not separate)
│   │   │   - Fixed height: 48px
│   │   │   - Separated from content by a bottom border, not a gap
│   │   │   - Contains: workbench title, badge, chat toggle, actions
│   │   │
│   │   └── Star Content Area
│   │       - Fills remaining height below toolbar
│   │       - Scrollable, card grid layout
│   │
│   └── Chat Window (SlidingChatWindow) — fixed width: 360px
│       - Only panel that moves (slides open/closed)
│       - When hidden: width collapses to 0, workbench expands to fill
│       - Per-workbench state (ChatWindowContext)
│
└── Row 2, Column 1–2: Command Center (full width)
    - Fixed height: 64px
    - Independent panel spanning both columns
    - Contains: command input, session dropdown, keyboard shortcut hints, health indicator
```

## Grid Structure

```css
.app-shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: 1fr 64px;
  column-gap: var(--gap);
  row-gap: var(--gap);
  padding: var(--gap);
  height: 100vh;
}
```

## Panel Placement Rules

1. **Every panel is independent** — own background, own border, own border-radius (10px). No panel is a visual extension of another.
2. **Panels do not touch** — `--gap` separates every panel from every other panel and from the app shell edge.
3. **Sub-panels stay static** — sidebar (260px), toolbar (48px), command center (64px) never resize.
4. **Only chat moves** — the chat window is the only panel that toggles visibility. When hidden, its width animates to 0 and the gap collapses with it.
5. **Toolbar is part of workbench** — the star toolbar lives inside the workbench panel (same background, shared border). It is separated from the content area by a `border-bottom`, not a gap.

## Key Relationships

| Panel | Grid Position | Size | Behavior |
|-------|--------------|------|----------|
| Sidebar | Row 1, Col 1 | 260px wide, stretches row height | Fixed, static |
| Workbench | Row 1, Col 2 (flex child) | Fills remaining width | Static, contains toolbar + content |
| Chat Window | Row 1, Col 2 (flex child) | 360px wide | Slides open/closed |
| Command Center | Row 2, Col 1–2 | Full width, 64px tall | Fixed, static |

## Visual Reference

Chat open (default):

```
┌─ app shell padding (--gap) ──────────────────────────────┐
│                                                          │
│  ┌──────────┐  ┌─────────────────────────┐  ┌────────┐  │
│  │          │  │ Toolbar (inside panel)   │  │        │  │
│  │          │  ├─────────────────────────┤  │        │  │
│  │  1       │  │                         │  │  5     │  │
│  │  Side    │  │    Star Content         │  │  Chat  │  │
│  │  bar     │  │    (scrollable)         │  │        │  │
│  │          │  │                         │  │        │  │
│  │          │  │       3 (workbench)     │  │        │  │
│  └──────────┘  └─────────────────────────┘  └────────┘  │
│         ↕ --gap                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │              2 (Command Center)                   │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
     ↔ --gap between all panels and shell edges
```

Chat hidden (workbench expands):

```
┌─ app shell padding (--gap) ──────────────────────────────┐
│                                                          │
│  ┌──────────┐  ┌────────────────────────────────────┐    │
│  │          │  │ Toolbar (inside panel)              │    │
│  │          │  ├────────────────────────────────────┤    │
│  │  1       │  │                                    │    │
│  │  Side    │  │    Star Content (full width)       │    │
│  │  bar     │  │                                    │    │
│  │          │  │                                    │    │
│  │          │  │       3 (workbench expanded)       │    │
│  └──────────┘  └────────────────────────────────────┘    │
│         ↕ --gap                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │              2 (Command Center)                   │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Dynamic Behavior

- **Chat toggle:** Only the chat window (5) slides. When hidden, its width animates to 0 and the workbench panel (3) expands via `flex: 1` to fill the available space. The gap between workbench and chat collapses with it.
- **Workbench switch:** Switching stars swaps the content inside the workbench panel AND preserves per-workbench chat state (visible/hidden, scroll position, selected session).
- **Terminal (planned):** TerminalContext mirrors chat pattern — per-workbench terminal state with saveAndSwitch.

## Fixed Sizes Summary

| Element | Size | Configurable |
|---------|------|-------------|
| Gap (all spacing) | 20px | `--gap` variable |
| Sidebar width | 260px | `--sidebar-w` variable |
| Toolbar height | 48px | `--toolbar-h` variable |
| Command center height | 64px | `--bottom-h` variable |
| Chat window width | 360px | `--chat-w` variable |
| Panel border radius | 10px | Hardcoded |
