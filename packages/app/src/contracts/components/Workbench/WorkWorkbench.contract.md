# Component Contract: WorkStar

**File:** `packages/app/src/components/Stars/WorkStar.tsx`
**Type:** page
**Parent Group:** Stars
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** WorkStar
- **Introduced:** 2026-01-15
- **Description:** Primary workbench for active development sessions. Displays the active session using SessionPanelLayout with 25/75 split panel architecture.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'work'`)

**Render Conditions:**
1. User selects "Work" tab in TopBar (`activeWorkbench === 'work'`)

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to Work workbench via TopBar tab
- Application startup (if Work was last active workbench)

**Key Effects:**
N/A - No useEffect hooks in this component

**Cleanup Actions:**
- None

**Unmount Triggers:**
- User switches to different workbench tab

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessions | `Session[]` | ✅ | N/A | Sessions currently attached to this workbench |
| activeSessionId | `string` | ❌ | undefined | Active session ID (determines which session to display) |
| onSessionClose | `(sessionId: string) => void` | ❌ | undefined | Callback when a session is closed |
| onSessionDetach | `(sessionId: string) => void` | ❌ | undefined | Callback when a session is detached from the workbench |
| onSessionInput | `(sessionId: string, input: string) => Promise<void>` | ❌ | undefined | Callback when user submits input in a session |
| onNodeClick | `(sessionId: string, nodeId: string) => void` | ❌ | undefined | Callback when a flow node is clicked |
| onAgentClick | `(sessionId: string, agentId: string) => void` | ❌ | undefined | Callback when an agent avatar is clicked |
| flows | `FlowAction[]` | ❌ | [] | Available flows for SmartPromptLibrary |
| actions | `FlowAction[]` | ❌ | [] | Available actions for SmartPromptLibrary |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSessionClose | `(sessionId: string) => void` | Notifies parent when session is closed |
| onSessionDetach | `(sessionId: string) => void` | Notifies parent when session is detached |
| onSessionInput | `(sessionId: string, input: string) => Promise<void>` | Notifies parent when user submits input |
| onNodeClick | `(sessionId: string, nodeId: string) => void` | Notifies parent when flow node is clicked |
| onAgentClick | `(sessionId: string, agentId: string) => void` | Notifies parent when agent avatar is clicked |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onSessionClose | `() => void` | SessionPanelLayout | Closes the active session |
| onSessionDetach | `() => void` | SessionPanelLayout | Detaches the active session |
| onSubmitInput | `(input: string) => Promise<void>` | SessionPanelLayout | Submits input to session |
| onNodeClick | `(nodeId: string) => void` | SessionPanelLayout | Handles flow node click |
| onAgentClick | `(agentId: string) => void` | SessionPanelLayout | Handles agent avatar click |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| sessionCount | `number` | `sessions.length` | Computed from props |
| activeSession | `Session \| undefined` | Computed from props | Computed from props |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `prefillChatInput()` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| sessionCount | `number` | `[sessions]` | `sessions.length` |
| activeSession | `Session \| undefined` | `[sessions, activeSessionId]` | Find session by activeSessionId or default to first |

### Custom Hooks
- `useDiscussButton()` — Manages DiscussButton dialog state and context formatting

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Passes session events (close, detach, input, clicks) up to WorkbenchLayout
- **Example:** User clicks "Close" in SessionPanelLayout → `onSessionClose(sessionId)` → WorkbenchLayout removes session

### Child Communication
- **Child:** SessionPanelLayout
- **Mechanism:** props
- **Data Flow:** Passes active session data + callbacks down

### Sibling Communication
- **Sibling:** N/A
- **Mechanism:** N/A
- **Description:** N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens DiscussDialog, prefills chat input with component context

---

## Side Effects

### API Calls
N/A - This component does not make direct API calls

### WebSocket Events
N/A - Listens indirectly via session prop updates

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
- `.work-workbench`
- `.work-workbench__header`
- `.work-workbench__title`
- `.work-workbench__session-count`
- `.session-count-badge`
- `.work-workbench__content`
- `.work-workbench__empty-state`

**Data Test IDs:**
N/A - Component does not use data-testid attributes

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Header bar with "Work Dashboard" title (`.work-workbench__header`) — Always visible at top
2. Session count badge (`.session-count-badge`) — Shows number of attached sessions
3. Empty state message (`.work-workbench__empty-state`) — Visible when no sessions attached
4. SessionPanelLayout (if sessions exist) — Main content area

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-WW-001: Component Renders
- **Type:** render
- **Target:** `.work-workbench` element
- **Condition:** Element exists in DOM
- **Failure Mode:** Workbench does not appear when Work tab is selected
- **Automation Script:**
```javascript
const workbench = document.querySelector('.work-workbench');
return workbench !== null;
```

#### HC-WW-002: Header Displays
- **Type:** render
- **Target:** `.work-workbench__header` with title "Work Dashboard"
- **Condition:** Header contains title text
- **Failure Mode:** Users don't know which workbench is active
- **Automation Script:**
```javascript
const header = document.querySelector('.work-workbench__header');
const title = header?.querySelector('.work-workbench__title');
return title?.textContent === 'Work Dashboard';
```

#### HC-WW-003: Session Count Updates
- **Type:** state-update
- **Target:** `.session-count-badge`
- **Condition:** Badge shows accurate session count
- **Failure Mode:** Users don't know how many sessions are attached
- **Automation Script:**
```javascript
const badge = document.querySelector('.session-count-badge');
// Expect "0 sessions", "1 session", or "N sessions"
return badge && /\d+ sessions?/.test(badge.textContent);
```

#### HC-WW-004: Empty State (No Sessions)
- **Type:** conditional-render
- **Target:** `.work-workbench__empty-state`
- **Condition:** Empty state appears when sessions.length === 0
- **Failure Mode:** Blank screen instead of helpful message
- **Automation Script:**
```javascript
const sessions = []; // Simulate no sessions
const emptyState = document.querySelector('.work-workbench__empty-state');
return sessions.length === 0 ? emptyState !== null : true;
```

#### HC-WW-005: SessionPanelLayout Renders (With Session)
- **Type:** conditional-render
- **Target:** SessionPanelLayout component
- **Condition:** SessionPanelLayout appears when sessions.length > 0
- **Failure Mode:** No way to view session data
- **Automation Script:**
```javascript
const sessions = [{ id: 'test-session', /* ... */ }]; // Simulate session
const panelLayout = document.querySelector('.session-panel-layout');
return sessions.length > 0 ? panelLayout !== null : true;
```

### Warning Checks (Should Pass)

#### HC-WW-006: DiscussButton Present
- **Type:** render
- **Target:** DiscussButton in header
- **Condition:** DiscussButton renders
- **Failure Mode:** No way to discuss workbench state with AI

---

## Dependencies

**Required Contexts:**
- DiscussContext (for DiscussButton integration)

**Required Hooks:**
- useDiscussButton

**Child Components:**
- SessionPanelLayout (from `../SessionPanel`)
- DiscussButton (from `../DiscussButton`)
- DiscussDialog (from `../DiscussButton`)

**Required Props:**
- `sessions` (must be provided by parent)

---

## Notes

- This is the primary workbench for active development work.
- Session selection logic: If `activeSessionId` is provided, use that session. Otherwise default to first session in array.
- Empty state provides clear instruction: "Select a session from the sidebar to begin."
- DiscussButton integration allows users to discuss workbench state with AI assistant.

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
