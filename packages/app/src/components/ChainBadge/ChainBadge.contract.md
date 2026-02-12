# ChainBadge Behavioral Contract

## Identity
**Component Name:** ChainBadge
**File Path:** packages/app/src/components/ChainBadge/ChainBadge.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Small badge/chip component showing chain ID and status. Appears in headers, lists, and status indicators throughout the dashboard.

## Lifecycle
- **Mount:** Initializes status subscription
- **Update:** Re-renders when status changes
- **Unmount:** Cleans up

## Props Contract
```typescript
interface ChainBadgeProps {
  chainId: ChainId;
  /** Display variant: compact or full */
  variant?: 'compact' | 'full';
  /** Whether badge is clickable */
  onClick?: () => void;
  /** Custom color override */
  color?: string;
}
```

## State Ownership
- **Chain status:** Current execution status
- **Hover state:** Whether badge is hovered
- **Truncated ID:** Display-friendly chain ID format

## Interactions
- **Click:** Calls onClick callback if provided
- **Hover:** Shows full chain ID tooltip

## Test Hooks
- `data-testid="chain-badge-{chainId}"` on badge
- `data-testid="chain-status-{status}"` on status indicator
