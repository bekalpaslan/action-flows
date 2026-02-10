# Component Contract: SquadPanelDemo

**File:** `packages/app/src/components/SquadPanel/SquadPanelDemo.tsx`
**Type:** utility
**Parent Group:** Squad
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SquadPanelDemo
- **Introduced:** 2026-02-09
- **Description:** Visual test component for SquadPanel with interactive controls for placement, overlay settings, and audio cues. Supports demo mode (auto-updating agents) and real mode (WebSocket events).

---

## Render Location

**Mounts Under:**
- Test routes or isolated demo pages

**Render Conditions:**
1. Manually mounted for testing/demo purposes
2. Not part of production workbench layout

**Positioning:** relative
**Z-Index:** N/A (container for demo)

---

## Lifecycle

**Mount Triggers:**
- Developer navigates to test route

**Key Effects:**
None (local state only)

**Cleanup Actions:**
None

**Unmount Triggers:**
- Developer navigates away

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| mode | 'demo' \| 'real' | ❌ | 'demo' | Demo mode (null sessionId) or real mode (WebSocket events) |
| sessionId | SessionId | ❌ | undefined | Session ID for real mode (ignored in demo mode) |

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onAgentClick | `(agentId: string) => void` | SquadPanel | Logs clicked agent ID to console |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| placement | 'left' \| 'right' \| 'bottom' \| 'overlay' | 'left' | `setPlacement` (select onChange) |
| overlayPosition | 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right' | 'bottom-right' | `setOverlayPosition` (select onChange) |
| overlayOpacity | number (0-1) | 0.9 | `setOverlayOpacity` (range input onChange) |
| audioEnabled | boolean | false | `setAudioEnabled` (checkbox onChange) |

### Context Consumption
None

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| activeSessionId | SessionId \| null | `[mode, sessionId]` | `mode === 'demo' ? null : (sessionId ?? null)` |

### Custom Hooks
None

---

## Interactions

### Parent Communication
None (isolated demo component)

### Child Communication
- **Child:** SquadPanel
- **Mechanism:** props
- **Data Flow:** Passes sessionId, placement, overlay settings, audioEnabled, onAgentClick

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
None

### WebSocket Events
None (delegated to SquadPanel in real mode)

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
None (demo wrapper, not tested directly)

**Data Test IDs:**
None

**ARIA Labels:**
None (controls are standard HTML inputs)

**Visual Landmarks:**
1. Controls panel at top — Dropdowns and inputs for configuration
2. Info box with phase status — Checklist of completed features
3. SquadPanel preview in center — Live preview with current settings
4. Instructions box at bottom — Interaction guide

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-SPD-001: Controls Update SquadPanel Props
- **Type:** interaction
- **Target:** Select/input controls
- **Condition:** Changing controls updates SquadPanel props (placement, overlayOpacity, etc.)
- **Failure Mode:** Controls non-functional, cannot test configurations
- **Automation Script:**
```javascript
// Chrome MCP script
const placementSelect = document.querySelector('select[value="left"]');
placementSelect.value = 'right';
placementSelect.dispatchEvent(new Event('change', { bubbles: true }));
setTimeout(() => {
  const panel = document.querySelector('.squad-panel.placement-right');
  if (!panel) throw new Error('Placement change not applied to SquadPanel');
}, 100);
```

#### HC-SPD-002: Demo Mode Passes Null SessionId
- **Type:** render
- **Target:** SquadPanel `sessionId` prop
- **Condition:** When `mode === 'demo'`, sessionId is null
- **Failure Mode:** Demo mode tries to connect to WebSocket
- **Automation Script:**
```javascript
// Chrome MCP script
// Verify demo mode indicator shows correct mode
const modeIndicator = document.querySelector('div:contains("Demo (auto-updating)")');
if (!modeIndicator) throw new Error('Demo mode indicator not showing');
```

### Warning Checks (Should Pass)

None

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 100 | ms | Time to mount demo with controls + SquadPanel |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
None

**Child Components:**
- SquadPanel

**Required Props:**
None (all optional)

---

## Notes

**Demo vs Real Mode:**
- **Demo mode** (`mode="demo"`): Passes `sessionId={null}` to SquadPanel, triggering auto-updating demo agents
- **Real mode** (`mode="real"`): Passes provided `sessionId` to SquadPanel for WebSocket-driven updates

**Controls:**
- **Placement**: left, right, bottom, overlay
- **Overlay Position**: top-left, top-right, bottom-left, bottom-right (only when placement is overlay)
- **Overlay Opacity**: 0-1 range slider (only when placement is overlay)
- **Audio Cues**: Checkbox to enable/disable sound effects (not yet implemented)

**Phase Checklist:**
- ✅ Phase 1: Core structure (types, hooks, components)
- ✅ Phase 2: WebSocket integration
- ⏳ Phase 3: Animations (keyframes, aura pulses)
- ⏳ Phase 4: Responsive layout (AgentRow breakpoints)
- ⏳ Phase 5: SVG artwork (63 expression variants)

**Usage Example:**
```tsx
import { SquadPanelDemo } from './SquadPanel/SquadPanelDemo';

function TestRoute() {
  return <SquadPanelDemo mode="demo" />;
}
```

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
