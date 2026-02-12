# SparkParticle Behavioral Contract

## Identity
**Component Name:** SparkParticle
**File Path:** packages/app/src/components/CosmicMap/SparkParticle.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Individual SVG element rendered within SparkAnimation. Appears as a single glowing particle within the spark group.

## Lifecycle
- **Mount:** Initializes particle rendering at starting position
- **Update:** Re-renders as position/opacity changes
- **Unmount:** Cleans up

## Props Contract
```typescript
interface SparkParticleProps {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color?: string;
}
```

## State Ownership
- **No internal state:** Pure presentation component
- **Position/opacity:** From props only

## Interactions
- **No user interactions:** Pure animation element

## Test Hooks
- `data-testid="spark-particle"` on SVG circle element
