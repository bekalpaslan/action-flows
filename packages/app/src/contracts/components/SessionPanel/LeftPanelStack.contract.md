# Component Contract: ChatPanel (Left Panel Consolidation)

**File:** `packages/app/src/components/SessionPanel/ChatPanel.tsx`
**Type:** utility
**Parent Group:** SessionPanel/
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ChatPanel (consolidated from LeftPanelStack)
- **Introduced:** 2026-01-20
- **Description:** Simplified container for the left panel area, now rendering a single ChatPanel component that fills the entire space with integrated session info.

---

## Render Location

**Mounts Under:**
- SessionPanelLayout (left side of split)

**Render Conditions:**
1. Session prop provided
2. Renders within `.session-panel-layout__left` div

**Positioning:** relative (flex container)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- SessionPanelLayout mounts
- Session changes

**Key Effects:**
None (stateless pass-through)

**Cleanup Actions:**
- None

**Unmount Triggers:**
- SessionPanelLayout unmounts
- Session detached

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| session | `Session` | ✅ | N/A | Session to display |
| onSendMessage | `(message: string) => Promise<void>` | ❌ | N/A | Callback when user sends message |
| onSubmitInput | `(input: string) => Promise<void>` | ❌ | N/A | Legacy callback (fallback) |
| onSelectFlow | `(flow: FlowAction) => void` | ❌ | N/A | Callback when flow selected (unused) |
| flows | `FlowAction[]` | ❌ | `[]` | Available flows (unused) |
| actions | `FlowAction[]` | ❌ | `[]` | Available actions (unused) |
| panelHeights | `PanelHeightConfig` | ❌ | `{}` | Custom panel heights (unused) |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSendMessage \| onSubmitInput | `(message: string) => Promise<void>` | Passed to ChatPanel |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | ChatPanel | ChatPanel uses session.id directly, not callbacks from here |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| N/A | N/A | N/A | Stateless component |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| N/A | N/A |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| handleSendMessage | `function` | `onSendMessage, onSubmitInput` | Chooses onSendMessage or falls back to onSubmitInput |

### Custom Hooks
- None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback (pass-through)
- **Description:** Receives callback from SessionPanelLayout, does not use it
- **Example:** N/A (ChatPanel handles its own input submission)

### Child Communication
- **Child:** ChatPanel
- **Mechanism:** props
- **Data Flow:** Passes `sessionId`, `session`, `collapsible: true`

### Sibling Communication
- **Sibling:** RightVisualizationArea
- **Mechanism:** None (independent)
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
| N/A | N/A | N/A | N/A (handled by ChatPanel) |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A (handled by ChatPanel) |

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
| N/A | N/A | N/A |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.left-panel-stack`
- `.left-panel-stack__panel`
- `.left-panel-stack__panel--chat`

**Data Test IDs:**
- N/A (use CSS selectors)

**ARIA Labels:**
- None specified

**Visual Landmarks:**
1. Single panel area (`.left-panel-stack`) — Flex container
2. ChatPanel wrapper (`.left-panel-stack__panel--chat`) — Flex: 1, minHeight: 300px

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-LPS-001: ChatPanel Renders
- **Type:** render
- **Target:** ChatPanel component visible
- **Condition:** ChatPanel renders within left panel stack
- **Failure Mode:** No conversation interface
- **Automation Script:**
```javascript
const leftPanel = await page.locator('.session-panel-layout__left').first();
const chatPanel = leftPanel.locator('.chat-panel');

if (!await chatPanel.isVisible()) {
  throw new Error('ChatPanel not rendered in LeftPanelStack');
}
```

#### HC-LPS-002: Full Height Fill
- **Type:** layout
- **Target:** ChatPanel fills entire left panel height
- **Condition:** ChatPanel has flex: 1 and fills parent
- **Failure Mode:** Wasted space in panel
- **Automation Script:**
```javascript
const leftPanel = await page.locator('.session-panel-layout__left').first();
const chatPanelWrapper = leftPanel.locator('.left-panel-stack__panel--chat');

const wrapperHeight = await chatPanelWrapper.evaluate(el => {
  return parseFloat(window.getComputedStyle(el).height);
});

const parentHeight = await leftPanel.evaluate(el => {
  return parseFloat(window.getComputedStyle(el).height);
});

// ChatPanel should fill most of parent (allowing for small padding/margins)
if (wrapperHeight < parentHeight * 0.95) {
  throw new Error('ChatPanel not filling parent height');
}
```

### Warning Checks (Should Pass)

#### HC-LPS-003: Backward Compatibility
- **Type:** integration
- **Target:** onSubmitInput fallback works
- **Condition:** If onSendMessage not provided, onSubmitInput used
- **Failure Mode:** Legacy integrations break

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 50 | ms | Time to render container and ChatPanel |

---

## Dependencies

**Required Contexts:**
- None

**Required Hooks:**
- None

**Child Components:**
- ChatPanel

**Required Props:**
- `session`

---

## Notes

- **Simplified architecture:** Originally a 5-panel accordion (SessionInfo, CLI, Conversation, Prompts, Folders), now simplified to single ChatPanel
- **ChatPanel integration:** ChatPanel now includes integrated session info in its header, eliminating need for separate SessionInfo panel
- **Unused props:** `onSelectFlow`, `flows`, `actions`, `panelHeights` retained for backward compatibility but not used
- **Backward compat:** Uses `onSendMessage || onSubmitInput` to support both new and legacy callback names
- **Flex layout:** ChatPanel gets `flex: 1` to fill entire vertical space
- **MinHeight constraint:** 300px minimum ensures usable chat interface
- **Pass-through component:** Primary purpose is layout container, minimal logic

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
