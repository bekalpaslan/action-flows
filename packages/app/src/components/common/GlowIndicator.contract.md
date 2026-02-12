# GlowIndicator Behavioral Contract

## Identity
**Component Name:** GlowIndicator
**File Path:** packages/app/src/components/common/GlowIndicator.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Visual indicator component showing status via glow/color. Used throughout dashboard to indicate active, waiting, or error states.

## Lifecycle
- **Mount:** Initializes glow state and animation
- **Update:** Re-renders when status prop changes
- **Unmount:** Cleans up animation

## Props Contract
```typescript
interface GlowIndicatorProps {
  /** Current status to display */
  status: 'idle' | 'active' | 'waiting' | 'error' | 'success';
  /** Size of indicator */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show pulsing animation */
  animated?: boolean;
  /** Optional label text */
  label?: string;
}
```

## State Ownership
- **Animation state:** Current animation frame
- **Glow intensity:** Current glow level

## Interactions
- **Hover:** May show tooltip with status explanation

## Test Hooks
- `data-testid="glow-indicator"` on main element
- `data-testid="glow-status-{status}"` on element with status
- `data-testid="glow-label"` on label text
