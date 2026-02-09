# SessionTile Components

Components for displaying session information in a tile format.

## Components

### SessionDetailsPanel

Displays session metadata and status in the left panel of a SessionTile.

**Features:**
- Session ID with copy-to-clipboard functionality
- Status badge with color-coded indicators
- Working directory (truncated for space)
- Relative timestamps ("5m ago", "2h ago")
- Duration display (for completed sessions or running time)
- Chain count and active chain information
- Compact mode for smaller tiles

**Props:**

```typescript
interface SessionDetailsPanelProps {
  /** Session data to display */
  session: Session;
  /** Enable compact layout for smaller tiles */
  compact?: boolean;
}
```

**Usage:**

```tsx
import { SessionDetailsPanel } from './components/SessionTile';

function MySessionTile({ session }) {
  return (
    <div className="session-tile">
      {/* Left panel - 25% width */}
      <SessionDetailsPanel session={session} />

      {/* Right content - 75% width */}
      <div className="session-content">
        {/* Chain visualizations, logs, etc. */}
      </div>
    </div>
  );
}
```

**Compact Mode:**

```tsx
<SessionDetailsPanel session={session} compact={true} />
```

Compact mode:
- Reduces padding and font sizes
- Hides some secondary information (platform, hostname)
- Truncates paths more aggressively
- Ideal for grid views with many sessions

**Styling:**

The component uses CSS custom properties and follows the dark theme of the ActionFlows Dashboard:
- Background: `#1e1e1e`
- Section dividers: `#2a2a2a`
- Status colors: Green (active), Gray (completed), Red (failed), Yellow (paused)

Light mode is also supported via `prefers-color-scheme: light`.

## Status Badge Colors

| Status | Color | Meaning |
|--------|-------|---------|
| `in_progress` / `active` | Green | Currently executing |
| `completed` | Gray | Successfully completed |
| `failed` / `error` | Red | Execution failed |
| `paused` | Yellow | Temporarily paused |

## Icon Usage

All icons are inline SVG for better performance and styling control. Icons are from Bootstrap Icons set.

## Accessibility

- Proper ARIA labels for screen readers
- Keyboard-accessible copy button
- Sufficient color contrast ratios
- Semantic HTML structure
