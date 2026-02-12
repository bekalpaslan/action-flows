# BigBangAnimation Behavioral Contract

## Identity
**Component Name:** BigBangAnimation
**File Path:** packages/app/src/components/CosmicMap/BigBangAnimation.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Full-screen animation overlay shown once on first app visit. Renders above CosmicBackground, displayed before main cosmic map becomes visible. Animates expansion of universe from singularity.

## Lifecycle
- **Mount:** Starts animation sequence (particles expand outward)
- **Animation complete:** Calls onComplete callback after duration (typically 3-5 seconds)
- **Unmount:** Cleans up animation timers

## Props Contract
```typescript
interface BigBangAnimationProps {
  /** Called when animation sequence completes */
  onComplete: () => void;
}
```

## State Ownership
- **Animation progress:** Tracked internally via requestAnimationFrame or CSS animation
- **Particle positions:** Computed during animation loop

## Interactions
- **No user interactions:** Pure animation presentation
- **Completion:** Triggers onComplete callback to hide animation and show map

## Test Hooks
- `data-testid="big-bang-animation"` on animation container
- `data-testid="big-bang-complete"` fired when onComplete called
