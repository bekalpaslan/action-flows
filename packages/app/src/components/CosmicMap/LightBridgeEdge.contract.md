# LightBridgeEdge Behavioral Contract

## Identity
**Component Name:** LightBridgeEdge
**File Path:** packages/app/src/components/CosmicMap/LightBridgeEdge.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Custom ReactFlow edge rendered between RegionStar nodes. Represents light bridges (connections) between universe regions. Rendered as smooth step paths with optional gate checkpoints and spark animations.

## Lifecycle
- **Mount:** Fetches initial bridge strength from backend API, initializes gate state
- **Update:** Re-renders when strength or gate status changes
- **Unmount:** Cleans up fetch requests and event subscriptions

## Props Contract
```typescript
interface LightBridgeData {
  edgeId: EdgeId;
  gates: GateCheckpoint[];
  strength: number;
  activeSparkChainId?: ChainId;
  traversalCount: number;
  bridge?: LightBridge; // Full bridge data for trace rendering
}

// Inherited from EdgeProps<LightBridgeData>:
id: string;
sourceX: number;
sourceY: number;
targetX: number;
targetY: number;
sourcePosition: Position;
targetPosition: Position;
style?: CSSProperties;
markerEnd?: string;
source: string; // source regionId
target: string; // target regionId
```

## State Ownership
- **gateStatus:** 'pending' | 'passed' | 'failed' for gate state visualization
- **gatePassCount:** Counter of successful gate traversals
- **gateFailCount:** Counter of failed gate traversals
- **strength:** Numeric value (0.3-1.0) for edge thickness visualization

## Interactions
- **Spark animation:** Renders active spark when activeSparkChainId is set
- **Gate checkpoints:** Renders GateCheckpointMarker at edge midpoint if gates exist
- **Brightness:** Edge brightness increases with traversal strength

## Test Hooks
- `data-testid="light-bridge-{edgeId}"` on main edge path
- `data-testid="light-bridge-gate-{edgeId}"` on gate marker
- `data-testid="light-bridge-trace-{edgeId}"` on trace renderer if active
