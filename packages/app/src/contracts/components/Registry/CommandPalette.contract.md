# Component Contract: CommandPalette

**File:** `packages/app/src/components/CommandPalette/CommandPalette.tsx`
**Type:** feature
**Parent Group:** Registry / Navigation
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** CommandPalette
- **Introduced:** 2025-11-01
- **Description:** Modal command palette (Ctrl+K / Cmd+K) for quick navigation and command execution

---

## Render Location

**Mounts Under:**
- App root (via portal or conditional render)

**Render Conditions:**
1. Renders when `isOpen === true` from useCommandPalette hook
2. Opened via Ctrl+K / Cmd+K keyboard shortcut
3. Returns null when closed

**Positioning:** fixed
**Z-Index:** 1000 (backdrop), 1001 (modal)

---

## Lifecycle

**Mount Triggers:**
- User presses Ctrl+K (Windows/Linux) or Cmd+K (Mac)
- Parent component calls useCommandPalette.open()

**Key Effects:**
1. **Dependencies:** `[isOpen]`
   - **Side Effects:** Sets focus to input field, registers Tab key trap
   - **Cleanup:** Removes Tab key listener
   - **Condition:** Only when isOpen === true

**Cleanup Actions:**
- Removes keydown event listener for Tab trap

**Unmount Triggers:**
- User presses Escape
- User clicks backdrop
- User selects a command (closes after execution)
- useCommandPalette.close() called

---

## Props Contract

### Inputs
N/A — Uses useCommandPalette hook internally, no props

### Callbacks Up (to parent)
N/A — Self-contained, communicates via context/global shortcuts

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onChange | `(value: string) => void` | CommandPaletteInput | Updates search query |
| onSelect | `(cmd: Command) => void` | CommandPaletteResults | Executes selected command |
| onHover | `(index: number) => void` | CommandPaletteResults | Updates selected index |
| handleSend | `(message: string) => void` | DiscussDialog | Sends discuss message |

---

## State Ownership

### Local State
N/A — All state managed by useCommandPalette hook

### Context Consumption
| Context | Values Used |
|---------|-------------|
| useCommandPalette | isOpen, close, query, setQuery, results, selectedIndex, setSelectedIndex, executeCommand |
| DiscussContext | via useDiscussButton hook |

### Derived State
N/A — All derived state in hook

### Custom Hooks
- `useCommandPalette()` — Manages command palette state, shortcuts, command registry
- `useDiscussButton({ componentName, getContext })` — DiscussButton integration

---

## Interactions

### Parent Communication
- **Mechanism:** global keyboard shortcut (Ctrl+K / Cmd+K)
- **Description:** Opens palette via global listener registered in useCommandPalette
- **Example:** User presses Ctrl+K → hook sets isOpen=true → component renders

### Child Communication
- **Child:** CommandPaletteInput
- **Mechanism:** props
- **Data Flow:** Passes query value, onChange callback, autoFocus

- **Child:** CommandPaletteResults
- **Mechanism:** props
- **Data Flow:** Passes results array, selectedIndex, onSelect, onHover callbacks

- **Child:** DiscussButton / DiscussDialog
- **Mechanism:** props
- **Data Flow:** Opens discuss dialog, sends formatted messages

### Sibling Communication
N/A

### Context Interaction
- **Context:** useCommandPalette
- **Role:** consumer
- **Operations:** Reads state, calls close(), setQuery(), executeCommand()

---

## Side Effects

### API Calls
N/A — Commands may trigger API calls, but palette itself does not

### WebSocket Events
N/A

### Timers
N/A

### LocalStorage Operations
N/A — Command registry may persist preferences (handled by hook)

### DOM Manipulation
- **Target:** First focusable element (input)
- **Operation:** .focus() on mount
- **Trigger:** useEffect when isOpen === true

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.command-palette-backdrop`
- `.command-palette-modal`
- `.command-palette-input` (via child)
- `.command-palette-results` (via child)

**Data Test IDs:**
N/A

**ARIA Labels:**
- `role="dialog"` on modal
- `aria-modal="true"` on modal
- `aria-label="Command palette"` on modal
- `role="presentation"` on backdrop

**Visual Landmarks:**
1. Backdrop overlay (`.command-palette-backdrop`) — Full-screen semi-transparent overlay
2. Centered modal (`.command-palette-modal`) — White/themed modal box
3. Input at top (`.command-palette-input`) — Search/filter input
4. Results list below (`.command-palette-results`) — Filtered command list

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CP-01: Keyboard Shortcut
- **Type:** interaction
- **Target:** Global Ctrl+K / Cmd+K listener
- **Condition:** Pressing shortcut opens palette
- **Failure Mode:** Palette does not open on shortcut
- **Automation Script:**
```javascript
// Chrome MCP script
// Trigger keyboard shortcut
await page.keyboard.down('Control');
await page.keyboard.press('KeyK');
await page.keyboard.up('Control');
await page.waitForSelector('.command-palette-modal', { timeout: 500 });
const modal = await page.$('.command-palette-modal');
console.assert(modal !== null, 'Command palette did not open on Ctrl+K');
```

#### HC-CP-02: Focus Trap
- **Type:** keyboard-navigation
- **Target:** Tab key cycling
- **Condition:** Tab cycles through focusable elements, wraps at edges
- **Failure Mode:** Focus escapes modal
- **Automation Script:**
```javascript
// Chrome MCP script
await page.keyboard.press('Tab');
const activeElement = await page.evaluateHandle(() => document.activeElement);
const isInsideModal = await page.evaluate(
  (el, modal) => modal.contains(el),
  activeElement,
  await page.$('.command-palette-modal')
);
console.assert(isInsideModal, 'Focus escaped modal on Tab');
```

#### HC-CP-03: Escape to Close
- **Type:** interaction
- **Target:** Escape key listener (from useCommandPalette)
- **Condition:** Pressing Escape closes palette
- **Failure Mode:** Palette remains open
- **Automation Script:**
```javascript
// Chrome MCP script
await page.keyboard.press('Escape');
await page.waitForSelector('.command-palette-modal', { hidden: true, timeout: 500 });
const modal = await page.$('.command-palette-modal');
console.assert(modal === null, 'Command palette did not close on Escape');
```

### Warning Checks (Should Pass)

#### HC-CP-04: Backdrop Click
- **Type:** interaction
- **Target:** Backdrop click listener
- **Condition:** Clicking backdrop closes palette
- **Failure Mode:** Palette remains open

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| open-animation-time | 150 | ms | Time for modal to appear and animate in |
| input-focus-time | 50 | ms | Time from open to input focus |
| filter-update-time | 50 | ms | Time to re-render results after query change |

---

## Dependencies

**Required Contexts:**
- CommandPaletteContext (via useCommandPalette hook)

**Required Hooks:**
- `useCommandPalette()`
- `useDiscussButton()`

**Child Components:**
- CommandPaletteInput
- CommandPaletteResults
- DiscussButton
- DiscussDialog

**Required Props:**
N/A — Self-contained

---

## Notes

- Global keyboard shortcut Ctrl+K / Cmd+K managed by useCommandPalette hook
- Escape key handled by hook, not component directly
- Focus trap implemented with Tab key listener to prevent focus escape
- Backdrop click calls close(), modal click stops propagation
- Command execution closes palette automatically (handled by hook)
- Results filtered by query in real-time (no debounce)
- Selected index managed by hook, keyboard navigation (Up/Down/Enter) in hook
- DiscussButton provides context: query, resultCount, selectedCommand

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
