# OrchestratorButton Behavioral Contract

## Identity
**Component Name:** OrchestratorButton
**File Path:** packages/app/src/components/OrchestratorButton/OrchestratorButton.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Wrapper component that can be placed around any element to add orchestrator chat capability. Renders a pulsing badge indicator on wrapped children showing the element is orchestrator-enabled.

## Lifecycle
- **Mount:** Initializes click handler for opening orchestrator chat
- **Update:** Re-renders when children or props change
- **Unmount:** Cleans up

## Props Contract
```typescript
interface OrchestratorButtonProps {
  /** The element(s) to wrap with the orchestrator badge */
  children: React.ReactNode;
  /** Source identifier for the orchestrator chat (e.g., "harmony-recheck") */
  source: string;
  /** Additional context passed to openChat */
  context?: Record<string, unknown>;
  /** Accessibility label for the indicator badge */
  label?: string;
  /** Whether to show the visual indicator badge (default true) */
  showIndicator?: boolean;
  /** Additional CSS classes applied to the wrapper */
  className?: string;
  /** Optional callback invoked before opening chat */
  onClick?: () => void;
}
```

## State Ownership
- **No internal state:** Delegates to ChatWindowContext

## Interactions
- **Click:** Opens orchestrator chat with source and context
- **Keyboard (Enter/Space):** Opens orchestrator chat
- **Hover:** Shows tooltip explaining orchestrator feature

## Test Hooks
- `data-testid="orchestrator-button"` on wrapper
- `data-testid="orchestrator-indicator"` on badge
- `aria-label` includes source identifier
