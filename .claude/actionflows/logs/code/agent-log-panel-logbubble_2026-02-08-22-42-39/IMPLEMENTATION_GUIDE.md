# Implementation Guide: AgentLogPanel & LogBubble

## Quick Start

These components are ready to integrate into the SquadPanel system. They handle the "Phase 2: Interactions + Log Panel" from the architecture plan.

## Component Responsibilities

### AgentLogPanel
**Responsibility:** Display and animate the log panel for a single agent

**Props:**
```typescript
interface AgentLogPanelProps {
  agent: AgentCharacter;        // Agent data with logs array
  isExpanded: boolean;          // Control visibility
  maxHeight?: number;           // Container max height (default: 400px)
  className?: string;           // Additional CSS classes
}
```

**Behavior:**
- Returns `null` when `isExpanded=false` (no DOM overhead)
- Renders header with agent name and log count
- Renders list of LogBubble components
- Auto-scrolls to bottom on mount/update
- Shows empty state message when no logs

**Usage:**
```tsx
<AgentLogPanel
  agent={selectedAgent}
  isExpanded={expandedAgentId === selectedAgent.id}
  maxHeight={400}
/>
```

---

### LogBubble
**Responsibility:** Render a single log message with type-specific styling

**Props:**
```typescript
interface LogBubbleProps {
  log: AgentLog;               // Log entry data
  className?: string;          // Additional CSS classes
}
```

**Behavior:**
- Displays timestamp (relative or absolute)
- Shows icon indicator for log type
- Applies color-coded background
- Fades in on appearance
- Supports all 5 log types

**Usage:**
```tsx
{agent.logs.map((log) => (
  <LogBubble key={log.id} log={log} />
))}
```

---

## Integration Steps

### Step 1: Import Components
```tsx
import { AgentLogPanel } from './components/SquadPanel';
import type { AgentCharacter } from './components/SquadPanel';
```

### Step 2: Add State to Parent Component
```tsx
const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
```

### Step 3: Create Click Handler
```tsx
const handleAgentClick = (agentId: string) => {
  setExpandedAgentId(prev => prev === agentId ? null : agentId);
};
```

### Step 4: Render in AgentCharacterCard
```tsx
function AgentCharacterCard({ agent, isExpanded, onHover, onClick }) {
  return (
    <>
      {/* Agent avatar and status bar */}
      <div className="agent-character-card" onClick={onClick}>
        {/* ... */}
      </div>

      {/* Log panel below agent card */}
      <AgentLogPanel
        agent={agent}
        isExpanded={isExpanded}
        maxHeight={400}
      />
    </>
  );
}
```

---

## CSS Integration

### Required Custom Properties
The stylesheets assume these CSS variables are defined globally (in animations.css or App.css):

```css
:root {
  --ease-ghibli: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

If this variable doesn't exist, add it to your global styles.

### Color Inheritance
Border colors are automatically applied based on the `agent.role` property:
- `.log-panel-border-orchestrator` → warm white
- `.log-panel-border-explore` → aqua
- `.log-panel-border-plan` → magenta
- `.log-panel-border-bash` → neon green
- `.log-panel-border-read` → paper white
- `.log-panel-border-write` → warm amber
- `.log-panel-border-edit` → surgical pink
- `.log-panel-border-grep` → highlight yellow
- `.log-panel-border-glob` → constellation blue

---

## Data Flow

### Where Logs Come From
The `AgentCharacter` interface includes a `logs` array:

```typescript
interface AgentCharacter {
  id: string;
  role: AgentRole;
  name: string;
  status: AgentStatus;
  logs: AgentLog[];        // <- Populated by useAgentTracking
  progress?: number;
  currentAction?: string;
}

interface AgentLog {
  id: string;
  type: LogType;           // 'info' | 'success' | 'error' | 'thinking' | 'warning'
  message: string;
  timestamp: number;       // Unix milliseconds (Date.getTime())
}
```

### From useAgentTracking Hook
The `useAgentTracking` hook (in useAgentTracking.ts) listens to WebSocket events and populates the logs array:

```typescript
const { orchestrator, subagents } = useAgentTracking(sessionId);
// orchestrator.logs and subagents[].logs are populated from events
```

---

## Styling Reference

### Log Type Colors

| Type | Background | Border | Icon |
|------|----------|--------|------|
| info | rgba(128, 128, 128, 0.15) | rgba(128, 128, 128, 0.3) | ℹ️ |
| success | rgba(76, 175, 80, 0.15) | rgba(76, 175, 80, 0.3) | ✓ |
| error | rgba(244, 67, 54, 0.15) | rgba(244, 67, 54, 0.3) | ✕ |
| thinking | rgba(156, 39, 176, 0.15) | rgba(156, 39, 176, 0.3) | ◆ |
| warning | rgba(255, 193, 7, 0.15) | rgba(255, 193, 7, 0.3) | ⚠ |

### Panel Colors

| Element | Color | Usage |
|---------|-------|-------|
| Background | #1a1a1a | Main panel area |
| Header | #1e1e1e | Agent name row |
| Border | #3c3c3c | Standard borders |
| Agent-specific | Per role | Left/right/bottom borders |

---

## Customization Points

### Change Animation Duration
**In AgentLogPanel.css:**
```css
.agent-log-panel {
  animation: log-panel-expand 0.35s var(--ease-ghibli) forwards;
  /* Change 0.35s to your preferred duration */
}
```

### Change Max Height
**Pass as prop:**
```tsx
<AgentLogPanel agent={agent} isExpanded={true} maxHeight={600} />
```

### Change Scrollbar Width
**In AgentLogPanel.css:**
```css
.log-panel-scroll-container::-webkit-scrollbar {
  width: 6px;  /* Change to desired width */
}
```

### Add Custom Colors
**In AgentLogPanel.css:**
```css
.log-panel-border-custom-role {
  border-left-color: #YOUR_COLOR;
  border-right-color: #YOUR_COLOR;
  border-bottom-color: #YOUR_COLOR;
}
```

### Customize Bubble Appearance
**In LogBubble.css:**
```css
.log-bubble {
  padding: 8px 10px;        /* Adjust spacing */
  border-radius: 6px;       /* Adjust roundness */
  font-size: 12px;          /* Adjust text size */
}
```

---

## Accessibility Features

### For Users with Color Blindness
Each log type has a distinct icon shape:
- Success: ✓ (checkmark)
- Error: ✕ (X)
- Thinking: ◆ (diamond)
- Warning: ⚠ (warning triangle)
- Info: ℹ️ (info circle)

### For Users with Motion Sensitivity
Add `prefers-reduced-motion: reduce` media query:
- Animations are disabled
- Only essential transitions remain (0.2s ease)

### For Users Needing High Contrast
Add `prefers-contrast: more` media query:
- Borders are thicker (2px)
- Background opacity is increased
- Text contrast is enhanced

---

## Common Issues & Solutions

### Issue: Scrollbar doesn't appear
**Solution:** Ensure the log panel has logs and container has overflow.
```tsx
// Check that:
// 1. agent.logs array is populated
// 2. isExpanded={true}
// 3. maxHeight is set and content exceeds it
```

### Issue: Auto-scroll not working
**Solution:** The scroll behavior is smooth and may appear slow.
```tsx
// Try explicit scroll:
scrollContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
```

### Issue: Colors don't match style guide
**Solution:** Verify the agent.role matches the CSS class names.
```tsx
// Check mapping in types.ts:
export type AgentRole = 'orchestrator' | 'explore' | 'plan' | ...;
// CSS class should be: .log-panel-border-{role}
```

### Issue: Timestamp shows "NaN"
**Solution:** Ensure log.timestamp is a valid number.
```tsx
// Check that:
// 1. log.timestamp is Unix milliseconds (number)
// 2. Not a string or other type
```

---

## Testing Recommendations

### Unit Tests
```typescript
describe('LogBubble', () => {
  it('renders log message', () => {
    const log = { id: '1', type: 'info', message: 'Test', timestamp: Date.now() };
    render(<LogBubble log={log} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('displays correct icon for log type', () => {
    const log = { id: '1', type: 'success', message: 'Test', timestamp: Date.now() };
    render(<LogBubble log={log} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('formats timestamp correctly', () => {
    const nowMs = Date.now();
    const log = { id: '1', type: 'info', message: 'Test', timestamp: nowMs };
    render(<LogBubble log={log} />);
    expect(screen.getByText('just now')).toBeInTheDocument();
  });
});

describe('AgentLogPanel', () => {
  it('returns null when not expanded', () => {
    const { container } = render(
      <AgentLogPanel agent={mockAgent} isExpanded={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders logs when expanded', () => {
    const { logs } = mockAgent;
    render(
      <AgentLogPanel agent={mockAgent} isExpanded={true} />
    );
    logs.forEach(log => {
      expect(screen.getByText(log.message)).toBeInTheDocument();
    });
  });

  it('auto-scrolls to bottom on new logs', () => {
    const { rerender } = render(
      <AgentLogPanel agent={mockAgent} isExpanded={true} />
    );
    const updatedAgent = {
      ...mockAgent,
      logs: [...mockAgent.logs, { id: 'new', type: 'info', message: 'New log', timestamp: Date.now() }]
    };
    rerender(<AgentLogPanel agent={updatedAgent} isExpanded={true} />);
    // Scroll position should move to bottom
  });
});
```

### Visual Tests
- Open agent card and verify log panel appears
- Verify animation is smooth (not janky)
- Verify colors match agent type
- Verify scroll appears on 5+ logs
- Verify mobile responsive layout
- Test on dark mode
- Test with prefers-reduced-motion enabled

---

## Performance Notes

- **Component re-renders:** Only when props change (agent, isExpanded)
- **Animation performance:** GPU-accelerated (transform + opacity)
- **Memory usage:** Minimal (no state, props-driven)
- **Scroll performance:** Native browser scrolling (optimized)

For very large log counts (1000+), consider implementing:
- Virtual scrolling
- Log pagination
- Log retention policy

---

## File Structure
```
packages/app/src/components/SquadPanel/
├── AgentLogPanel.tsx          # Main component
├── AgentLogPanel.css          # Styles + animations
├── LogBubble.tsx              # Child component
├── LogBubble.css              # Styles + color variants
├── types.ts                   # Type definitions
├── index.ts                   # Public exports
└── [other existing components]
```

---

## Next Integration Target

After AgentLogPanel & LogBubble are integrated:
1. **AgentStatusBar** - Progress bar + status text
2. **AgentCharacterCard** - Hover/click interactions
3. **AgentAvatar** - Character animations
4. **AgentRow** - Layout arrangement
5. **SquadPanel** - Main container

Follow the "Phase 2: Interactions + Log Panel" checklist in the architecture plan.
