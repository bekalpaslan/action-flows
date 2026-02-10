# Component Contract: PMWorkbench

**File:** `packages/app/src/components/Workbench/PMWorkbench.tsx`
**Type:** page
**Parent Group:** Workbench
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** PMWorkbench
- **Introduced:** 2026-01-28
- **Description:** Project Management workbench for tasks and documentation. Features task list with status (todo, in-progress, done), project documentation links, and milestone timeline.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'pm'`)

**Render Conditions:**
1. User selects "PM" tab in TopBar

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to PM workbench

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
| tasks | `PMTask[]` | ❌ | `[]` | Tasks to display |
| docs | `DocLink[]` | ❌ | `[]` | Documentation links |
| milestones | `Milestone[]` | ❌ | `[]` | Project milestones |
| onTaskCreate | `(task: Omit<PMTask, 'id' \| 'createdAt'>) => void` | ❌ | undefined | Callback when task is created |
| onTaskStatusChange | `(taskId: string, status: TaskStatus) => void` | ❌ | undefined | Callback when task status changes |
| onTaskDelete | `(taskId: string) => void` | ❌ | undefined | Callback when task is deleted |
| onDocClick | `(docId: string) => void` | ❌ | undefined | Callback when doc link is clicked |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onTaskCreate | `(task) => void` | Notifies parent of new task |
| onTaskStatusChange | `(taskId, status) => void` | Notifies parent of status change |
| onTaskDelete | `(taskId) => void` | Notifies parent of task deletion |
| onDocClick | `(docId) => void` | Notifies parent of doc click |

### Callbacks Down (to children)
None (uses primitive task cards)

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| statusFilter | `'todo' \| 'in-progress' \| 'done' \| 'all'` | `'all'` | setStatusFilter |
| showCreateForm | `boolean` | `false` | setShowCreateForm |
| newTaskTitle | `string` | `''` | setNewTaskTitle |
| newTaskDescription | `string` | `''` | setNewTaskDescription |
| newTaskPriority | `'low' \| 'medium' \| 'high' \| 'critical'` | `'medium'` | setNewTaskPriority |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `prefillChatInput()` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| filteredTasks | `PMTask[]` | `[tasks, statusFilter]` | Filters tasks by status |
| taskCounts | `{ todo, inProgress, done, total }` | `[tasks]` | Computes task counts by status |
| docsByCategory | `Record<string, DocLink[]>` | `[docs]` | Groups docs by category |

### Custom Hooks
- `useDiscussButton()` — Manages DiscussButton dialog

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent of task/doc operations
- **Example:** User creates task → `onTaskCreate(taskData)` → Parent adds to task list

### Child Communication
N/A

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens discuss dialog with project stats

---

## Side Effects

### API Calls
N/A - Uses parent-provided data

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
- `.pm-workbench`
- `.pm-workbench__create-form`
- `.pm-workbench__filter-bar`
- `.filter-tab`
- `.filter-tab--active`
- `.task-card`
- `.status-badge`
- `.priority-badge`
- `.task-card__status-select`
- `.docs-category`
- `.milestone-item`
- `.progress-bar`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Task creation form (`.pm-workbench__create-form`) — Appears when "+ New Task" clicked
2. Filter tabs (`.filter-bar__tabs`) — All, To Do, In Progress, Done
3. Task cards (`.task-card`) — Task list with inline status dropdown
4. Documentation panel (`.pm-workbench__docs-panel`) — Grouped by category
5. Milestone timeline (`.pm-workbench__timeline`) — Progress bars and dates

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-PW-001: Task List Renders
- **Type:** render
- **Target:** `.task-panel__list`
- **Condition:** Task list appears
- **Failure Mode:** No tasks visible
- **Automation Script:**
```javascript
const taskPanel = document.querySelector('.task-panel__list');
return taskPanel !== null;
```

#### HC-PW-002: Task Creation Form Works
- **Type:** user-action
- **Target:** "+ New Task" button
- **Condition:** Clicking shows form
- **Failure Mode:** Can't create tasks
- **Automation Script:**
```javascript
const createBtn = document.querySelector('.pm-workbench__create-btn');
createBtn.click();
await new Promise(resolve => setTimeout(resolve, 100));
const form = document.querySelector('.pm-workbench__create-form');
return form !== null;
```

#### HC-PW-003: Status Filter Works
- **Type:** user-action
- **Target:** Filter tabs
- **Condition:** Clicking tab filters tasks
- **Failure Mode:** Can't filter tasks
- **Automation Script:**
```javascript
const todoTab = Array.from(document.querySelectorAll('.filter-tab'))
  .find(tab => tab.textContent.includes('To Do'));
todoTab.click();
await new Promise(resolve => setTimeout(resolve, 100));
const activeTasks = document.querySelectorAll('.task-card');
return activeTasks.length >= 0; // Should only show todo tasks
```

#### HC-PW-004: Task Status Change Works
- **Type:** user-action
- **Target:** Status dropdown in task card
- **Condition:** Changing dropdown updates task status
- **Failure Mode:** Can't update task status
- **Automation Script:**
```javascript
const statusSelect = document.querySelector('.task-card__status-select');
statusSelect.value = 'done';
statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
await new Promise(resolve => setTimeout(resolve, 100));
return true; // Verify onTaskStatusChange called
```

### Warning Checks (Should Pass)

#### HC-PW-005: Documentation Links Work
- **Type:** user-action
- **Target:** Doc links in docs panel
- **Condition:** Clicking doc link triggers callback
- **Failure Mode:** Docs not accessible

#### HC-PW-006: Milestone Progress Displays
- **Type:** render
- **Target:** Milestone progress bars
- **Condition:** Progress bars show percentage
- **Failure Mode:** No milestone tracking

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- useDiscussButton

**Child Components:**
- DiscussButton
- DiscussDialog

**Required Props:**
None (all optional, renders empty states)

---

## Notes

- Task statuses: 'todo', 'in-progress', 'done'
- Task priorities: 'low', 'medium', 'high', 'critical'
- Task creation: Title required, description optional
- Docs grouped by category
- Milestones show status: 'upcoming', 'current', 'completed'
- Milestone progress: Optional 0-100 percentage

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
