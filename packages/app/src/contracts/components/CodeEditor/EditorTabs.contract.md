# Component Contract: EditorTabs

**File:** `packages/app/src/components/CodeEditor/EditorTabs.tsx`
**Type:** feature
**Parent Group:** CodeEditor
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** EditorTabs
- **Introduced:** 2024-Q4 (estimated)
- **Description:** Horizontal tab bar for managing open editor files. Supports scrolling overflow, middle-click to close, unsaved changes indicator, and active tab auto-scroll.

---

## Render Location

**Mounts Under:**
- EditorWorkbench (positioned below header, above Monaco editor)

**Render Conditions:**
1. Only renders when `files.length > 0`
2. Returns `null` if no files are open

**Positioning:** relative (within editor workbench layout)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- EditorWorkbench opens first file

**Key Effects:**
1. **Dependencies:** `[checkScrollState]`
   - **Side Effects:** Registers window resize listener to check scroll state
   - **Cleanup:** Removes resize listener
   - **Condition:** Runs once on mount

2. **Dependencies:** `[files, checkScrollState]`
   - **Side Effects:** Checks scroll state when files array changes
   - **Cleanup:** None
   - **Condition:** Runs when files are added/removed

3. **Dependencies:** `[activeFilePath, checkScrollState]`
   - **Side Effects:** Scrolls active tab into view, updates scroll state
   - **Cleanup:** None (timeout cleanup handled automatically)
   - **Condition:** Runs when active file path changes

**Cleanup Actions:**
- Removes window resize event listener

**Unmount Triggers:**
- Last file closed (component returns null)
- EditorWorkbench unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| files | `EditorFile[]` | ✅ | N/A | Array of open files with path and dirty state |
| activeFilePath | `string \| null` | ✅ | N/A | Currently active file path |
| onTabClick | `(path: string) => void` | ✅ | N/A | Callback when tab is clicked |
| onTabClose | `(path: string) => void` | ✅ | N/A | Callback when tab close button is clicked |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onTabClick | `(path: string) => void` | Called when user clicks tab (switches active file) |
| onTabClose | `(path: string) => void` | Called when user clicks close button or middle-clicks tab |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | N/A | No children with callbacks |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| canScrollLeft | `boolean` | `false` | checkScrollState |
| canScrollRight | `boolean` | `false` | checkScrollState |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| N/A | No context usage |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| N/A | N/A | N/A | N/A |

### Custom Hooks
- None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls parent callbacks for tab switching and closing
- **Example:** User clicks tab → `onTabClick('src/index.ts')` → Parent updates activeFilePath

### Child Communication
- **Child:** N/A (no complex children, just button elements)
- **Mechanism:** N/A
- **Data Flow:** N/A

### Sibling Communication
- **Sibling:** Monaco Editor (via parent)
- **Mechanism:** parent-mediated
- **Description:** Tab switch triggers parent to update Monaco editor content

### Context Interaction
- **Context:** N/A
- **Role:** N/A
- **Operations:** N/A

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| N/A | N/A | N/A | N/A |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| setTimeout | 300ms | Delay checkScrollState after scroll animation | ✅ (auto) |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| N/A | N/A | N/A | N/A |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| `.editor-tab.active` | `scrollIntoView()` | Active file path changes |
| `.editor-tabs-container` | `scrollBy()` | Scroll left/right buttons clicked |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.editor-tabs`
- `.editor-tabs-container`
- `.editor-tab`
- `.editor-tab.active`
- `.tab-name`
- `.dirty-indicator`
- `.tab-close-btn`
- `.tab-scroll-btn`
- `.tab-scroll-left`
- `.tab-scroll-right`

**Data Test IDs:**
- N/A

**ARIA Labels:**
- `aria-label="Scroll tabs left"`
- `aria-label="Scroll tabs right"`
- `aria-label="Close {file.path}"`

**Visual Landmarks:**
1. Active tab (`.editor-tab.active`) — Highlighted tab with distinct background
2. Dirty indicator (`.dirty-indicator`) — Black dot `●` before filename
3. Close button (`.tab-close-btn`) — `×` symbol on each tab
4. Scroll buttons (`.tab-scroll-btn`) — `‹` and `›` arrows when overflow

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-ET-01: Tab Rendering
- **Type:** render
- **Target:** Tab elements for each open file
- **Condition:** Each file in `files` prop renders a `.editor-tab` element
- **Failure Mode:** Tabs don't render, or render incorrectly
- **Automation Script:**
```javascript
// Chrome MCP script
const snapshot = await take_snapshot();
const tabCount = (snapshot.match(/editor-tab/g) || []).length;
assert(tabCount > 0, 'At least one tab should render');
```

#### HC-ET-02: Active Tab Highlighting
- **Type:** render-condition
- **Target:** Active tab visual state
- **Condition:** Tab matching `activeFilePath` has `.active` class
- **Failure Mode:** No active tab highlighted, or wrong tab highlighted
- **Automation Script:**
```javascript
// Chrome MCP script
const snapshot = await take_snapshot();
const hasActive = snapshot.includes('editor-tab active');
assert(hasActive, 'Active tab should have active class');
```

#### HC-ET-03: Tab Click Switching
- **Type:** interaction
- **Target:** onTabClick callback
- **Condition:** Clicking tab calls `onTabClick(path)`
- **Failure Mode:** Tab clicks don't switch active file
- **Automation Script:**
```javascript
// Chrome MCP script
await click({ uid: '.editor-tab:nth-child(2)' });
// Verify active tab changes (requires checking activeFilePath state change)
```

#### HC-ET-04: Close Button Functionality
- **Type:** interaction
- **Target:** onTabClose callback
- **Condition:** Clicking close button calls `onTabClose(path)`, stops propagation
- **Failure Mode:** Close button doesn't work, or triggers tab switch
- **Automation Script:**
```javascript
// Chrome MCP script
const beforeCount = (await take_snapshot()).match(/editor-tab/g).length;
await click({ uid: '.tab-close-btn' });
const afterCount = (await take_snapshot()).match(/editor-tab/g).length;
assert(afterCount === beforeCount - 1, 'Tab should close');
```

#### HC-ET-05: Middle-Click to Close
- **Type:** interaction
- **Target:** Mouse button 1 (middle) click handler
- **Condition:** Middle-clicking tab calls `onTabClose(path)`
- **Failure Mode:** Middle-click doesn't close tab
- **Automation Script:**
```javascript
// Chrome MCP script
// Note: Chrome MCP doesn't support middle-click, manual test required
// Verify: Middle-click tab → Tab closes
```

### Warning Checks (Should Pass)

#### HC-ET-06: Dirty Indicator Display
- **Type:** render-condition
- **Target:** Unsaved changes indicator
- **Condition:** Files with `isDirty: true` show `●` dot before name
- **Failure Mode:** Dirty indicator doesn't show, user unaware of unsaved changes

#### HC-ET-07: Scroll Overflow Handling
- **Type:** layout + interaction
- **Target:** Scroll buttons and horizontal scrolling
- **Condition:** When tabs overflow, scroll buttons appear and work correctly
- **Failure Mode:** Tabs cut off, no way to access hidden tabs

#### HC-ET-08: Active Tab Auto-Scroll
- **Type:** automatic-behavior
- **Target:** Active tab visibility
- **Condition:** Switching to off-screen tab scrolls it into view
- **Failure Mode:** Active tab not visible, user confused

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| tab-render | 50 | ms | Time to render tabs after files prop update |
| tab-switch | 50 | ms | Time from click to active class update |
| scroll-animation | 300 | ms | Duration of smooth scroll animation |
| auto-scroll | 100 | ms | Time to scroll active tab into view |

---

## Dependencies

**Required Contexts:**
- None

**Required Hooks:**
- None (uses standard React hooks)

**Child Components:**
- None (renders buttons and divs)

**Required Props:**
- `files` (required)
- `activeFilePath` (required)
- `onTabClick` (required)
- `onTabClose` (required)

---

## Notes

### Tab Display
- Filename extracted from path: `path.split('/').pop()`
- Full path shown in `title` attribute (hover tooltip)
- Tab width: auto (based on filename length)
- Max tabs before scrolling: ~10-15 (depends on filename lengths)

### Scroll Behavior
- Scroll buttons appear only when needed (overflow detected)
- Scroll amount: 200px per click
- Smooth scroll animation: `behavior: 'smooth'`
- Scroll state checked on:
  - Mount
  - Window resize
  - Files array change
  - Manual scroll

### Middle-Click Support
- Uses `onMouseDown` with `e.button === 1` check
- Prevents default behavior with `e.preventDefault()`
- Same behavior as clicking close button

### Active Tab Auto-Scroll
- Checks if active tab is visible within container bounds
- Scrolls tab into view with `scrollIntoView()` if not visible
- Uses `behavior: 'smooth'`, `inline: 'nearest'`
- Delays scroll state check by 300ms to allow animation to complete

### Accessibility Improvements Needed
- Add `role="tablist"` to container
- Add `role="tab"` to each tab
- Add `aria-selected` attribute
- Add `aria-controls` pointing to editor content
- Add keyboard navigation (arrow keys, Home, End)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
