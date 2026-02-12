# ControlButtons Behavioral Contract

## Identity
**Component Name:** ControlButtons
**File Path:** packages/app/src/components/ControlButtons/ControlButtons.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Button group for controlling chain execution. Typically appears in top bar or control panel showing pause/resume/cancel/retry/skip buttons.

## Lifecycle
- **Mount:** Subscribes to chain execution state
- **Update:** Updates button availability based on chain state
- **Unmount:** Cleans up subscriptions

## Props Contract
```typescript
interface ControlButtonsProps {
  chainId: ChainId;
  /** Whether buttons are enabled */
  enabled?: boolean;
  /** Called when pause button clicked */
  onPause?: () => void;
  /** Called when resume button clicked */
  onResume?: () => void;
  /** Called when cancel button clicked */
  onCancel?: () => void;
}
```

## State Ownership
- **Chain state:** Current execution state from context
- **Button states:** Which buttons are enabled/disabled
- **Loading state:** Whether operation is in progress

## Interactions
- **Pause button:** Pauses chain execution
- **Resume button:** Resumes paused chain
- **Cancel button:** Cancels execution with confirmation
- **Retry button:** Retries failed step
- **Skip button:** Skips current step

## Test Hooks
- `data-testid="control-buttons"` on container
- `data-testid="pause-button"` on pause button
- `data-testid="resume-button"` on resume button
- `data-testid="cancel-button"` on cancel button
