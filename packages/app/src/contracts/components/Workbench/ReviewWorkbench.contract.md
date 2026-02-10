# Component Contract: ReviewWorkbench

**File:** `packages/app/src/components/Workbench/ReviewWorkbench.tsx`
**Type:** page
**Parent Group:** Workbench
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ReviewWorkbench
- **Introduced:** 2026-01-22
- **Description:** PR/Diff viewer workbench for code reviews. Features Monaco-powered diff viewer, approve/reject/comment actions, and filtering by PR status.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'review'`)

**Render Conditions:**
1. User selects "Review" tab in TopBar

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to Review workbench

**Key Effects:**
1. **Dependencies:** `[externalPRs]`
   - **Side Effects:** Updates local PR list when external data changes
   - **Cleanup:** None
   - **Condition:** Runs when externalPRs prop changes

2. **Dependencies:** `[selectedPR]`
   - **Side Effects:** Auto-selects first file when PR changes
   - **Cleanup:** None
   - **Condition:** Runs when selectedPR changes

**Cleanup Actions:**
None

**Unmount Triggers:**
- User switches workbenches

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onReviewAction | `(prId: string, action: 'approve' \| 'request_changes' \| 'comment', body?: string) => Promise<void>` | ❌ | undefined | Callback when review action is taken |
| onPRSelect | `(prId: string) => void` | ❌ | undefined | Callback when PR is selected |
| pullRequests | `PullRequest[]` | ❌ | `MOCK_PULL_REQUESTS` | List of pull requests (controlled mode) |
| isLoading | `boolean` | ❌ | false | Whether data is loading |
| error | `string \| null` | ❌ | null | Error message if any |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onReviewAction | `(prId, action, body?) => Promise<void>` | Notifies parent of review submission |
| onPRSelect | `(prId) => void` | Notifies parent of PR selection |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onClick | `() => void` | PRListItem | Selects PR |
| onFileSelect | `(path) => void` | FileList | Selects file for diff view |
| onApprove/onRequestChanges/onComment | `() => void` | ReviewActions | Opens comment dialog |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| pullRequests | `PullRequest[]` | External or mock data | setPullRequests |
| selectedPRId | `string \| null` | `null` | handlePRSelect |
| selectedFilePath | `string \| null` | `null` | setSelectedFilePath |
| viewMode | `'unified' \| 'split'` | `'split'` | setViewMode |
| statusFilter | `ReviewStatus \| 'all'` | `'all'` | setStatusFilter |
| dialogState | `{ isOpen, actionType }` | `{ isOpen: false, actionType: 'comment' }` | handleOpenDialog |
| isSubmitting | `boolean` | `false` | handleSubmitReview |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `prefillChatInput()` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| filteredPRs | `PullRequest[]` | `[pullRequests, statusFilter]` | Filters PRs by status |
| selectedPR | `PullRequest \| null` | `[pullRequests, selectedPRId]` | Finds PR by ID |
| selectedFile | `ReviewFile \| null` | `[selectedPR, selectedFilePath]` | Finds file by path |
| stats | `{ total, pending, approved, changesRequested }` | `[pullRequests]` | Computes PR status counts |

### Custom Hooks
- `useDiscussButton()` — Manages DiscussButton dialog

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent of review actions and PR selections
- **Example:** User clicks Approve → Opens dialog → Submits → `onReviewAction(prId, 'approve', body)`

### Child Communication
- **Child:** DiffEditor (Monaco)
- **Mechanism:** props
- **Data Flow:** Passes original/modified file content + language + view mode

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens discuss dialog with review context

---

## Side Effects

### API Calls
N/A - Uses external data via props

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
- `.review-workbench`
- `.review-pr-list`
- `.review-pr-item`
- `.review-diff-viewer`
- `.review-action-btn`
- `.review-view-toggle`
- `.review-file-list`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Header with stats (`.review-workbench__stats`) — Shows pending, approved, changes requested counts
2. PR list sidebar (`.review-workbench__sidebar`) — Scrollable PR list
3. Diff viewer (`.review-diff-viewer`) — Monaco DiffEditor
4. Review actions bar (`.review-actions`) — Approve, Request Changes, Comment buttons

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-RW-001: PR List Renders
- **Type:** render
- **Target:** `.review-pr-list`
- **Condition:** PR list appears with items
- **Failure Mode:** No PRs visible
- **Automation Script:**
```javascript
const prList = document.querySelector('.review-pr-list');
const items = prList?.querySelectorAll('.review-pr-item');
return prList && items.length > 0;
```

#### HC-RW-002: Diff Viewer Renders
- **Type:** render
- **Target:** Monaco DiffEditor
- **Condition:** DiffEditor appears when file is selected
- **Failure Mode:** Can't view code changes
- **Automation Script:**
```javascript
const diffViewer = document.querySelector('.monaco-diff-editor');
return diffViewer !== null;
```

#### HC-RW-003: Review Actions Work
- **Type:** user-action
- **Target:** Review action buttons
- **Condition:** Clicking Approve/Request Changes/Comment opens dialog
- **Failure Mode:** Can't submit reviews
- **Automation Script:**
```javascript
const approveBtn = document.querySelector('.review-action-btn.approve');
approveBtn.click();
await new Promise(resolve => setTimeout(resolve, 100));
const dialog = document.querySelector('.review-comment-dialog');
return dialog !== null;
```

#### HC-RW-004: View Mode Toggle Works
- **Type:** user-action
- **Target:** Split/Unified toggle buttons
- **Condition:** Clicking toggles diff view mode
- **Failure Mode:** Can't switch diff views
- **Automation Script:**
```javascript
const unifiedBtn = document.querySelector('.view-toggle-btn');
unifiedBtn.click();
await new Promise(resolve => setTimeout(resolve, 100));
const isUnified = unifiedBtn.classList.contains('active');
return isUnified;
```

### Warning Checks (Should Pass)

#### HC-RW-005: Status Filter Works
- **Type:** user-action
- **Target:** Status filter dropdown
- **Condition:** Filtering updates PR list
- **Failure Mode:** Can't filter PRs

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- useDiscussButton

**Child Components:**
- DiffEditor (from `@monaco-editor/react`)
- PRListItem
- FileList
- ReviewActions
- CommentDialog
- DiscussButton
- DiscussDialog

**Required Props:**
None (all optional, uses mock data if not provided)

---

## Notes

- Mock data provided via `MOCK_PULL_REQUESTS` constant for development
- Supports GitHub-style PR review workflow
- Language detection based on file extension via `getLanguageFromPath()`
- Monaco DiffEditor theme: `vs-dark`
- Stats computed: total, pending, approved, changesRequested

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
