# Component Contract: EditorTool (CodeEditor)

**File:** `packages/app/src/components/Tools/EditorTool/EditorTool.tsx`
**Type:** page
**Parent Group:** Tools
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** EditorTool (serves as the primary CodeEditor implementation)
- **Introduced:** 2024-Q4 (estimated)
- **Description:** Full-screen Monaco-based code editor with multi-file tabs, file sync, conflict resolution, and keyboard shortcuts. Supports 20+ programming languages with syntax highlighting.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'editor'`)

**Render Conditions:**
1. User navigates to Editor workbench
2. Component loads on workbench switch (`activeWorkbench` change)

**Positioning:** relative (fills workbench content area)
**Z-Index:** N/A (conflict dialog uses modal z-index)

---

## Lifecycle

**Mount Triggers:**
- User clicks "Editor" tab in TopBar
- Direct workbench navigation to 'editor'

**Key Effects:**
1. **Dependencies:** `[initialFiles, handleOpenFile]`
   - **Side Effects:** Opens initial files passed via props
   - **Cleanup:** None
   - **Condition:** Runs once on mount if initialFiles provided

2. **Dependencies:** `[fileToOpen, onFileOpened, handleOpenFile]`
   - **Side Effects:** Opens file requested by external component (e.g., FileTree)
   - **Cleanup:** Calls `onFileOpened()` callback
   - **Condition:** Runs when `fileToOpen` prop changes

3. **Dependencies:** `[onEvent, handleFileSystemEvent, openFiles]`
   - **Side Effects:** Subscribes to WebSocket file events (file:modified, file:deleted, file:created)
   - **Cleanup:** Unsubscribes from WebSocket events
   - **Condition:** Runs when `onEvent` or `openFiles` changes

4. **Dependencies:** `[openFiles]`
   - **Side Effects:** Syncs `openFilesRef` with state for use in callbacks
   - **Cleanup:** None
   - **Condition:** Runs on every `openFiles` update

**Cleanup Actions:**
- Unsubscribes from WebSocket file events
- Disposes Monaco editor instance (handled by Monaco component)

**Unmount Triggers:**
- User switches to different workbench
- WorkbenchLayout unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | `SessionId` | ✅ | N/A | Session ID for file operations |
| initialFiles | `string[]` | ❌ | `[]` | Initial files to open on mount |
| fileToOpen | `string \| null` | ❌ | N/A | File to open externally (from FileTree) |
| onFileOpened | `() => void` | ❌ | N/A | Callback when external file is opened |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onFileOpened | `() => void` | Called after `fileToOpen` is loaded |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| setActiveFilePath | `(path: string) => void` | EditorTabs | Switches active file |
| handleCloseFile | `(path: string) => void` | EditorTabs | Closes file tab |
| dismissToast | `(id: string) => void` | ToastContainer | Dismisses toast notification |
| handleConflictResolve | `(resolution) => void` | ConflictDialog | Resolves file conflict |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| openFiles | `EditorFile[]` | `[]` | handleOpenFile, handleCloseFile, handleContentChange, handleSave, handleFileModified, handleFileDeleted |
| activeFilePath | `string \| null` | `null` | handleOpenFile, handleCloseFile, setActiveFilePath |
| conflict | `FileConflict \| null` | `null` | handleConflictDetected, handleConflictResolve, handleConflictCancel |
| toasts | `ToastMessage[]` | `[]` | showToast, dismissToast |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| WebSocketContext | `onEvent` (for file system events) |
| DiscussContext | `registerChatInput`, `prefillChatInput` (via useDiscussButton) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| activeFile | `EditorFile \| undefined` | `openFiles`, `activeFilePath` | `openFiles.find(f => f.path === activeFilePath)` |
| hasUnsavedChanges | `boolean` | `openFiles` | `openFiles.some(f => f.isDirty)` |

### Custom Hooks
- `useEditorFiles(sessionId)` — Provides `readFile()`, `writeFile()`, `isLoading`, `error`
- `useWebSocketContext()` — Provides `onEvent()` for file sync
- `useFileSyncManager({ callbacks })` — Handles file:modified, file:deleted events with conflict detection
- `useDiscussButton({ componentName, getContext })` — Manages discuss dialog

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls `onFileOpened()` after loading external file request
- **Example:** FileTree requests file open → EditorWorkbench loads file → Calls callback

### Child Communication
- **Child:** EditorTabs
- **Mechanism:** props
- **Data Flow:** Passes `files`, `activeFilePath`, `onTabClick`, `onTabClose`

- **Child:** Monaco Editor
- **Mechanism:** props + ref
- **Data Flow:** Passes `value`, `onChange`, `onMount`, stores ref for Ctrl+S handler

- **Child:** ConflictDialog
- **Mechanism:** props
- **Data Flow:** Passes `filePath`, `userVersion`, `externalVersion`, `onResolve`, `onShowDiff`, `onCancel`

- **Child:** ToastContainer
- **Mechanism:** props
- **Data Flow:** Passes `toasts`, `onDismiss`

- **Child:** DiscussButton/DiscussDialog
- **Mechanism:** props
- **Data Flow:** Standard discuss button integration

### Sibling Communication
- **Sibling:** FileTree (via parent)
- **Mechanism:** prop-callback
- **Description:** FileTree triggers `onFileOpen` → Parent sets `fileToOpen` prop → EditorWorkbench opens file

### Context Interaction
- **Context:** WebSocketContext
- **Role:** consumer
- **Operations:** Subscribes to file:modified, file:deleted, file:created events

- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Prefills chat input with editor context

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/files/content/:path` | GET | `handleOpenFile()`, file sync manager | Updates `openFiles` with file content |
| `/api/files/content/:path` | PUT/POST | `handleSave()` (Ctrl+S) | Updates `isDirty: false`, shows success toast |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| `file:modified` | Backend detects file change | `handleFileModified()` → updates content, checks for conflicts |
| `file:deleted` | Backend detects file deletion | `handleFileDeleted()` → marks file as deleted |
| `file:created` | Backend detects file creation | (no handler) |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| N/A | N/A | N/A | N/A (toasts auto-dismiss via ToastContainer) |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| N/A | N/A | N/A | N/A |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| Monaco editor | Focus | `handleEditorMount()` |
| N/A | N/A | All other updates via React state |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.editor-workbench`
- `.editor-workbench__header`
- `.editor-workbench__unsaved-badge`
- `.editor-workbench__breadcrumb`
- `.editor-workbench__content`
- `.editor-workbench__loading`
- `.editor-workbench__error`
- `.editor-workbench__empty`

**Data Test IDs:**
- N/A

**ARIA Labels:**
- `aria-label="Close dialog"` (conflict dialog)

**Visual Landmarks:**
1. Header with breadcrumb (`.editor-workbench__header`) — Shows active file path
2. Unsaved changes badge (`.editor-workbench__unsaved-badge`) — Appears when any file has unsaved changes
3. Editor tabs bar (`.editor-tabs`) — Horizontal tab bar below header
4. Monaco editor (`.monaco-editor`) — Full-height code editor
5. Empty state icon and text (`.editor-workbench__empty`) — Shows when no file is open
6. Conflict dialog modal (`.conflict-dialog`) — Appears on file sync conflict

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CE-01: File Load and Display
- **Type:** data-fetch + render
- **Target:** File content loading and Monaco editor rendering
- **Condition:** Opening file fetches content, displays in Monaco within 2s
- **Failure Mode:** Loading spinner doesn't resolve, editor stays blank
- **Automation Script:**
```javascript
// Chrome MCP script
await navigate_page({ url: 'http://localhost:5173', type: 'url' });
await wait_for({ text: 'Editor', timeout: 5000 });
await click({ uid: '[aria-label="Editor tab button"]' });
// Simulate file open request (requires FileTree interaction)
await wait_for({ text: 'No File Open', timeout: 2000 });
const snapshot = await take_snapshot();
const hasEmpty = snapshot.includes('editor-workbench__empty');
assert(hasEmpty, 'Empty state should show when no file open');
```

#### HC-CE-02: Save Functionality (Ctrl+S)
- **Type:** interaction + API
- **Target:** File save on keyboard shortcut
- **Condition:** Pressing Ctrl/Cmd+S saves file, updates dirty state, shows toast
- **Failure Mode:** File doesn't save, dirty indicator persists
- **Automation Script:**
```javascript
// Chrome MCP script (requires Monaco editor interaction)
// Note: Monaco editor keyboard shortcuts require special handling
await fill({ uid: '.monaco-editor textarea', value: 'console.log("test");' });
await press_key({ key: 'Control+S' });
await wait_for({ text: 'Saved:', timeout: 3000 });
const snapshot = await take_snapshot();
const hasToast = snapshot.includes('toast');
assert(hasToast, 'Save toast should appear');
```

#### HC-CE-03: Tab Management
- **Type:** state-management
- **Target:** Opening, switching, and closing tabs
- **Condition:** Files open in tabs, clicking tab switches content, close button removes tab
- **Failure Mode:** Tabs don't switch, close doesn't work, content doesn't update
- **Automation Script:**
```javascript
// Chrome MCP script
// Open multiple files, click tabs, verify active tab changes
const beforeClick = await take_snapshot();
await click({ uid: '.editor-tab:nth-child(2)' });
const afterClick = await take_snapshot();
assert(beforeClick !== afterClick, 'Editor content should change on tab switch');
```

#### HC-CE-04: Conflict Resolution Dialog
- **Type:** modal + interaction
- **Target:** File sync conflict detection and resolution
- **Condition:** External file change while editing shows conflict dialog
- **Failure Mode:** Silent overwrite, no dialog, data loss
- **Automation Script:**
```javascript
// Chrome MCP script (requires WebSocket event simulation)
// Simulate file:modified event while editor has unsaved changes
// Verify dialog appears with "Keep Mine" and "Take Theirs" buttons
```

### Warning Checks (Should Pass)

#### HC-CE-05: Unsaved Changes Warning
- **Type:** user-feedback
- **Target:** Unsaved changes badge and close confirmation
- **Condition:** Dirty files show badge, close tab prompts confirmation
- **Failure Mode:** No warning, user loses unsaved work

#### HC-CE-06: Empty State Display
- **Type:** render-condition
- **Target:** Empty state when no file is open
- **Condition:** Shows icon, title, hint text, keyboard shortcut
- **Failure Mode:** Blank screen, no guidance

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| file-load | 1000 | ms | Time from open to content displayed in Monaco |
| save-operation | 500 | ms | Time from Ctrl+S to save complete + toast |
| tab-switch | 100 | ms | Time to switch between open tabs |
| monaco-render | 2000 | ms | Time for Monaco editor to initialize and render |
| syntax-highlight | 500 | ms | Time for syntax highlighting to complete |

---

## Dependencies

**Required Contexts:**
- WebSocketContext
- DiscussContext

**Required Hooks:**
- `useEditorFiles()`
- `useWebSocketContext()`
- `useFileSyncManager()`
- `useDiscussButton()`

**Child Components:**
- EditorTabs
- Monaco Editor (`@monaco-editor/react`)
- ConflictDialog
- ToastContainer
- DiscussButton
- DiscussDialog

**Required Props:**
- `sessionId` (required)

---

## Notes

### Supported Languages (20+)
- TypeScript (.ts, .tsx) → `typescript`
- JavaScript (.js, .jsx) → `javascript`
- Python (.py) → `python`
- JSON (.json) → `json`
- Markdown (.md) → `markdown`
- HTML (.html) → `html`
- CSS (.css, .scss) → `css`, `scss`
- YAML (.yaml, .yml) → `yaml`
- XML (.xml) → `xml`
- Shell (.sh, .bash) → `shell`
- SQL (.sql) → `sql`
- Go (.go) → `go`
- Rust (.rs) → `rust`
- Java (.java) → `java`
- C/C++ (.c, .cpp, .h, .hpp) → `c`, `cpp`
- C# (.cs) → `csharp`
- Ruby (.rb) → `ruby`
- PHP (.php) → `php`
- Fallback → `plaintext`

### Monaco Editor Options
- Theme: `vs-dark` (dark mode only)
- Minimap: enabled
- Line numbers: on
- Font size: 14px
- Tab size: 2 spaces
- Word wrap: on
- Cursor: smooth blinking + smooth animation
- Bracket colorization: enabled
- Folding: enabled
- Auto layout: true

### File Sync Behavior
- External file changes trigger `file:modified` WebSocket event
- If file is clean (not dirty), auto-updates content
- If file is dirty, shows conflict dialog with options:
  - **Keep Mine** — Keeps local changes, sets dirty flag
  - **Take Theirs** — Accepts external version, resets dirty flag
  - **Show Diff** — Not yet implemented (see Future Enhancements below)
- Deleted files marked with `isDeleted: true`, show warning badge

### Known Limitations
- No multi-cursor support
- No split editor view
- No file explorer sidebar within editor
- Conflict dialog diff view is simplified (see Future Enhancements below)
- No undo/redo history persistence across sessions
- No code formatting on save (should integrate Prettier/ESLint)

### Future Enhancements
- Full diff viewer for conflict resolution
- Advanced conflict dialog with side-by-side diff view

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
