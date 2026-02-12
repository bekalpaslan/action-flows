# RegionStar Behavioral Contract

## Identity
**Component Name:** RegionStar
**File Path:** packages/app/src/components/CosmicMap/RegionStar.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Custom ReactFlow node rendered within CosmicMap. Appears as glowing star icons at computed positions on the cosmic visualization. Each region in the universe becomes one RegionStar node.

## Lifecycle
- **Mount:** Initializes fog state ref, sets up WebSocket event subscription for step events
- **Update:** Re-renders when data (fogState, status, glowIntensity, health) changes; triggers fog reveal animation
- **Unmount:** Cleans up WebSocket subscription and auto-revert timers

## Props Contract
```typescript
interface RegionStarData {
  regionId: RegionId;
  workbenchId: WorkbenchId;
  label: string;
  layer: 'platform' | 'template' | 'philosophy' | 'physics' | 'experience';
  fogState: FogState;
  glowIntensity: number;
  status: 'idle' | 'active' | 'waiting' | 'undiscovered';
  colorShift: ColorShift;
  health: HealthMetrics;
}

// Inherited from NodeProps<RegionStarData>:
selected?: boolean;
```

## State Ownership
- **isRevealing:** Tracks fog reveal animation (1500ms duration)
- **glowState:** 'idle' | 'active' | 'waiting' for region glow visualization
- **showBurst:** Completion burst animation flag (1000ms duration)
- **prevFogStateRef:** Tracks previous fog state to detect HIDDEN→REVEALED transitions
- **autoRevertTimerRef:** Stores timeout ID for auto-revert glow to idle (3000ms)

## Interactions
- **Click:** Calls navigateToRegion if region is accessible (fogState === REVEALED)
- **Keyboard:** Enter/Space triggers same as click if tabIndex=0
- **Hover:** Shows cursor pointer if clickable, not-allowed if locked
- **WebSocket events:** Listens for step:started/step:completed to update glow state

## Test Hooks
- `data-testid="region-star-{regionId}"` on main container
- `data-testid="region-star-label-{regionId}"` on label span
- `data-testid="region-star-status-{regionId}"` on status indicator
- `data-testid="region-star-health-{regionId}"` on health bar
- `aria-label` includes regionId, status, and fog state
