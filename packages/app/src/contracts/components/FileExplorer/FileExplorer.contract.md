# Component Contract: ExploreStar (FileExplorer)

**File:** `packages/app/src/components/Stars/ExploreStar.tsx`
**Type:** page
**Parent Group:** Stars
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ExploreStar (serves as the primary FileExplorer implementation)
- **Introduced:** 2024-Q4 (estimated)
- **Description:** Full-featured file browser workbench with search, keyboard navigation, and recursive directory tree rendering. Supports filtering, hidden file toggle, and real-time file tree updates.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'explore'`)

**Render Conditions:**
1. User navigates to Explore workbench (`canWorkbenchHaveSessions('explore')` is false, always renders)
2. Component loads on workbench switch (`activeWorkbench` change)

**Positioning:** relative (fills workbench content area)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User clicks "Explore" tab in TopBar
- Direct workbench navigation to 'explore'

**Key Effects:**
1. **Dependencies:** `[sessionId, showHidden]`
   - **Side Effects:** HTTP GET `/api/files/tree` via `useFileTree()` hook
   - **Cleanup:** Aborts pending fetch on unmount
   - **Condition:** Runs on mount and when `sessionId` or `showHidden` changes

2. **Dependencies:** `[]`
   - **Side Effects:** Registers global `Ctrl/Cmd+F` keyboard listener for search focus
   - **Cleanup:** Removes event listener
   - **Condition:** Runs once on mount

3. **Dependencies:** `[focusedIndex]`
   - **Side Effects:** Scrolls focused tree item into view
   - **Cleanup:** None
   - **Condition:** Runs when focused index changes (keyboard navigation)

4. **Dependencies:** `[tree, searchQuery]`
   - **Side Effects:** Filters tree based on search query (pure computation, no I/O)
   - **Cleanup:** None
   - **Condition:** Runs when tree data or search query updates

**Cleanup Actions:**
- Removes global keyboard event listener for Ctrl+F
- Aborts in-flight HTTP requests (via useFileTree cleanup)

**Unmount Triggers:**
- User switches to different workbench
- WorkbenchLayout unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | `string` | ❌ | `'global'` | Session ID for file tree context |
| onFileSelect | `(path: string) => void` | ❌ | N/A | Callback when file is selected (single click) |
| onFileOpen | `(path: string) => void` | ❌ | N/A | Callback when file is opened (double click or Enter) |
| showHidden | `boolean` | ❌ | `false` | Whether to show hidden files by default |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onFileSelect | `(path: string) => void` | Called when user single-clicks a file |
| onFileOpen | `(path: string) => void` | Called when user double-clicks file or presses Enter |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| openDialog | `() => void` | DiscussButton | Opens discuss dialog |
| handleSend | `(message: string) => void` | DiscussDialog | Sends discuss message to chat |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| showHidden | `boolean` | `initialShowHidden` | handleToggleHidden |
| searchQuery | `string` | `''` | handleSearchChange, handleClearSearch |
| expandedDirs | `Set<string>` | `new Set()` | toggleDirectory |
| selectedPath | `string \| null` | `null` | handleEntryClick, keyboard navigation |
| focusedIndex | `number` | `-1` | keyboard navigation (arrow keys, Home, End) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `registerChatInput`, `prefillChatInput` (via useDiscussButton) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| filteredTree | `DirectoryEntry[]` | `[tree, searchQuery]` | `filterTree(tree, searchQuery)` |
| flattenedEntries | `DirectoryEntry[]` | `[filteredTree, expandedDirs]` | `flattenTree(filteredTree, expandedDirs)` |

### Custom Hooks
- `useFileTree(sessionId, showHidden)` — Fetches file tree from backend, manages loading/error state
- `useDiscussButton({ componentName, getContext })` — Manages discuss dialog state and message formatting

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls `onFileSelect` on single click, `onFileOpen` on double click/Enter
- **Example:** `onFileOpen?.('src/index.ts')` → Parent opens file in EditorWorkbench

### Child Communication
- **Child:** FileIcon
- **Mechanism:** props
- **Data Flow:** Passes `type` (file/directory) and `name` for icon rendering

### Sibling Communication
- **Sibling:** ChatPanel
- **Mechanism:** context (DiscussContext)
- **Description:** Sends formatted discuss message to chat input via context ref

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Prefills chat input with discuss message including component context

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/files/tree` | GET | Mount, `sessionId` or `showHidden` change | Updates `tree` state in useFileTree hook |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | None (file tree doesn't subscribe to real-time updates) |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| N/A | N/A | N/A | N/A |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| N/A | N/A | N/A | N/A |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| `[data-index="${focusedIndex}"]` | `scrollIntoView()` | Keyboard navigation changes focused index |
| `searchInputRef.current` | `focus()`, `select()` | Ctrl+F pressed, Clear Search clicked |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.explore-workbench`
- `.explore-workbench__header`
- `.explore-workbench__search-input`
- `.explore-workbench__tree`
- `.explore-workbench__tree-item`
- `.explore-workbench__tree-entry`
- `.explore-workbench__action-btn`
- `.explore-workbench__status-bar`

**Data Test IDs:**
- N/A (component uses CSS classes for targeting)

**ARIA Labels:**
- `aria-label="Search files"`
- `aria-label="Refresh file tree"`
- `aria-label="Hide hidden files"` / `"Show hidden files"`
- `aria-label="Clear search"`
- `aria-label="File tree"`
- `role="tree"`
- `role="treeitem"`
- `aria-selected={isSelected}`
- `aria-expanded={isExpanded}`

**Visual Landmarks:**
1. Search bar with magnifying glass icon (`.explore-workbench__search`) — Unique gray bar at top
2. Status bar at bottom (`.explore-workbench__status-bar`) — Shows item count and selected path
3. Tree container with keyboard focus ring (`.explore-workbench__content`) — Takes focus for navigation
4. Toggle buttons in header (`.explore-workbench__header-right`) — Discuss, Show/Hide Hidden, Refresh

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-FE-01: File Tree Data Fetch
- **Type:** data-fetch
- **Target:** useFileTree hook
- **Condition:** `tree` is not null after mount, `isLoading` becomes false within 2s
- **Failure Mode:** Component shows "Loading files..." indefinitely, no tree renders
- **Automation Script:**
```javascript
// Chrome MCP script
await navigate_page({ url: 'http://localhost:5173', type: 'url' });
await wait_for({ text: 'Explore', timeout: 5000 });
await click({ uid: '[aria-label="Explore tab button"]' });
await wait_for({ text: 'items', timeout: 3000 }); // Status bar shows item count
const snapshot = await take_snapshot();
const hasTree = snapshot.includes('explore-workbench__tree');
assert(hasTree, 'File tree should render after data fetch');
```

#### HC-FE-02: Search Functionality
- **Type:** interaction
- **Target:** Search input and filtering logic
- **Condition:** Typing in search input filters tree within 100ms, result count updates
- **Failure Mode:** Search input doesn't filter, or filters incorrectly
- **Automation Script:**
```javascript
// Chrome MCP script
await fill({ uid: '[aria-label="Search files"]', value: '.tsx' });
await wait_for({ text: 'result', timeout: 500 });
const snapshot = await take_snapshot();
const hasResults = snapshot.includes('explore-workbench__search-results');
assert(hasResults, 'Search results count should appear');
```

#### HC-FE-03: Keyboard Navigation
- **Type:** interaction
- **Target:** Arrow key navigation and focus management
- **Condition:** Arrow keys change focused item, Enter opens file, focus indicator visible
- **Failure Mode:** Keyboard navigation doesn't work, focus indicator missing
- **Automation Script:**
```javascript
// Chrome MCP script
await click({ uid: '.explore-workbench__content' }); // Focus tree
await press_key({ key: 'ArrowDown' });
await press_key({ key: 'ArrowDown' });
const snapshot = await take_snapshot();
const hasFocused = snapshot.includes('focused');
assert(hasFocused, 'Focused item should have focused class');
```

### Warning Checks (Should Pass)

#### HC-FE-04: Empty State Display
- **Type:** render-condition
- **Target:** Empty state when no files match search
- **Condition:** Searching for non-existent term shows "No files match" message
- **Failure Mode:** Shows empty tree without explanation

#### HC-FE-05: Error Handling
- **Type:** error-recovery
- **Target:** Error display and retry button
- **Condition:** When API fails, shows error message with Retry button
- **Failure Mode:** Shows loading spinner forever, no error feedback

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| initial-render | 500 | ms | Time from mount to first tree render |
| search-filter | 100 | ms | Time from keypress to filtered tree update |
| tree-expand | 50 | ms | Time to expand/collapse directory |
| keyboard-nav | 50 | ms | Time to update focus on arrow key press |

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- `useFileTree()`
- `useDiscussButton()`

**Child Components:**
- FileIcon
- DiscussButton
- DiscussDialog

**Required Props:**
- None (all props have defaults)

---

## Notes

- Component acts as both a workbench and the primary FileExplorer implementation
- Uses recursive flattening for keyboard navigation (flatten + expand/collapse state)
- Search filters by both filename and full path (case-insensitive)
- Keyboard navigation follows standard tree widget ARIA patterns
- Hidden files controlled by backend API, not client-side filtering
- Status bar shows real-time item count and selected path
- Ctrl/Cmd+F focuses search input (global shortcut within workbench)

### Future Enhancements
- Context menu implementation (currently marked as future work in FileTree component)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
