# SessionCliPanel

Terminal panel component for Claude CLI sessions with xterm.js integration.

## Overview

SessionCliPanel provides a full-featured terminal interface for interacting with Claude CLI sessions. It displays terminal output in real-time via WebSocket events and provides an input field for sending commands.

## Features

- **xterm.js Terminal**: Professional terminal emulation with color support
- **Real-time Updates**: WebSocket integration for live CLI output
- **Command Input**: Bottom-mounted input field with Enter-to-send
- **Auto-scroll**: Automatically scrolls to bottom on new output
- **Error Highlighting**: stderr output displayed in red
- **Dark Theme**: Minimal dark terminal theme matching dashboard aesthetic
- **Responsive**: Adapts to container size with FitAddon

## Usage

```tsx
import { SessionCliPanel } from './components/SessionTile';

function MyComponent() {
  return (
    <SessionCliPanel
      sessionId="session-123"
      height="400px"
      onCommand={(cmd) => console.log('Command sent:', cmd)}
    />
  );
}
```

## Props

### `sessionId` (required)
- Type: `SessionId`
- The session ID to connect to for CLI output

### `height` (optional)
- Type: `number | string`
- Default: `'100%'`
- Height of the terminal panel (CSS value)

### `onCommand` (optional)
- Type: `(command: string) => void`
- Callback fired when a command is sent

## Integration

### WebSocket Events

The component subscribes to WebSocket events and filters by sessionId:

- **`claude-cli:output`**: Terminal output (stdout/stderr)
- **`claude-cli:exited`**: Session termination notification

### Claude CLI Service

Commands are sent via `claudeCliService.sendInput()`:

```typescript
await claudeCliService.sendInput(sessionId, command + '\n');
```

## Styling

The component uses dark terminal theming with:
- Background: `#0a0a0a`
- Foreground: `#d4d4d4`
- Accent (green): `#0dbc79`
- Error (red): `#cd3131`

Custom styles can be applied via `SessionCliPanel.css`.

## Terminal Features

### xterm.js Configuration
- Font: Cascadia Code, Fira Code, Consolas (monospace)
- Font size: 14px
- Cursor: Block style with blink
- Scrollback: 10,000 lines
- Color scheme: Dark theme with ANSI color support

### Command Input
- Enter key sends command
- Shows loading spinner while sending
- Disabled state while command in-flight
- Echoes commands to terminal in green

## Example: Full Integration

```tsx
import { SessionCliPanel } from './components/SessionTile';
import { WebSocketProvider } from './contexts/WebSocketContext';

function SessionView({ sessionId }: { sessionId: SessionId }) {
  return (
    <WebSocketProvider url="ws://localhost:3001/ws">
      <div style={{ height: '600px' }}>
        <SessionCliPanel
          sessionId={sessionId}
          height="100%"
          onCommand={(cmd) => {
            console.log('User sent command:', cmd);
          }}
        />
      </div>
    </WebSocketProvider>
  );
}
```

## Dependencies

- **xterm**: Terminal emulation library
- **@xterm/addon-fit**: Responsive terminal sizing
- **@afw/shared**: Shared types (SessionId, events)
- **claudeCliService**: CLI backend service
- **WebSocketContext**: Real-time event streaming

## Architecture

```
┌─────────────────────────────────────┐
│     SessionCliPanel Component       │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │   xterm.js Terminal           │ │
│  │   - Output display            │ │
│  │   - Color support             │ │
│  │   - Auto-scroll               │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Command Input               │ │
│  │   - Text field                │ │
│  │   - Send button               │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
           │              │
           │              │
    WebSocket Events   claudeCliService
           │              │
           ▼              ▼
    ┌─────────────────────────┐
    │   Backend WebSocket     │
    │   + Claude CLI Manager  │
    └─────────────────────────┘
```

## Event Flow

1. User types command and presses Enter
2. Component calls `claudeCliService.sendInput()`
3. Backend receives command and forwards to Claude CLI process
4. Claude CLI generates output
5. Backend emits `claude-cli:output` WebSocket event
6. Component receives event via `useWebSocketContext`
7. Component filters by sessionId and writes to terminal
8. Terminal auto-scrolls to show new output

## Error Handling

- Command send failures display error in terminal (red)
- stderr output automatically colored red
- WebSocket disconnection handled by WebSocketContext
- Terminal initialization failures caught and logged

## Accessibility

- `role="region"` with `aria-label="Claude CLI terminal"`
- Command input has `aria-label="Command input"`
- Send button has `aria-label="Send command"`
- Disabled states properly communicated to screen readers

## Performance

- Terminal scrollback limited to 10,000 lines
- FitAddon handles responsive resizing efficiently
- Event callbacks unsubscribed on unmount
- Terminal disposed properly to prevent memory leaks
