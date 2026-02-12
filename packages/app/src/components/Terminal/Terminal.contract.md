# Terminal Behavioral Contract

## Identity
**Component Name:** Terminal (TerminalPanel)
**File Path:** packages/app/src/components/Terminal/TerminalPanel.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Full-featured terminal emulator within Terminal workbench. Renders as xterm.js-based terminal with command execution and output streaming.

## Lifecycle
- **Mount:** Initializes xterm.js instance, establishes WebSocket connection for command execution
- **Update:** Re-renders on output changes, theme updates
- **Unmount:** Closes WebSocket connection and disposes xterm instance

## Props Contract
```typescript
interface TerminalPanelProps {
  /** Optional initial command to execute */
  initialCommand?: string;
  /** Theme configuration (light/dark) */
  theme?: 'light' | 'dark';
  /** Whether to enable command history */
  enableHistory?: boolean;
}
```

## State Ownership
- **Terminal instance:** xterm.js core instance
- **Command history:** Array of previously executed commands
- **Current input:** Current command line input
- **Output buffer:** Terminal output lines
- **Connection state:** Whether WebSocket is connected

## Interactions
- **Type command:** Adds to command input
- **Enter key:** Executes command via WebSocket
- **Ctrl+C:** Sends SIGINT to process
- **Mouse selection:** Allows copy/paste
- **Scroll wheel:** Scrolls through history
- **Right-click:** Shows context menu (copy/paste/clear)

## Test Hooks
- `data-testid="terminal-panel"` on main container
- `data-testid="terminal-output"` on output area
- `data-testid="terminal-input"` on input line
- `data-testid="terminal-prompt"` on command prompt
- `data-testid="command-history"` on history list
