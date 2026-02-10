# Component Contract: WorkbenchLayout

**File:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx`
**Type:** page
**Parent Group:** components/Workbench
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** WorkbenchLayout
- **Introduced:** 2026-01-20
- **Description:** Main shell layout that orchestrates the entire dashboard UI. Renders TopBar, SessionSidebar (conditional), and workbench-specific content based on active workbench. Manages session attachment/detachment, workbench transitions, and coordinates between navigation and content areas.

---

## Render Location

**Mounts Under:**
- AppContent (root content component)

**Render Conditions:**
1. Always renders (main shell)

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- AppContent mount (application initialization)

**Key Effects:**
1. **Dependencies:** `[activeWorkbench]`
   - **Side Effects:** Triggers CSS transition animation (workbench-enter → workbench-enter-active → workbench-enter-done), 180ms duration
   - **Cleanup:** Clears transition timeout
   - **Condition:** Whenever activeWorkbench changes

**Cleanup Actions:**
- Clears transition timeout on unmount

**Unmount Triggers:**
- Application shutdown (never unmounts in normal operation)

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | ❌ | N/A | Optional additional children (not currently used) |

### Callbacks Up (to parent)
N/A (top-level layout)

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onWorkbenchChange | `(id: WorkbenchId) => void` | TopBar | Changes active workbench via setActiveWorkbench |
| onAttachSession | `(sessionId: SessionId) => void` | SessionSidebar | Fetches session from API, adds to attachedSessions |
| onNewSession | `() => Promise<void>` | SessionSidebar | Creates new session via POST /api/sessions, auto-attaches |
| onSessionClose | `(sessionId: string) => void` | WorkWorkbench | Removes session from attachedSessions |
| onSessionDetach | `(sessionId: string) => void` | WorkWorkbench | Removes session from attachedSessions |
| onSessionInput | `(sessionId: string, input: string) => Promise<void>` | WorkWorkbench | Sends input to backend (placeholder) |
| onNodeClick | `(sessionId: string, nodeId: string) => void` | WorkWorkbench | Handles flow node click (console.log) |
| onAgentClick | `(sessionId: string, agentId: string) => void` | WorkWorkbench | Handles agent click (console.log) |
| onFileSelect | `(path: string) => void` | ExploreWorkbench | Handles file selection (console.log) |
| onFileOpen | `(path: string) => void` | ExploreWorkbench | Handles file open (console.log) |
| onArchiveRestore | `(sessionId: string) => void` | ArchiveWorkbench | Restores session from archive via useSessionArchive |
| onArchiveDelete | `(sessionId: string) => void` | ArchiveWorkbench | Deletes archived session via useSessionArchive |
| onArchiveClearAll | `() => void` | ArchiveWorkbench | Clears all archived sessions via useSessionArchive |
| onTaskCreate | `(task: Omit<PMTask, 'id' \| 'createdAt'>) => void` | PMWorkbench | Creates new PM task |
| onTaskStatusChange | `(taskId: string, status: TaskStatus) => void` | PMWorkbench | Updates task status |
| onTaskDelete | `(taskId: string) => void` | PMWorkbench | Deletes PM task |
| onDocClick | `(docId: string) => void` | PMWorkbench | Handles doc link click (console.log) |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| attachedSessions | `Session[]` | `[]` | handleAttachSession, handleSessionClose, handleSessionDetach |
| activeSessionId | `SessionId \| undefined` | `undefined` | handleAttachSession, handleSessionClose, handleSessionDetach |
| transitionClass | string | `'workbench-enter-done'` | activeWorkbench effect (CSS transition) |
| demoTasks | `PMTask[]` | `initialDemoTasks` | handleTaskCreate, handleTaskStatusChange, handleTaskDelete |
| demoDocs | `DocLink[]` | `initialDemoDocs` | N/A (read-only) |
| demoMilestones | `Milestone[]` | `initialDemoMilestones` | N/A (read-only) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| WorkbenchContext | activeWorkbench, setActiveWorkbench |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| showSessionSidebar | boolean | `[activeWorkbench]` | `canWorkbenchHaveSessions(activeWorkbench)` |

### Custom Hooks
- `useSessionArchive()` — Manages archived sessions (archivedSessions, restoreSession, deleteArchive, clearAllArchives)

---

## Interactions

### Parent Communication
- **Mechanism:** Direct render
- **Description:** Rendered by AppContent
- **Example:** `<WorkbenchLayout />`

### Child Communication
- **Child:** TopBar, SessionSidebar, WorkWorkbench, ExploreWorkbench, PMWorkbench, etc.
- **Mechanism:** Props (callbacks and data)
- **Data Flow:** Receives workbench change events from TopBar, session events from SessionSidebar, passes session data to workbenches

### Sibling Communication
N/A (manages all children)

### Context Interaction
- **Context:** WorkbenchContext
- **Role:** consumer
- **Operations:** Reads activeWorkbench, calls setActiveWorkbench

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/sessions` | POST | onNewSession callback | Creates session, returns { id }, calls handleAttachSession |
| `/api/sessions/:sessionId` | GET | handleAttachSession | Fetches session data, adds to attachedSessions |

### WebSocket Events
N/A (workbenches consume WebSocket events, not the layout directly)

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| timeout | 180ms | CSS transition completion (workbench-enter-active → workbench-enter-done) | ✅ Cleared on unmount |

### LocalStorage Operations
N/A (WorkbenchContext handles persistence)

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| `.workbench-content` element | className changes for CSS transitions | activeWorkbench changes |

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.workbench-layout` (root element)
- `.workbench-body`
- `.workbench-main`
- `.workbench-content`
- `.workbench-enter`, `.workbench-enter-active`, `.workbench-enter-done` (transition classes)

**Data Test IDs:**
- `data-testid="workbench-layout"`
- `data-testid="workbench-content-{workbenchId}"` (e.g., `workbench-content-work`)

**ARIA Labels:**
- `role="main"` on `.workbench-main`

**Visual Landmarks:**
1. TopBar at top (`.top-bar`)
2. SessionSidebar on left (`.session-sidebar`, conditional)
3. Main content area (`.workbench-main`)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-WL-001: TopBar Renders
- **Type:** render
- **Target:** TopBar component
- **Condition:** TopBar is present in DOM after mount
- **Failure Mode:** No navigation, cannot switch workbenches
- **Automation Script:**
```javascript
// Chrome MCP script
await new Promise(resolve => setTimeout(resolve, 1000));
const snapshot = await takeSnapshot();
if (!snapshot.includes('top-bar')) {
  throw new Error('TopBar did not render');
}
```

#### HC-WL-002: SessionSidebar Renders on Session-Capable Workbenches
- **Type:** conditional-render
- **Target:** SessionSidebar component
- **Condition:** SessionSidebar is present when activeWorkbench is 'work', 'maintenance', 'explore', 'review', 'harmony', 'editor'
- **Failure Mode:** Cannot attach sessions, no session navigation
- **Automation Script:**
```javascript
// Chrome MCP script
// Navigate to 'work' workbench
await click({ uid: 'workbench-tab-work' });
await new Promise(resolve => setTimeout(resolve, 500));
let snapshot = await takeSnapshot();
if (!snapshot.includes('session-sidebar')) {
  throw new Error('SessionSidebar did not render on work workbench');
}
// Navigate to 'settings' workbench (no sessions)
await click({ uid: 'workbench-tab-settings' });
await new Promise(resolve => setTimeout(resolve, 500));
snapshot = await takeSnapshot();
if (snapshot.includes('session-sidebar')) {
  throw new Error('SessionSidebar should not render on settings workbench');
}
```

#### HC-WL-003: Workbench Content Switches on Tab Click
- **Type:** navigation
- **Target:** renderWorkbenchContent function
- **Condition:** Clicking workbench tab changes activeWorkbench and renders corresponding content
- **Failure Mode:** Workbench navigation does not work
- **Automation Script:**
```javascript
// Chrome MCP script
// Start on 'work' workbench
await click({ uid: 'workbench-tab-work' });
await new Promise(resolve => setTimeout(resolve, 500));
let snapshot = await takeSnapshot();
if (!snapshot.includes('WorkWorkbench')) {
  throw new Error('WorkWorkbench did not render');
}
// Switch to 'pm' workbench
await click({ uid: 'workbench-tab-pm' });
await new Promise(resolve => setTimeout(resolve, 500));
snapshot = await takeSnapshot();
if (!snapshot.includes('PMWorkbench')) {
  throw new Error('PMWorkbench did not render after switching tabs');
}
```

#### HC-WL-004: Session Attachment Flow
- **Type:** integration
- **Target:** handleAttachSession function
- **Condition:** Clicking session in SessionSidebar fetches session data and attaches to workbench
- **Failure Mode:** Cannot open sessions, no session panels
- **Automation Script:**
```javascript
// Chrome MCP script
// Click on a session in SessionSidebar
await click({ uid: 'session-item-1' }); // Assumes session exists
await new Promise(resolve => setTimeout(resolve, 1000));
// Check if SessionPanelLayout rendered
const snapshot = await takeSnapshot();
if (!snapshot.includes('session-panel-layout')) {
  throw new Error('Session did not attach — SessionPanelLayout not rendered');
}
```

### Warning Checks (Should Pass)

#### HC-WL-W001: Workbench Transition Animation
- **Type:** ui-polish
- **Target:** CSS transition classes
- **Condition:** Transition classes cycle correctly: workbench-enter → workbench-enter-active → workbench-enter-done
- **Failure Mode:** Workbench switches abruptly without animation

#### HC-WL-W002: Fallback Session Data on API Failure
- **Type:** error-handling
- **Target:** handleAttachSession catch block
- **Condition:** If GET /api/sessions/:id fails, creates fallback session with minimal data
- **Failure Mode:** Session attachment fails silently, no error feedback

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| workbench-switch-time | 300 | ms | Time from tab click to new content visible (includes 180ms transition) |
| session-attach-time | 1000 | ms | Time from session click to SessionPanelLayout rendered |
| api-fetch-time | 500 | ms | Time for GET /api/sessions/:id to complete |

---

## Dependencies

**Required Contexts:**
- WorkbenchContext (activeWorkbench, setActiveWorkbench)

**Required Hooks:**
- useSessionArchive (for ArchiveWorkbench)

**Child Components:**
- TopBar
- SessionSidebar (conditional)
- WorkWorkbench
- MaintenanceWorkbench
- ExploreWorkbench
- ReviewWorkbench
- ArchiveWorkbench
- SettingsWorkbench
- PMWorkbench
- HarmonyWorkbench
- CanvasWorkbench
- EditorWorkbench
- IntelWorkbench
- RespectWorkbench

**Required Props:**
N/A

---

## Notes

- 12 workbenches total: work, maintenance, explore, review, archive, settings, pm, harmony, canvas, editor, intel, respect
- SessionSidebar only shows on workbenches that support sessions (canWorkbenchHaveSessions helper)
- Workbench transition animation: 180ms duration defined in transitions.css (--transition-duration)
- attachedSessions state is local to WorkbenchLayout, not persisted
- activeSessionId tracks which session is currently focused (for UI highlighting)
- PM workbench uses demo data (demoTasks, demoDocs, demoMilestones) — not connected to backend yet
- Session attachment fetches full session data via GET /api/sessions/:id
- Fallback session created on API failure with minimal data (id, cwd, status)

### Future Enhancements
- Replace hardcoded ACTIONFLOWS_FLOWS and ACTIONFLOWS_ACTIONS arrays with backend API
- Implement WebSocket message sending for onSessionInput
- Implement actual behavior for file/node/agent click handlers (currently console.log placeholders)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
