# Component Contract: TerminalPanel

**File:** `packages/app/src/components/Terminal/TerminalPanel.tsx`
**Type:** feature
**Parent Group:** Terminal Components
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** TerminalPanel
- **Introduced:** 2025-Q4
- **Description:** Read-only xterm.js terminal for agent output with step attribution, resizable panel, search, and export features.

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | SessionId | ❌ | undefined | Session identifier |
| height | number | ✅ | N/A | Panel height in pixels |
| onHeightChange | (height: number) => void | ✅ | N/A | Height change callback |
| isCollapsed | boolean | ✅ | N/A | Collapsed state |
| onToggleCollapse | () => void | ✅ | N/A | Toggle collapse callback |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onHeightChange | `(height: number) => void` | Called during resize drag |
| onToggleCollapse | `() => void` | Called when collapse button clicked |

### Callbacks Down (to children)
None (leaf component with xterm.js)

---

## Render Location

**Mounts Under:**
- Bottom panel in workbench layouts

**Render Conditions:**
1. Always rendered (collapsible but not removed)

**Positioning:** fixed (bottom panel)
**Z-Index:** Above content, below modals

---

## Lifecycle

**Mount Triggers:**
- Parent layout renders

**Key Effects:**
1. **Dependencies:** `[]`
   - **Side Effects:** Initializes xterm with SearchAddon, sets read-only (disableStdin: true), loads FitAddon
   - **Cleanup:** Disposes xterm instance
   - **Condition:** Runs once on mount

2. **Dependencies:** `[]`
   - **Side Effects:** Window resize listener for fitAddon.fit()
   - **Cleanup:** Removes resize listener
   - **Condition:** Runs once on mount

3. **Dependencies:** `[height, isCollapsed]`
   - **Side Effects:** Calls fitAddon.fit() to adjust terminal size
   - **Cleanup:** None
   - **Condition:** Runs when height or collapse state changes

4. **Dependencies:** `[isResizing]`
   - **Side Effects:** Adds mouse move/up listeners during resize drag
   - **Cleanup:** Removes mouse listeners
   - **Condition:** Runs when isResizing changes

**Cleanup Actions:**
- Dispose xterm instance
- Remove resize listener
- Remove mouse listeners

**Unmount Triggers:**
- Parent unmounts

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| isResizing | boolean | false | Mouse down/up on resize handle |

### Context Consumption
None

### Derived State
None

### Custom Hooks
- `useDiscussButton()` — Discuss dialog integration

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Reports height changes and collapse toggles to parent
- **Example:** User drags resize handle → onHeightChange(newHeight) → parent updates layout

### Child Communication
None (xterm.js is external library)

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
None

### WebSocket Events
None (read-only display)

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| terminalRef | xterm.open() | Terminal initialization |
| xterm | write(), clear() | writeOutput method, Clear button |
| document | Mouse move/up listeners | Resize drag |

### Electron IPC
None

---

## Test Hooks

**CSS Selectors:**
- `.terminal-panel`
- `.terminal-panel.collapsed`
- `.terminal-header`
- `button[title="Search (Ctrl+Shift+F)"]`
- `button[title="Clear"]`
- `button[title="Export"]`
- `.xterm` (xterm.js container)
- `.xterm canvas` (xterm.js canvas)

**Data Test IDs:**
None

**ARIA Labels:**
None

**Visual Landmarks:**
1. Terminal header with collapse/expand button (`.terminal-header`)
2. Toolbar with Search, Clear, Export buttons
3. xterm.js canvas (`.xterm canvas`)
4. Resize handle at top edge

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-TP-001: Panel Render
- **Type:** render
- **Target:** TerminalPanel container
- **Condition:** `.terminal-panel` exists
- **Failure Mode:** No terminal panel displayed
- **Automation Script:**
```javascript
const panel = document.querySelector('.terminal-panel');
if (!panel) throw new Error('Terminal panel not rendered');
return true;
```

#### HC-TP-002: xterm Initialization (Expanded)
- **Type:** render
- **Target:** xterm.js canvas
- **Condition:** `.xterm canvas` exists when panel is expanded
- **Failure Mode:** Terminal not functional
- **Automation Script:**
```javascript
const panel = document.querySelector('.terminal-panel');
if (panel.classList.contains('collapsed')) {
  return { collapsed: true };
}
const xtermCanvas = panel.querySelector('.xterm canvas');
if (!xtermCanvas) throw new Error('xterm not initialized');
return true;
```

### Warning Checks (Should Pass)

#### HC-TP-003: Toolbar Buttons
- **Type:** render
- **Target:** Search and Export buttons
- **Condition:** Buttons exist in header
- **Failure Mode:** Limited terminal functionality
- **Automation Script:**
```javascript
const panel = document.querySelector('.terminal-panel');
const searchBtn = panel.querySelector('button[title="Search (Ctrl+Shift+F)"]');
const exportBtn = panel.querySelector('button[title="Export"]');
return { hasSearch: !!searchBtn, hasExport: !!exportBtn };
```

#### HC-TP-004: Resize Handle
- **Type:** interaction
- **Target:** Drag handle
- **Condition:** Mouse down triggers isResizing=true
- **Failure Mode:** Panel height cannot be adjusted

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 200 | ms | Time to initialize xterm and render |
| resize-latency | 50 | ms | Time from drag to visual feedback |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
- useState
- useRef
- useEffect
- useDiscussButton

**Child Components:**
None (uses xterm.js library)

**Required Props:**
- height
- onHeightChange
- isCollapsed
- onToggleCollapse

---

## Notes

- Read-only terminal (disableStdin: true)
- Step attribution via writeOutput method (accepts stepNumber parameter)
- Resizable via drag handle (100-600px range enforced)
- Search in terminal via SearchAddon (Ctrl+Shift+F)
- Export to log file feature
- Collapsible with header-only mode (shows only header when collapsed)
- Window resize listener keeps terminal fitted to container
- Mouse move/up listeners added during resize drag, removed after
- xterm.js refs stored in useRef to avoid re-renders

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
