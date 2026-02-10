# Component Contract: DiscussContext

**File:** `packages/app/src/contexts/DiscussContext.tsx`
**Type:** utility
**Parent Group:** contexts
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** DiscussContext
- **Introduced:** 2026-02-05
- **Description:** Provides a ref-based communication channel between DiscussButton/DiscussDialog (used throughout the app, 41+ components) and ChatPanel (which owns the chat input field). Enables "send to chat" functionality without prop drilling or context re-renders.

---

## Render Location

**Mounts Under:**
- App.tsx or WorkbenchLayout (high in component tree)

**Render Conditions:**
1. Always renders (required for DiscussButton pattern to work)

**Positioning:** N/A (context provider)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Application initialization or WorkbenchLayout mount

**Key Effects:**
N/A (no effects, pure coordination layer)

**Cleanup Actions:**
N/A (no cleanup required)

**Unmount Triggers:**
- Application shutdown (never unmounts in normal operation)

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | ✅ | N/A | Child components to receive context |

### Callbacks Up (to parent)
N/A (coordination layer)

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| registerChatInput | `(setter: (message: string) => void) => void` | ChatPanel | Registers the chat input setter function (called by ChatPanel on mount) |
| unregisterChatInput | `() => void` | ChatPanel | Unregisters the chat input setter (called by ChatPanel on unmount) |
| prefillChatInput | `(message: string) => void` | All DiscussButton consumers | Prefills the chat input with a message (called by useDiscussButton) |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| chatInputSetterRef | `React.MutableRefObject<((message: string) => void) \| null>` | `null` | registerChatInput, unregisterChatInput |

### Context Consumption
N/A (this is a provider)

### Derived State
N/A

### Custom Hooks
N/A

---

## Interactions

### Parent Communication
- **Mechanism:** Props
- **Description:** Receives children from App.tsx or WorkbenchLayout
- **Example:** `<DiscussProvider><WorkbenchLayout /></DiscussProvider>`

### Child Communication
- **Child:** ChatPanel (registers input setter), all components with DiscussButton (call prefillChatInput)
- **Mechanism:** Context value via useDiscussContext()
- **Data Flow:** ChatPanel registers setter → DiscussButton calls prefill → Setter function invoked → Chat input updates

### Sibling Communication
- **Sibling:** All 41+ components with DiscussButton
- **Mechanism:** Context-mediated ref invocation
- **Description:** DiscussButton in FlowVisualization calls prefillChatInput → Context invokes registered setter → ChatPanel input updates

### Context Interaction
- **Context:** DiscussContext
- **Role:** provider
- **Operations:** Provides registration and prefill functions for chat input coordination

---

## Side Effects

### API Calls
N/A

### WebSocket Events
N/A

### Timers
N/A

### LocalStorage Operations
N/A

### DOM Manipulation
N/A (coordination only; DOM updates handled by ChatPanel)

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
N/A (context provider, no visual elements)

**Data Test IDs:**
N/A

**ARIA Labels:**
N/A

**Visual Landmarks:**
N/A

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-DC-001: ChatPanel Registration on Mount
- **Type:** context-registration
- **Target:** registerChatInput function
- **Condition:** ChatPanel calls registerChatInput on mount, chatInputSetterRef.current becomes non-null
- **Failure Mode:** DiscussButton "send to chat" does not work, warning logged: "No chat input registered"
- **Automation Script:**
```javascript
// Chrome MCP script
// Wait for app to load and ChatPanel to mount
await new Promise(resolve => setTimeout(resolve, 1500));
// Check if chat input setter is registered
const isRegistered = await evaluateScript(() => {
  return window.__discussContext?.chatInputSetterRef?.current !== null;
});
if (!isRegistered) {
  throw new Error('ChatPanel did not register chat input setter');
}
```

#### HC-DC-002: prefillChatInput Updates Chat Input
- **Type:** integration
- **Target:** prefillChatInput function
- **Condition:** Calling prefillChatInput with a message updates ChatPanel's input field
- **Failure Mode:** DiscussButton dialog sends message but chat input does not update
- **Automation Script:**
```javascript
// Chrome MCP script
// Open DiscussButton dialog (e.g., from FlowVisualization)
await click({ uid: 'discuss-button-flow-visualization' });
await new Promise(resolve => setTimeout(resolve, 300));
// Type a message in the dialog
await fill({ uid: 'discuss-dialog-textarea', value: 'Test discuss message' });
// Click Send button
await click({ uid: 'discuss-dialog-send-button' });
await new Promise(resolve => setTimeout(resolve, 200));
// Check if ChatPanel input field has the message
const chatInput = await evaluateScript(() => {
  return document.querySelector('.chat-panel__input-field')?.value;
});
if (!chatInput.includes('Test discuss message')) {
  throw new Error(`Expected chat input to contain 'Test discuss message', got: ${chatInput}`);
}
```

#### HC-DC-003: Unregister Clears Setter Ref
- **Type:** lifecycle
- **Target:** unregisterChatInput function
- **Condition:** ChatPanel calls unregisterChatInput on unmount, chatInputSetterRef.current becomes null
- **Failure Mode:** Stale setter reference, potential memory leak or incorrect behavior

### Warning Checks (Should Pass)

#### HC-DC-W001: Warning Logged When No Chat Input Registered
- **Type:** error-handling
- **Target:** prefillChatInput console.warn
- **Condition:** Calling prefillChatInput when chatInputSetterRef.current is null logs warning
- **Failure Mode:** Silent failure, user thinks message was sent but it wasn't

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| prefill-latency | 50 | ms | Time from prefillChatInput call to chat input update |
| registration-time | 10 | ms | Time for registerChatInput to execute |

---

## Dependencies

**Required Contexts:**
N/A (this is a provider)

**Required Hooks:**
N/A

**Child Components:**
- ChatPanel (must mount and register)
- All components with DiscussButton (41+ consumers)

**Required Props:**
- `children` (ReactNode)

---

## Notes

- Ref-based pattern avoids re-renders: chatInputSetterRef is a useRef, not useState
- ChatPanel registers its setInput function on mount via registerChatInput
- All 41+ components with DiscussButton use useDiscussButton hook, which calls prefillChatInput
- prefillChatInput invokes the registered setter function, which updates ChatPanel's local input state
- If ChatPanel is not mounted (e.g., session not open), prefillChatInput logs a warning and does nothing
- useDiscussContext() hook throws if used outside provider (defensive programming)
- This pattern decouples DiscussButton from ChatPanel — no direct component relationship required
- Message formatting (markdown details block) is handled by useDiscussButton, not the context
- Context can be placed at App root or WorkbenchLayout level (anywhere above ChatPanel and DiscussButton components)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
