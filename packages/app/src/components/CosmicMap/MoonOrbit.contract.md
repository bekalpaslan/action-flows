# MoonOrbit Behavioral Contract

## Identity
**Component Name:** MoonOrbit
**File Path:** packages/app/src/components/CosmicMap/MoonOrbit.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Orbital animation rendered around RegionStar nodes. Appears as rotating moon/satellite orbiting a region star when region is in specific states.

## Lifecycle
- **Mount:** Starts orbital animation via CSS animation
- **Update:** Resets animation if period changes
- **Unmount:** Stops animation

## Props Contract
```typescript
interface MoonOrbitProps {
  regionId: RegionId;
  orbitPeriod?: number; // milliseconds
  size?: number;
}
```

## State Ownership
- **No internal state:** Uses CSS animation
- **Orbit progress:** Maintained by CSS keyframes

## Interactions
- **No user interactions:** Pure animation

## Test Hooks
- `data-testid="moon-orbit-{regionId}"` on main element
