# ChainDAG Behavioral Contract

## Identity
**Component Name:** ChainDAG
**File Path:** packages/app/src/components/ChainDAG/ChainDAG.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Directed acyclic graph visualization of chain execution flow. Displays as node-link diagram showing chain dependencies and execution relationships.

## Lifecycle
- **Mount:** Initializes ReactFlow, loads chain graph data
- **Update:** Re-renders when chain structure changes
- **Unmount:** Cleans up ReactFlow instance

## Props Contract
```typescript
interface ChainDAGProps {
  chainId: ChainId;
  /** Whether to enable interactive features */
  interactive?: boolean;
  /** Callback when node is selected */
  onNodeSelect?: (stepId: StepId) => void;
}
```

## State Ownership
- **ReactFlow nodes:** Current node layout
- **ReactFlow edges:** Edge connections
- **Selected node:** Currently highlighted step
- **View state:** Current viewport/zoom

## Interactions
- **Click node:** Selects step and calls onNodeSelect
- **Pan/zoom:** Interactive navigation through graph
- **Hover node:** Shows node details tooltip

## Test Hooks
- `data-testid="chain-dag"` on main container
- `data-testid="dag-node-{stepId}"` on step nodes
- `data-testid="dag-edge-{source}-{target}"` on edges
