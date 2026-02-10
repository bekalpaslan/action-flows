# Component Contract: ChangePreview

**File:** `packages/app/src/components/ChangePreview/ChangePreview.tsx`
**Type:** feature
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ChangePreview
- **Introduced:** 2025-11-10
- **Description:** Diff-style preview of changes with collapsible sections, destructive change warnings, and Confirm/Cancel actions

---

## Render Location

**Mounts Under:**
- Self-modification workflows
- Configuration edit flows
- Any component needing change confirmation

**Render Conditions:**
1. Always renders (can show empty state)

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders with changes array

**Key Effects:**
None — Pure presentation component with local UI state

**Cleanup Actions:**
None

**Unmount Triggers:**
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| changes | ChangePreviewData[] | ✅ | N/A | Array of change objects |
| onConfirm | () => void | ❌ | undefined | Callback when Confirm clicked |
| onCancel | () => void | ❌ | undefined | Callback when Cancel clicked |
| isLoading | boolean | ❌ | false | Whether changes are being applied |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onConfirm | `() => void` | User confirms changes |
| onCancel | `() => void` | User cancels changes |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onToggle | `() => void` | ChangeItem | Toggles item expansion |
| handleSend | `(message: string) => void` | DiscussDialog | Discuss message handler |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| expandedItems | Set<number> | new Set() | toggleItem, expandAll, collapseAll |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | via useDiscussButton hook |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| summary | ChangeSummary | `[changes]` | Counts additions, modifications, removals, destructive, total |

### Custom Hooks
- `useDiscussButton({ componentName, getContext })` — DiscussButton integration

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onConfirm/onCancel based on user button clicks
- **Example:** `onConfirm()` when user clicks Confirm

### Child Communication
- **Child:** ChangeItem (internal component)
- **Mechanism:** props
- **Data Flow:** change data, isExpanded, onToggle

- **Child:** DiscussButton / DiscussDialog
- **Mechanism:** props
- **Data Flow:** Opens dialog, sends formatted messages with change details

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer (via hook)
- **Operations:** Opens discuss dialog with change preview context

---

## Side Effects

None — Pure presentation component, parent handles API calls

---

## Test Hooks

**CSS Selectors:**
- `.change-preview`
- `.change-preview-header`
- `.change-summary`
- `.destructive-warning`
- `.expand-controls`
- `.change-list`
- `.change-item`
- `.change-header`
- `.change-values`
- `.value-block`
- `.change-preview-footer`
- `.confirm-btn`
- `.cancel-btn`

**Data Test IDs:**
N/A

**ARIA Labels:**
- `role="button"` on collapsible change headers
- `tabIndex={0}` on collapsible headers

**Visual Landmarks:**
1. Summary bar (`.change-summary`) — Shows +N added, ~N modified, -N removed counts
2. Destructive warning (`.destructive-warning`) — Red warning banner when destructive changes present
3. Change list (`.change-list`) — Scrollable list of change items
4. Footer (`.change-preview-footer`) — Confirm/Cancel buttons

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CP-01: Changes Render
- **Type:** render
- **Target:** Change items
- **Condition:** `.change-item` elements match changes array length
- **Failure Mode:** Changes not displayed

#### HC-CP-02: Summary Accurate
- **Type:** logic
- **Target:** Summary counts
- **Condition:** Counts match actual change types
- **Failure Mode:** Incorrect summary displayed

#### HC-CP-03: Destructive Warning
- **Type:** conditional-render
- **Target:** `.destructive-warning`
- **Condition:** Visible when any change has isDestructive=true
- **Failure Mode:** No warning for destructive changes

#### HC-CP-04: Expand/Collapse All
- **Type:** interaction
- **Target:** Expand/Collapse buttons
- **Condition:** Buttons update expandedItems state for all items
- **Failure Mode:** Some items not expanded/collapsed

### Warning Checks (Should Pass)

#### HC-CP-05: Collapsible Complex Values
- **Type:** visual-feedback
- **Target:** Change items with complex values
- **Condition:** Items with objects/arrays are collapsible
- **Failure Mode:** All items collapsed/expanded regardless of complexity

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 200 | ms | Time to render 50 changes |
| expand-all-time | 100 | ms | Time to expand all items |

---

## Dependencies

**Required Contexts:**
- DiscussContext (via hook)

**Required Hooks:**
- `useDiscussButton()`

**Child Components:**
- ChangeItem (internal)
- DiscussButton
- DiscussDialog

**Required Props:**
- `changes`

---

## Notes

- ChangeSummary computed via useMemo for performance
- ChangeItem internal component handles individual change rendering
- Collapsible sections only for complex values (objects/arrays)
- Destructive warning shows count of destructive changes
- Confirm button text changes when destructive: "Confirm Destructive Changes"
- Confirm button shows spinner and "Applying..." during isLoading
- Empty state shown when changes array empty
- DiscussButton provides rich context: fileCount, totalChanges, additions, modifications, removals, destructiveChanges, changesSummary array

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
