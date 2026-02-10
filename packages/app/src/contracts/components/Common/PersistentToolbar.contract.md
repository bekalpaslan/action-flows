# Component Contract: PersistentToolbar

**File:** `packages/app/src/components/PersistentToolbar/PersistentToolbar.tsx`
**Type:** feature
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** PersistentToolbar
- **Introduced:** 2025-12-15
- **Description:** Project-scoped toolbar with frequency-based button ordering, pin/unpin support, and suggested buttons section

---

## Render Location

**Mounts Under:**
- Project-specific UI containers
- Settings panels

**Render Conditions:**
1. Always renders (shows loading/error states)

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders with projectId

**Key Effects:**
1. **Dependencies:** `[projectId]`
   - **Side Effects:** HTTP GET `/api/toolbar/:projectId/config` on mount
   - **Cleanup:** None
   - **Condition:** Runs when projectId changes

**Cleanup Actions:**
None

**Unmount Triggers:**
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| projectId | ProjectId | ✅ | N/A | Project ID for config persistence |
| buttons | ButtonDefinition[] | ✅ | N/A | Available button definitions |
| onButtonClick | (button: ButtonDefinition) => void | ❌ | undefined | Callback when button clicked |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onButtonClick | `(button: ButtonDefinition) => void` | User clicks a toolbar button |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onClick | `() => void` | PersistentToolbarButton | Button click handler |
| onTogglePin | `(pinned: boolean) => void` | PersistentToolbarButton | Pin/unpin handler |
| onRemove | `() => void` | PersistentToolbarButton | Remove slot handler |
| handleSend | `(message: string) => void` | DiscussDialog | Discuss message handler |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| config | ToolbarConfig \| null | null | fetchConfig, saveConfig |
| loading | boolean | true | fetchConfig |
| error | string \| null | null | fetchConfig, saveConfig |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | via useDiscussButton hook |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| visibleSlots | ToolbarSlot[] | `[config]` | getVisibleSlots(config.slots, config.maxSlots) |
| toolbarButtons | ButtonDefinition[] | `[visibleSlots, buttons]` | Maps slots to button definitions |

### Custom Hooks
- `useDiscussButton({ componentName, getContext })` — DiscussButton integration

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onButtonClick when user clicks button, tracks usage via API
- **Example:** `onButtonClick?.(button)` after updating usage count

### Child Communication
- **Child:** PersistentToolbarButton
- **Mechanism:** props
- **Data Flow:** button, slot, onClick, onTogglePin, onRemove

- **Child:** DiscussButton / DiscussDialog
- **Mechanism:** props
- **Data Flow:** Opens dialog, sends formatted messages

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer (via hook)
- **Operations:** Opens discuss dialog with toolbar context

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/toolbar/:projectId/config` | GET | mount, projectId change | Sets config state or creates default |
| `/api/toolbar/:projectId/config` | PUT | saveConfig | Updates config state |

---

## Test Hooks

**CSS Selectors:**
- `.persistent-toolbar`
- `.toolbar-header`
- `.toolbar-title`
- `.toolbar-stats`
- `.toolbar-buttons`
- `.empty-state`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Header (`.toolbar-header`) — Shows title and stats
2. Buttons row (`.toolbar-buttons`) — Horizontal list of toolbar buttons
3. Empty state (`.empty-state`) — Shown when no buttons pinned

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-PT-01: Config Fetches
- **Type:** connection
- **Target:** API /api/toolbar/:projectId/config
- **Condition:** HTTP 200 or 404 within 2s
- **Failure Mode:** Shows error state
- **Automation Script:**
```javascript
const response = await fetch('http://localhost:3001/api/toolbar/test-project/config');
console.assert(response.ok || response.status === 404, 'Toolbar config API unreachable');
```

#### HC-PT-02: Buttons Render
- **Type:** render
- **Target:** Toolbar buttons
- **Condition:** Visible slots rendered as PersistentToolbarButton components
- **Failure Mode:** Empty toolbar when slots exist

### Warning Checks (Should Pass)

#### HC-PT-03: Usage Tracking
- **Type:** interaction
- **Target:** Button click → usage count update
- **Condition:** Clicking button calls trackButtonUsage and saves config
- **Failure Mode:** Usage frequency not updated

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| config-fetch-time | 500 | ms | Time to load toolbar config |
| button-click-response | 100 | ms | Time from click to callback |

---

## Dependencies

**Required Contexts:**
- DiscussContext (via hook)

**Required Hooks:**
- `useDiscussButton()`

**Child Components:**
- PersistentToolbarButton
- DiscussButton
- DiscussDialog

**Required Props:**
- `projectId`
- `buttons`

---

## Notes

- Config includes maxSlots (default 8), slots array, autoLearn flag, showUsageCount flag
- Slots sorted by frequency (pinned first, then by usage count)
- 404 response creates default config with empty slots
- Usage tracking via utility function trackButtonUsage
- Pin/unpin updates slot.pinned field and saves config
- Remove button filters out slot from config
- Empty state shows helpful text when no buttons pinned
- DiscussButton provides context: toolbarItems, pinnedCount

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
