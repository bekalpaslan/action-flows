# Component Contract: QuickActionBar

**File:** `packages/app/src/components/QuickActionBar/QuickActionBar.tsx`
**Type:** feature
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** QuickActionBar
- **Introduced:** 2025-11-20
- **Description:** Context-aware action bar showing quick response buttons + manual input field, pulses when session enters waiting-for-input state

---

## Render Location

**Mounts Under:**
- Session tile bottom
- Claude CLI terminal bottom
- Any component needing quick input collection

**Render Conditions:**
1. Always renders

**Positioning:** relative (typically bottom of container)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders with session

**Key Effects:**
1. **Dependencies:** `[lifecycleState, isWaitingForInput]`
   - **Side Effects:** Updates isWaitingForInput state, triggers CSS pulse animation
   - **Cleanup:** None
   - **Condition:** When lifecycleState changes to 'waiting-for-input'

**Cleanup Actions:**
None

**Unmount Triggers:**
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | SessionId | ✅ | N/A | Session ID |
| lifecycleState | SessionLifecycleState | ✅ | N/A | Lifecycle state for UI rendering |
| quickActions | QuickActionDefinition[] | ✅ | N/A | Quick action definitions |
| onActionClick | (value: string) => void | ✅ | N/A | Callback when action clicked |
| onManualInput | (value: string) => void | ✅ | N/A | Callback when manual input submitted |
| lastOutput | string | ❌ | '' | Last terminal output for context detection |
| disabled | boolean | ❌ | false | Disabled state |
| projectId | ProjectId | ❌ | undefined | Project ID for custom prompts |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onActionClick | `(value: string) => void` | User clicks quick action button |
| onManualInput | `(value: string) => void` | User submits manual input |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onClick | `(value: string) => void` | QuickActionButton | Quick action click handler |
| handleSend | `(message: string) => void` | DiscussDialog | Discuss message handler |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| manualInputValue | string | '' | setManualInputValue (input change) |
| isWaitingForInput | boolean | false | useEffect on lifecycleState change |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | via useDiscussButton hook |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| customQuickActions | QuickActionDefinition[] | `[customPromptButtons]` | Maps custom prompt buttons to quick actions |
| allQuickActions | QuickActionDefinition[] | `[quickActions, customQuickActions]` | Merges provided + custom actions |
| compiledPatterns | Map<string, RegExp[]> | `[allQuickActions]` | Pre-compiles context pattern regexes |
| visibleActions | QuickActionDefinition[] | `[allQuickActions, lastOutput, compiledPatterns]` | Filters by alwaysShow or matching pattern |

### Custom Hooks
- `useCustomPromptButtons(projectId)` — Fetches custom prompt buttons
- `useDiscussButton({ componentName, getContext })` — DiscussButton integration

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onActionClick or onManualInput based on user action
- **Example:** `onActionClick(action.value)`, `onManualInput(manualInputValue)`

### Child Communication
- **Child:** QuickActionButton
- **Mechanism:** props
- **Data Flow:** label, icon, value, onClick, disabled

- **Child:** DiscussButton / DiscussDialog
- **Mechanism:** props
- **Data Flow:** Opens dialog, sends formatted messages

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer (via hook)
- **Operations:** Opens discuss dialog with action bar context

---

## Side Effects

### API Calls
N/A — useCustomPromptButtons hook handles custom prompt fetching

---

## Test Hooks

**CSS Selectors:**
- `.quick-action-bar`
- `.pulse-animation`
- `.disabled`
- `.quick-actions-buttons`
- `.manual-input-form`
- `.manual-input-field`
- `.manual-input-submit`

**Data Test IDs:**
- `data-session-id` on bar container

**ARIA Labels:**
- `title="Send input"` on submit button

**Visual Landmarks:**
1. Quick action buttons row (`.quick-actions-buttons`) — Left side
2. Manual input field (`.manual-input-field`) — Right side
3. Submit arrow button (`.manual-input-submit`) — Far right
4. Pulse animation (`.pulse-animation`) — Applied when waiting for input

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-QAB-01: Bar Renders
- **Type:** render
- **Target:** Action bar element
- **Condition:** `.quick-action-bar` exists
- **Failure Mode:** Bar not visible

#### HC-QAB-02: Context Filtering Works
- **Type:** logic
- **Target:** Visible actions based on lastOutput
- **Condition:** Actions with matching patterns shown, others hidden (unless alwaysShow)
- **Failure Mode:** Wrong actions displayed

#### HC-QAB-03: Manual Input Submission
- **Type:** interaction
- **Target:** Manual input form
- **Condition:** Submitting calls onManualInput, clears field
- **Failure Mode:** Input persists after submit

### Warning Checks (Should Pass)

#### HC-QAB-04: Pulse Animation on Waiting
- **Type:** visual-feedback
- **Target:** `.pulse-animation` class
- **Condition:** Applied when lifecycleState === 'waiting-for-input'
- **Failure Mode:** No visual indication of waiting state

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| pattern-compilation-time | 50 | ms | Time to compile all context patterns |
| filter-update-time | 50 | ms | Time to re-filter actions on lastOutput change |

---

## Dependencies

**Required Contexts:**
- DiscussContext (via hook)

**Required Hooks:**
- `useCustomPromptButtons()`
- `useDiscussButton()`

**Child Components:**
- QuickActionButton
- DiscussButton
- DiscussDialog

**Required Props:**
- `sessionId`
- `lifecycleState`
- `quickActions`
- `onActionClick`
- `onManualInput`

---

## Notes

- Custom prompts fetched via useCustomPromptButtons hook (project-scoped)
- Context patterns compiled once using useMemo for performance
- Visible actions filtered by: alwaysShow=true OR matching contextPattern regex
- Pulse animation CSS-driven (no JavaScript animation)
- Manual input cleared after successful submit
- Submit button disabled when input empty or bar disabled
- DiscussButton provides context: sessionId, lifecycleState, visibleActionsCount, isWaitingForInput

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
