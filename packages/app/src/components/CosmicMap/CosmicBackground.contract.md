# CosmicBackground Behavioral Contract

## Identity
**Component Name:** CosmicBackground
**File Path:** packages/app/src/components/CosmicMap/CosmicBackground.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Full-screen canvas background rendered behind CosmicMap. Appears as the void/space backdrop for the universe visualization. Positioned absolutely or as first child in cosmic map container.

## Lifecycle
- **Mount:** Initializes HTML5 canvas, draws background with seeded random nebula
- **Update:** Redraws on dimension change (width/height props) or animation frame if enabled
- **Unmount:** Cancels animation frame request

## Props Contract
```typescript
interface CosmicBackgroundProps {
  width: number;
  height: number;
  /** Seed for deterministic nebula generation (e.g., sessionId) */
  seed?: string;
  /** Enable subtle twinkle animation */
  enableAnimation?: boolean;
}
```

## State Ownership
- **canvasRef:** Reference to HTML5 canvas element
- **animationFrameRef:** Current animation frame ID for cleanup
- **Canvas context:** 2D rendering context maintained across redraws

## Interactions
- **No user interactions:** Pure presentation component
- **Animation:** If enableAnimation=true, runs twinkle animation via requestAnimationFrame

## Test Hooks
- `data-testid="cosmic-background"` on canvas element
- Canvas width/height attributes reflect props
