# CommandCenter Behavioral Contract

## Identity
**Component Name:** CommandCenter
**File Path:** packages/app/src/components/CosmicMap/CommandCenter.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Bottom bar UI element within CosmicMap. Appears as a horizontal control panel at the base of the cosmic visualization when COMMAND_CENTER_ENABLED feature flag is true.

## Lifecycle
- **Mount:** Initializes with health status tracking
- **Update:** Re-renders when chain status or health metrics change
- **Unmount:** Cleans up status subscriptions

## Props Contract
```typescript
interface CommandCenterProps {
  /** Callback when user executes a command */
  onCommand: (command: string) => void;
  /** Whether to show health status indicators */
  showHealthStatus?: boolean;
}
```

## State Ownership
- **Active commands:** Current command queue state
- **Chain status:** Summary of active/completed chains
- **Health metrics:** Aggregated universe health

## Interactions
- **Command input:** User types command and executes
- **Command button:** Predefined command shortcuts
- **Status click:** May open detailed status panel

## Test Hooks
- `data-testid="command-center"` on main container
- `data-testid="command-input"` on input field
- `data-testid="health-status"` on health indicator
- `data-testid="command-button-{cmd}"` on command buttons
