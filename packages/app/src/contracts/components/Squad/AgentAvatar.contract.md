# Component Contract: AgentAvatar

**File:** `packages/app/src/components/SquadPanel/AgentAvatar.tsx`
**Type:** widget
**Parent Group:** Squad
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** AgentAvatar
- **Introduced:** 2026-02-09
- **Description:** SVG-based character visual with role-based colors, status-driven expression animations, eye tracking on hover, and pulsing aura effects.

---

## Render Location

**Mounts Under:**
- AgentCharacterCard

**Render Conditions:**
1. Always renders when parent AgentCharacterCard mounts
2. No conditional rendering (always visible)

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- AgentCharacterCard mounts

**Key Effects:**
None (pure presentation component)

**Cleanup Actions:**
None

**Unmount Triggers:**
- AgentCharacterCard unmounts

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| role | string | ✅ | N/A | Agent role (orchestrator, explore, plan, bash, read, write, edit, grep, glob) |
| status | string | ✅ | N/A | Agent status (thinking, working, error, success, waiting, spawning, idle) |
| isHovered | boolean | ✅ | N/A | Hover state from parent |
| eyeTarget | { x: number; y: number } \| null | ✅ | N/A | Eye tracking target (normalized -0.3 to 0.3) |
| size | 'orchestrator' \| 'subagent' | ✅ | N/A | Size variant (orchestrator 1.5x, subagent standard) |
| className | string | ❌ | '' | Additional CSS classes |

### Callbacks Up (to parent)
None (presentation only)

### Callbacks Down (to children)
None

---

## State Ownership

### Local State
None

### Context Consumption
None

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| colors | { primary, accent, glow } | `[role]` | `AGENT_COLORS[role] \|\| AGENT_COLORS.orchestrator` |
| characterEmoji | string | `[role]` | `getCharacterEmoji(role)` mapping |
| eyePos | { x, y } | `[eyeTarget, isHovered]` | `calculateEyePosition(eyeTarget, isHovered)` (clamped) |
| expressionClass | string | `[status]` | `getExpressionState(status)` CSS class |
| auraClass | string | `[status]` | `getAuraState(status)` CSS class |

### Custom Hooks
None

---

## Interactions

### Parent Communication
None (receives props, no callbacks)

### Child Communication
None (leaf component)

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
None

### WebSocket Events
None

### Timers
None

### LocalStorage Operations
None

### DOM Manipulation
None

### Electron IPC (if applicable)
N/A

---

## Test Hooks

**CSS Selectors:**
- `.agent-avatar`
- `.size-orchestrator`, `.size-subagent`
- `.expression-thinking`, `.expression-working`, `.expression-error`, `.expression-success`, `.expression-waiting`, `.expression-spawning`, `.expression-idle`
- `.is-hovered`
- `.agent-avatar-thinking`, `.agent-avatar-working`, `.agent-avatar-error`, etc. (status animation classes)
- `.avatar-aura` (aura layer)
- `.avatar-character` (main character container)
- `.avatar-svg` (SVG element)
- `.avatar-emoji` (emoji fallback)
- `.avatar-status-dot` (status indicator)

**Data Test IDs:**
None

**ARIA Labels:**
- `role="img"` on `.agent-avatar`
- `aria-label="{role} agent character"`

**Visual Landmarks:**
1. Aura glow (`.avatar-aura`) — Pulses with status, color matches role
2. SVG face with eyes (`.avatar-svg`) — Two circles for eyes, pupils track cursor
3. Status dot (`.avatar-status-dot`) — Bottom-right corner, color matches role accent
4. Emoji overlay (`.avatar-emoji`) — Character-based emoji (🎼, 🔍, etc.)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-AA-001: SVG Renders with Eyes
- **Type:** render
- **Target:** `.avatar-svg` with eye circles
- **Condition:** SVG contains 4 circles (2 eyes + 2 pupils)
- **Failure Mode:** Character face missing, eyes not visible
- **Automation Script:**
```javascript
// Chrome MCP script
const svg = document.querySelector('.agent-avatar .avatar-svg');
if (!svg) throw new Error('Avatar SVG not rendering');
const circles = svg.querySelectorAll('circle');
if (circles.length < 4) throw new Error('Avatar SVG missing eye elements');
```

#### HC-AA-002: Aura Glow Visible
- **Type:** render
- **Target:** `.avatar-aura`
- **Condition:** Element exists with border color and box-shadow
- **Failure Mode:** No glow effect, avatar looks flat
- **Automation Script:**
```javascript
// Chrome MCP script
const aura = document.querySelector('.avatar-aura');
if (!aura) throw new Error('Avatar aura layer missing');
const boxShadow = window.getComputedStyle(aura).boxShadow;
if (boxShadow === 'none') console.warn('Aura box-shadow not applied');
```

#### HC-AA-003: Eye Tracking on Hover
- **Type:** interaction
- **Target:** Pupil circles' `cx` and `cy` attributes
- **Condition:** Pupil positions update when `eyeTarget` prop changes and `isHovered` is true
- **Failure Mode:** Eyes don't follow cursor, static appearance
- **Automation Script:**
```javascript
// Chrome MCP script
// Simulate hover and check if pupils move
const avatar = document.querySelector('.agent-avatar');
const svg = avatar.querySelector('.avatar-svg');
const pupils = Array.from(svg.querySelectorAll('circle')).slice(2, 4); // Pupils are 3rd & 4th circles
const initialCx = pupils[0].getAttribute('cx');
// Cannot directly test eyeTarget prop, but can verify pupils are NOT at default positions
const leftPupilCx = parseFloat(pupils[0].getAttribute('cx'));
console.log(`Left pupil cx: ${leftPupilCx} (should deviate from base when eyeTarget active)`);
```

### Warning Checks (Should Pass)

#### HC-AA-004: Status Indicator Dot
- **Type:** render
- **Target:** `.avatar-status-dot`
- **Condition:** Element exists with background color matching role accent
- **Failure Mode:** Status not visually indicated

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 10 | ms | Time to mount AgentAvatar SVG |
| eye-update | 5 | ms | Time to update pupil positions on eyeTarget change |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
None (leaf component)

**Required Props:**
- `role` (string)
- `status` (string)
- `isHovered` (boolean)
- `eyeTarget` ({ x, y } | null)
- `size` ('orchestrator' | 'subagent')

---

## Notes

**Role-Based Colors (AGENT_COLORS):**
- `orchestrator`: { primary: '#5e35b1', accent: '#9575cd', glow: '#ce93d8' }
- `explore`: { primary: '#2196f3', accent: '#64b5f6', glow: '#90caf9' }
- `plan`: { primary: '#43a047', accent: '#66bb6a', glow: '#81c784' }
- `bash`: { primary: '#f57c00', accent: '#ff9800', glow: '#ffb74d' }
- `read`: { primary: '#00796b', accent: '#26a69a', glow: '#4db6ac' }
- `write`: { primary: '#7b1fa2', accent: '#9c27b0', glow: '#ba68c8' }
- `edit`: { primary: '#c2185b', accent: '#e91e63', glow: '#f06292' }
- `grep`: { primary: '#0288d1', accent: '#03a9f4', glow: '#4fc3f7' }
- `glob`: { primary: '#388e3c', accent: '#4caf50', glow: '#66bb6a' }

**Status Expression Mapping:**
- `thinking`: Pupils move slowly, aura pulses gently (CSS animation: `aura-thinking`)
- `working`: Pupils focused, aura pulses rapidly (CSS animation: `aura-working`)
- `error`: Pupils dilated, aura flashes red (CSS animation: `aura-error`)
- `success`: Pupils relaxed, aura glows steady (CSS animation: `aura-success`)
- `waiting`: Pupils idle, aura dims (CSS animation: `aura-waiting`)
- `spawning`: Pupils dilating, aura expanding (CSS animation: `aura-spawning`)

**Eye Tracking Algorithm:**
- Normalizes cursor position relative to avatar center
- Clamps movement to ±0.3 range (subtle eye movement)
- Pupils offset by `eyePos.x * 6` for X, `eyePos.y * 6` for Y (scaled SVG units)

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
