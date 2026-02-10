# Component Contract: ThemeToggle

**File:** `packages/app/src/components/ThemeToggle/ThemeToggle.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ThemeToggle
- **Introduced:** 2025-08-01
- **Description:** Button to toggle between light/dark/system theme modes with SVG icons

---

## Render Location

**Mounts Under:**
- TopBar (global header)
- Settings panels

**Render Conditions:**
1. Always renders

**Positioning:** inline-block
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent component renders

**Key Effects:**
None — All theme logic in ThemeContext

**Cleanup Actions:**
None

**Unmount Triggers:**
- Parent unmounts

---

## Props Contract

### Inputs
N/A — No props, uses ThemeContext

### Callbacks Up (to parent)
N/A — Communicates via ThemeContext

### Callbacks Down (to children)
N/A — No child components

---

## State Ownership

### Local State
N/A — Stateless

### Context Consumption
| Context | Values Used |
|---------|-------------|
| ThemeContext | theme, resolvedTheme, toggleTheme |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| icon | JSX.Element | `[theme, resolvedTheme]` | getIcon() returns SVG based on current theme |
| ariaLabel | string | `[theme, resolvedTheme]` | getAriaLabel() returns descriptive label |

### Custom Hooks
- `useTheme()` — ThemeContext consumer

---

## Interactions

### Parent Communication
- **Mechanism:** context (ThemeContext)
- **Description:** Calls toggleTheme() which updates global theme state
- **Example:** User clicks button → toggleTheme() → ThemeContext updates → Document theme changes

### Child Communication
N/A — No children

### Sibling Communication
N/A

### Context Interaction
- **Context:** ThemeContext
- **Role:** consumer
- **Operations:** Reads theme/resolvedTheme, calls toggleTheme()

---

## Side Effects

### API Calls
N/A

### WebSocket Events
N/A

### Timers
N/A

### LocalStorage Operations
N/A — Handled by ThemeContext

### DOM Manipulation
N/A — ThemeContext sets `data-theme` attribute on `<html>`

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.theme-toggle`
- `.theme-toggle__icon`

**Data Test IDs:**
N/A

**ARIA Labels:**
- Dynamic `aria-label` based on current theme
- Examples: "Switch to light mode", "Switch to dark mode", "Using system theme (currently dark). Click to switch to light mode."

**Visual Landmarks:**
1. Sun icon (light mode active)
2. Moon icon (dark mode active)
3. Monitor icon (system mode active)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-TT-01: Button Renders
- **Type:** render
- **Target:** Theme toggle button
- **Condition:** `.theme-toggle` exists with icon
- **Failure Mode:** Button not visible
- **Automation Script:**
```javascript
// Chrome MCP script
const button = await page.$('.theme-toggle');
console.assert(button !== null, 'Theme toggle button not rendered');
const icon = await button.$('.theme-toggle__icon');
console.assert(icon !== null, 'Theme icon not rendered');
```

#### HC-TT-02: Theme Toggle Cycles
- **Type:** interaction
- **Target:** toggleTheme() function
- **Condition:** Clicking button cycles: dark → light → system → dark
- **Failure Mode:** Theme does not change on click
- **Automation Script:**
```javascript
// Chrome MCP script
const initialTheme = await page.evaluate(() =>
  document.documentElement.getAttribute('data-theme')
);
await page.click('.theme-toggle');
await page.waitForTimeout(100);
const newTheme = await page.evaluate(() =>
  document.documentElement.getAttribute('data-theme')
);
console.assert(initialTheme !== newTheme, 'Theme did not change on click');
```

### Warning Checks (Should Pass)

#### HC-TT-03: Icon Matches Theme
- **Type:** visual-consistency
- **Target:** SVG icon shape
- **Condition:** Sun for light, moon for dark, monitor for system
- **Failure Mode:** Wrong icon displayed

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| click-response-time | 50 | ms | Time from click to theme change visible |
| render-time | 10 | ms | Time to paint button |

---

## Dependencies

**Required Contexts:**
- ThemeContext

**Required Hooks:**
- `useTheme()`

**Child Components:**
None

**Required Props:**
N/A

---

## Notes

- Theme cycle: dark → light → system → dark
- SVG icons inline (no external assets)
- Icons use currentColor for consistency with theme
- ARIA label provides context for accessibility
- ThemeContext handles localStorage persistence and DOM updates
- Resolved theme shows actual theme when system mode active
- Button has no visual state changes (no hover/active styling mentioned)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
