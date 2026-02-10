# Component Contract: ChatPanel

**File:** `packages/app/src/components/SessionPanel/ChatPanel.tsx`
**Type:** feature
**Parent Group:** components/SessionPanel
**Contract Version:** 2.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ChatPanel
- **Introduced:** 2026-02-10
- **Description:** Mobile-format chat interface for Claude CLI sessions with integrated session info header bar. Displays message history, handles real-time message streaming, supports context-aware prompt buttons, and registers chat input with DiscussContext. Replaces deprecated ConversationPanel.

---

## Render Location

**Mounts Under:**
- LeftPanelStack (primary, within SessionPanelLayout)
- SessionPanel (responsive layouts)

**Render Conditions:**
1. sessionId prop provided
2. Renders as primary chat interface in left panel
3. Conditionally displays content based on `isCollapsed` state

**Positioning:** relative (fills parent container)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- LeftPanelStack mounts
- sessionId changes

**Key Effects:**

1. **Dependencies:** `[registerChatInput, unregisterChatInput]` (DiscussContext callbacks)
   - **Side Effects:** Registers handleSendMessage with DiscussContext via ref wrapper (handleSendMessageRef) to enable DiscussButton integration
   - **Cleanup:** Unregisters handleSendMessageRef from DiscussContext
   - **Condition:** Runs on mount and when DiscussContext callbacks change
   - **Implementation Note:** Uses ref wrapper (handleSendMessageRef.current) to avoid stale closure over handleSendMessage state

2. **Dependencies:** `[sessionId]`
   - **Side Effects:** Resets cliState to 'not-started' when switching sessions so startCliSession fires for new session
   - **Cleanup:** None
   - **Condition:** Runs when sessionId changes

3. **Dependencies:** `[messages]`
   - **Side Effects:** Auto-scrolls to bottom of message list
   - **Cleanup:** None
   - **Condition:** Runs when messages array changes

**Cleanup Actions:**
- Unregisters handleSendMessageRef from DiscussContext on unmount

**Unmount Triggers:**
- LeftPanelStack unmounts
- Session detached or parent component unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | `SessionId` | ✅ | N/A | Session ID to connect to (branded type from packages/shared) |
| session | `Session \| undefined` | ❌ | N/A | Full session object for context-aware buttons and session info. If undefined, fetched via sessionId. |
| onSendMessage | `(message: string) => Promise<void> \| undefined` | ❌ | N/A | Callback when user sends a message. If provided, called instead of default WebSocket send. |
| collapsible | `boolean \| undefined` | ❌ | `true` | Enable collapsible header with expand/collapse toggle button |
| cwd | `string \| undefined` | ❌ | `'D:/ActionFlowsDashboard'` | Working directory for CLI session context (passed to claudeCliService) |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSendMessage | `(message: string) => Promise<void> \| undefined` | Called when user sends a message via input field or prompt button |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onClose | `() => void` | DiscussDialog | Dialog closed → calls closeDialog state setter |
| onSend | `(message: string) => void \| undefined` | DiscussDialog | Dialog message sent → calls handleSend from useDiscussButton |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| input | `string` | `''` | setInput (textarea onChange) |
| isSending | `boolean` | `false` | setIsSending (during message send) |
| isCollapsed | `boolean` | `false` | setIsCollapsed (toggle collapse button) |
| cliState | `CliSessionState` | `'not-started'` | setCliStateSync (startCliSession result) |
| copyTooltip | `string` | `'Copy'` | setCopyTooltip (copy ID button) |
| expandedSpawnPrompts | `Set<string>` | `new Set()` | setExpandedSpawnPrompts (toggle spawn prompt expansion) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| WebSocketContext | `send` (sendWebSocketEvent), status |
| DiscussContext | `registerChatInput`, `unregisterChatInput` (ref registration) |
| useChatMessages hook | `messages`, `addUserMessage` (custom hook state) |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| sessionStatus | `string` | `[session?.status]` | Defaults to 'active' if session undefined |
| statusColor | `string` | `[sessionStatus]` | Maps status to CSS modifier: 'green' (in_progress/active), 'gray' (completed), 'red' (failed/error), 'yellow' (paused) |
| statusText | `string` | `[sessionStatus]` | Human-readable status: 'In Progress', 'Completed', 'Failed', 'Paused', 'Active' |
| chainCount | `number` | `[session?.chains]` | session?.chains.length ?? 0 |
| activeChain | `Chain \| undefined` | `[session?.currentChain]` | Currently active chain from session |
| sessionDuration | `string \| undefined` | `[session?.duration, session?.status]` | Formatted duration (e.g., "2h 30m") or undefined |
| isTyping | `boolean` | `[]` | Currently hardcoded false (TODO: track from streaming state) |

### Ref State
| Ref | Type | Initial | Purpose |
|-----|------|---------|---------|
| handleSendMessageRef | `React.MutableRefObject<(msg: string) => void>` | `() => {}` | Wrapper for DiscussContext registration to avoid stale closure over handleSendMessage |
| cliStateRef | `React.MutableRefObject<CliSessionState>` | `'not-started'` | Synchronous access to CLI state for startCliSession check |
| messagesEndRef | `React.RefObject<HTMLDivElement>` | `null` | Auto-scroll to bottom target |
| messagesContainerRef | `React.RefObject<HTMLDivElement>` | `null` | Messages list container reference |
| inputRef | `React.RefObject<HTMLTextAreaElement>` | `null` | Input textarea reference |

### Custom Hooks
- `useChatMessages(sessionId)` — Manages message history and addUserMessage callback
- `usePromptButtons({ session, messages, cliRunning })` — Generates context-aware prompt buttons
- `useDiscussButton({ componentName, getContext })` — Dialog state and send handling
- `useWebSocketContext()` — WebSocket communication

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when user sends a message via onSendMessage callback
- **Example:**
  ```tsx
  handleSendMessage(text) →
    if (onSendMessage) → onSendMessage(text)
    else → send({ type: 'input', sessionId, payload: text })
  ```

### Child Communication
- **Child:** DiscussButton
- **Mechanism:** props
- **Data Flow:** Passes `componentName`, `onClick` handler (opens dialog)

- **Child:** DiscussDialog
- **Mechanism:** props
- **Data Flow:** Passes `isOpen`, `componentName`, `componentContext`, `onSend`, `onClose`

### Sibling Communication
- **Sibling:** All components with DiscussButton (e.g., DiscussButton itself, other panels)
- **Mechanism:** DiscussContext (ref wrapper registration)
- **Description:** DiscussButtons can trigger chat input via registerChatInput callback

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer (registers input handler)
- **Operations:** Registers handleSendMessage via ref wrapper so DiscussButtons can trigger chat input

- **Context:** WebSocketContext
- **Role:** consumer
- **Operations:** Uses `send()` to emit 'input' type events when no onSendMessage callback provided

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| /api/cli/start | POST | startCliSession() called | Sets cliState to 'running' or 'stopped' based on success |
| N/A (onSendMessage) | N/A | User sends message with callback | Await onSendMessage(message) |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| `input` | User sends message without onSendMessage callback | Emitted via send({ type: 'input', sessionId, payload }) |
| N/A (consuming) | N/A | Session updates flow via parent/WebSocketContext |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| setTimeout (copyTooltip) | 2000ms | Reset "Copy!" tooltip to "Copy" | ✅ Cleared in handler |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| N/A | N/A | N/A | N/A |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| messagesEndRef | scrollIntoView({ behavior: 'smooth' }) | messages array changes |
| inputRef | focus() on send complete | N/A (not explicitly focused) |
| expandedSpawnPrompts | DOM attribute aria-expanded toggle | toggleSpawnPrompt() click |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Naming Convention:** All classes follow BEM pattern: `.block`, `.block__element`, `.block--modifier`

### CSS Selectors — Component Container
- `.chat-panel` — Root container
- `.chat-panel.collapsed` — Collapsed state modifier

### CSS Selectors — Header
- `.chat-panel-header` — Header container (sticky, clickable if collapsible)
- `.chat-panel-header__left` — Left section (title, status, message count)
- `.chat-panel-header__right` — Right section (live badge, discuss button, collapse toggle)
- `.chat-panel-header__message-count` — Message count badge
- `.chat-panel-header__status-badge` — "Live" status badge (CLI running)
- `.chat-panel-header__status-dot` — Pulsing indicator dot
- `.panel-title` — "Chat" heading
- `.collapse-toggle` — Collapse/expand button
- `.collapse-icon` — Chevron icon (rotates when collapsed)

### CSS Selectors — Session Info Bar
- `.chat-panel__info-bar` — Session metadata strip (ID, duration, chains)
- `.chat-panel__info-session-id` — Copy-to-clipboard button for session ID
- `.chat-panel__info-session-id-text` — Truncated session ID text
- `.chat-panel__info-copy-icon` — Copy icon
- `.chat-panel__info-chip` — Info chip (duration, chain count, etc.)
- `.chat-panel__info-chip--active` — Highlight for active chain chip

### CSS Selectors — Session Status
- `.chat-panel-header__session-status` — Status badge container
- `.chat-panel-header__session-status--green` — Active/in-progress status
- `.chat-panel-header__session-status--gray` — Completed/inactive status
- `.chat-panel-header__session-status--red` — Failed/error status
- `.chat-panel-header__session-status--yellow` — Paused status
- `.chat-panel-header__session-dot` — Status indicator dot

### CSS Selectors — Messages Container
- `.chat-panel__messages` — Scrollable message list
- `.chat-panel__empty` — Empty state container
- `.chat-panel__empty-icon` — Empty state emoji (💬)
- `.chat-panel__empty-text` — Empty state text

### CSS Selectors — Message Bubbles (BEM pattern)
- `.chat-bubble` — Base message bubble
- `.chat-bubble--assistant` — Assistant message (left, gray)
- `.chat-bubble--user` — User message (right, blue)
- `.chat-bubble--system` — System message (center, muted)
- `.chat-bubble--error` — Error message (red tint)
- `.chat-bubble--tool_use` — Tool use message with badge
- `.chat-bubble__role` — Role label ("You" or "Claude")
- `.chat-bubble__tool-badge` — Tool name badge
- `.chat-bubble__content` — Message text content (markdown rendered)
- `.chat-bubble__metadata` — Timestamp + cost footer
- `.chat-bubble__timestamp` — Message time
- `.chat-bubble__cost` — Cost/duration metadata

### CSS Selectors — Spawn Prompt Section
- `.chat-bubble__spawn-prompt` — Expandable spawn prompt container
- `.chat-bubble__spawn-prompt-header` — Expandable button
- `.chat-bubble__spawn-prompt-icon` — Chevron icon (▶/▼)
- `.chat-bubble__spawn-prompt-label` — "Spawn Prompt" label
- `.chat-bubble__spawn-prompt-content` — Expanded prompt text (pre/code)

### CSS Selectors — Typing Indicator
- `.chat-panel__typing` — Typing indicator container
- `.chat-panel__typing-dots` — Dot animation wrapper
- `.chat-panel__typing-dot` — Individual animated dot

### CSS Selectors — Prompt Buttons
- `.chat-panel__prompt-buttons` — Button grid container
- `.chat-panel__prompt-btn` — Individual prompt button
- `.chat-panel__prompt-btn--approval` — Approval button (teal)
- `.chat-panel__prompt-btn--error-recovery` — Error recovery button (red)
- `.chat-panel__prompt-btn--chain-control` — Chain control button (yellow)
- `.chat-panel__prompt-btn--code-action` — Code action button (blue)

### CSS Selectors — Input Area
- `.chat-panel__input-area` — Input container (textarea + send button)
- `.chat-panel__input-field` — Message textarea
- `.chat-panel__send-btn` — Send button
- `.chat-panel__send-icon` — Send icon (arrow or spinning loader)
- `.chat-panel__send-icon.spinning` — Spinning animation class

### Data Test IDs
- N/A (use CSS selectors for a11y tree snapshots via Chrome MCP)

### ARIA Labels
| Element | Role | Label | Notes |
|---------|------|-------|-------|
| `.chat-panel` | `region` | "Chat" | Semantic region for chat interface |
| `.chat-panel-header` | button (implicit) | N/A | Clickable when collapsible=true |
| `.collapse-toggle` | button | "Expand panel" / "Collapse panel" | Toggle state dependent |
| `.chat-panel__info-session-id` | button | "Copy session ID" | Tooltip on hover |
| `.chat-bubble__spawn-prompt-header` | button | "Expand spawn prompt" / "Collapse spawn prompt" | aria-expanded reflects state |
| `.chat-panel__input-field` | textbox | "Chat message input" | Placeholder text guides usage |
| `.chat-panel__send-btn` | button | "Send message" | Disabled state when input empty |

### Keyboard Interactions
| Key Combination | Target Element | Action | Notes |
|-----------------|----------------|--------|-------|
| Enter | `.chat-panel__input-field` | Send message (if not empty) | Shift+Enter adds new line |
| Escape | `.chat-panel` (focused) | Collapse panel (if collapsible=true) | Optional: could enhance with keyboard nav |
| Tab | `.chat-panel__prompt-btn` | Navigate between prompt buttons | Standard tabindex behavior |

### Visual Landmarks
1. Header with "Chat" title and status badge (`.chat-panel-header`) — Always visible, top of panel
2. Session info bar with ID, duration, chain count (`.chat-panel__info-bar`) — Hidden when collapsed
3. Message list with bubbles (`.chat-panel__messages`) — Scrollable, hidden when collapsed
4. Typing indicator (`.chat-panel__typing`) — Shows when assistant is responding
5. Prompt buttons grid (`.chat-panel__prompt-buttons`) — Context-aware action buttons
6. Input area with textarea + send button (`.chat-panel__input-area`) — Always visible when not collapsed

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CP-001: Component Renders with sessionId
- **Type:** render
- **Target:** ChatPanel component mount
- **Condition:** Component renders without errors when sessionId prop provided
- **Failure Mode:** Component fails to mount, chat not available
- **Recovery Path:** Check sessionId is valid SessionId type, verify context providers mounted
- **Automation Script:**
```javascript
// Chrome MCP: Verify ChatPanel renders
const chatPanel = await page.locator('.chat-panel').first();
if (!await chatPanel.isVisible()) {
  throw new Error('ChatPanel failed to render');
}
const header = chatPanel.locator('.chat-panel-header');
if (!await header.isVisible()) {
  throw new Error('ChatPanel header not visible');
}
```

#### HC-CP-002: Message List Displays
- **Type:** data-integration
- **Target:** Messages from useChatMessages hook
- **Condition:** Message bubbles render when messages array populated
- **Failure Mode:** No messages displayed (broken message extraction or rendering)
- **Recovery Path:** Verify useChatMessages hook returns messages, check session object structure
- **Automation Script:**
```javascript
// Chrome MCP: Verify message rendering
const chatPanel = await page.locator('.chat-panel').first();
const messages = chatPanel.locator('.chat-bubble');
const count = await messages.count();
if (count === 0) {
  console.warn('No messages found (may be normal if session is new)');
} else {
  const firstMsg = messages.first();
  const content = firstMsg.locator('.chat-bubble__content');
  if (!await content.isVisible()) {
    throw new Error('Message content not visible');
  }
}
```

#### HC-CP-003: Input Field and Send Button Work
- **Type:** interaction
- **Target:** Input textarea + send button
- **Condition:** Can type and submit message
- **Failure Mode:** Cannot send messages to Claude
- **Recovery Path:** Check onSendMessage callback defined or WebSocket connected
- **Automation Script:**
```javascript
// Chrome MCP: Test message input and send
const chatPanel = await page.locator('.chat-panel').first();
const inputField = chatPanel.locator('.chat-panel__input-field');
const sendBtn = chatPanel.locator('.chat-panel__send-btn');

// Type message
await inputField.fill('Test message');
const inputValue = await inputField.inputValue();
if (inputValue !== 'Test message') {
  throw new Error('Input field not accepting text');
}

// Check send button not disabled
if (await sendBtn.isDisabled()) {
  throw new Error('Send button disabled with non-empty input');
}
```

#### HC-CP-004: DiscussContext Registration
- **Type:** context-registration
- **Target:** handleSendMessageRef registered with DiscussContext
- **Condition:** DiscussButton can trigger chat input
- **Failure Mode:** Discuss integration broken, can't prefill input from other components
- **Recovery Path:** Check DiscussContext provider mounted, useDiscussContext hook available
- **Automation Script:**
```javascript
// Chrome MCP: Verify DiscussContext integration
// This is harder to test directly; smoke test by checking discuss button exists
const chatPanel = await page.locator('.chat-panel').first();
const discussBtn = chatPanel.locator('[data-testid*="discuss"]').first();
if (await discussBtn.isVisible()) {
  console.log('DiscussButton found in ChatPanel (registration likely working)');
} else {
  console.warn('No DiscussButton found (may indicate discuss integration issue)');
}
```

#### HC-CP-005: Auto-Scroll to Bottom
- **Type:** behavior
- **Target:** messagesEndRef scrollIntoView
- **Condition:** Messages scroll to bottom when new message added
- **Failure Mode:** New messages hidden below scroll position
- **Recovery Path:** Check messagesEndRef ref assigned correctly, check useEffect dependencies
- **Automation Script:**
```javascript
// Chrome MCP: Test auto-scroll
const chatPanel = await page.locator('.chat-panel').first();
const messagesContainer = chatPanel.locator('.chat-panel__messages');
const scrollHeightBefore = await messagesContainer.evaluate(el => el.scrollHeight);
const scrollTopBefore = await messagesContainer.evaluate(el => el.scrollTop);

// Add a new message (simulated by waiting for chat messages to update)
await page.waitForTimeout(100);

const scrollHeightAfter = await messagesContainer.evaluate(el => el.scrollHeight);
const scrollTopAfter = await messagesContainer.evaluate(el => el.scrollTop);

// If new messages added, should scroll to bottom
if (scrollHeightAfter > scrollHeightBefore && scrollTopAfter < scrollTopBefore + 100) {
  console.log('Auto-scroll working (scrolled down)');
} else {
  console.warn('Auto-scroll may not be working (scroll position unchanged)');
}
```

#### HC-CP-006: CLI Session Lifecycle
- **Type:** state-management
- **Target:** cliState and startCliSession
- **Condition:** CLI session starts when first message sent and transitions through states
- **Failure Mode:** CLI session not started, messages fail to process
- **Recovery Path:** Check claudeCliService available, verify sessionId format, check cwd path valid
- **Automation Script:**
```javascript
// Chrome MCP: Verify CLI state management
const chatPanel = await page.locator('.chat-panel').first();
// CLI state is internal; verify via "Live" badge visibility when active
const liveBadge = chatPanel.locator('.chat-panel-header__status-badge');
if (await liveBadge.isVisible()) {
  const text = await liveBadge.textContent();
  if (text.includes('Live')) {
    console.log('CLI session active (Live badge visible)');
  } else {
    console.warn('Status badge visible but not showing Live');
  }
} else {
  console.log('CLI not yet started (Live badge not visible, may be normal)');
}
```

#### HC-CP-007: Collapsible Header
- **Type:** ui-interaction
- **Target:** Collapse toggle button and isCollapsed state
- **Condition:** Clicking toggle collapses/expands panel, content hidden when collapsed
- **Failure Mode:** Cannot collapse chat, takes too much space
- **Recovery Path:** Check collapsible prop true, verify collapse-toggle button rendered
- **Automation Script:**
```javascript
// Chrome MCP: Test collapse toggle
const chatPanel = await page.locator('.chat-panel').first();
const toggleBtn = chatPanel.locator('.collapse-toggle');

if (!await toggleBtn.isVisible()) {
  console.warn('Collapse toggle not visible (collapsible prop may be false)');
  return;
}

// Check initial state
const initialHeight = await chatPanel.evaluate(el => el.offsetHeight);
const initialCollapsed = await chatPanel.evaluate(el => el.classList.contains('collapsed'));

// Click toggle
await toggleBtn.click();
await page.waitForTimeout(200);

// Check collapsed state changed
const finalHeight = await chatPanel.evaluate(el => el.offsetHeight);
const finalCollapsed = await chatPanel.evaluate(el => el.classList.contains('collapsed'));

if (finalCollapsed !== initialCollapsed) {
  console.log(`Collapse toggle working (state changed from ${initialCollapsed} to ${finalCollapsed})`);
} else {
  console.warn('Collapse toggle did not change state');
}
```

#### HC-CP-008: Session Status Badge
- **Type:** visual-feedback
- **Target:** Session status dot and color (green/gray/red/yellow)
- **Condition:** Badge shows correct status color based on session.status
- **Failure Mode:** Status color wrong, user confused about session state
- **Recovery Path:** Check session object has status field, verify status value is one of: in_progress, completed, failed, paused, active
- **Automation Script:**
```javascript
// Chrome MCP: Verify status badge
const chatPanel = await page.locator('.chat-panel').first();
const statusBadge = chatPanel.locator('.chat-panel-header__session-status').first();

if (!await statusBadge.isVisible()) {
  console.warn('Session status badge not visible (session prop may be undefined)');
  return;
}

const classes = await statusBadge.evaluate(el => el.className);
const statusClass = ['green', 'gray', 'red', 'yellow'].find(c => classes.includes(c));

if (statusClass) {
  console.log(`Session status: ${statusClass}`);
} else {
  console.warn('Status class not found or unrecognized');
}
```

### Warning Checks (Should Pass)

#### HC-CP-W001: Session Info Bar Displays
- **Type:** ui-feature
- **Target:** Session metadata (ID, duration, chains)
- **Condition:** Info bar renders when session prop provided and panel not collapsed
- **Failure Mode:** Missing session context, harder to track session

#### HC-CP-W002: Prompt Buttons Render
- **Type:** ui-feature
- **Target:** usePromptButtons generates context-aware buttons
- **Condition:** Prompt buttons visible when available
- **Failure Mode:** Cannot use quick-action buttons

#### HC-CP-W003: Typing Indicator Shows
- **Type:** visual-feedback
- **Target:** isTyping state and `.chat-panel__typing`
- **Condition:** Typing indicator visible when assistant streaming
- **Failure Mode:** Unclear when Claude is thinking (currently hardcoded false, TODO)

#### HC-CP-W004: Spawn Prompt Expansion
- **Type:** ui-interaction
- **Target:** Tool messages with spawn prompt metadata
- **Condition:** Expand/collapse button toggles spawn prompt visibility
- **Failure Mode:** Cannot view generated spawn prompts

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| initial-render | 150 | ms | Time to render ChatPanel with header |
| message-render | 100 | ms | Time to render a single message bubble |
| input-response | 50 | ms | Time from keystroke to state update |
| auto-scroll | 200 | ms | Time to scroll to bottom after new message |
| toggle-collapse | 100 | ms | Time to toggle collapsed state |

---

## Dependencies

**Required Contexts:**
- WebSocketContext (for send function)
- DiscussContext (for registerChatInput, unregisterChatInput)

**Required Hooks:**
- `useChatMessages(sessionId)` — Manages message history
- `usePromptButtons({ session, messages, cliRunning })` — Generates prompt buttons
- `useDiscussButton({ componentName, getContext })` — Dialog state
- `useWebSocketContext()` — WebSocket communication

**Child Components:**
- DiscussButton
- DiscussDialog

**Required Props:**
- `sessionId` (SessionId branded type)
- `session` (optional Session object)
- `onSendMessage` (optional callback)
- `collapsible` (optional boolean)
- `cwd` (optional string)

---

## Notes

### Component Evolution
- **Previous Name:** ConversationPanel (deprecated, replaced 2026-02-10)
- **Renamed To:** ChatPanel for clarity and consistency with DiscussContext terminology

### Message Sources
1. **useChatMessages hook** — Manages message history by sessionId
2. **User submissions** — Tracked in messages state via addUserMessage
3. **WebSocket updates** — Session updates flow from parent context

### CLI Session Lifecycle
- **State Machine:** `'not-started'` → `'starting'` → `'running'` / `'stopped'`
- **Trigger:** First message sent automatically starts CLI session via claudeCliService
- **Service:** Uses packages/app/src/services/claudeCliService for session management
- **Reconnect:** If session already exists on backend, treats as running (reconnect case)

### DiscussContext Integration (Ref Wrapper Pattern)
- **Purpose:** Allow DiscussButton components to trigger chat input from anywhere
- **Implementation:** Uses `handleSendMessageRef.current = handleSendMessage` pattern to maintain stable closure
- **Why Ref?** React.useCallback dependency changes would cause re-registration. Ref avoids this and always calls latest version.
- **Registration:** On effect cleanup, unregisters via `unregisterChatInput()`

### Prompt Buttons
- **Source:** usePromptButtons hook generates context-aware suggestions
- **Categories:** approval, error-recovery, chain-control, code-action (BEM class modifiers)
- **Interaction:** Clicking button prefills input with button.promptText, then sends

### Accessibility Notes
- **Region role:** ChatPanel marked as `role="region" aria-label="Chat"` for landmark navigation
- **Buttons:** All interactive elements (collapse, copy, send) have aria-label
- **Keyboard:** Enter submits, Shift+Enter adds new line, Tab navigates buttons
- **Spawn Prompt:** aria-expanded reflects state, aria-controls links to content ID

### CSS Notes
- **BEM Convention:** All classes use BEM naming (.block, .block__element, .block--modifier)
- **Responsive:** Media query for screens < 320px reduces padding/font sizes
- **Motion:** Respects prefers-reduced-motion accessibility preference
- **Scrollbar:** Custom webkit scrollbar styled to match theme
- **Animations:**
  - chat-bubble-in: 0.15s fade + slide entry
  - chat-pulse: Pulsing status dot (2s infinite)
  - typing-bounce: Bouncing dots for typing indicator
  - chat-spin: Spinning send icon during submit

### Known Limitations
- **isTyping:** Currently hardcoded to false. TODO: Track from streaming state in useChatMessages or WebSocket
- **Health Check HC-CP-004:** DiscussContext registration difficult to test directly; relies on smoke tests
- **Chrome MCP Tests:** Use `.chat-panel` as root selector for robustness; specific child selectors may need adjustment if DOM changes

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 2.0.0
