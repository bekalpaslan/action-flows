# Component Contract: FolderHierarchy

**File:** `packages/app/src/components/SessionPanel/FolderHierarchy.tsx`
**Type:** widget
**Parent Group:** SessionPanel/
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** FolderHierarchy
- **Introduced:** 2026-01-10
- **Description:** Workspace file tree panel with expand/collapse folders, file type icons, search functionality, and collapsible header. Phase 1 uses static mock data.

---

## Render Location

**Mounts Under:**
- Previously part of LeftPanelStack accordion (now deprecated in favor of ChatPanel-only layout)

**Render Conditions:**
1. workspaceRoot prop provided
2. May be conditionally rendered in future layouts

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders FolderHierarchy
- workspaceRoot prop provided

**Key Effects:**
None (uses static data, no side effects)

**Cleanup Actions:**
- None

**Unmount Triggers:**
- Parent unmounts
- Component removed from layout

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| workspaceRoot | `string` | ✅ | N/A | Workspace root path |
| onFileSelect | `(filePath: string) => void` | ❌ | N/A | Callback when file selected |
| height | `number \| string` | ❌ | `200` | Panel height (px or CSS value) |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onFileSelect | `(filePath: string) => void` | User clicks file → parent opens/selects |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onNodeClick | `(node: FileTreeNode) => void` | FileTreeRecursive | Node clicked → toggles directory or selects file |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| searchQuery | `string` | `''` | setSearchQuery (search input) |
| expandedDirs | `Set<string>` | `Set(['D:/ActionFlowsDashboard/packages', 'D:/ActionFlowsDashboard/.claude'])` | setExpandedDirs (toggle handler) |
| selectedPath | `string \| null` | `null` | setSelectedPath (file click) |
| isCollapsed | `boolean` | `false` | setIsCollapsed (header click) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| N/A | N/A |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| MOCK_FILE_TREE | `FileTreeNode[]` | `[]` (useMemo) | Static mock file tree structure |
| filteredTree | `FileTreeNode[]` | `[searchQuery, MOCK_FILE_TREE]` | Filters tree by search query |

### Custom Hooks
- None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when user selects file
- **Example:**
  ```tsx
  handleNodeClick(fileNode) → onFileSelect(filePath)
  ```

### Child Communication
- **Child:** FileTreeRecursive (internal component)
- **Mechanism:** props
- **Data Flow:** Passes `nodes`, `expandedDirs`, `selectedPath`, `onNodeClick`, `level`

### Sibling Communication
- **Sibling:** None
- **Mechanism:** N/A
- **Description:** N/A

### Context Interaction
- **Context:** None
- **Role:** N/A
- **Operations:** N/A

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| N/A | N/A | N/A | Phase 1: Static mock data. TODO: GET /api/workspace/:sessionId/files |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A (future: file change events) |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| N/A | N/A | N/A | N/A |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| N/A | N/A | N/A | N/A (future: persist expanded dirs) |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| N/A | N/A | N/A |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.folder-hierarchy`
- `.folder-hierarchy.collapsed`
- `.folder-hierarchy__header`
- `.folder-hierarchy__title`
- `.folder-hierarchy__collapse-toggle`
- `.collapse-icon`
- `.collapse-icon.collapsed`
- `.folder-hierarchy__search`
- `.folder-hierarchy__search-input`
- `.folder-hierarchy__tree`
- `.folder-hierarchy__list`
- `.folder-hierarchy__item`
- `.folder-hierarchy__node`
- `.folder-hierarchy__node.file`
- `.folder-hierarchy__node.directory`
- `.folder-hierarchy__node.selected`
- `.folder-hierarchy__chevron`
- `.folder-hierarchy__icon`
- `.folder-hierarchy__name`

**Data Test IDs:**
- N/A (use CSS selectors)

**ARIA Labels:**
- `aria-label="Expand panel" | "Collapse panel"` (collapse toggle button)

**Visual Landmarks:**
1. Header with "Files" title (`.folder-hierarchy__header`) — Clickable to collapse
2. Collapse toggle button (`.folder-hierarchy__collapse-toggle`) — Chevron icon
3. Search input (`.folder-hierarchy__search-input`) — Filter by file name
4. Tree view (`.folder-hierarchy__tree`) — Scrollable file/folder list
5. Folder chevrons (`.folder-hierarchy__chevron`) — ▶ collapsed, ▼ expanded
6. File icons (`.folder-hierarchy__icon`) — Type-specific emojis (📁, 📘, 📝, etc.)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-FH-001: Initial Render with Mock Data
- **Type:** render
- **Target:** Tree renders with mock data
- **Condition:** Shows packages/, .claude/ directories
- **Failure Mode:** Empty or broken tree
- **Automation Script:**
```javascript
const folderHierarchy = await page.locator('.folder-hierarchy').first();

// Verify packages folder visible
const packagesFolder = folderHierarchy.locator('.folder-hierarchy__name:has-text("packages")');
if (!await packagesFolder.isVisible()) {
  throw new Error('packages folder not in tree');
}

// Verify .claude folder visible
const claudeFolder = folderHierarchy.locator('.folder-hierarchy__name:has-text(".claude")');
if (!await claudeFolder.isVisible()) {
  throw new Error('.claude folder not in tree');
}
```

#### HC-FH-002: Expand/Collapse Folders
- **Type:** interaction
- **Target:** Clicking folder toggles expansion
- **Condition:** Chevron rotates, children show/hide
- **Failure Mode:** Cannot navigate tree
- **Automation Script:**
```javascript
const folderHierarchy = await page.locator('.folder-hierarchy').first();

// Find packages folder (initially expanded)
const packagesNode = folderHierarchy.locator('.folder-hierarchy__node:has(.folder-hierarchy__name:has-text("packages"))').first();

// Verify initially expanded
const hasChildren = await packagesNode.locator('+ ul .folder-hierarchy__item').count() > 0;
if (!hasChildren) {
  throw new Error('packages folder not initially expanded');
}

// Click to collapse
await packagesNode.click();

// Verify children hidden
await page.waitForTimeout(200);
const stillHasChildren = await packagesNode.locator('+ ul .folder-hierarchy__item').count() > 0;
if (stillHasChildren) {
  throw new Error('packages folder did not collapse');
}

// Click to expand again
await packagesNode.click();
await page.waitForTimeout(200);

// Verify children visible
const childrenReappeared = await packagesNode.locator('+ ul .folder-hierarchy__item').count() > 0;
if (!childrenReappeared) {
  throw new Error('packages folder did not re-expand');
}
```

#### HC-FH-003: File Selection
- **Type:** interaction
- **Target:** Clicking file calls onFileSelect
- **Condition:** File highlighted, callback triggered
- **Failure Mode:** Cannot open files
- **Automation Script:**
```javascript
const folderHierarchy = await page.locator('.folder-hierarchy').first();

// Find a file node (e.g., package.json)
const fileNode = folderHierarchy.locator('.folder-hierarchy__node.file:has(.folder-hierarchy__name:has-text("package.json"))').first();

// Click file
await fileNode.click();

// Verify selected class applied
await page.waitForSelector('.folder-hierarchy__node.selected', { timeout: 500 });

// Verify onFileSelect called (check for side effects, e.g., file opens)
```

#### HC-FH-004: Search Filter
- **Type:** interaction
- **Target:** Search input filters tree
- **Condition:** Only matching files/folders shown
- **Failure Mode:** Cannot find files quickly
- **Automation Script:**
```javascript
const folderHierarchy = await page.locator('.folder-hierarchy').first();
const searchInput = folderHierarchy.locator('.folder-hierarchy__search-input');

// Count visible items before search
const initialCount = await folderHierarchy.locator('.folder-hierarchy__item').count();

// Type search query
await searchInput.fill('package.json');
await page.waitForTimeout(200);

// Count visible items after search
const filteredCount = await folderHierarchy.locator('.folder-hierarchy__item').count();

// Should have fewer items
if (filteredCount >= initialCount) {
  throw new Error('Search did not filter tree');
}

// Verify package.json visible
const hasPackageJson = await folderHierarchy.locator('.folder-hierarchy__name:has-text("package.json")').isVisible();
if (!hasPackageJson) {
  throw new Error('Search filtered out matching file');
}

// Clear search
await searchInput.fill('');
await page.waitForTimeout(200);

// Verify items restored
const restoredCount = await folderHierarchy.locator('.folder-hierarchy__item').count();
if (restoredCount !== initialCount) {
  throw new Error('Search clear did not restore tree');
}
```

#### HC-FH-005: Collapse Panel Header
- **Type:** interaction
- **Target:** Clicking header collapses panel
- **Condition:** Tree hides, chevron rotates
- **Failure Mode:** Cannot minimize panel
- **Automation Script:**
```javascript
const folderHierarchy = await page.locator('.folder-hierarchy').first();
const header = folderHierarchy.locator('.folder-hierarchy__header');

// Verify initially expanded
const treeVisible = await folderHierarchy.locator('.folder-hierarchy__tree').isVisible();
if (!treeVisible) {
  throw new Error('Tree not initially visible');
}

// Click header to collapse
await header.click();

// Verify tree hidden
await page.waitForSelector('.folder-hierarchy.collapsed', { timeout: 500 });
const treeStillVisible = await folderHierarchy.locator('.folder-hierarchy__tree').isVisible();
if (treeStillVisible) {
  throw new Error('Tree still visible after collapse');
}

// Click header to expand
await header.click();

// Verify tree shown
await page.waitForSelector('.folder-hierarchy:not(.collapsed)', { timeout: 500 });
const treeReappeared = await folderHierarchy.locator('.folder-hierarchy__tree').isVisible();
if (!treeReappeared) {
  throw new Error('Tree did not reappear after expand');
}
```

### Warning Checks (Should Pass)

#### HC-FH-006: File Icon Accuracy
- **Type:** visual-feedback
- **Target:** File icons match file types
- **Condition:** .ts → 📘, .tsx → ⚛️, .md → 📝, etc.
- **Failure Mode:** Confusing file types

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| initial-render | 150 | ms | Time to render tree with 100 items |
| search-filter | 50 | ms | Time to filter tree by query |
| expand-collapse | 100 | ms | Time to toggle folder |

---

## Dependencies

**Required Contexts:**
- None

**Required Hooks:**
- None

**Child Components:**
- FileTreeRecursive (internal recursive component)

**Required Props:**
- `workspaceRoot`

---

## Notes

- **Phase 1 limitation:** Uses STATIC mock data representing ActionFlows Dashboard structure
- **Mock structure:** Includes packages/ (app, backend, shared), .claude/ (actionflows), root files
- **Default expanded:** packages/ and .claude/ folders initially expanded
- **Search logic:** Filters tree to show matching files + their parent folders
- **File icons:** Type-specific emojis (📁 folder, 📘 .ts, ⚛️ .tsx, 🎨 .css, 📝 .md, 📋 .json, etc.)
- **Collapse header:** Clicking header or toggle button collapses entire panel
- **Padding levels:** Uses paddingLeft calculation for nested indentation (16px per level)
- **stopPropagation:** Collapse toggle button stops event propagation to prevent header click

### Future Enhancements
- Backend integration via GET /api/workspace/:sessionId/files endpoint
- Keyboard navigation: Arrow up/down, Enter, Left/Right for tree navigation

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
