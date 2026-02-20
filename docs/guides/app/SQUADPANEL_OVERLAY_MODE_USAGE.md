# SquadPanel Overlay Mode

## Overview

The SquadPanel component now supports an `overlay` placement mode, designed for use in visualization contexts like HybridFlowViz. In overlay mode, the panel displays as a compact, floating cluster of agents positioned in a corner of the parent container.

## Features

- **Semi-transparent background** with glassmorphism effect
- **Absolute positioning** within parent container
- **Smaller avatar sizes** for compact display
- **Enhanced glow effects** on avatars for visibility
- **Configurable position** (4 corner options)
- **Adjustable opacity** (0-1 range)
- **Responsive sizing** for different screen sizes

## Usage

### Basic Example

```tsx
import { SquadPanel } from './components/SquadPanel/SquadPanel';

function HybridFlowViz() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Main visualization content */}
      <ReactFlowComponent />

      {/* Floating agent squad overlay */}
      <SquadPanel
        sessionId={sessionId}
        placement="overlay"
        overlayPosition="bottom-right"
        overlayOpacity={0.9}
        onAgentClick={handleAgentClick}
      />
    </div>
  );
}
```

### Props for Overlay Mode

```typescript
interface SquadPanelProps {
  // Required
  sessionId: SessionId | null;

  // Overlay mode
  placement?: 'left' | 'right' | 'bottom' | 'overlay';

  // Overlay-specific props (only apply when placement='overlay')
  overlayPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  overlayOpacity?: number; // 0-1, default 0.9

  // Common props
  className?: string;
  onAgentClick?: (agentId: string) => void;
  audioEnabled?: boolean;
}
```

### Position Options

- `'top-left'` - Overlay in top-left corner
- `'top-right'` - Overlay in top-right corner
- `'bottom-left'` - Overlay in bottom-left corner
- `'bottom-right'` - Overlay in bottom-right corner (default)

### Opacity Control

The `overlayOpacity` prop controls the background transparency:

- `1.0` - Fully opaque (solid background)
- `0.9` - Default (semi-transparent)
- `0.7` - More transparent
- `0.5` - Highly transparent

## Visual Characteristics

### Overlay Mode vs. Standard Modes

| Feature | Standard Modes | Overlay Mode |
|---------|---------------|--------------|
| Position | Relative | Absolute |
| Background | Transparent | Semi-transparent with blur |
| Avatar Size | 140-220px | 70-130px |
| Layout | Row/Column | Compact cluster |
| Border | None | Subtle white border |
| Shadow | Minimal | Enhanced glow |

### Sizing by Screen Width

- **Desktop (≥1024px)**: Orchestrator 130px, Subagents 110px
- **Tablet (640-1023px)**: Orchestrator 110px, Subagents 90px
- **Mobile (<640px)**: Orchestrator 90px, Subagents 70px

## Parent Container Requirements

For overlay mode to work correctly, the parent container must:

1. Have `position: relative` or `position: absolute`
2. Have defined dimensions (width and height)
3. Create a stacking context for the overlay

```tsx
// Good parent setup
<div style={{ position: 'relative', width: '100%', height: '100vh' }}>
  <SquadPanel placement="overlay" />
</div>

// Bad parent setup (no positioning context)
<div>
  <SquadPanel placement="overlay" />
</div>
```

## Accessibility

- Reduced motion support (no transforms/blur when `prefers-reduced-motion` is set)
- Proper ARIA labels maintained
- Keyboard navigation supported
- Log panels remain accessible when expanded

## Demo

Run the demo to test all placement modes including overlay:

```tsx
import { SquadPanelDemo } from './components/SquadPanel/SquadPanelDemo';

function TestPage() {
  return <SquadPanelDemo mode="demo" />;
}
```

The demo includes controls for:
- Placement mode selection (including overlay)
- Overlay position adjustment
- Opacity slider
- Audio toggle

## Notes

- Overlay mode maintains all existing functionality (hover, click, expand)
- Log panels adapt to screen size in overlay mode
- On mobile, expanded log panels become full-width at bottom
- Existing placement modes (`left`, `right`, `bottom`) are unchanged
