# Component Contract: HarmonyPanel

**File:** `packages/app/src/components/HarmonyPanel/HarmonyPanel.tsx`
**Type:** React Component
**Parent Group:** Harmony
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** HarmonyPanel
- **Introduced:** 2025-12-15 (estimated)
- **Description:** Full harmony metrics dashboard displaying contract drift detection, format breakdown, recent violations, and overall harmony percentage. Tracks orchestrator output format compliance.

---

## Render Location

**Mounts Under:**
- HarmonyWorkbench

**Render Conditions:**
1. Always renders when HarmonyWorkbench is active
2. Conditional content based on loading/error states

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- HarmonyWorkbench activates

**Key Effects:**
1. **Dependencies:** `[target, targetType]` (via `useHarmonyMetrics`)
   - **Side Effects:** HTTP GET `/api/harmony/metrics?target={target}&type={targetType}`
   - **Cleanup:** None
   - **Condition:** Runs on mount and when target/targetType changes

**Cleanup Actions:**
None

**Unmount Triggers:**
- User switches to different workbench

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| target | SessionId \| ProjectId | ✅ | N/A | Target ID (session or project) |
| targetType | 'session' \| 'project' | ✅ | N/A | Target type |
| className | string | ❌ | '' | Additional CSS classes |

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| refresh | `() => void` | Self (button onClick) | Refetches harmony metrics |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| expandedViolation | string \| null | null | `toggleViolation` (click handler) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `registerChatInput`, `prefillChatInput` |

### Derived State
None

### Custom Hooks
- `useHarmonyMetrics(target, targetType)` — Fetches metrics from backend
- `useDiscussButton({ componentName, getContext })` — DiscussDialog state

---

## Interactions

### Parent Communication
None (standalone feature panel)

### Child Communication
- **Child:** HarmonyBadge
- **Mechanism:** props
- **Data Flow:** Passes `percentage`, `showLabel`, `size`

### Sibling Communication
None

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens DiscussDialog to send harmony metrics context to ChatPanel

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/harmony/metrics` | GET | Mount, refresh button | Sets `metrics` state with harmony data |

### WebSocket Events
None

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
None

### Electron IPC (if applicable)
N/A

---

## Event Handling

### User Interactions
| Event | Target | Handler | Side Effect |
|-------|--------|---------|-------------|
| click | Refresh button | `refresh` | Re-fetches harmony metrics from `/api/harmony/metrics` |
| click | Violation header | `toggleViolation` | Expands/collapses violation details (`.harmony-violation__details`) |
| click | DiscussButton | `openDialog` | Opens DiscussDialog with harmony metrics context |

### Custom Events
- None (uses React callbacks and context)

### Delegation to Children
- HarmonyBadge receives `percentage`, `showLabel`, `size` props
- DiscussButton receives context from `useDiscussButton` hook

---

## Accessibility

### ARIA Attributes
- Semantic HTML structure (no ARIA needed for basic lists/text)
- Violation headers could have `aria-expanded` (not currently implemented)
- Loading/error states could have `role="status"` for announcement

### Keyboard Support
- Refresh button is keyboard accessible (tab navigation, Enter/Space)
- Violation headers should support arrow keys for expand/collapse (not implemented)
- Buttons respond to standard keyboard interactions

### Color & Contrast
- Metric badges use color + icon/text for status (not color-only)
- Violation severity uses color + text labels
- Status states have distinct visual representation

### Testing Assistance
- CSS classes follow BEM naming for reliable selection
- State classes (`.harmony-panel--loading`, `.harmony-panel--error`) available

---

## Error Handling

### Error States
| Scenario | Current Behavior | Recovery |
|----------|------------------|----------|
| API call fails | Shows `.harmony-panel--error` with error message and Retry button | User clicks Retry to refetch |
| Metrics is null | Shows `.harmony-panel--empty` with message | Waits for API call or manual refresh |
| Network timeout | Error state with timeout message | User can retry manually |
| Invalid target/type | API returns 400 error | Should validate props before calling API |

### Error Boundaries
- No explicit error boundary (relies on parent HarmonyWorkbench)
- API errors are caught and displayed in UI
- Components degrade gracefully on API failure

---

## Performance Considerations

### Optimization Strategies
- **useState** for `expandedViolation` is efficient (single string state)
- **useHarmonyMetrics** hook handles data fetching and caching
- API call is memoized in hook (only runs when target/targetType changes)

### Rendering Efficiency
- Components render only when metrics state changes
- Violation expansion state is isolated (toggling one doesn't re-render others)
- Violation lists use efficient DOM structure

### Potential Bottlenecks
- Large violation lists (100+) could be slow (should add virtualization)
- Metrics calculation on backend could be slow (API timeout risk)
- Badge percentage calculation runs on every render (lightweight, acceptable)

### Metrics
- Target: <500ms API fetch for harmony metrics
- Target: <100ms render after metrics loaded
- Target: <50ms violation toggle animation

---

## Test Hooks

**CSS Selectors:**
- `.harmony-panel`
- `.harmony-panel--loading`, `.harmony-panel--error`, `.harmony-panel--empty`
- `.harmony-panel__header`
- `.harmony-panel__title`
- `.harmony-panel__metrics` (metrics overview)
- `.harmony-metric`, `.harmony-metric--success`, `.harmony-metric--warning`, `.harmony-metric--danger`
- `.harmony-panel__section`
- `.harmony-panel__format-list` (format breakdown)
- `.harmony-format-item`
- `.harmony-panel__violations` (recent violations list)
- `.harmony-violation`, `.harmony-violation__header`, `.harmony-violation__details`
- `.harmony-panel__footer`
- `.harmony-panel__refresh` (refresh button)

**Data Test IDs:**
None

**ARIA Labels:**
None (semantic HTML structure)

**Visual Landmarks:**
1. Header with HarmonyBadge (`.harmony-panel__header`) — Shows overall harmony percentage
2. Metrics grid (`.harmony-panel__metrics`) — Total checks, valid, degraded, violations
3. Format breakdown (`.harmony-panel__format-list`) — Counts per format type
4. Violations list (`.harmony-panel__violations`) — Expandable violation details
5. Footer with last check time and refresh button (`.harmony-panel__footer`)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-HP-001: Metrics Loaded from API
- **Type:** connection
- **Target:** `useHarmonyMetrics` hook
- **Condition:** HTTP GET succeeds and `metrics` state is non-null
- **Failure Mode:** Panel shows empty state or error
- **Automation Script:**
```javascript
// Chrome MCP script
await fetch('http://localhost:3001/api/harmony/metrics?target=test-session&type=session')
  .then(res => res.json())
  .then(data => {
    if (!data.success) throw new Error('Harmony API failed');
    console.log('Harmony metrics loaded:', data.metrics);
  });
```

#### HC-HP-002: HarmonyBadge Renders with Percentage
- **Type:** render
- **Target:** `.harmony-panel__header .harmony-badge`
- **Condition:** HarmonyBadge displays with correct percentage
- **Failure Mode:** Harmony status not visualized
- **Automation Script:**
```javascript
// Chrome MCP script
const badge = document.querySelector('.harmony-panel__header .harmony-badge');
if (!badge) throw new Error('HarmonyBadge missing from header');
const percentage = badge.textContent.match(/\d+%/);
if (!percentage) throw new Error('HarmonyBadge missing percentage text');
```

#### HC-HP-003: Violations Expandable
- **Type:** interaction
- **Target:** `.harmony-violation__header` click
- **Condition:** Clicking header toggles `.harmony-violation__details` visibility
- **Failure Mode:** Cannot inspect violation details
- **Automation Script:**
```javascript
// Chrome MCP script
const violationHeader = document.querySelector('.harmony-violation__header');
if (violationHeader) {
  violationHeader.click();
  setTimeout(() => {
    const details = document.querySelector('.harmony-violation__details');
    if (!details) throw new Error('Violation details not expanding');
  }, 100);
}
```

### Warning Checks (Should Pass)

#### HC-HP-004: Loading State Spinner
- **Type:** render
- **Target:** `.harmony-panel--loading .harmony-panel__spinner`
- **Condition:** Loading indicator shows while fetching
- **Failure Mode:** No feedback during load

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| api-fetch | 500 | ms | Time to fetch harmony metrics |
| render-time | 100 | ms | Time to render panel with metrics |

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- `useHarmonyMetrics(target, targetType)`
- `useDiscussButton({ componentName, getContext })`

**Child Components:**
- HarmonyBadge
- DiscussButton
- DiscussDialog

**Required Props:**
- `target` (SessionId | ProjectId)
- `targetType` ('session' | 'project')

---

## Notes

**Metrics Structure:**
- `harmonyPercentage`: Overall compliance percentage (0-100)
- `totalChecks`: Total number of checks performed
- `validCount`: Checks that passed
- `degradedCount`: Checks that partially passed
- `violationCount`: Checks that failed
- `formatBreakdown`: Object mapping format names to counts
- `recentViolations`: Array of violation objects with timestamp, text, context
- `lastCheck`: Timestamp of most recent harmony check

**Violation Context:**
- `stepNumber`: Step number where violation occurred
- `chainId`: Chain ID associated with violation
- `actionType`: Action type (analyze, review, code, etc.)

**Refresh Behavior:**
- Clicking refresh button calls `useHarmonyMetrics().refresh()`
- Re-fetches data from `/api/harmony/metrics`

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
