# Component Contract: ClaudeCliTerminal

**File:** `packages/app/src/components/ClaudeCliTerminal/ClaudeCliTerminal.tsx`
**Type:** feature
**Parent Group:** Terminal Components
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ClaudeCliTerminal
- **Introduced:** 2025-Q4
- **Description:** Interactive xterm.js terminal for Claude CLI sessions with stdin support, toolbar controls, and WebSocket event integration.

---

## Render Location

**Mounts Under:**
- Terminal panel or dedicated terminal view

**Render Conditions:**
1. Valid sessionId provided

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- Parent renders with sessionId

**Key Effects:**
1. **Dependencies:** `[]`
   - **Side Effects:** Initializes xterm instance, creates FitAddon, mounts to terminalRef, writes welcome message
   - **Cleanup:** Disposes xterm instance
   - **Condition:** Runs once on mount

2. **Dependencies:** `[sendInput, isTerminalReady]`
   - **Side Effects:** Attaches onData handler for user input (handles Enter, Backspace, Ctrl+C, printable chars)
   - **Cleanup:** None
   - **Condition:** Runs when dependencies change

3. **Dependencies:** `[sessionId]` (from WebSocket context)
   - **Side Effects:** Subscribes to WebSocket events for sessionId
   - **Cleanup:** Unsubscribes from WebSocket
   - **Condition:** Runs when sessionId changes

4. **Dependencies:** `[sessionId]` (from onEvent)
   - **Side Effects:** Listens for claude-cli:output and claude-cli:exited events, writes to terminal
   - **Cleanup:** None
   - **Condition:** Runs when events arrive

5. **Dependencies:** `[]`
   - **Side Effects:** Window resize listener for fitAddon.fit()
   - **Cleanup:** Removes resize listener
   - **Condition:** Runs once on mount

**Cleanup Actions:**
- Dispose xterm instance
- Remove resize listener
- Unsubscribe from WebSocket

**Unmount Triggers:**
- Parent unmounts or sessionId changes

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| sessionId | SessionId | ✅ | N/A | Claude CLI session identifier |
| onClose | () => void | ❌ | undefined | Close callback |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onClose | `() => void` | Called when user closes terminal |

### Callbacks Down (to children)
None (leaf component with xterm.js)

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| isTerminalReady | boolean | false | Set to true after xterm initialization |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| WebSocketContext | onEvent, subscribe, unsubscribe |

### Derived State
None

### Custom Hooks
- `useWebSocketContext()` — For WebSocket event subscription
- `useClaudeCliControl(sessionId)` — For sendInput, stop API calls
- `useDiscussButton()` — Discuss dialog integration

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onClose when terminal should close
- **Example:** User clicks Close button → onClose() → parent removes terminal

### Child Communication
None (xterm.js is external library)

### Sibling Communication
None

### Context Interaction
- **Context:** WebSocketContext
- **Role:** consumer
- **Operations:** Subscribe to sessionId events, listen for claude-cli:output and claude-cli:exited

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/claude-cli/${sessionId}/input` | POST | User types Enter | useClaudeCliControl hook |
| `/api/claude-cli/${sessionId}/stop` | POST | User clicks Stop | useClaudeCliControl hook |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| `claude-cli:output` | CLI produces output | Write to xterm (stdout/stderr) |
| `claude-cli:exited` | CLI session ends | Write exit message to xterm |

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| terminalRef | xterm.open() | Terminal initialization |
| xterm | write(), clear() | Output events, Clear button |

### Electron IPC
None

---

## Test Hooks

**CSS Selectors:**
- `.claude-cli-terminal`
- `.terminal-toolbar`
- `.xterm` (xterm.js container)
- `.xterm canvas` (xterm.js canvas)

**Data Test IDs:**
None

**ARIA Labels:**
None

**Visual Landmarks:**
1. Toolbar with Stop and Clear buttons (`.terminal-toolbar`)
2. xterm.js canvas (`.xterm canvas`)
3. Welcome message on initialization

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CCT-001: Terminal Render
- **Type:** render
- **Target:** ClaudeCliTerminal container
- **Condition:** `.claude-cli-terminal` exists
- **Failure Mode:** No terminal UI
- **Automation Script:**
```javascript
const terminal = document.querySelector('.claude-cli-terminal');
if (!terminal) throw new Error('Terminal not rendered');
return true;
```

#### HC-CCT-002: Toolbar Render
- **Type:** render
- **Target:** Terminal toolbar
- **Condition:** `.terminal-toolbar` exists
- **Failure Mode:** No controls for Stop/Clear
- **Automation Script:**
```javascript
const terminal = document.querySelector('.claude-cli-terminal');
const toolbar = terminal.querySelector('.terminal-toolbar');
if (!toolbar) throw new Error('Toolbar missing');
return true;
```

#### HC-CCT-003: xterm Initialization
- **Type:** render
- **Target:** xterm.js canvas
- **Condition:** `.xterm canvas` exists
- **Failure Mode:** Terminal not functional
- **Automation Script:**
```javascript
const terminal = document.querySelector('.claude-cli-terminal');
const xtermCanvas = terminal.querySelector('.xterm canvas');
if (!xtermCanvas) throw new Error('xterm canvas not initialized');
return true;
```

### Warning Checks (Should Pass)

#### HC-CCT-004: WebSocket Connection
- **Type:** connection
- **Target:** WebSocket subscription
- **Condition:** Successfully subscribed to sessionId
- **Failure Mode:** No output from CLI

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 200 | ms | Time to initialize xterm and render |
| input-latency | 100 | ms | Time from keypress to visual feedback |

---

## Dependencies

**Required Contexts:**
- WebSocketContext

**Required Hooks:**
- useState
- useRef
- useEffect
- useWebSocketContext
- useClaudeCliControl
- useDiscussButton

**Child Components:**
None (uses xterm.js library)

**Required Props:**
- sessionId

---

## Notes

- Interactive stdin enabled (disableStdin: false)
- Input handling: Enter sends line, Backspace removes char, Ctrl+C sends interrupt
- ANSI color support (stderr rendered in red)
- Auto-fit on window resize via FitAddon
- Welcome message: "Claude CLI Terminal Ready. Type your commands below."
- inputBufferRef used instead of React state for performance (avoids re-renders on every keystroke)
- Stop button calls `/api/claude-cli/${sessionId}/stop`
- Clear button calls xterm.clear()
- WebSocket events: claude-cli:output (stdout/stderr), claude-cli:exited (session end)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
