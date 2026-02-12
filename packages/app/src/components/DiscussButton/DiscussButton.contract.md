# DiscussButton Behavioral Contract

## Identity
**Component Name:** DiscussButton
**File Path:** packages/app/src/components/DiscussButton/DiscussButton.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Compact button component that can be placed anywhere to open component-specific discussion. Appears as full button with label (medium) or icon-only (small).

## Lifecycle
- **Mount:** Initializes click handler for discussion context
- **Update:** Re-renders when disabled prop or componentName changes
- **Unmount:** Cleans up

## Props Contract
```typescript
interface DiscussButtonProps {
  /** Name of the component this button refers to */
  componentName: string;
  /** Callback when button is clicked */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size variant: medium (default) shows label, small shows icon only */
  size?: 'small' | 'medium';
  /** Additional CSS classes */
  className?: string;
}
```

## State Ownership
- **No internal state:** Delegates to ChatWindowContext and DiscussContext

## Interactions
- **Click:** Opens sliding chat window with component discussion context
- **Keyboard (Space/Enter):** Activates button
- **Hover:** Shows tooltip (small size) or label (medium size)
- **Disabled state:** Button is non-interactive

## Test Hooks
- `data-testid="discuss-button"` on button element
- `data-testid="discuss-button-small"` when size="small"
- `data-testid="discuss-button-{componentName}"` on button
- `aria-label` includes component name
