# Component Contract: InlineButtons

**File:** `packages/app/src/components/InlineButtons/InlineButtons.tsx`
**Type:** widget
**Parent Group:** Discussion System
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** InlineButtons
- **Introduced:** 2025-Q4
- **Description:** Horizontal button row below Claude messages, auto-detects context and filters buttons.

---

## Render Location

**Mounts Under:**
- ChatPanel (below Claude response messages)

**Render Conditions:**
1. Message has been sent
2. Context can be detected
3. At least one button matches the context

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- ChatPanel renders a new message

**Key Effects:**
None (all state derived via useMemo)

**Cleanup Actions:**
None

**Unmount Triggers:**
- Message removed or parent unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| messageContent | string | ✅ | N/A | Message text for context detection |
| sessionId | SessionId | ✅ | N/A | Session for action routing |
| buttons | ButtonDefinition[] | ✅ | N/A | Available buttons (filtered by context) |
| projectId | ProjectId | ❌ | undefined | For fetching custom prompts |
| overrideContext | ButtonContext | ❌ | undefined | Override auto-detected context |
| onAction | (button: ButtonDefinition) => void | ❌ | undefined | Action callback |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onAction | `(button: ButtonDefinition) => void` | Called when button is clicked |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onAction | `(button: ButtonDefinition) => void` | InlineButtonItem | Button action handler |

---

## State Ownership

### Local State
None

### Context Consumption
None

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| allButtons | ButtonDefinition[] | `[buttons, customPromptButtons]` | Merges buttons + customPromptButtons |
| detectedContext | ButtonContext | `[messageContent, overrideContext]` | detectContext(messageContent) or override |
| filteredButtons | ButtonDefinition[] | `[allButtons, detectedContext]` | Filters by context, sorts by priority |

### Custom Hooks
- `useCustomPromptButtons(projectId)` — Fetches custom prompts
- `useDiscussButton()` — Discuss dialog integration

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onAction when button is clicked
- **Example:** Button click triggers action in parent

### Child Communication
- **Child:** InlineButtonItem
- **Mechanism:** props
- **Data Flow:** Passes button definition, sessionId, onAction callback

- **Child:** DiscussButton
- **Mechanism:** props
- **Data Flow:** Opens discuss dialog for InlineButtons component

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/custom-prompts` | GET | useCustomPromptButtons hook | Fetches custom prompts for projectId |

### WebSocket Events
None

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
None

### Electron IPC
None

---

## Test Hooks

**CSS Selectors:**
- `.inline-buttons-container`
- `.inline-button-item`

**Data Test IDs:**
None

**ARIA Labels:**
None

**Visual Landmarks:**
1. Horizontal button row (`.inline-buttons-container`)
2. Individual button items (`.inline-button-item`)
3. DiscussButton at end of row

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-IB-001: Container Render
- **Type:** render
- **Target:** InlineButtons container
- **Condition:** `.inline-buttons-container` exists when buttons match context
- **Failure Mode:** No button row displayed
- **Automation Script:**
```javascript
const containers = document.querySelectorAll('.inline-buttons-container');
if (containers.length === 0) return { noButtons: true };
return true;
```

### Warning Checks (Should Pass)

#### HC-IB-002: Button Rendering
- **Type:** render
- **Target:** Filtered buttons
- **Condition:** `.inline-button-item` elements exist
- **Failure Mode:** Empty button row
- **Automation Script:**
```javascript
const firstContainer = document.querySelector('.inline-buttons-container');
const buttons = firstContainer.querySelectorAll('.inline-button-item');
return { buttonCount: buttons.length };
```

#### HC-IB-003: DiscussButton
- **Type:** render
- **Target:** DiscussButton component
- **Condition:** `.discuss-button` exists in container
- **Failure Mode:** No way to discuss inline buttons
- **Automation Script:**
```javascript
const firstContainer = document.querySelector('.inline-buttons-container');
const discussBtn = firstContainer.querySelector('.discuss-button');
return { hasDiscuss: !!discussBtn };
```

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 50 | ms | Time to render button row |
| context-detection | 10 | ms | Time to detect context from message |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
- useMemo
- useCustomPromptButtons
- useDiscussButton

**Child Components:**
- InlineButtonItem
- DiscussButton
- DiscussDialog

**Required Props:**
- messageContent
- sessionId
- buttons

---

## Notes

- Auto-detects response context (code-change, error-message, question-prompt, etc.)
- Filters buttons to show only those matching the detected context
- Sorts buttons by priority (lower = higher priority)
- Responsive wrapping on small screens
- Graceful handling of empty state (no matching buttons = no render)
- Custom prompts fetched via useCustomPromptButtons and merged with provided buttons
- detectContext utility analyzes message content to determine context
- If no buttons match context, component does not render (returns null)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
