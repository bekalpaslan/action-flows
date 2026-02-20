# CommandCenter Component

**Living Universe Phase 2: Command Center**

Bottom bar component for the Living Universe visualization that provides primary user controls for navigating and interacting with the cosmic map.

---

## Overview

The CommandCenter is a fixed bottom bar positioned over the CosmicMap that provides three main interface elements:

1. **Command Input Field** - Left side input for orchestrator commands
2. **Session Selector** - Middle dropdown for switching between active sessions
3. **Health Status** - Right side indicator showing overall universe health

---

## Architecture

### File Structure

```
packages/app/src/components/CosmicMap/
├── CommandCenter.tsx       # Main component
├── CommandCenter.css       # Styling
├── CosmicMap.tsx          # Parent component (integrated)
├── CosmicMap.css          # Updated for spacing
└── index.ts               # Exports
```

### Integration Points

#### SessionContext
- Reads `sessions`, `activeSessionId` from SessionContext
- Calls `setActiveSession()` when user switches sessions
- Displays session metadata (ID, timestamp, status)

#### UniverseContext
- Reads `universe` to calculate health metrics
- Can be extended to send commands via universe methods

#### CosmicMap Parent
- Receives `onCommand` callback when user submits a command
- Positioned absolutely at bottom of CosmicMap container
- Respects z-index layering (above map, below modals)

---

## Component Props

```typescript
interface CommandCenterProps {
  /** Callback when user submits a command */
  onCommand?: (command: string) => void;

  /** Show health status indicator (default: true) */
  showHealthStatus?: boolean;
}
```

---

## Features

### 1. Command Input Field

**Purpose:** Allow users to enter orchestrator commands directly from the Living Universe view.

**Behavior:**
- Text input with placeholder "Enter orchestrator command..."
- Submit button (disabled when input is empty)
- Submit on Enter key or button click
- Auto-clears input after submission
- Calls `onCommand` prop with trimmed command string

**Styling:**
- Uses cosmic design tokens (`--input-bg-default`, `--cosmic-star-idle`)
- Glows on focus (blue accent)
- Smooth transitions on hover/focus

**Future Integration:**
- Commands will be sent to backend orchestrator API
- Response handling and feedback UI
- Command history and autocomplete

### 2. Session Selector

**Purpose:** Switch between active sessions without leaving the Living Universe view.

**Behavior:**
- Dropdown trigger button shows current session (ID + timestamp) or "No Session"
- Click to open dropdown menu (slides up from bottom)
- Lists all available sessions from SessionContext
- Each session shows:
  - Truncated ID + timestamp
  - Status badge (in_progress/completed/failed)
  - Checkmark if selected
- Click session to switch (calls `setActiveSession`)
- Closes on selection, outside click, or Escape key

**Styling:**
- Cosmic-themed dropdown with panel glow
- Status badges color-coded (green/gray/red)
- Smooth slide-up animation
- Custom scrollbar for long session lists

**Session Label Format:**
```typescript
formatSessionLabel(session: Session): string
// Returns: "abc12345... • 3:45 PM"
```

### 3. Health Status Indicator

**Purpose:** Display overall universe health at a glance.

**Behavior:**
- Calculates average health across all regions
- Displays percentage (0-100%)
- Color-coded based on health level:
  - **High (≥80%)**: Green (`--cosmic-health-high`)
  - **Medium (40-79%)**: Yellow (`--cosmic-health-medium`)
  - **Low (<40%)**: Red (`--cosmic-health-low`)
- Shows tooltip with "Universe health: X%" on hover

**Calculation:**
```typescript
calculateUniverseHealth(): number {
  // Averages region.health values
  // Returns 100 if no health data available
}
```

**Future Integration:**
- Click to open health detail panel
- Link to health metrics dashboard
- Historical health trends

---

## Styling

### Design Tokens Used

**Backgrounds:**
- `--panel-bg-elevated` - Command Center background
- `--panel-bg-raised` - Session button, health indicator
- `--input-bg-default` - Input field background

**Borders:**
- `--panel-border-default` - Default borders
- `--input-border-focus` - Input focus border

**Effects:**
- `--panel-glow-default` - Standard glow on hover
- `--panel-glow-focus` - Input focus glow
- `--panel-glow-accent` - Dropdown glow

**Colors:**
- `--cosmic-star-idle` - Icon colors
- `--system-blue` - Focus states
- `--cosmic-health-*` - Health status colors

### Responsive Behavior

**Desktop (>768px):**
- Single row layout
- Command input flexes to fill available space
- Session selector and health fixed width

**Mobile (≤768px):**
- Wraps to two rows
- Command input takes full width (row 1)
- Session selector and health share row 2

---

## Accessibility

### ARIA Labels

```html
<div role="region" aria-label="Command Center">
  <input aria-label="Orchestrator command input" />
  <button aria-label="Select session" aria-haspopup="listbox" aria-expanded="..." />
  <div role="listbox" aria-label="Available sessions">
    <button role="option" aria-selected="..." />
  </div>
  <div aria-label="Universe health: 85%" />
</div>
```

### Keyboard Navigation

- **Enter** in command input → Submit command
- **Tab** → Move between command input, session selector, health indicator
- **Space/Enter** on session selector → Open dropdown
- **ArrowUp/ArrowDown** in dropdown → Navigate sessions
- **Enter/Space** on session option → Select session
- **Escape** → Close dropdown

---

## Integration with CosmicMap

### CosmicMap.tsx Changes

**Imports:**
```typescript
import { CommandCenter } from './CommandCenter';
```

**Command Handler:**
```typescript
const handleCommand = useCallback((command: string) => {
  console.log('[CosmicMap] Command received:', command);
  // TODO: Integrate with orchestrator backend
}, []);
```

**Render:**
```tsx
<CommandCenter
  onCommand={handleCommand}
  showHealthStatus={true}
/>
```

### CosmicMap.css Changes

**Controls Repositioned:**
```css
.cosmic-map__controls {
  bottom: 80px; /* Was 20px */
}

.cosmic-map__minimap {
  bottom: 80px; /* Was 20px */
}
```

This ensures the ReactFlow Controls and MiniMap don't overlap with the CommandCenter bar.

---

## Future Enhancements

### Phase 3 Candidates

1. **Command Autocomplete**
   - Suggest commands as user types
   - Show command history
   - Context-aware suggestions based on current region

2. **Health Detail Panel**
   - Click health indicator to open modal
   - Region-by-region health breakdown
   - Historical health charts
   - Health trend analysis

3. **Command Execution Feedback**
   - Loading spinner during command execution
   - Success/error toast notifications
   - Command result display

4. **Multi-Session Actions**
   - Bulk session operations (delete, archive)
   - Session search/filter
   - Session creation from CommandCenter

5. **Orchestrator Integration**
   - POST /api/universe/command endpoint
   - WebSocket command streaming
   - Real-time command status updates

---

## Testing Checklist

- [ ] Command input accepts text and submits on Enter
- [ ] Submit button disabled when input empty
- [ ] Command callback receives trimmed input
- [ ] Input clears after submission
- [ ] Session dropdown opens/closes correctly
- [ ] Session list displays all sessions
- [ ] Active session highlighted with checkmark
- [ ] Session switch updates SessionContext
- [ ] Dropdown closes on outside click
- [ ] Dropdown closes on Escape key
- [ ] Health indicator shows correct percentage
- [ ] Health color matches threshold (high/medium/low)
- [ ] Health tooltip displays on hover
- [ ] Component respects responsive breakpoints
- [ ] Keyboard navigation works correctly
- [ ] ARIA labels present and accurate

---

## Dependencies

**Runtime:**
- React 18.2
- @afw/shared (types: Session, SessionId)
- SessionContext
- UniverseContext

**Styling:**
- cosmic-tokens.css (cosmic design tokens)
- design-tokens.css (base design tokens)

**No external UI libraries** - Pure React + CSS implementation.

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| CommandCenter.tsx | 345 | Main component implementation |
| CommandCenter.css | 428 | Component styles |
| index.ts | 14 | Export barrel |
| COMMAND_CENTER.md | This file | Documentation |

**Modified Files:**
- CosmicMap.tsx (+10 lines) - Import and integrate CommandCenter
- CosmicMap.css (+2 lines) - Reposition controls/minimap

---

## Design Rationale

### Why Bottom Bar?

1. **Accessibility** - Primary controls should be easy to reach
2. **Consistency** - Matches command palettes in modern IDEs (VS Code, JetBrains)
3. **Visibility** - Always visible regardless of map zoom/pan state
4. **Separation** - Distinguishes map navigation from command entry

### Why Three Elements?

1. **Command Input** - Core interaction (user → orchestrator)
2. **Session Selector** - Context switching without leaving view
3. **Health Status** - At-a-glance system health

These three form a complete "cockpit" for Living Universe navigation.

### Why Cosmic Styling?

The CommandCenter must feel native to the Living Universe aesthetic:
- Deep blacks and subtle transparency (frosted glass effect)
- Blue cosmic glow on interactive elements
- Health colors match cosmic-tokens (not system colors)
- Smooth animations echo universe navigation transitions

---

## Version History

**v1.0.0** (2026-02-11)
- Initial implementation
- Command input with Enter key support
- Session selector with dropdown
- Health status indicator
- Responsive layout
- Full accessibility support
- Integration with CosmicMap

---

## Related Components

- **CosmicMap** - Parent container
- **SessionContext** - Session state management
- **UniverseContext** - Universe state and health data
- **ChatPanel** - Similar command input patterns
- **CommandPalette** - Similar dropdown/search patterns

---

## Contact

For questions or issues with CommandCenter:
- File an issue in the ActionFlows repository
- Tag component: `component:cosmic-map`
- Tag phase: `living-universe:phase-2`
