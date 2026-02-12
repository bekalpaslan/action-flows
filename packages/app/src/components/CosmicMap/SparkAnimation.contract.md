# SparkAnimation Behavioral Contract

## Identity
**Component Name:** SparkAnimation
**File Path:** packages/app/src/components/CosmicMap/SparkAnimation.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Rendered as SVG element within CosmicMap's spark layer overlay. Appears as animated particle/spark traveling along a light bridge edge path.

## Lifecycle
- **Mount:** Starts spark animation along edge path
- **Update:** Updates progress as spark moves
- **Unmount:** Calls onComplete callback to clean up

## Props Contract
```typescript
interface SparkAnimationProps {
  chainId: ChainId;
  fromRegion: RegionId;
  toRegion: RegionId;
  progress: number; // 0.0 to 1.0
  edgePath: string; // SVG path string
  onComplete: () => void;
}
```

## State Ownership
- **Animation progress:** Tracked via props and animation frame
- **Spark position:** Computed from progress along edgePath

## Interactions
- **No user interactions:** Pure animation
- **Completion:** Calls onComplete callback when progress reaches 1.0

## Test Hooks
- `data-testid="spark-animation-{chainId}"` on main group
- `data-testid="spark-particle-{chainId}"` on spark element
