# TraceRenderer Behavioral Contract

## Identity
**Component Name:** TraceRenderer
**File Path:** packages/app/src/components/CosmicMap/TraceRenderer.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
SVG element rendered on LightBridgeEdge to show traversal traces. Appears as visual representation of chain execution traces flowing along light bridges.

## Lifecycle
- **Mount:** Initializes trace visualization
- **Update:** Re-renders as traces update from props
- **Unmount:** Cleans up

## Props Contract
```typescript
interface TraceRendererProps {
  bridge: LightBridge;
  edgePath: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}
```

## State Ownership
- **No internal state:** Renders from props only
- **Trace positions:** Computed from bridge traversal history

## Interactions
- **No user interactions:** Pure visualization

## Test Hooks
- `data-testid="trace-renderer"` on main group
