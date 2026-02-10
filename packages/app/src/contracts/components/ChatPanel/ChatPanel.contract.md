# Component Contract: ChatPanel

**File:** `packages/app/src/components/ConversationPanel/ConversationPanel.tsx`
**Type:** feature
**Parent Group:** ConversationPanel/ (aliased as ChatPanel)
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ChatPanel (ConversationPanel)
- **Introduced:** 2025-12-20
- **Description:** Full conversation interface displaying Claude output and user input with message history, quick response buttons, InlineButtons integration, and DiscussButton support. Registers chat input setter with DiscussContext.

---

## Render Location

**Mounts Under:**
- LeftPanelStack (primary, within SessionPanelLayout)
- SessionPane (legacy)

**Render Conditions:**
1. Session prop provided
2. Renders as primary interface in left panel

**Positioning:** relative (fills parent container)
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- LeftPanelStack mounts
- Session changes

**Key Effects:**
1. **Dependencies:** `[]` (mount only)
   - **Side Effects:** Registers chatInputSetter with DiscussContext
   - **Cleanup:** Unregisters chatInputSetter
   - **Condition:** Runs on mount

2. **Dependencies:** `[session]`
   - **Side Effects:** Extracts message history from session.chains and session.lastPrompt
   - **Cleanup:** None
   - **Condition:** Runs when session changes

3. **Dependencies:** `[messages]`
   - **Side Effects:** Auto-scrolls to bottom of message list
   - **Cleanup:** None
   - **Condition:** Runs when messages array changes

**Cleanup Actions:**
- Unregisters chatInputSetter from DiscussContext

**Unmount Triggers:**
- LeftPanelStack unmounts
- Session detached

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| session | `Session` | ✅ | N/A | Session data to display |
| onSubmitInput | `(input: string) => Promise<void>` | ✅ | N/A | Callback when user submits input |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSubmitInput | `(input: string) => Promise<void>` | User submits input → parent processes |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onAction | `(button: ButtonDefinition) => void` | InlineButtons | Button clicked → logs to console (placeholder) |
| onSend | `(message: string) => void` | DiscussDialog | Message sent → handled by useDiscussButton |
| onClose | `() => void` | DiscussDialog | Dialog closed → handled by useDiscussButton |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| input | `string` | `''` | setInput (textarea onChange) |
| messages | `Message[]` | `[]` | setMessages (extracted from session) |
| isSending | `boolean` | `false` | setIsSending (during submit) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | `registerChatInput`, `unregisterChatInput` |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| isAwaiting | `boolean` | `session.conversationState` | Checks if === 'awaiting_input' |
| canSend | `boolean` | `isAwaiting, input, isSending` | isAwaiting && input.trim().length > 0 && !isSending |
| quickResponses | `string[]` | `session.lastPrompt?.quickResponses` | Extracts quick response options |

### Custom Hooks
- `useDiscussButton({ componentName, getContext })` — Discussion dialog integration

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Notifies parent when user submits input
- **Example:**
  ```tsx
  handleSubmit(input) → onSubmitInput(input) → backend processes
  ```

### Child Communication
- **Child:** InlineButtons
- **Mechanism:** props
- **Data Flow:** Passes `messageContent`, `sessionId`, `buttons`, `onAction`

- **Child:** DiscussDialog
- **Mechanism:** props
- **Data Flow:** Passes `isOpen`, `componentName`, `componentContext`, `onSend`, `onClose`

### Sibling Communication
- **Sibling:** All components with DiscussButton
- **Mechanism:** DiscussContext (registerChatInput)
- **Description:** DiscussButtons can prefill this ChatPanel's input field

### Context Interaction
- **Context:** DiscussContext
- **Role:** provider (registers input setter)
- **Operations:** Registers `setInput` function so DiscussButtons can prefill input

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| N/A | N/A | N/A | N/A (onSubmitInput handled by parent) |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| N/A | N/A | N/A (session updates via parent) |

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
| messagesEndRef | scrollIntoView | messages change | Auto-scroll to bottom |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.conversation-panel`
- `.conversation-header`
- `.awaiting-badge`
- `.pulse-dot`
- `.messages-container`
- `.no-messages`
- `.message`
- `.message-assistant`
- `.message-user`
- `.message-role`
- `.message-step-number`
- `.message-content`
- `.message-timestamp`
- `.input-area`
- `.quick-responses`
- `.quick-response-btn`
- `.input-field-container`
- `.input-field`
- `.send-btn`
- `.not-awaiting-notice`

**Data Test IDs:**
- N/A (use CSS selectors)

**ARIA Labels:**
- None specified (consider adding for accessibility)

**Visual Landmarks:**
1. Header with "Conversation" title (`.conversation-header`) — Top of panel
2. Awaiting badge (`.awaiting-badge`) — Pulsing dot + "Awaiting Input" text
3. Message list (`.messages-container`) — Scrollable conversation history
4. Quick response buttons (`.quick-responses`) — When available
5. Input textarea (`.input-field`) — Multi-line input with placeholder
6. Send button (`.send-btn`) — Blue button, enabled when canSend

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CP-001: Message History Extraction
- **Type:** data-integration
- **Target:** Messages extracted from session.chains and session.lastPrompt
- **Condition:** Message array populated with chain steps + last prompt
- **Failure Mode:** Missing conversation history
- **Automation Script:**
```javascript
const chatPanel = await page.locator('.conversation-panel').first();

// Wait for messages to load
await page.waitForTimeout(500);

// Verify messages exist
const messageCount = await chatPanel.locator('.message').count();

if (messageCount === 0) {
  throw new Error('No messages extracted from session');
}

// Verify message structure
const firstMessage = chatPanel.locator('.message').first();
const hasRole = await firstMessage.locator('.message-role').isVisible();
const hasContent = await firstMessage.locator('.message-content').isVisible();
const hasTimestamp = await firstMessage.locator('.message-timestamp').isVisible();

if (!hasRole || !hasContent || !hasTimestamp) {
  throw new Error('Message structure incomplete');
}
```

#### HC-CP-002: Input Submission
- **Type:** interaction
- **Target:** Submit input triggers onSubmitInput
- **Condition:** Typing + Enter sends message
- **Failure Mode:** Cannot respond to Claude
- **Automation Script:**
```javascript
const chatPanel = await page.locator('.conversation-panel').first();

// Verify awaiting state
const awaitingBadge = chatPanel.locator('.awaiting-badge');
if (!await awaitingBadge.isVisible()) {
  throw new Error('Session not awaiting input');
}

// Type message
const inputField = chatPanel.locator('.input-field');
await inputField.fill('Test response');

// Press Enter
await inputField.press('Enter');

// Verify message sent (input cleared, isSending state)
await page.waitForTimeout(200);
const inputValue = await inputField.inputValue();

if (inputValue !== '') {
  throw new Error('Input not cleared after send');
}

// Verify user message added to history
const userMessages = await chatPanel.locator('.message-user').count();
if (userMessages === 0) {
  throw new Error('User message not added to history');
}
```

#### HC-CP-003: Quick Response Buttons
- **Type:** interaction
- **Target:** Quick response buttons submit input
- **Condition:** Clicking button submits that response
- **Failure Mode:** Cannot use quick responses
- **Automation Script:**
```javascript
const chatPanel = await page.locator('.conversation-panel').first();

// Verify quick responses visible (if session has them)
const quickResponseBtn = chatPanel.locator('.quick-response-btn').first();

if (await quickResponseBtn.isVisible()) {
  const buttonText = await quickResponseBtn.textContent();

  // Click button
  await quickResponseBtn.click();

  // Verify message sent
  await page.waitForTimeout(200);

  // Verify user message with button text appears
  const userMessage = chatPanel.locator(`.message-user:has(.message-content:has-text("${buttonText}"))`);
  if (!await userMessage.isVisible()) {
    throw new Error('Quick response not submitted');
  }
}
```

#### HC-CP-004: DiscussContext Registration
- **Type:** context-registration
- **Target:** chatInputSetter registered on mount
- **Condition:** DiscussButton can prefill input
- **Failure Mode:** Discuss integration broken
- **Automation Script:**
```javascript
// Open discuss dialog from another component
await page.locator('.discuss-button').first().click();
await page.waitForSelector('.discuss-dialog', { visible: true });

// Type and send message
await page.locator('.discuss-dialog textarea').fill('Prefill test');
await page.locator('.discuss-dialog .send-btn').click();

// Verify dialog closed
await page.waitForSelector('.discuss-dialog', { state: 'hidden', timeout: 1000 });

// Verify ChatPanel input prefilled
const chatPanel = await page.locator('.conversation-panel').first();
const inputValue = await chatPanel.locator('.input-field').inputValue();

if (!inputValue.includes('Prefill test')) {
  throw new Error('DiscussButton did not prefill ChatPanel input');
}
```

#### HC-CP-005: Auto-Scroll to Bottom
- **Type:** behavior
- **Target:** Messages scroll to bottom when new message added
- **Condition:** messagesEndRef scrollIntoView called
- **Failure Mode:** New messages hidden below scroll
- **Automation Script:**
```javascript
const chatPanel = await page.locator('.conversation-panel').first();
const messagesContainer = chatPanel.locator('.messages-container');

// Get scroll position before
const scrollBefore = await messagesContainer.evaluate(el => el.scrollTop);

// Add new message (simulate by sending input)
await chatPanel.locator('.input-field').fill('New message');
await chatPanel.locator('.send-btn').click();

// Wait for scroll
await page.waitForTimeout(500);

// Get scroll position after
const scrollAfter = await messagesContainer.evaluate(el => el.scrollTop);

// Should have scrolled down
if (scrollAfter <= scrollBefore) {
  throw new Error('Did not auto-scroll to bottom');
}
```

### Warning Checks (Should Pass)

#### HC-CP-006: InlineButtons Rendering
- **Type:** integration
- **Target:** InlineButtons component renders for messages with hasInlineButtons
- **Condition:** InlineButtons visible with default buttons
- **Failure Mode:** Missing button actions

#### HC-CP-007: Awaiting State Badge
- **Type:** visual-feedback
- **Target:** Pulsing badge when awaiting input
- **Condition:** Badge visible when conversationState === 'awaiting_input'
- **Failure Mode:** Unclear when input expected

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| message-extraction | 100 | ms | Time to extract messages from session |
| render-history | 200 | ms | Time to render 50 messages |
| input-submit | 500 | ms | Time from submit to UI update |
| auto-scroll | 100 | ms | Time to scroll to bottom |

---

## Dependencies

**Required Contexts:**
- DiscussContext (registers chatInputSetter)

**Required Hooks:**
- `useDiscussButton()`

**Child Components:**
- InlineButtons
- DiscussButton
- DiscussDialog

**Required Props:**
- `session`
- `onSubmitInput`

---

## Notes

- **Alias:** Component file is ConversationPanel.tsx but referred to as ChatPanel in contracts/architecture
- **Message extraction sources:**
  1. session.chains → chain.steps (completed steps with description/result)
  2. session.lastPrompt (current awaiting prompt from Claude)
  3. Local user submissions (tracked in messages state)
- **InlineButtons integration:** Phase 1 uses DEFAULT_BUTTONS (copy, retry, approve, reject). Phase 3 will use registry-based buttons.
- **DiscussContext role:** Registers `setInput` function so other components can prefill input
- **Quick responses:** Extracted from session.lastPrompt.quickResponses (binary prompts)
- **Enter behavior:** Enter submits, Shift+Enter adds new line
- **Disabled state:** Input disabled when not awaiting, shows notice
- **Message sorting:** Chronological by timestamp
- **hasInlineButtons flag:** Currently true for lastPrompt messages (placeholder for Step 4 integration)
- **Markdown rendering:** Recent addition for rich message formatting

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
