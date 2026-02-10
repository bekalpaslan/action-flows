# Component Contract: FileTree

**File:** `packages/app/src/components/FileExplorer/FileTree.tsx`
**Type:** feature
**Parent Group:** FileExplorer
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** FileTree
- **Introduced:** 2024-Q4 (estimated)
- **Description:** Recursive tree view component for rendering nested directory structures. Supports expand/collapse, selection, context menu, and file icons.

---

## Render Location

**Mounts Under:**
- FileTree (recursively, for child directories)
- ExploreWorkbench (initial mount via FileTree wrapper)

**Render Conditions:**
1. Tree data is available (`tree.length > 0`)
2. Directory is expanded (`expandedDirs.has(entry.path)`)
3. Entry has children (`entry.children && entry.children.length > 0`)

**Positioning:** relative (within parent tree container)
**Z-Index:** N/A (context menu uses `position: fixed` with auto z-index)

---

## Lifecycle

**Mount Triggers:**
- Parent FileTree renders with directory entry
- Initial mount from ExploreWorkbench

**Key Effects:**
1. **Dependencies:** `[contextMenuPath]`
   - **Side Effects:** Registers global click listener to close context menu
   - **Cleanup:** Removes click event listener
   - **Condition:** Runs when context menu is opened

**Cleanup Actions:**
- Removes global click event listener for context menu

**Unmount Triggers:**
- Parent directory collapsed
- Parent component unmounts
- Tree data changes (re-renders)

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| tree | `DirectoryEntry[]` | ✅ | N/A | Array of directory entries to render |
| onFileSelect | `(path: string) => void` | ❌ | N/A | Callback when file is selected (single click) |
| onFileOpen | `(path: string) => void` | ❌ | N/A | Callback when file is opened (double click) |
| level | `number` | ❌ | `0` | Current nesting level (for indentation) |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onFileSelect | `(path: string) => void` | Called when user clicks a file entry |
| onFileOpen | `(path: string) => void` | Called when user double-clicks a file entry |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onFileSelect | `(path: string) => void` | FileTree (recursive) | Passes selection callback to child trees |
| onFileOpen | `(path: string) => void` | FileTree (recursive) | Passes open callback to child trees |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| expandedDirs | `Set<string>` | `new Set()` | toggleDirectory |
| selectedPath | `string \| null` | `null` | handleFileClick |
| contextMenuPath | `string \| null` | `null` | handleContextMenu, handleClick (global) |
| contextMenuPosition | `{ x: number; y: number } \| null` | `null` | handleContextMenu, handleClick (global) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `registerChatInput`, `prefillChatInput` (via useDiscussButton) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| N/A | N/A | N/A | N/A |

### Custom Hooks
- `useDiscussButton({ componentName, getContext })` — Manages discuss dialog for file tree

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls parent callbacks for file selection and opening
- **Example:** `onFileSelect?.('src/index.ts')` → Parent updates selected state

### Child Communication
- **Child:** FileTree (recursive)
- **Mechanism:** props
- **Data Flow:** Passes `tree`, `onFileSelect`, `onFileOpen`, `level + 1` to child trees

- **Child:** FileIcon
- **Mechanism:** props
- **Data Flow:** Passes `type`, `name` for icon rendering

- **Child:** DiscussButton
- **Mechanism:** props
- **Data Flow:** Passes `componentName`, `onClick` to open dialog

- **Child:** DiscussDialog
- **Mechanism:** props
- **Data Flow:** Passes `isOpen`, `componentName`, `componentContext`, `onSend`, `onClose`

### Sibling Communication
- **Sibling:** None (isolated tree component)
- **Mechanism:** N/A
- **Description:** N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Prefills chat input with file tree context

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| N/A | N/A | N/A | N/A (data provided via props) |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | None |

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
| N/A | N/A | N/A (no direct DOM manipulation) |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.file-tree`
- `.file-tree-item`
- `.file-tree-entry`
- `.file-tree-entry.file`
- `.file-tree-entry.directory`
- `.file-tree-entry.selected`
- `.directory-toggle`
- `.entry-name`
- `.entry-size`
- `.file-context-menu`

**Data Test IDs:**
- N/A

**ARIA Labels:**
- N/A (component should add ARIA attributes for accessibility)

**Visual Landmarks:**
1. Directory toggle arrow (`.directory-toggle`) — `▼` when expanded, `▶` when collapsed
2. File icons (`.file-icon`) — Emoji icons rendered by FileIcon component
3. Entry name (`.entry-name`) — File or directory name
4. File size (`.entry-size`) — Formatted size for files only
5. Context menu (`.file-context-menu`) — Fixed position menu on right-click

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-FT-01: Recursive Rendering
- **Type:** render
- **Target:** Nested FileTree components
- **Condition:** Directories with children render child FileTree components when expanded
- **Failure Mode:** Tree stops at first level, no nested directories shown
- **Automation Script:**
```javascript
// Chrome MCP script
await click({ uid: '.directory-toggle' }); // Expand first directory
const snapshot = await take_snapshot();
const hasNested = snapshot.includes('paddingLeft: 16px'); // Check for nested indentation
assert(hasNested, 'Nested directories should render with increased padding');
```

#### HC-FT-02: Expand/Collapse Toggle
- **Type:** interaction
- **Target:** Directory expand/collapse
- **Condition:** Clicking directory or toggle arrow expands/collapses children
- **Failure Mode:** Directories don't expand or collapse on click
- **Automation Script:**
```javascript
// Chrome MCP script
const before = await take_snapshot();
await click({ uid: '.file-tree-entry.directory' });
const after = await take_snapshot();
const toggleChanged = before !== after;
assert(toggleChanged, 'Tree should change after directory click');
```

#### HC-FT-03: Context Menu Display
- **Type:** interaction
- **Target:** Right-click context menu
- **Condition:** Right-clicking entry shows context menu at cursor position
- **Failure Mode:** Context menu doesn't appear or appears at wrong position
- **Automation Script:**
```javascript
// Chrome MCP script
// Note: Chrome MCP doesn't support right-click, manual test required
// Verify: Right-click file → Menu appears with Open, Copy Path, Reveal options
```

### Warning Checks (Should Pass)

#### HC-FT-04: Selection State
- **Type:** state-management
- **Target:** Selected entry highlighting
- **Condition:** Clicking entry adds `.selected` class
- **Failure Mode:** Selection doesn't persist or highlight doesn't show

#### HC-FT-05: Context Menu Cleanup
- **Type:** cleanup
- **Target:** Global click listener removal
- **Condition:** Context menu closes on any click outside menu
- **Failure Mode:** Context menu stays open, multiple menus can open

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| expand-collapse | 50 | ms | Time to toggle directory expansion |
| selection-update | 20 | ms | Time to update selected class |
| context-menu-show | 50 | ms | Time to display context menu |
| recursive-render | 200 | ms | Time to render deeply nested tree (10+ levels) |

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- `useDiscussButton()`

**Child Components:**
- FileIcon
- FileTree (self-recursive)
- DiscussButton
- DiscussDialog

**Required Props:**
- `tree` (DirectoryEntry[] - required)

---

## Notes

- Component is self-recursive for nested directory rendering
- `level` prop controls indentation via `paddingLeft` style
- Context menu actions: Open, Copy Path, Reveal (Reveal not yet implemented)
- Context menu uses fixed positioning, appears at cursor
- Global click listener ensures only one context menu at a time
- DiscussButton only renders at root level (`level === 0`)
- File size formatting: B, KB, MB, GB with 1 decimal precision
- No keyboard navigation support (should be added for accessibility)
- Selection state is local to FileTree, not shared with parent ExploreWorkbench

### Future Enhancements
- Implement "Reveal" context menu action
- Add keyboard navigation support for accessibility

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
