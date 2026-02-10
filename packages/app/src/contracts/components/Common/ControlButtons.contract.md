# Component Contract: ControlButtons

**File:** `packages/app/src/components/ControlButtons/ControlButtons.tsx`
**Type:** widget
**Parent Group:** Common
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ControlButtons
- **Introduced:** 2025-09-01
- **Description:** Chain execution control buttons (Pause, Resume, Cancel) with confirmation dialog for destructive actions

---

## Render Location

**Mounts Under:**
- SessionPanel headers
- Chain control sections

**Render Conditions:**
1. Returns null when no active chain (`!hasActiveChain`)
2. Otherwise always renders

**Positioning:** inline-flex
**Z-Index:** N/A (cancel confirm overlay uses higher z-index)

---

## Lifecycle

**Mount Triggers:**
- Parent renders with session containing active chain

**Key Effects:**
None — API calls triggered by user actions

**Cleanup Actions:**
None

**Unmount Triggers:**
- Session no longer has active chain
- Parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| session | Session | ✅ | N/A | Session data with status and currentChain |
| disabled | boolean | ❌ | false | Whether controls are disabled |

### Callbacks Up (to parent)
N/A — Uses useSessionControls hook for API calls

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| handleSend | `(message: string) => void` | DiscussDialog | Discuss message handler |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| isPausing | boolean | false | handlePause |
| isResuming | boolean | false | handleResume |
| isCancelling | boolean | false | handleCancelConfirm |
| showCancelConfirm | boolean | false | handleCancelClick, handleCancelDismiss, handleCancelConfirm |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | via useDiscussButton hook |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| isPaused | boolean | `[session.status]` | session.status === 'paused' |
| isRunning | boolean | `[session.status]` | session.status === 'in_progress' |
| hasActiveChain | boolean | `[session.currentChain]` | !!session.currentChain |

### Custom Hooks
- `useSessionControls()` — Provides pause, resume, cancel API functions
- `useDiscussButton({ componentName, getContext })` — DiscussButton integration

---

## Interactions

### Parent Communication
- **Mechanism:** context (via useSessionControls hook)
- **Description:** Calls pause/resume/cancel API functions
- **Example:** `controls.pause(session.id)`

### Child Communication
- **Child:** DiscussButton / DiscussDialog
- **Mechanism:** props
- **Data Flow:** Opens dialog, sends formatted messages

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer (via hook)
- **Operations:** Opens discuss dialog with control context

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/sessions/:id/commands` (pause) | POST | handlePause | Updates session status to 'paused' |
| `/api/sessions/:id/commands` (resume) | POST | handleResume | Updates session status to 'in_progress' |
| `/api/sessions/:id/commands` (cancel) | POST | handleCancelConfirm | Cancels chain execution |

---

## Test Hooks

**CSS Selectors:**
- `.control-buttons`
- `.control-btn`
- `.pause-btn`
- `.resume-btn`
- `.cancel-btn`
- `.cancel-confirm-overlay`
- `.cancel-confirm-dialog`
- `.confirm-btn`

**Data Test IDs:**
N/A

**ARIA Labels:**
- `title="Pause chain execution after current step"` on pause button
- `title="Resume chain execution"` on resume button
- `title="Cancel chain execution"` on cancel button

**Visual Landmarks:**
1. Pause button (⏸ Pause) — Only visible when running
2. Resume button (▶ Resume) — Only visible when paused
3. Cancel button (⏹ Cancel) — Always visible
4. Cancel confirmation dialog — Modal overlay with Yes/No buttons

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CB-01: Conditional Rendering
- **Type:** conditional-render
- **Target:** Component visibility
- **Condition:** Returns null when no active chain
- **Failure Mode:** Controls shown when no chain active

#### HC-CB-02: Pause Button Shows When Running
- **Type:** conditional-render
- **Target:** Pause button
- **Condition:** Visible when session.status === 'in_progress'
- **Failure Mode:** Pause button missing during execution

#### HC-CB-03: Resume Button Shows When Paused
- **Type:** conditional-render
- **Target:** Resume button
- **Condition:** Visible when session.status === 'paused'
- **Failure Mode:** Resume button missing when paused

#### HC-CB-04: Cancel Confirmation Flow
- **Type:** workflow
- **Target:** Cancel button → confirmation dialog → confirm → API call
- **Condition:** Two-step process prevents accidental cancellation
- **Failure Mode:** Immediate cancellation without confirmation
- **Automation Script:**
```javascript
await page.click('.cancel-btn');
const dialog = await page.waitForSelector('.cancel-confirm-dialog');
console.assert(dialog !== null, 'Cancel confirmation dialog not shown');
```

### Warning Checks (Should Pass)

#### HC-CB-05: Button Disabled During API Call
- **Type:** interaction
- **Target:** Button disabled state
- **Condition:** Buttons disabled when isPausing/isResuming/isCancelling
- **Failure Mode:** Multiple API calls triggered

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| api-response-time | 500 | ms | Time for control commands |

---

## Dependencies

**Required Contexts:**
- DiscussContext (via hook)

**Required Hooks:**
- `useSessionControls()`
- `useDiscussButton()`

**Child Components:**
- DiscussButton
- DiscussDialog

**Required Props:**
- `session`

---

## Notes

- Returns null early when no active chain (hasActiveChain = false)
- Pause/Resume buttons mutually exclusive (only one visible at a time)
- Cancel button always visible when controls rendered
- Cancel confirmation prevents accidental chain abortion
- Confirmation dialog has backdrop overlay (click to dismiss)
- Error handling shows alert dialog (basic UX, could be improved with toast)
- Loading states shown in button text ("Pausing...", "Resuming...", "Cancelling...")
- DiscussButton provides context: sessionId, sessionStatus, hasActiveChain, availableCommands

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
