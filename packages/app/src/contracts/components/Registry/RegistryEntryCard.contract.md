# Component Contract: RegistryEntryCard

**File:** `packages/app/src/components/RegistryBrowser/RegistryEntryCard.tsx`
**Type:** widget
**Parent Group:** Registry
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** RegistryEntryCard
- **Introduced:** 2025-12-01
- **Description:** Display card for a single registry entry showing name, type, source, status, and enable/disable toggle

---

## Render Location

**Mounts Under:**
- RegistryBrowser (in entries grid)

**Render Conditions:**
1. Always renders when passed as child to parent
2. No conditional rendering

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent RegistryBrowser renders entry list
- Entry appears in filtered results

**Key Effects:**
None — Pure presentation component

**Cleanup Actions:**
None

**Unmount Triggers:**
- Entry filtered out of view
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| entry | RegistryEntry | ✅ | N/A | Registry entry data (id, name, type, source, status, enabled) |
| onClick | () => void | ❌ | undefined | Called when card body is clicked |
| onToggle | (enabled: boolean) => void | ❌ | undefined | Called when toggle switch changed |
| onDelete | (entryId: string) => void | ❌ | undefined | Called when delete button clicked (custom-prompt only) |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onClick | `() => void` | User clicks card body |
| onToggle | `(enabled: boolean) => void` | User toggles enable/disable switch |
| onDelete | `(entryId: string) => void` | User clicks delete button (X) |

### Callbacks Down (to children)
N/A — No child components

---

## State Ownership

### Local State
N/A — Stateless presentation component

### Context Consumption
N/A

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| sourceLabel | string | `[entry.source.type]` | Maps source type to display label |
| sourceBadgeClass | string | `[entry.source.type]` | CSS class for source badge |

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onClick, onToggle, onDelete based on user interactions
- **Example:** `onClick={() => onToggle?.(e.target.checked)}`

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
- `.entry-card`
- `.entry-header`
- `.entry-name`
- `.entry-description`
- `.entry-footer`
- `.entry-type`
- `.source-badge`
- `.entry-status`
- `.entry-version`
- `.toggle-switch`
- `.entry-delete-button`
- `.custom-prompt-details`

**Data Test IDs:**
N/A

**ARIA Labels:**
- `aria-label="Delete entry"` on delete button

**Visual Landmarks:**
1. Type badge (`.entry-type`) — Colored badge showing entry type
2. Source badge (`.source-badge`) — Shows Core/Pack/Project
3. Toggle switch (`.toggle-switch`) — Enable/disable control
4. Delete button (`.entry-delete-button`) — X button (custom-prompt only)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-REC-01: Card Renders
- **Type:** render
- **Target:** Entry card element
- **Condition:** `.entry-card` exists with entry data
- **Failure Mode:** Entry not visible in grid
- **Automation Script:**
```javascript
// Chrome MCP script
const card = await page.$('.entry-card');
console.assert(card !== null, 'Entry card not rendered');
const name = await card.$eval('.entry-name', el => el.textContent);
console.assert(name.length > 0, 'Entry name not displayed');
```

#### HC-REC-02: Toggle Interaction
- **Type:** interaction
- **Target:** Toggle switch
- **Condition:** Clicking toggle calls onToggle callback
- **Failure Mode:** Toggle does not trigger state change
- **Automation Script:**
```javascript
// Chrome MCP script
const toggle = await page.$('.toggle-switch input[type="checkbox"]');
const initialChecked = await toggle.evaluate(el => el.checked);
await toggle.click();
// Parent should handle state update
```

### Warning Checks (Should Pass)

#### HC-REC-03: Delete Button Visibility
- **Type:** conditional-render
- **Target:** Delete button
- **Condition:** Only visible for custom-prompt entries when onDelete provided
- **Failure Mode:** Delete button shown for core/pack entries
- **Automation Script:**
```javascript
// Chrome MCP script
const isCustomPrompt = await page.$eval('.entry-type', el =>
  el.textContent === 'custom-prompt'
);
const deleteBtn = await page.$('.entry-delete-button');
if (isCustomPrompt) {
  console.assert(deleteBtn !== null, 'Delete button missing for custom-prompt');
} else {
  console.assert(deleteBtn === null, 'Delete button shown for non-custom-prompt');
}
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
- `entry`

---

## Notes

- Stateless presentation component — all state managed by parent
- Custom prompt entries show additional details: icon, prompt preview, "Always Visible" badge
- Delete button only rendered for custom-prompt type entries
- Toggle switch stops event propagation to prevent card click when toggling
- Entry can be in disabled state (visual dimming via `.entry-disabled`)
- Source badge color-coded: core (blue), pack (green), project (purple)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
