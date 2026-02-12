# GateCheckpoint Behavioral Contract

## Identity
**Component Name:** GateCheckpoint
**File Path:** packages/app/src/components/CosmicMap/GateCheckpoint.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Visual checkpoint marker rendered on LightBridgeEdge paths. Appears at gate positions along light bridges to indicate decision points or validation checkpoints.

## Lifecycle
- **Mount:** Initializes gate state from props
- **Update:** Re-renders when gate status changes
- **Unmount:** Cleans up state subscriptions

## Props Contract
```typescript
interface GateCheckpointProps {
  gateId: string;
  label?: string;
  position: { x: number; y: number };
  status: 'pending' | 'passed' | 'failed' | 'blocked';
}
```

## State Ownership
- **Gate status:** Current state (pending/passed/failed/blocked)
- **Animation state:** Pulsing or completion animation

## Interactions
- **Click:** May open gate details dialog (if interactive)
- **Hover:** Shows gate information tooltip

## Test Hooks
- `data-testid="gate-checkpoint-{gateId}"` on main element
- `data-testid="gate-status-{gateId}"` on status indicator
