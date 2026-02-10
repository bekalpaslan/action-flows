# Component Contract: VimModeIndicator

**File:** `packages/app/src/components/VimModeIndicator/VimModeIndicator.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** VimModeIndicator
- **Introduced:** 2025-09-01
- **Description:** Shows current Vim navigation mode (NORMAL/INSERT/VISUAL/COMMAND) with color-coded pill and toggle button

---

## Render Location

**Mounts Under:**
- App root (global indicator)
- Bottom-right or top-right corner of viewport

**Render Conditions:**
1. Returns null when `isEnabled === false`
2. Otherwise always renders

**Positioning:** fixed (via CSS)
**Z-Index:** 999 (typically)

---

## Lifecycle

**Mount Triggers:**
- App root renders
- Vim mode enabled in VimNavigationContext

**Key Effects:**
None — All mode logic in VimNavigationContext

**Cleanup Actions:**
None

**Unmount Triggers:**
- App unmounts
- Vim mode disabled (component returns null)

---

## Props Contract

### Inputs
N/A — No props, uses VimNavigationContext

### Callbacks Up (to parent)
N/A — Communicates via VimNavigationContext

### Callbacks Down (to children)
N/A — No child components

---

## State Ownership

### Local State
N/A — Stateless

### Context Consumption
| Context | Values Used |
|---------|-------------|
| VimNavigationContext | mode, isEnabled, setIsEnabled |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| modeColor | string | `[mode]` | getModeColor() returns hex color for current mode |

### Custom Hooks
- `useVimContext()` — VimNavigationContext consumer

---

## Interactions

### Parent Communication
- **Mechanism:** context (VimNavigationContext)
- **Description:** Reads current mode, calls setIsEnabled(false) to toggle off
- **Example:** User clicks toggle button → setIsEnabled(false) → Component returns null

### Child Communication
N/A — No children

### Sibling Communication
N/A

### Context Interaction
- **Context:** VimNavigationContext
- **Role:** consumer
- **Operations:** Reads mode/isEnabled, calls setIsEnabled()

---

## Side Effects

### API Calls
N/A

### WebSocket Events
N/A

### Timers
N/A

### LocalStorage Operations
N/A — Handled by VimNavigationContext

### DOM Manipulation
N/A

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.vim-mode-indicator`
- `.vim-mode-pill`
- `.vim-mode-text`
- `.vim-toggle-button`

**Data Test IDs:**
N/A

**ARIA Labels:**
- `role="status"` on pill
- `aria-live="polite"` on pill
- `aria-label="Vim mode: {mode}"` on pill
- `aria-label="Toggle Vim Mode"` on button
- `title="Toggle Vim Mode"` on button

**Visual Landmarks:**
1. Color-coded pill (`.vim-mode-pill`) — Green (normal), blue (insert), purple (visual), orange (command)
2. Mode text (`.vim-mode-text`) — Shows uppercase mode name
3. Toggle button (`.vim-toggle-button`) — SVG "V" icon button

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-VMI-01: Indicator Renders When Enabled
- **Type:** conditional-render
- **Target:** Indicator element
- **Condition:** Renders when isEnabled=true, null when isEnabled=false
- **Failure Mode:** Indicator visible when Vim mode disabled
- **Automation Script:**
```javascript
// Chrome MCP script
// Assume Vim mode enabled
const indicator = await page.$('.vim-mode-indicator');
if (indicator) {
  console.log('Vim mode indicator found (enabled)');
} else {
  console.log('Vim mode indicator not found (disabled)');
}
```

#### HC-VMI-02: Mode Color Matches State
- **Type:** visual-consistency
- **Target:** Pill background color
- **Condition:** Color matches mode (green=normal, blue=insert, purple=visual, orange=command)
- **Failure Mode:** Wrong color displayed
- **Automation Script:**
```javascript
// Chrome MCP script
const pill = await page.$('.vim-mode-pill');
const bgColor = await pill.evaluate(el =>
  window.getComputedStyle(el).backgroundColor
);
const modeText = await pill.$eval('.vim-mode-text', el => el.textContent);
// Verify color matches mode (requires color parsing)
console.log(`Mode: ${modeText}, Color: ${bgColor}`);
```

#### HC-VMI-03: Toggle Button Works
- **Type:** interaction
- **Target:** Toggle button
- **Condition:** Clicking button calls setIsEnabled(false) → indicator disappears
- **Failure Mode:** Button does not toggle
- **Automation Script:**
```javascript
// Chrome MCP script
await page.click('.vim-toggle-button');
await page.waitForTimeout(100);
const indicator = await page.$('.vim-mode-indicator');
console.assert(indicator === null, 'Vim mode indicator should disappear after toggle');
```

### Warning Checks (Should Pass)

#### HC-VMI-04: Mode Text Uppercase
- **Type:** visual-consistency
- **Target:** Mode text
- **Condition:** Text is uppercase (NORMAL, INSERT, VISUAL, COMMAND)
- **Failure Mode:** Lowercase mode text

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| mode-change-time | 50 | ms | Time to update display after mode change |
| render-time | 10 | ms | Time to paint indicator |

---

## Dependencies

**Required Contexts:**
- VimNavigationContext

**Required Hooks:**
- `useVimContext()`

**Child Components:**
None

**Required Props:**
N/A

---

## Notes

- Returns null early when isEnabled=false (conditional render)
- Mode colors: normal (#4caf50 green), insert (#2196f3 blue), visual (#9c27b0 purple), command (#ff9800 orange)
- Pill has glowing box-shadow matching background color (opacity 25%)
- Toggle button shows SVG icon with "V" character
- ARIA role="status" and aria-live="polite" for accessibility
- Mode text always uppercase via CSS or JavaScript
- Fixed positioning (typically bottom-right corner)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
