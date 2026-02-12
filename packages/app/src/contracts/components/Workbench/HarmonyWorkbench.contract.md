# Component Contract: HarmonySpaceWorkbench

**File:** `packages/app/src/components/Harmony/HarmonySpaceWorkbench.tsx`
**Type:** page
**Parent Group:** Harmony
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** HarmonySpaceWorkbench
- **Introduced:** 2026-01-30
- **Description:** Dashboard for monitoring contract compliance and harmony detection. Features HarmonyPanel, manual harmony checks, drift detection, and contract status display.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'harmony'`)

**Render Conditions:**
1. User selects "Harmony" tab in TopBar

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to Harmony workbench

**Key Effects:**
None

**Cleanup Actions:**
None

**Unmount Triggers:**
- User switches workbenches

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | `SessionId` | ❌ | undefined | Active session ID for session-level monitoring |
| projectId | `ProjectId` | ❌ | undefined | Active project ID for project-level monitoring |
| onViolationClick | `(check: HarmonyCheck) => void` | ❌ | undefined | Callback when violation is clicked |
| onTriggerCheck | `() => void` | ❌ | undefined | Callback when triggering manual harmony check |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onViolationClick | `(check) => void` | Notifies parent of violation click |
| onTriggerCheck | `() => void` | Notifies parent to trigger harmony check |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | HarmonyPanel | Passed via props |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| viewMode | `'session' \| 'project' \| 'global'` | Computed from props | setViewMode |
| manualCheckText | `string` | `''` | setManualCheckText |
| isCheckingManually | `boolean` | `false` | setIsCheckingManually |
| manualCheckResult | `{ result, parsedFormat, missingFields } \| null` | `null` | setManualCheckResult |
| showManualCheck | `boolean` | `false` | setShowManualCheck |
| driftResults | `DriftResult[]` | Mock data | Static |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `prefillChatInput()` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| target | `SessionId \| ProjectId` | `[viewMode, sessionId, projectId]` | Determines target based on view mode |
| targetType | `'session' \| 'project'` | `[viewMode]` | Maps view mode to target type |
| harmonyScore | `number` | `[metrics]` | Extracts harmonyPercentage from metrics |

### Custom Hooks
- `useHarmonyMetrics(target, targetType)` — Fetches harmony metrics from API
- `useDiscussButton()` — Manages DiscussButton dialog

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent of harmony check triggers
- **Example:** User clicks "Run Check" → `onTriggerCheck()` → Parent triggers backend check

### Child Communication
- **Child:** HarmonyPanel
- **Mechanism:** props
- **Data Flow:** Passes target and targetType

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens discuss dialog with harmony context

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/harmony/:target/check` | POST | Manual check button | Updates manualCheckResult |

### WebSocket Events
N/A - Listens indirectly via metrics hook

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
- `.harmony-workbench`
- `.harmony-workbench__score-display`
- `.harmony-workbench__view-selector`
- `.harmony-workbench__view-btn`
- `.harmony-workbench__manual-input`
- `.harmony-workbench__manual-result`
- `.harmony-workbench__drift-list`
- `.harmony-workbench__drift-item`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Header with harmony score badge (`.harmony-workbench__score-display`) — Shows overall harmony percentage
2. View mode selector (`.harmony-workbench__view-selector`) — Session, Project, Global tabs
3. HarmonyPanel (`.harmony-workbench__harmony-panel`) — Main contract compliance display
4. Manual check panel (`.harmony-workbench__panel--manual`) — Textarea + check button
5. Drift detection panel (`.harmony-workbench__panel--drift`) — Drift results list

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-HW-001: Harmony Score Displays
- **Type:** render
- **Target:** HarmonyBadge in header
- **Condition:** Badge shows percentage
- **Failure Mode:** No harmony visibility
- **Automation Script:**
```javascript
const badge = document.querySelector('.harmony-badge');
return badge !== null && /\d+%/.test(badge.textContent);
```

#### HC-HW-002: Manual Check Works
- **Type:** api-call
- **Target:** POST `/api/harmony/:target/check`
- **Condition:** Submitting text returns result
- **Failure Mode:** Can't manually check output
- **Automation Script:**
```javascript
const textarea = document.querySelector('.harmony-workbench__manual-input');
textarea.value = 'test output';
const checkBtn = document.querySelector('.harmony-workbench__action-btn--primary');
checkBtn.click();
await new Promise(resolve => setTimeout(resolve, 1000));
const result = document.querySelector('.harmony-workbench__manual-result');
return result !== null;
```

#### HC-HW-003: View Mode Toggle Works
- **Type:** user-action
- **Target:** View mode buttons
- **Condition:** Clicking switches view
- **Failure Mode:** Can't change view
- **Automation Script:**
```javascript
const globalBtn = Array.from(document.querySelectorAll('.harmony-workbench__view-btn'))
  .find(btn => btn.textContent === 'Global');
globalBtn.click();
await new Promise(resolve => setTimeout(resolve, 100));
return globalBtn.classList.contains('harmony-workbench__view-btn--active');
```

#### HC-HW-004: HarmonyPanel Renders
- **Type:** render
- **Target:** HarmonyPanel component
- **Condition:** Panel appears with metrics
- **Failure Mode:** No contract compliance display
- **Automation Script:**
```javascript
const panel = document.querySelector('.harmony-panel');
return panel !== null;
```

### Warning Checks (Should Pass)

#### HC-HW-005: Drift Detection Displays
- **Type:** render
- **Target:** Drift results list
- **Condition:** Drift items show when detected
- **Failure Mode:** No drift visibility

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- useHarmonyMetrics
- useDiscussButton

**Child Components:**
- HarmonyPanel (from `../HarmonyPanel`)
- HarmonyBadge (from `../HarmonyBadge`)
- DiscussButton
- DiscussDialog

**Required Props:**
None (all optional)

---

## Notes

- View modes: session-level, project-level, or global monitoring
- Manual check: Accepts orchestrator output text, returns validation result
- Drift detection: Shows schema changes between contract versions
- Harmony score: Computed as percentage of compliant outputs
- Mock drift data provided for development

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
