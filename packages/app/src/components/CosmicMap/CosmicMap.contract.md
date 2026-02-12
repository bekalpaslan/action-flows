# CosmicMap Behavioral Contract

## Identity
**Component Name:** CosmicMap
**File Path:** packages/app/src/components/CosmicMap/CosmicMap.tsx
**Type:** Container
**Last Updated:** 2026-02-12

## Render Location
Full-screen ReactFlow visualization container. Renders as the primary view in the Living Universe dashboard. Appears below the app header and sidebar, occupying remaining viewport space.

## Lifecycle
- **Mount:** Initializes ReactFlow provider, checks localStorage for Big Bang animation state, subscribes to WebSocket events
- **Update:** Re-renders when universe context changes, nodes/edges update, or zoom target changes
- **Unmount:** Cleans up WebSocket subscriptions, event listeners, animation frame references

## Props Contract
```typescript
interface CosmicMapProps {
  /** Whether cosmic map should be visible (opacity 1) */
  visible?: boolean;
  /** Whether cosmic map is in zooming transition (triggers fade-out) */
  zooming?: boolean;
}
```

## State Ownership
- **Universe data:** From UniverseContext (read-only)
- **Node/edge state:** ReactFlow's useNodesState/useEdgesState hooks
- **Active sparks:** Map<ChainId, SparkState> tracking concurrent spark animations (max 5)
- **Big Bang animation:** Boolean flag from localStorage
- **Initial fit view:** Boolean to ensure single initial fit
- **Glow states:** Managed by individual RegionStar child components

## Interactions
- **Click on region star:** Calls navigateToRegion if accessible
- **Escape key:** Triggers fitView return to god view
- **"God View" button:** Manually returns to full universe view with pan/zoom animation (300ms)
- **WebSocket events:** Subscribes to spark:traveling events for animation
- **Feature flags:** COMMAND_CENTER_ENABLED, SPARK_ANIMATION_ENABLED

## Test Hooks
- `data-testid="cosmic-map"` on main container
- `data-testid="cosmic-map-loading"` on loading state
- `data-testid="cosmic-map-error"` on error state
- `data-testid="cosmic-map-empty"` on empty state
- `data-testid="god-view-button"` on return button
- `data-testid="command-center"` on CommandCenter child
