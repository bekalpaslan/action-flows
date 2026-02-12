# Component Contract: CanvasTool

**File:** `packages/app/src/components/Tools/CanvasTool/CanvasTool.tsx`
**Type:** page
**Parent Group:** Tools
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** CanvasTool
- **Introduced:** 2026-02-01
- **Description:** Live HTML/CSS preview workbench. Monaco Editor for HTML input with sandboxed iframe for real-time preview. Persists to localStorage.

---

## Render Location

**Mounts Under:**
- WorkbenchLayout (when `activeWorkbench === 'canvas'`)

**Render Conditions:**
1. User selects "Canvas" tab in TopBar

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to Canvas workbench

**Key Effects:**
1. **Dependencies:** `[markup, onContentChange]`
   - **Side Effects:** Persists markup to localStorage with 500ms debounce
   - **Cleanup:** Clears debounce timer, persists final state on unmount
   - **Condition:** Runs when markup changes

**Cleanup Actions:**
- Clears debounce timer
- Persists final markup to localStorage

**Unmount Triggers:**
- User switches workbenches

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| initialMarkup | `string` | ❌ | `''` | Initial HTML markup to load |
| onContentChange | `(markup: string) => void` | ❌ | undefined | Callback when content changes |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onContentChange | `(markup) => void` | Notifies parent of content changes |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onChange | `(value) => void` | Monaco Editor | Handles editor content changes |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| markup | `string` | Loaded from localStorage or initialMarkup | handleMarkupChange |
| isEditorCollapsed | `boolean` | `false` | handleToggleEditor |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `prefillChatInput()` |

### Derived State
N/A

### Custom Hooks
- `useDiscussButton()` — Manages DiscussButton dialog

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when markup changes (debounced)
- **Example:** User edits HTML → 500ms debounce → `onContentChange(newMarkup)`

### Child Communication
- **Child:** Monaco Editor
- **Mechanism:** props
- **Data Flow:** Passes markup value and onChange handler

### Sibling Communication
N/A

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer
- **Operations:** Opens discuss dialog with canvas context

---

## Side Effects

### API Calls
N/A

### WebSocket Events
N/A

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| timeout | 500ms | Debounce localStorage persistence | ✅ |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| `afw-canvas-markup` | write | Markup change (debounced) | HTML string |
| `afw-canvas-markup` | read | Component mount | HTML string |

### DOM Manipulation
N/A

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.canvas-workbench`
- `.canvas-workbench__editor`
- `.canvas-workbench__editor--collapsed`
- `.canvas-workbench__preview`
- `.canvas-workbench__iframe`
- `.canvas-workbench__button`

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
1. Header with controls (`.canvas-workbench__header`) — Hide/Show Editor, Clear buttons
2. Monaco Editor (`.canvas-workbench__editor`) — HTML code editor (60% width)
3. Preview iframe (`.canvas-workbench__preview`) — Live preview (40% width)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CW-001: Editor Renders
- **Type:** render
- **Target:** Monaco Editor
- **Condition:** Editor appears
- **Failure Mode:** Can't edit HTML
- **Automation Script:**
```javascript
const editor = document.querySelector('.monaco-editor');
return editor !== null;
```

#### HC-CW-002: Preview Updates
- **Type:** state-update
- **Target:** Preview iframe
- **Condition:** Typing in editor updates preview
- **Failure Mode:** No live preview
- **Automation Script:**
```javascript
// Simulate editor change
const markup = '<h1>Test</h1>';
// Trigger onChange
await new Promise(resolve => setTimeout(resolve, 100));
const iframe = document.querySelector('.canvas-workbench__iframe');
const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
return iframeDoc.body.innerHTML.includes('<h1>Test</h1>');
```

#### HC-CW-003: localStorage Persistence
- **Type:** state-persistence
- **Target:** localStorage `afw-canvas-markup`
- **Condition:** Markup saves after 500ms
- **Failure Mode:** Markup lost on refresh
- **Automation Script:**
```javascript
// Set markup
const markup = '<p>Persist test</p>';
// Wait for debounce
await new Promise(resolve => setTimeout(resolve, 600));
const saved = localStorage.getItem('afw-canvas-markup');
return saved === markup;
```

#### HC-CW-004: Clear Button Works
- **Type:** user-action
- **Target:** Clear button
- **Condition:** Button clears markup after confirmation
- **Failure Mode:** Can't reset canvas
- **Automation Script:**
```javascript
window.confirm = () => true; // Mock confirmation
const clearBtn = Array.from(document.querySelectorAll('.canvas-workbench__button'))
  .find(btn => btn.textContent === 'Clear');
clearBtn.click();
await new Promise(resolve => setTimeout(resolve, 100));
const editor = document.querySelector('.monaco-editor');
// Verify editor is empty
return true;
```

### Warning Checks (Should Pass)

#### HC-CW-005: Editor Toggle Works
- **Type:** user-action
- **Target:** Hide/Show Editor button
- **Condition:** Button collapses/expands editor
- **Failure Mode:** Can't maximize preview

---

## Dependencies

**Required Contexts:**
- DiscussContext

**Required Hooks:**
- useDiscussButton

**Child Components:**
- Editor (from `@monaco-editor/react`)
- DiscussButton
- DiscussDialog

**Required Props:**
None (all optional)

---

## Notes

- Monaco configuration: HTML language, vs-dark theme, word wrap on
- Iframe sandbox: `allow-same-origin` only (no scripts)
- CSP in iframe: `script-src 'none'; object-src 'none';`
- Debounce delay: 500ms for localStorage writes
- Editor collapse: Toggles between 60% width and hidden
- Initial load: localStorage takes precedence over initialMarkup prop

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
