# Component Contract: ThemeContext

**File:** `packages/app/src/contexts/ThemeContext.tsx`
**Type:** utility
**Parent Group:** contexts
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ThemeContext
- **Introduced:** 2026-01-18
- **Description:** Manages application theme state (dark, light, or system preference) with localStorage persistence and automatic system preference detection. Applies theme to document.documentElement via data-theme attribute.

---

## Render Location

**Mounts Under:**
- App.tsx (root level provider)

**Render Conditions:**
1. Always renders (root provider)

**Positioning:** N/A (context provider)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Application initialization

**Key Effects:**
1. **Dependencies:** `[]` (mount only)
   - **Side Effects:** Loads theme from localStorage (`actionflows:theme`), resolves 'system' to actual preference via window.matchMedia
   - **Cleanup:** None
   - **Condition:** On mount

2. **Dependencies:** `[resolvedTheme]`
   - **Side Effects:** Applies theme to document.documentElement.setAttribute('data-theme', resolvedTheme)
   - **Cleanup:** None
   - **Condition:** Whenever resolvedTheme changes

3. **Dependencies:** `[theme]`
   - **Side Effects:** Adds event listener to window.matchMedia('(prefers-color-scheme: dark)') to detect system preference changes
   - **Cleanup:** Removes media query event listener
   - **Condition:** Whenever theme changes (to detect system preference changes when theme is 'system')

**Cleanup Actions:**
- Removes media query event listener for '(prefers-color-scheme: dark)'

**Unmount Triggers:**
- Application shutdown (never unmounts in normal operation)

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | ✅ | N/A | Child components to receive context |

### Callbacks Up (to parent)
N/A (root provider)

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| setTheme | `(theme: Theme) => void` | All consumers | Sets theme ('dark' \| 'light' \| 'system'), persists to localStorage |
| toggleTheme | `() => void` | All consumers | Toggles between 'dark' and 'light' (ignores 'system') |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| theme | Theme ('dark' \| 'light' \| 'system') | `getStoredTheme()` | setTheme, toggleTheme |
| resolvedTheme | ResolvedTheme ('dark' \| 'light') | `resolveTheme(getStoredTheme())` | setTheme, toggleTheme, media query listener |

### Context Consumption
N/A (this is a provider)

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| isDark | boolean | `[resolvedTheme]` | `resolvedTheme === 'dark'` |
| isLight | boolean | `[resolvedTheme]` | `resolvedTheme === 'light'` |
| isSystem | boolean | `[theme]` | `theme === 'system'` |

### Custom Hooks
N/A

---

## Interactions

### Parent Communication
- **Mechanism:** Props
- **Description:** Receives children from App.tsx, wraps entire component tree
- **Example:** `<ThemeProvider><App /></ThemeProvider>`

### Child Communication
- **Child:** ThemeToggle, any component consuming theme
- **Mechanism:** Context value via useTheme()
- **Data Flow:** theme, resolvedTheme, setTheme, toggleTheme, isDark, isLight, isSystem

### Sibling Communication
N/A (provider has no siblings at app root)

### Context Interaction
- **Context:** ThemeContext
- **Role:** provider
- **Operations:** Provides theme state, setter, toggle, and derived boolean flags

---

## Side Effects

### API Calls
N/A

### WebSocket Events
N/A

### Timers
N/A

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| `actionflows:theme` | read | Mount | 'dark' \| 'light' \| 'system' |
| `actionflows:theme` | write | setTheme called | Current theme value |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| `document.documentElement` | setAttribute('data-theme', resolvedTheme) | resolvedTheme changes (mount, setTheme, toggleTheme, system preference change) |

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `html[data-theme="dark"]`
- `html[data-theme="light"]`

**Data Test IDs:**
N/A (context provider, no visual elements)

**ARIA Labels:**
N/A

**Visual Landmarks:**
- Check `document.documentElement.getAttribute('data-theme')` for current theme

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-TH-001: Theme Loads from localStorage
- **Type:** persistence
- **Target:** localStorage read on mount
- **Condition:** theme matches localStorage value or defaults to 'system'
- **Failure Mode:** User loses theme preference between sessions
- **Automation Script:**
```javascript
// Chrome MCP script
// Set a known theme in localStorage
await evaluateScript(() => {
  localStorage.setItem('actionflows:theme', 'dark');
});
// Refresh page to remount provider
await navigatePage({ type: 'reload' });
await new Promise(resolve => setTimeout(resolve, 500));
// Check if theme loaded correctly
const theme = await evaluateScript(() => {
  return document.documentElement.getAttribute('data-theme');
});
if (theme !== 'dark') {
  throw new Error(`Expected 'dark' theme, got: ${theme}`);
}
```

#### HC-TH-002: setTheme Updates DOM and localStorage
- **Type:** state-mutation
- **Target:** setTheme function
- **Condition:** Calling setTheme('light') updates data-theme attribute and persists to localStorage
- **Failure Mode:** Theme changes do not apply, no persistence
- **Automation Script:**
```javascript
// Chrome MCP script
// Get initial theme
const initialTheme = await evaluateScript(() => {
  return document.documentElement.getAttribute('data-theme');
});
// Click theme toggle button
await click({ uid: 'theme-toggle-button' }); // Assumes ThemeToggle has data-testid
await new Promise(resolve => setTimeout(resolve, 200));
// Check DOM update
const newTheme = await evaluateScript(() => {
  return document.documentElement.getAttribute('data-theme');
});
if (newTheme === initialTheme) {
  throw new Error(`Theme did not change from ${initialTheme}`);
}
// Check localStorage persistence
const storedTheme = await evaluateScript(() => {
  return localStorage.getItem('actionflows:theme');
});
if (storedTheme !== newTheme) {
  throw new Error(`localStorage (${storedTheme}) does not match DOM (${newTheme})`);
}
```

#### HC-TH-003: System Preference Detection
- **Type:** system-integration
- **Target:** window.matchMedia('(prefers-color-scheme: dark)')
- **Condition:** When theme is 'system', resolvedTheme matches OS preference
- **Failure Mode:** System theme setting does not work
- **Automation Script:**
```javascript
// Chrome MCP script
// Set theme to 'system'
await evaluateScript(() => {
  localStorage.setItem('actionflows:theme', 'system');
});
await navigatePage({ type: 'reload' });
await new Promise(resolve => setTimeout(resolve, 500));
// Get system preference
const systemPreference = await evaluateScript(() => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
});
// Get applied theme
const appliedTheme = await evaluateScript(() => {
  return document.documentElement.getAttribute('data-theme');
});
if (appliedTheme !== systemPreference) {
  throw new Error(`Applied theme (${appliedTheme}) does not match system (${systemPreference})`);
}
```

### Warning Checks (Should Pass)

#### HC-TH-W001: Media Query Listener Responds to OS Changes
- **Type:** reactivity
- **Target:** Media query change listener
- **Condition:** When OS theme changes, resolvedTheme updates (requires OS-level change, hard to automate)
- **Failure Mode:** Theme does not update when user changes OS preference

#### HC-TH-W002: toggleTheme Cycles Between Dark and Light
- **Type:** ui-behavior
- **Target:** toggleTheme function
- **Condition:** Calling toggleTheme switches from dark to light or light to dark (ignores system)
- **Failure Mode:** Theme toggle button does not work correctly

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| theme-apply-time | 50 | ms | Time from setTheme call to DOM update |
| localStorage-write-time | 20 | ms | Time to persist theme to localStorage |
| media-query-response-time | 100 | ms | Time from OS preference change to resolvedTheme update |

---

## Dependencies

**Required Contexts:**
N/A (this is a root provider)

**Required Hooks:**
N/A

**Child Components:**
N/A (wraps entire app)

**Required Props:**
- `children` (ReactNode)

---

## Notes

- Theme enum: 'dark' | 'light' | 'system'
- ResolvedTheme enum: 'dark' | 'light' (system is resolved to one of these)
- CSS variables for dark/light themes are defined in :root[data-theme="dark"] and :root[data-theme="light"]
- toggleTheme ignores 'system' setting and toggles between explicit dark/light
- Media query listener is compatible with both modern (addEventListener) and legacy (addListener) browsers
- useTheme() hook throws if used outside provider (defensive programming)
- System preference detection uses window.matchMedia('(prefers-color-scheme: dark)')

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
