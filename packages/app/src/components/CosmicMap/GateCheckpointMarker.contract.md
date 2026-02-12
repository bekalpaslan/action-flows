# GateCheckpointMarker Behavioral Contract

## Identity
**Component Name:** GateCheckpointMarker
**File Path:** packages/app/src/components/CosmicMap/GateCheckpointMarker.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Rendered via EdgeLabelRenderer in LightBridgeEdge at the calculated midpoint of the edge. Appears as a small icon/circle on light bridges when gates exist.

## Lifecycle
- **Mount:** Positions at edge midpoint, initializes gate status
- **Update:** Re-renders when gate status changes
- **Unmount:** Cleans up resources

## Props Contract
```typescript
interface GateCheckpointMarkerProps {
  gates: GateCheckpoint[];
  x: number;
  y: number;
  status: GateStatus;
}

export type GateStatus = 'pending' | 'passed' | 'failed';
```

## State Ownership
- **Current status:** From props, no internal state
- **Visual animation:** May have pulsing/spinning based on status

## Interactions
- **Hover:** Displays gate list/details tooltip
- **Click:** May open expanded gate view dialog

## Test Hooks
- `data-testid="gate-marker"` on main marker
- `data-testid="gate-marker-status-{status}"` including status class
