# ChainLiveMonitor Behavioral Contract

## Identity
**Component Name:** ChainLiveMonitor
**File Path:** packages/app/src/components/ChainLiveMonitor.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Real-time chain execution monitoring display. Appears as overlay or sidebar panel showing active chain execution status, step progress, and event timeline.

## Lifecycle
- **Mount:** Subscribes to chain/step WebSocket events
- **Update:** Re-renders on event updates, progress changes
- **Unmount:** Unsubscribes from WebSocket events

## Props Contract
```typescript
interface ChainLiveMonitorProps {
  chainId?: ChainId;
  /** Whether to show only current chain or all active chains */
  showAll?: boolean;
}
```

## State Ownership
- **Active chains:** Array of currently executing chains
- **Step progress:** Progress for each active step
- **Event log:** Timeline of recent events
- **Expanded chain:** Which chain details are expanded
- **Auto-scroll:** Whether to auto-scroll event log

## Interactions
- **Click step:** May expand step details
- **Click event:** Shows event details
- **Resume/pause:** Control chain execution
- **Auto-scroll toggle:** Enables/disables auto-scroll

## Test Hooks
- `data-testid="chain-live-monitor"` on main container
- `data-testid="active-chain-{chainId}"` on chain item
- `data-testid="step-progress-{stepId}"` on step progress
- `data-testid="event-log"` on event list
