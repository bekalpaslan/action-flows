# CommandPalette Behavioral Contract

## Identity
**Component Name:** CommandPalette
**File Path:** packages/app/src/components/CommandPalette/CommandPalette.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Full-screen command/search overlay. Appears when Ctrl+K or Cmd+K is pressed, allowing quick navigation and command execution.

## Lifecycle
- **Mount:** Initializes keyboard shortcut listeners
- **Update:** Re-renders when search input changes, filters results
- **Unmount:** Cleans up keyboard listeners

## Props Contract
```typescript
// No props - uses keyboard event to appear/disappear
```

## State Ownership
- **Search query:** Current command search text
- **Results:** Filtered command results
- **Selected index:** Currently highlighted result
- **Recent commands:** Array of recently used commands
- **Open state:** Whether palette is visible

## Interactions
- **Ctrl+K / Cmd+K:** Opens palette
- **Type query:** Filters commands
- **Arrow keys:** Navigate results
- **Enter:** Executes selected command
- **Escape:** Closes palette

## Test Hooks
- `data-testid="command-palette"` on main container
- `data-testid="command-input"` on search field
- `data-testid="command-result-{idx}"` on results
- `data-testid="command-selected"` on highlighted result
