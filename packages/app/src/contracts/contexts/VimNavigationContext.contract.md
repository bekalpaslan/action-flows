# Component Contract: VimNavigationContext

**File:** `packages/app/src/contexts/VimNavigationContext.tsx`
**Type:** utility
**Parent Group:** contexts
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** VimNavigationContext
- **Introduced:** 2026-01-25
- **Description:** Provides Vim-style keyboard navigation system for the dashboard. Manages navigation mode (normal, insert, visual, command), target registry (navigable elements), and navigation functions (next, prev, first, last). Persists enabled state to localStorage.

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
   - **Side Effects:** Loads enabled state from localStorage (`actionflows:vim:enabled`)
   - **Cleanup:** None
   - **Condition:** On mount

2. **Dependencies:** `[isEnabled]`
   - **Side Effects:** Persists enabled state to localStorage
   - **Cleanup:** None
   - **Condition:** Whenever isEnabled changes

**Cleanup Actions:**
N/A (no cleanup required)

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
| setMode | `(mode: VimMode) => void` | All consumers | Changes Vim mode ('normal' \| 'insert' \| 'visual' \| 'command') |
| setIsEnabled | `(enabled: boolean) => void` | All consumers | Enables/disables Vim navigation, persists to localStorage |
| setCurrentTarget | `(targetId: string \| null) => void` | All consumers | Manually sets current focused target |
| registerTarget | `(targetId: string) => void` | All consumers | Registers a navigable element |
| unregisterTarget | `(targetId: string) => void` | All consumers | Unregisters a navigable element |
| navigateToTarget | `(targetId: string) => void` | All consumers | Navigates to specific target by ID |
| navigateNext | `() => void` | All consumers | Navigates to next target (j key binding) |
| navigatePrev | `() => void` | All consumers | Navigates to previous target (k key binding) |
| navigateFirst | `() => void` | All consumers | Navigates to first target (gg key binding) |
| navigateLast | `() => void` | All consumers | Navigates to last target (G key binding) |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| mode | VimMode | `'normal'` | setMode, setIsEnabled (resets to 'normal' when disabled) |
| isEnabled | boolean | `JSON.parse(localStorage.getItem('actionflows:vim:enabled')) \|\| true` | setIsEnabled |
| currentTarget | `string \| null` | `null` | setCurrentTarget, navigateNext, navigatePrev, navigateFirst, navigateLast, unregisterTarget |
| targets | `string[]` | `[]` | registerTarget, unregisterTarget |

### Context Consumption
N/A (this is a provider)

### Derived State
N/A

### Custom Hooks
N/A

---

## Interactions

### Parent Communication
- **Mechanism:** Props
- **Description:** Receives children from App.tsx, wraps entire component tree
- **Example:** `<VimNavigationProvider><App /></VimNavigationProvider>`

### Child Communication
- **Child:** VimModeIndicator, components with Vim navigation
- **Mechanism:** Context value via useVimContext()
- **Data Flow:** mode, isEnabled, currentTarget, targets, navigation functions

### Sibling Communication
N/A (provider has no siblings at app root)

### Context Interaction
- **Context:** VimNavigationContext
- **Role:** provider
- **Operations:** Provides Vim navigation state and control functions

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
| `actionflows:vim:enabled` | read | Mount | boolean (true/false) |
| `actionflows:vim:enabled` | write | setIsEnabled called | Current enabled state as JSON string |

### DOM Manipulation
N/A (context only manages state; DOM focus is handled by consumer components)

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
N/A (context provider, no visual elements; VimModeIndicator uses this context for display)

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
- VimModeIndicator component displays current mode (uses this context)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-VIM-001: Enabled State Loads from localStorage
- **Type:** persistence
- **Target:** localStorage read on mount
- **Condition:** isEnabled matches localStorage value or defaults to true
- **Failure Mode:** Vim navigation enabled state not persisted between sessions
- **Automation Script:**
```javascript
// Chrome MCP script
// Set enabled state in localStorage
await evaluateScript(() => {
  localStorage.setItem('actionflows:vim:enabled', JSON.stringify(false));
});
// Refresh page to remount provider
await navigatePage({ type: 'reload' });
await new Promise(resolve => setTimeout(resolve, 500));
// Check if enabled state loaded correctly
const isEnabled = await evaluateScript(() => {
  return window.__vimContext?.isEnabled; // Assumes context is exposed for testing
});
if (isEnabled !== false) {
  throw new Error(`Expected isEnabled=false, got: ${isEnabled}`);
}
```

#### HC-VIM-002: Target Registration and Navigation
- **Type:** state-management
- **Target:** registerTarget, navigateNext, navigatePrev functions
- **Condition:** Registering targets adds them to targets array, navigation functions cycle through correctly
- **Failure Mode:** Vim navigation does not work, keyboard shortcuts fail
- **Automation Script:**
```javascript
// Chrome MCP script
await evaluateScript(() => {
  const ctx = window.__vimContext;
  // Register 3 targets
  ctx.registerTarget('target-1');
  ctx.registerTarget('target-2');
  ctx.registerTarget('target-3');
  // Check targets array
  if (ctx.targets.length !== 3) throw new Error(`Expected 3 targets, got: ${ctx.targets.length}`);
  // Navigate next
  ctx.navigateNext();
  if (ctx.currentTarget !== 'target-1') throw new Error(`Expected target-1, got: ${ctx.currentTarget}`);
  ctx.navigateNext();
  if (ctx.currentTarget !== 'target-2') throw new Error(`Expected target-2, got: ${ctx.currentTarget}`);
  // Navigate prev
  ctx.navigatePrev();
  if (ctx.currentTarget !== 'target-1') throw new Error(`Expected target-1, got: ${ctx.currentTarget}`);
  // Navigate first
  ctx.navigateFirst();
  if (ctx.currentTarget !== 'target-1') throw new Error(`Expected target-1, got: ${ctx.currentTarget}`);
  // Navigate last
  ctx.navigateLast();
  if (ctx.currentTarget !== 'target-3') throw new Error(`Expected target-3, got: ${ctx.currentTarget}`);
  return { success: true };
});
```

#### HC-VIM-003: Unregister Target Clears currentTarget
- **Type:** lifecycle
- **Target:** unregisterTarget function
- **Condition:** Unregistering the current target sets currentTarget to null
- **Failure Mode:** Stale target reference, focus breaks
- **Automation Script:**
```javascript
// Chrome MCP script
await evaluateScript(() => {
  const ctx = window.__vimContext;
  ctx.registerTarget('target-1');
  ctx.navigateToTarget('target-1');
  if (ctx.currentTarget !== 'target-1') throw new Error('Failed to navigate to target-1');
  ctx.unregisterTarget('target-1');
  if (ctx.currentTarget !== null) throw new Error(`Expected null after unregister, got: ${ctx.currentTarget}`);
  if (ctx.targets.includes('target-1')) throw new Error('Target-1 still in targets array');
  return { success: true };
});
```

### Warning Checks (Should Pass)

#### HC-VIM-W001: Mode Reset on Disable
- **Type:** state-consistency
- **Target:** setIsEnabled function
- **Condition:** Setting isEnabled to false resets mode to 'normal'
- **Failure Mode:** Mode persists in non-normal state when disabled, confusing UX

#### HC-VIM-W002: Wraparound Navigation
- **Type:** ui-behavior
- **Target:** navigateNext, navigatePrev
- **Condition:** navigateNext at last target wraps to first, navigatePrev at first wraps to last
- **Failure Mode:** Navigation stops at boundaries instead of wrapping

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| register-time | 10 | ms | Time to register a new target |
| navigate-time | 20 | ms | Time to execute navigation function and update currentTarget |
| localStorage-write-time | 20 | ms | Time to persist enabled state |

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

- VimMode enum: 'normal' | 'insert' | 'visual' | 'command'
- Vim navigation is enabled by default (isEnabled: true)
- Keyboard bindings (j/k/h/l/gg/G) are implemented by consumer components, not the context
- targets array stores IDs of navigable elements (e.g., session IDs, file paths, component IDs)
- currentTarget tracks the currently focused element
- Navigation wraps around: navigateNext at end goes to start, navigatePrev at start goes to end
- Disabling Vim navigation resets mode to 'normal'
- useVimContext() hook throws if used outside provider (defensive programming)
- Components should call registerTarget on mount and unregisterTarget on unmount

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
