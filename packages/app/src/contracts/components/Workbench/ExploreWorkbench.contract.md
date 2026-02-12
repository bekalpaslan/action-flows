# Component Contract: ExploreStar

**File:** `packages/app/src/components/Stars/ExploreStar.tsx`
**Type:** page
**Parent Group:** Stars
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ExploreStar
- **Introduced:** 2026-01-20
- **Description:** File explorer workbench with search, keyboard navigation (arrow keys, Home, End), and file tree view with expand/collapse. Supports filtering by hidden files.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'explore'`)

**Render Conditions:**
1. User selects "Explore" tab in TopBar

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to Explore workbench

**Key Effects:**
1. **Dependencies:** `[]`
   - **Side Effects:** Registers Ctrl+F / Cmd+F keyboard shortcut for search input focus
   - **Cleanup:** Removes event listener
   - **Condition:** Runs once on mount

2. **Dependencies:** `[focusedIndex]`
   - **Side Effects:** Scrolls focused item into view
   - **Cleanup:** None
   - **Condition:** Runs when focusedIndex changes

**Cleanup Actions:**
- Removes global keydown listener

**Unmount Triggers:**
- User switches workbenches

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | `string` | ❌ | `'global'` | Session ID for file tree context |
| onFileSelect | `(path: string) => void` | ❌ | undefined | Callback when file is selected |
| onFileOpen | `(path: string) => void` | ❌ | undefined | Callback when file is opened (double-click or Enter) |
| showHidden | `boolean` | ❌ | false | Whether to show hidden files by default |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onFileSelect | `(path: string) => void` | Notifies parent of file selection |
| onFileOpen | `(path: string) => void` | Notifies parent to open file |

### Callbacks Down (to children)
None (uses FileIcon utility component)

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| showHidden | `boolean` | `initialShowHidden` | handleToggleHidden |
| searchQuery | `string` | `''` | handleSearchChange |
| expandedDirs | `Set<string>` | `new Set()` | toggleDirectory |
| selectedPath | `string \| null` | `null` | handleEntryClick |
| focusedIndex | `number` | `-1` | handleKeyDown |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `prefillChatInput()` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| filteredTree | `DirectoryEntry[]` | `[tree, searchQuery]` | Filters tree by search query |
| flattenedEntries | `DirectoryEntry[]` | `[filteredTree, expandedDirs]` | Flattens tree for keyboard navigation |

### Custom Hooks
- `useFileTree(sessionId, showHidden)` — Fetches file tree from backend
- `useDiscussButton()` — Manages DiscussButton dialog

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when files are selected or opened
- **Example:** User double-clicks file → `onFileOpen(path)` → Parent opens in editor

### Child Communication
- **Child:** FileIcon
- **Mechanism:** props
- **Data Flow:** Passes file type and name for icon display

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens discuss dialog with search context

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/files/tree` | GET | Mount, refresh, showHidden toggle | Updates tree state via hook |

### WebSocket Events
N/A

### Timers
N/A

### LocalStorage Operations
N/A

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| Focused tree item | scrollIntoView | Keyboard navigation changes focusedIndex |

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.explore-workbench`
- `.explore-workbench__search-input`
- `.explore-workbench__tree`
- `.explore-workbench__tree-item`
- `.explore-workbench__tree-entry`
- `.explore-workbench__toggle`
- `.explore-workbench__entry-name`

**Data Test IDs:**
N/A

**ARIA Labels:**
- `aria-label="Search files"` (search input)
- `aria-label="File tree"` (tree container)
- `aria-label="Hide/Show hidden files"` (toggle button)
- `aria-label="Refresh file tree"` (refresh button)

**Visual Landmarks:**
1. Search bar with Ctrl+F hint (`.explore-workbench__search`)
2. File tree with indented entries (`.explore-workbench__tree`)
3. Status bar with item count (`.explore-workbench__status-bar`)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-EW-001: File Tree Loads
- **Type:** api-call
- **Target:** GET `/api/files/tree`
- **Condition:** Tree data loaded within 5s
- **Failure Mode:** No files visible
- **Automation Script:**
```javascript
const startTime = Date.now();
const tree = await new Promise(resolve => {
  const checkTree = () => {
    const treeEl = document.querySelector('.explore-workbench__tree');
    if (treeEl) resolve(true);
    else if (Date.now() - startTime > 5000) resolve(false);
    else setTimeout(checkTree, 100);
  };
  checkTree();
});
return tree;
```

#### HC-EW-002: Search Filters Tree
- **Type:** user-input
- **Target:** Search input
- **Condition:** Typing filters tree entries
- **Failure Mode:** Search doesn't work
- **Automation Script:**
```javascript
const input = document.querySelector('.explore-workbench__search-input');
input.value = 'test';
input.dispatchEvent(new Event('change', { bubbles: true }));
await new Promise(resolve => setTimeout(resolve, 100));
const results = document.querySelectorAll('.explore-workbench__tree-item').length;
return results >= 0; // Should filter to matching items
```

#### HC-EW-003: Keyboard Navigation Works
- **Type:** keyboard-interaction
- **Target:** Tree container
- **Condition:** Arrow keys change focus, Enter opens file
- **Failure Mode:** No keyboard accessibility
- **Automation Script:**
```javascript
const tree = document.querySelector('.explore-workbench__content');
tree.focus();
const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
tree.dispatchEvent(arrowDownEvent);
await new Promise(resolve => setTimeout(resolve, 100));
const focused = document.querySelector('.explore-workbench__tree-entry.focused');
return focused !== null;
```

#### HC-EW-004: Directory Toggle Works
- **Type:** user-interaction
- **Target:** Directory entries
- **Condition:** Clicking directory expands/collapses children
- **Failure Mode:** Can't navigate directories
- **Automation Script:**
```javascript
const dirEntry = Array.from(document.querySelectorAll('.explore-workbench__tree-entry'))
  .find(el => el.classList.contains('directory'));
if (!dirEntry) return true; // No directories to test
dirEntry.click();
await new Promise(resolve => setTimeout(resolve, 100));
const isExpanded = dirEntry.getAttribute('aria-expanded') === 'true';
return isExpanded;
```

### Warning Checks (Should Pass)

#### HC-EW-005: Hidden Files Toggle Works
- **Type:** user-action
- **Target:** Show/Hide hidden button
- **Condition:** Button toggles hidden file visibility
- **Failure Mode:** Can't see hidden files

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- useFileTree
- useDiscussButton

**Child Components:**
- FileIcon (from `../FileExplorer`)
- DiscussButton
- DiscussDialog

**Required Props:**
None (all optional)

---

## Notes

- Keyboard shortcuts: Ctrl+F focuses search, Arrow keys navigate, Enter opens file, Home/End jump to first/last
- Search filters by file name and path
- Directory depth is visualized with padding-left indentation
- Supports both click and keyboard navigation
- File metadata (size, modified date) displayed inline

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
