# App Layout Specification

> Canonical reference for the 6-layer layout hierarchy.

## Layer Map

```
App shell (root)
├── 1: Left Sidebar (AppSidebar)
│   - Full height, fixed width
│   - Workbench navigation (stars: work, maintenance, explore, review, pm, settings)
│
├── 6: Main Content (parent flex container)
│   └── 3: Workbench Panel (WorkbenchLayout)
│       ├── Star Content Area
│       │   └── 4: Inner panel (toolbar / sub-region within star)
│       │
│       └── 5: Chat Window (SlidingChatWindow)
│           - Per-workbench state (tied to workbench context)
│           - Toggleable: when hidden, star content expands to fill all of 6
│           - Managed by ChatWindowContext (saveAndSwitch on workbench change)
│
└── 2: Bottom Bar (CommandCenter)
    - Full width, below main content
    - Input field, session dropdown, health indicator
```

## Dynamic Behavior

- **Chat toggle:** When chat (5) is hidden on a workbench, star content within 3 expands to fill all available space in 6.
- **Workbench switch:** Switching workbenches swaps the star content AND preserves per-workbench chat state (visible/hidden, scroll position).
- **Terminal (planned):** TerminalContext mirrors chat pattern — per-workbench terminal state with saveAndSwitch.

## Key Relationships

| Layer | Component | Parent | Flex Role |
|-------|-----------|--------|-----------|
| 1 | AppSidebar | App shell | Fixed width |
| 2 | CommandCenter | App shell | Fixed height, full width |
| 3 | WorkbenchLayout | 6 (Main Content) | Flex child, contains star + chat |
| 4 | Star sub-panel | 3 (Star content) | Content region within star |
| 5 | SlidingChatWindow | 3 (WorkbenchLayout) | Toggleable, per-workbench |
| 6 | Main Content | App shell | Flex parent for 3 |

## Visual Reference

```
┌──────┬──────────────────────────────────┐
│      │  ┌───────────────────┐  ┌──────┐ │
│      │  │                   │  │      │ │
│  1   │  │        4          │  │      │ │
│      │  │   (star sub)      │  │  5   │ │
│ Side │  ├───────────────────┤  │ Chat │ │
│ bar  │  │                   │  │      │ │
│      │  │        3          │  │      │ │
│      │  │   (workbench)     │  │      │ │
│      │  │                   │  └──────┘ │
│      │  └───────────────────┘    6      │
├──────┴──────────────────────────────────┤
│              2 (CommandCenter)           │
└─────────────────────────────────────────┘
```

When chat (5) is hidden:

```
┌──────┬──────────────────────────────────┐
│      │  ┌──────────────────────────────┐│
│      │  │                              ││
│  1   │  │            4                 ││
│      │  │       (star sub)             ││
│ Side │  ├──────────────────────────────┤│
│ bar  │  │                              ││
│      │  │            3                 ││
│      │  │       (workbench full)       ││
│      │  │                              ││
│      │  └──────────────────────────────┘│
│      │               6                  │
├──────┴──────────────────────────────────┤
│              2 (CommandCenter)           │
└─────────────────────────────────────────┘
```
