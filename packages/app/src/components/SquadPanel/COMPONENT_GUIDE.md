# AgentCharacterCard & AgentAvatar Components

## Overview

Two complementary React components for displaying and interacting with agent characters in the SquadPanel:

- **AgentAvatar**: Visual character representation with expression states and aura effects
- **AgentCharacterCard**: Interactive card wrapper around avatar, with name, status, and click-to-expand functionality

## Architecture

### AgentAvatar

Character visual that responds to status and hover interactions.

#### Props

```typescript
interface AgentAvatarProps {
  role: AgentRole;                          // Agent type (orchestrator, read, write, etc)
  status: AgentStatus;                      // Current state (idle, thinking, working, error, etc)
  isHovered: boolean;                       // Whether mouse is hovering
  eyeTarget: { x: number; y: number } | null; // Eye tracking target position
  size: 'orchestrator' | 'subagent';        // Size variant (1.5x vs 1x)
  className?: string;                       // Optional CSS class
}
```

#### Features

- **SVG-based face**: Scalable, crisp character visual
  - Head and body circles with role-based colors
  - Eyes with pupils and highlights
  - Mouth with expression variants
  - Accent marks (cheeks/blush)

- **Eye tracking**: Pupils follow cursor when hovering
  - Calculated from mouse position relative to avatar
  - Smooth, natural movement constrained to subtle range
  - Works on both horizontal and vertical axes

- **Expression states** (via CSS class):
  - `expression-idle`: Neutral, gentle float
  - `expression-thinking`: Contemplative, upward tilt
  - `expression-working`: Determined, active movement
  - `expression-error`: Worried, with jolt animation
  - `expression-success`: Smiling, satisfied
  - `expression-waiting`: Patient, slow breathe
  - `expression-spawning`: Concentrated, energetic

- **Aura effects**: Colored halo around avatar
  - Role-based glow color from AGENT_COLORS
  - Status-driven pulse animations
  - Idle: slow 3s pulse, dim
  - Thinking: 2s rhythm, medium
  - Working: 1.5s steady, bright
  - Error: 0.6s frantic flicker
  - Success: 1.2s burst then fade
  - Waiting: 2.5s slow breathe

- **Status indicator**: Colored dot at bottom-right
  - Matches agent role accent color
  - Animates based on status

#### Styling (AgentAvatar.css)

- Dark theme: `#1a1a1a`/`#1e1e1e` backgrounds
- SVG uses `drop-shadow` filter for crisp glow
- Animations: float, blink, aura pulses
- Respects `prefers-reduced-motion`

### AgentCharacterCard

Interactive card container with avatar, name, status, and expand interface.

#### Props

```typescript
interface AgentCharacterCardProps {
  agent: AgentCharacter;                // Agent data with status/logs
  size: 'orchestrator' | 'subagent';    // Size variant
  isExpanded: boolean;                  // Log panel expanded state
  onHover: (isHovering: boolean) => void; // Hover callback
  onClick: () => void;                  // Click callback
  className?: string;                   // Optional CSS class
}
```

#### Features

- **Avatar integration**: Displays AgentAvatar with eye tracking
- **Name and archetype**: Shows role-based labels
- **Status section**: Hidden by default, shown on hover/expand
  - Status badge with current action or status text
  - Progress bar (only when working)
  - Progress percentage and label
- **Expand indicator**: Clickable arrow showing expand state
- **Interaction hints**: Tooltip on hover
- **Keyboard accessible**: Tab-able, ARIA labels

#### Interactions

- **Hover**:
  - Scale up 1.1x
  - Show status section
  - Enable eye tracking
  - Brighten aura
  - Show expand hint

- **Click**:
  - Toggle expanded state
  - Keep status visible when expanded
  - Typically triggers log panel display

#### Status-based Styling

Each status gets a CSS class: `status-idle`, `status-working`, `status-error`, etc.
- Changes border color on hover
- Different shadow intensities
- Status indicator pulse varies by status

#### Styling (AgentCharacterCard.css)

- Dark theme: `#1a1a1a` base, `#1e1e1e` hover
- Border: `#3c3c3c` default, role-glow on hover
- Smooth transitions: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)
- Size variants: orchestrator 200px, subagent 140px
- Progress bar: gradient with glow

## Usage

### Basic Example

```tsx
import { AgentCharacterCard, AgentAvatar } from '@afw/app/components/SquadPanel';

// Just the avatar
<AgentAvatar
  role="orchestrator"
  status="thinking"
  isHovered={false}
  eyeTarget={null}
  size="orchestrator"
/>

// Full card with interaction
<AgentCharacterCard
  agent={agentData}
  size="orchestrator"
  isExpanded={expandedId === agentData.id}
  onHover={(hovering) => setHoveredAgent(hovering ? agentData.id : null)}
  onClick={() => setExpandedAgent(agentData.id)}
/>
```

### With SquadPanel

The SquadPanel uses these components via AgentRow (not yet implemented):

```tsx
<SquadPanel
  sessionId={sessionId}
  placement="left"
  onAgentClick={(agentId) => {
    // Toggle log panel for this agent
  }}
/>
```

## Color System

Colors come from `AGENT_COLORS` constant (types.ts):

```typescript
orchestrator: { primary: '#E8E8E8', accent: '#FFD700', glow: '#FFFAF0' }
explore:      { primary: '#20B2AA', accent: '#00FFFF', glow: '#7FFFD4' }
plan:         { primary: '#6A0DAD', accent: '#EE82EE', glow: '#FF00FF' }
bash:         { primary: '#3C3C3C', accent: '#00FF00', glow: '#39FF14' }
read:         { primary: '#000080', accent: '#87CEEB', glow: '#FFFAFA' }
write:        { primary: '#FFFDD0', accent: '#1A1A1A', glow: '#FFBF00' }
edit:         { primary: '#708090', accent: '#FF6F61', glow: '#FFB6C1' }
grep:         { primary: '#228B22', accent: '#32CD32', glow: '#FFFF00' }
glob:         { primary: '#4B0082', accent: '#FFFAFA', glow: '#6495ED' }
```

- **Primary**: Main character color (head/body)
- **Accent**: Eye/mouth color, status dot
- **Glow**: Aura and highlights

## Animation Details

### Performance

All animations use `transform` and `opacity` only (no layout shifts):
- Hover scale: `transform: scale(1.1)`
- Float: `transform: translateY()`
- Pulse: `transform: scale()`
- Jolt: `transform: translateY() translateX()`

Fully hardware-accelerated on modern browsers.

### Keyframes

#### Avatar Float
- Idle: 3s cycle, ±4px vertical movement
- Thinking: 3.5s cycle, ±6px vertical
- Working: 2s cycle, ±2px (faster/tighter)
- Error: 0.5s jolt with diagonal shake

#### Aura Pulses
- Idle: 3s, 0.5→0.7 opacity, 1→1.05 scale
- Thinking: 2s, 0.6→0.85 opacity, 1→1.08 scale
- Working: 1.5s, 0.8→1 opacity, 1→1.1 scale
- Waiting: 2.5s, 0.5→0.75 opacity, 1.02→1.08 scale
- Success: 1.2s burst (0.8→1.15→1 scale)
- Error: 0.6s flicker (0.3/0.9/0.2/0.8 opacity)
- Spawning: 1s expansion (0.5→1.2→1 scale)

#### Eye Blink
- 4s cycle
- Runs on idle and waiting states
- Smooth close/open

### Respects prefers-reduced-motion

All animations set to `animation: none` when user prefers reduced motion.
Hover effects reduced to `scale(1.05)` instead of `scale(1.1)`.

## Accessibility

- **ARIA labels**: Card has `role="button"`, `aria-label`, `aria-expanded`
- **Keyboard support**: Tab-able, Enter/Space can activate
- **High contrast**: Works on dark backgrounds with luminous colors
- **Color not sole indicator**: Status also shown with dot, text, shape
- **Motion respect**: `prefers-reduced-motion` reduces animations

## Testing

See `AgentCharacterCard.test.tsx` for comprehensive test suite:

- Rendering: Component presence, size variants, SVG elements
- Hover: onHover callback, status visibility, eye tracking
- Click: onClick callback, expanded state, status persistence
- Status: State classes, progress display, action text
- Accessibility: ARIA attributes, keyboard navigation
- Expressions: All expression states render correctly
- Aura: Aura element present, different states apply
- Eye tracking: Position updates with eyeTarget prop

Run tests:
```bash
pnpm test packages/app
```

## Future Enhancements

1. **Animation Library Integration**: Could use Framer Motion for complex sequences
2. **Custom Character Designs**: Replace SVG circles with asset-based characters
3. **Voice/Sound Effects**: Audio cues on state changes
4. **Multi-agent Arrangements**: Layout algorithms for many subagents
5. **Gesture Animations**: Signature poses per role (conductor, scout, etc)
6. **Particle Effects**: Sparkles on success, error shake with sparks

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- SVG support required
- CSS Flexbox and Grid
- CSS Animations (with fallback)
- CSS Variables for theme colors

## Related Components

- **SquadPanel**: Container component (planned)
- **AgentLogPanel**: Shows agent logs (existing)
- **LogBubble**: Individual log entry (existing)
- **AgentStatusBar**: Status overlay (planned)
- **AgentRow**: Layout container for orchestrator + subagents (planned)
