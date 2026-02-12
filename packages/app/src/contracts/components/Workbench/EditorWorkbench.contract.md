# Component Contract: EditorTool

**File:** `packages/app/src/components/Tools/EditorTool/EditorTool.tsx`
**Type:** page
**Parent Group:** Tools
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** EditorTool
- **Introduced:** 2026-02-02
- **Description:** Full-screen code editor with multi-file tabs, Monaco integration, file save (Cmd/Ctrl+S), unsaved changes tracking, and file sync via WebSocket.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'editor'`)

**Render Conditions:**
1. User selects "Editor" tab in TopBar

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to Editor workbench

**Key Effects:**
1. **Dependencies:** `[openFiles]`
   - **Side Effects:** Keeps openFilesRef in sync with state
   - **Cleanup:** None
   - **Condition:** Runs when openFiles changes

2. **Dependencies:** `[onEvent, handleFileSystemEvent, openFiles]`
   - **Side Effects:** Subscribes to WebSocket file events (file:modified, file:deleted, file:created)
   - **Cleanup:** Unsubscribes from WebSocket
   - **Condition:** Runs when dependencies change

3. **Dependencies:** `[initialFiles, handleOpenFile]`
   - **Side Effects:** Opens initial files on mount
   - **Cleanup:** None
   - **Condition:** Runs once if initialFiles provided

4. **Dependencies:** `[fileToOpen, onFileOpened, handleOpenFile]`
   - **Side Effects:** Opens externally requested file
   - **Cleanup:** None
   - **Condition:** Runs when fileToOpen changes

**Cleanup Actions:**
- Unsubscribes from WebSocket events

**Unmount Triggers:**
- User switches workbenches

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | `SessionId` | ✅ | N/A | Session ID for file operations |
| initialFiles | `string[]` | ❌ | `[]` | Initial files to open |
| fileToOpen | `string \| null` | ❌ | undefined | File to open externally |
| onFileOpened | `() => void` | ❌ | undefined | Callback when external file is opened |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onFileOpened | `() => void` | Notifies parent that external file was opened |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onTabClick | `(path) => void` | EditorTabs | Switches active file |
| onTabClose | `(path) => void` | EditorTabs | Closes file tab |
| onChange | `(value) => void` | Monaco Editor | Handles content changes |
| onMount | `(editor, monaco) => void` | Monaco Editor | Registers editor instance |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| openFiles | `EditorFile[]` | `[]` | setOpenFiles |
| activeFilePath | `string \| null` | `null` | setActiveFilePath |
| conflict | `FileConflict \| null` | `null` | setConflict |
| toasts | `ToastMessage[]` | `[]` | setToasts |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| WebSocketContext | `onEvent` |
| DiscussContext | `prefillChatInput()` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| activeFile | `EditorFile \| undefined` | `[openFiles, activeFilePath]` | Finds active file by path |
| hasUnsavedChanges | `boolean` | `[openFiles]` | Checks if any file has isDirty=true |

### Custom Hooks
- `useEditorFiles(sessionId)` — Provides readFile/writeFile functions
- `useWebSocketContext()` — Accesses WebSocket event subscription
- `useFileSyncManager(callbacks)` — Handles file system events and conflicts
- `useDiscussButton()` — Manages DiscussButton dialog

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when external file is opened
- **Example:** User opens file from Explorer → `fileToOpen` prop → Opens file → `onFileOpened()`

### Child Communication
- **Child:** Monaco Editor
- **Mechanism:** props + ref
- **Data Flow:** Passes file content, language, options; receives editor instance via onMount

### Sibling Communication
N/A

### Context Interaction
- **Context:** WebSocketContext
- **Role:** consumer
- **Operations:** Subscribes to file system events for real-time sync

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/files/content/:path` | GET | File open | Loads file content into editor |
| `/api/files/:path` | PUT/POST | Ctrl/Cmd+S | Saves file content |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| `file:modified` | External file change | handleFileModified |
| `file:deleted` | External file deletion | handleFileDeleted |
| `file:created` | External file creation | N/A (future) |

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
- `.editor-workbench`
- `.editor-workbench__header`
- `.editor-workbench__unsaved-badge`
- `.editor-workbench__breadcrumb`
- `.editor-tabs`
- `.editor-tab`
- `.editor-tab--dirty`
- `.monaco-editor`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Header with breadcrumb (`.editor-workbench__breadcrumb`) — Shows active file path
2. Unsaved badge (`.editor-workbench__unsaved-badge`) — Appears when changes exist
3. Editor tabs (`.editor-tabs`) — Multi-file tab bar
4. Monaco Editor (`.monaco-editor`) — Main code editor
5. Empty state — "No File Open" message when no tabs

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-EDW-001: File Opens
- **Type:** api-call
- **Target:** GET `/api/files/content/:path`
- **Condition:** File loads within 3s
- **Failure Mode:** Can't open files
- **Automation Script:**
```javascript
const startTime = Date.now();
// Trigger file open
await new Promise(resolve => setTimeout(resolve, 3000));
const editor = document.querySelector('.monaco-editor');
return editor && (Date.now() - startTime) < 3000;
```

#### HC-EDW-002: File Saves (Ctrl+S)
- **Type:** keyboard-shortcut + api-call
- **Target:** Ctrl/Cmd+S → PUT `/api/files/:path`
- **Condition:** Pressing Ctrl+S saves file
- **Failure Mode:** Can't save changes
- **Automation Script:**
```javascript
const editor = document.querySelector('.monaco-editor');
const saveEvent = new KeyboardEvent('keydown', {
  key: 's',
  ctrlKey: true,
  metaKey: true
});
editor.dispatchEvent(saveEvent);
await new Promise(resolve => setTimeout(resolve, 1000));
const unsavedBadge = document.querySelector('.editor-workbench__unsaved-badge');
return unsavedBadge === null; // Badge should disappear after save
```

#### HC-EDW-003: Tab Switching Works
- **Type:** user-action
- **Target:** Editor tabs
- **Condition:** Clicking tab switches active file
- **Failure Mode:** Can't switch files
- **Automation Script:**
```javascript
const tabs = document.querySelectorAll('.editor-tab');
if (tabs.length < 2) return true; // Need multiple tabs
tabs[1].click();
await new Promise(resolve => setTimeout(resolve, 100));
return tabs[1].classList.contains('editor-tab--active');
```

#### HC-EDW-004: Unsaved Changes Tracked
- **Type:** state-tracking
- **Target:** isDirty flag on files
- **Condition:** Editing file marks it as dirty
- **Failure Mode:** No unsaved indicator
- **Automation Script:**
```javascript
// Edit file
const editor = document.querySelector('.monaco-editor');
// Simulate typing
await new Promise(resolve => setTimeout(resolve, 500));
const unsavedBadge = document.querySelector('.editor-workbench__unsaved-badge');
return unsavedBadge !== null;
```

#### HC-EDW-005: WebSocket File Sync Works
- **Type:** websocket-event
- **Target:** file:modified event handler
- **Condition:** External file change updates editor
- **Failure Mode:** Stale file content
- **Automation Script:**
```javascript
// Simulate external file change event
const event = { type: 'file:modified', filePath: 'test.ts', content: 'new content' };
// Verify editor content updates
return true; // Verify via event monitoring
```

### Warning Checks (Should Pass)

#### HC-EDW-006: Conflict Dialog Appears
- **Type:** conflict-detection
- **Target:** ConflictDialog
- **Condition:** Concurrent edits show conflict resolution dialog
- **Failure Mode:** Data loss from conflicts

#### HC-EDW-007: Tab Close Confirmation
- **Type:** user-protection
- **Target:** Close tab with unsaved changes
- **Condition:** Shows confirmation dialog
- **Failure Mode:** Accidental data loss

---

## Dependencies

**Required Contexts:**
- WebSocketContext (for file sync)
- DiscussContext (for DiscussButton)

**Required Hooks:**
- useEditorFiles
- useWebSocketContext
- useFileSyncManager
- useDiscussButton

**Child Components:**
- Editor (from `@monaco-editor/react`)
- EditorTabs (from `../CodeEditor`)
- ConflictDialog (from `../CodeEditor`)
- ToastContainer (from `../Toast`)
- DiscussButton
- DiscussDialog

**Required Props:**
- `sessionId`

---

## Notes

- Monaco language detection via `LANGUAGE_MAP` (40+ languages)
- Ctrl/Cmd+S keyboard shortcut registered via Monaco's addCommand
- File conflict resolution: keep-mine or take-theirs
- EditorFile structure: path, content, isDirty, originalContent, isDeleted
- Toast notifications for save success/errors
- Breadcrumb shows full file path split by segments

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
