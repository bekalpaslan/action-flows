# Component Contract: PackCard

**File:** `packages/app/src/components/RegistryBrowser/PackCard.tsx`
**Type:** widget
**Parent Group:** Registry
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** PackCard
- **Introduced:** 2025-12-01
- **Description:** Display card for a behavior pack showing name, version, author, entry count, tags, and enable/uninstall controls

---

## Render Location

**Mounts Under:**
- RegistryBrowser (in packs grid)

**Render Conditions:**
1. Always renders when passed as child to parent
2. Rendered in Packs tab of RegistryBrowser

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent RegistryBrowser renders packs list
- User switches to Packs tab

**Key Effects:**
None — Pure presentation component with local UI state only

**Cleanup Actions:**
None

**Unmount Triggers:**
- User switches to Entries tab
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| pack | BehaviorPack | ✅ | N/A | Pack data (id, name, version, author, description, entries, tags, enabled) |
| onToggle | (enabled: boolean) => void | ❌ | undefined | Called when toggle switch changed |
| onUninstall | () => void | ❌ | undefined | Called when uninstall confirmed |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onToggle | `(enabled: boolean) => void` | User toggles enable/disable switch |
| onUninstall | `() => void` | User confirms uninstall |

### Callbacks Down (to children)
N/A — No child components

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| confirmingUninstall | boolean | false | handleUninstallClick, handleCancelUninstall |

### Context Consumption
N/A

### Derived State
N/A

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onToggle when switch clicked, onUninstall after confirmation
- **Example:** `onToggle?.(!pack.enabled)`

### Child Communication
N/A — No children

### Sibling Communication
N/A

### Context Interaction
N/A

---

## Side Effects

### API Calls
N/A — Parent handles all API calls

### WebSocket Events
N/A

### Timers
N/A

### LocalStorage Operations
N/A

### DOM Manipulation
N/A

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.pack-card`
- `.pack-header`
- `.pack-version`
- `.pack-description`
- `.pack-meta`
- `.pack-author`
- `.pack-entries`
- `.pack-tags`
- `.tag`
- `.pack-actions`
- `.toggle-switch`
- `.pack-action-buttons`
- `.uninstall-btn`
- `.confirm-uninstall-btn`
- `.cancel-uninstall-btn`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A — All buttons use text labels

**Visual Landmarks:**
1. Pack version badge (`.pack-version`) — Top right corner, shows "vX.X.X"
2. Entry count (`.pack-entries`) — Shows "N entries"
3. Tag list (`.pack-tags`) — Row of colored tag bubbles
4. Uninstall button (`.uninstall-btn`) — Red danger button

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-PC-01: Pack Card Renders
- **Type:** render
- **Target:** Pack card element
- **Condition:** `.pack-card` exists with pack data
- **Failure Mode:** Pack not visible in grid
- **Automation Script:**
```javascript
// Chrome MCP script
const card = await page.$('.pack-card');
console.assert(card !== null, 'Pack card not rendered');
const name = await card.$eval('.pack-header h3', el => el.textContent);
console.assert(name.length > 0, 'Pack name not displayed');
```

#### HC-PC-02: Toggle Interaction
- **Type:** interaction
- **Target:** Toggle switch
- **Condition:** Clicking toggle calls onToggle callback
- **Failure Mode:** Toggle does not trigger state change
- **Automation Script:**
```javascript
// Chrome MCP script
const toggle = await page.$('.pack-card .toggle-switch input[type="checkbox"]');
const initialChecked = await toggle.evaluate(el => el.checked);
await toggle.click();
// Parent should handle state update
```

### Warning Checks (Should Pass)

#### HC-PC-03: Uninstall Confirmation Flow
- **Type:** workflow
- **Target:** Uninstall button → confirmation state
- **Condition:** First click shows Confirm/Cancel, second click calls onUninstall
- **Failure Mode:** Immediate uninstall without confirmation
- **Automation Script:**
```javascript
// Chrome MCP script
await page.click('.uninstall-btn');
const confirmBtn = await page.$('.confirm-uninstall-btn');
const cancelBtn = await page.$('.cancel-uninstall-btn');
console.assert(confirmBtn !== null, 'Confirm button not shown');
console.assert(cancelBtn !== null, 'Cancel button not shown');
// Clicking cancel should return to normal state
await cancelBtn.click();
const uninstallBtn = await page.$('.uninstall-btn');
console.assert(uninstallBtn !== null, 'Uninstall button not restored');
```

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 16 | ms | Time to paint single card (60fps) |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None

**Required Props:**
- `pack`

---

## Notes

- Local confirmingUninstall state prevents accidental uninstalls
- Two-step uninstall: click once to enter confirmation mode, click again to execute
- Cancel button returns to normal state without calling onUninstall
- Pack disabled state applies CSS class `.pack-disabled` for visual dimming
- Tags are displayed as colored bubbles (`.tag`)
- Entry count shows total entries in pack (`.pack-entries`)
- Toggle switch label shows "Enabled"/"Disabled" text

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
