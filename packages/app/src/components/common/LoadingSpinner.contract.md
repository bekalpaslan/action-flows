# LoadingSpinner Behavioral Contract

## Identity
**Component Name:** LoadingSpinner
**File Path:** packages/app/src/components/common/LoadingSpinner.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Reusable loading indicator component. Appears in Suspense boundaries, data loading states, and async operations throughout the application.

## Lifecycle
- **Mount:** Starts loading animation via CSS or requestAnimationFrame
- **Update:** Re-renders on prop changes
- **Unmount:** Stops animation

## Props Contract
```typescript
interface LoadingSpinnerProps {
  /** Optional message to display below spinner */
  message?: string;
  /** Size of spinner: small (16px), medium (32px), large (64px) */
  size?: 'small' | 'medium' | 'large';
  /** Custom color for spinner */
  color?: string;
}
```

## State Ownership
- **Animation frame:** Current animation frame ID
- **Rotation angle:** Current spinner rotation (if JS-animated)

## Interactions
- **No user interactions:** Pure presentation

## Test Hooks
- `data-testid="loading-spinner"` on main container
- `data-testid="loading-message"` on message text (if present)
