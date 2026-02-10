# Component Contract: DiscussDialog

**File:** `packages/app/src/components/DiscussButton/DiscussDialog.tsx`
**Type:** utility
**Parent Group:** Discussion System
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** DiscussDialog
- **Introduced:** 2025-Q4
- **Description:** Modal dialog for discussing UI components, includes message textarea, collapsible context JSON, and Send/Cancel actions.

---

## Render Location

**Mounts Under:**
- Parent components that use DiscussButton

**Render Conditions:**
1. isOpen prop is true

**Positioning:** fixed (modal overlay)
**Z-Index:** High (modal layer)

---

## Lifecycle

**Mount Triggers:**
- isOpen becomes true

**Key Effects:**
1. **Dependencies:** `[isOpen, componentName]`
   - **Side Effects:** Sets message to template text, focuses textarea after 100ms
   - **Cleanup:** None
   - **Condition:** Runs when isOpen changes to true

2. **Dependencies:** `[isOpen, onClose]`
   - **Side Effects:** Adds Escape key listener to document
   - **Cleanup:** Removes keydown listener
   - **Condition:** Runs when isOpen is true

3. **Dependencies:** `[isOpen]`
   - **Side Effects:** Prevents body scroll when open
   - **Cleanup:** Restores body scroll
   - **Condition:** Runs when isOpen changes

**Cleanup Actions:**
- Remove Escape key listener
- Restore body scroll

**Unmount Triggers:**
- Parent unmounts or isOpen becomes false

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| isOpen | boolean | ✅ | N/A | Whether dialog is visible |
| componentName | string | ✅ | N/A | Component being discussed |
| componentContext | Record<string, unknown> | ❌ | undefined | Context data (shown as collapsible JSON) |
| onSend | (message: string) => void | ✅ | N/A | Send callback |
| onClose | () => void | ✅ | N/A | Close callback |
| isSending | boolean | ❌ | false | Loading state during send |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSend | `(message: string) => void` | Called when user clicks Send button |
| onClose | `() => void` | Called when dialog should close |

### Callbacks Down (to children)
None (leaf component)

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| message | string | Template text | User typing in textarea, initialized to "I want to discuss this {componentName} element" |

### Context Consumption
None

### Derived State
None

### Custom Hooks
None

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onSend with message text, calls onClose when dismissed
- **Example:** User clicks Send → onSend(message) → parent sends to chat

### Child Communication
None (no child components)

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
None (parent handles sending)

### WebSocket Events
None

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| setTimeout | 100ms | Focus textarea after dialog opens | ✅ (implicit) |

### LocalStorage Operations
None

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| textarea | focus() | Dialog opens |
| document.body | Prevent scroll (style.overflow = 'hidden') | isOpen=true |

### Electron IPC
None

---

## Test Hooks

**CSS Selectors:**
- `.discuss-dialog__backdrop`
- `.discuss-dialog`
- `.discuss-dialog__header`
- `.discuss-dialog__message`
- `.discuss-dialog__context`
- `.discuss-dialog__actions`
- `.discuss-dialog__btn--primary`

**Data Test IDs:**
None

**ARIA Labels:**
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby="discuss-dialog-title"`

**Visual Landmarks:**
1. Modal backdrop (`.discuss-dialog__backdrop`)
2. Dialog box (`.discuss-dialog`)
3. Header with title "Discuss {componentName}"
4. Message textarea (`.discuss-dialog__message`)
5. Collapsible context details (native `<details>`/`<summary>`)
6. Action buttons: Cancel, Send to Chat

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-DD-001: Dialog Opens
- **Type:** render
- **Target:** DiscussDialog modal
- **Condition:** `.discuss-dialog` exists when isOpen=true
- **Failure Mode:** Dialog does not appear
- **Automation Script:**
```javascript
const button = document.querySelector('.discuss-button');
if (!button) throw new Error('No discuss button to open dialog');
button.click();
await new Promise(r => setTimeout(r, 500));
const dialog = document.querySelector('.discuss-dialog');
if (!dialog) throw new Error('Dialog did not open');
return true;
```

#### HC-DD-002: Message Initialization
- **Type:** render
- **Target:** Textarea with pre-filled text
- **Condition:** textarea.value contains template text
- **Failure Mode:** User starts with empty message
- **Automation Script:**
```javascript
const dialog = document.querySelector('.discuss-dialog');
const textarea = dialog.querySelector('.discuss-dialog__message');
if (!textarea || !textarea.value) throw new Error('Message textarea not initialized');
return true;
```

#### HC-DD-003: Send Button
- **Type:** render
- **Target:** Primary action button
- **Condition:** `.discuss-dialog__btn--primary` exists
- **Failure Mode:** Cannot send message
- **Automation Script:**
```javascript
const dialog = document.querySelector('.discuss-dialog');
const sendButton = dialog.querySelector('.discuss-dialog__btn--primary');
if (!sendButton) throw new Error('Send button missing');
return true;
```

### Warning Checks (Should Pass)

#### HC-DD-004: Escape Key Closes
- **Type:** interaction
- **Target:** Keyboard event listener
- **Condition:** Escape key triggers onClose
- **Failure Mode:** Cannot dismiss via keyboard

#### HC-DD-005: Backdrop Click Closes
- **Type:** interaction
- **Target:** Backdrop click handler
- **Condition:** Clicking backdrop triggers onClose
- **Failure Mode:** Cannot dismiss via backdrop click

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 50 | ms | Time to render dialog |
| focus-time | 150 | ms | Time to focus textarea (includes 100ms delay) |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
- useState
- useEffect
- useRef
- useCallback

**Child Components:**
None

**Required Props:**
- isOpen
- componentName
- onSend
- onClose

---

## Notes

- Modal dialog with backdrop overlay
- Pre-fills message textarea with template: "I want to discuss this {componentName} element"
- Escape key to close, backdrop click to close
- Focus trap (textarea focused on open)
- Body scroll prevented when open (restored on close)
- Context details shown as collapsible JSON using native `<details>`/`<summary>` elements
- Send button disabled when isSending=true
- Returns null when isOpen=false (not rendered)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
