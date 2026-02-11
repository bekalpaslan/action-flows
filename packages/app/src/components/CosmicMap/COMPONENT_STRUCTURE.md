# CosmicMap Component Structure

**Living Universe Visualization - Phase 1 + Phase 2**

---

## Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│ CosmicMap (Full viewport container)                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ CosmicBackground (Canvas starfield + nebulae)              │ │
│ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ │
│ │                                                             │ │
│ │  ReactFlow (Region stars + Light bridges)                  │ │
│ │                                                             │ │
│ │    ● RegionStar (platform)                                 │ │
│ │         ╲                                                   │ │
│ │          ╲ LightBridgeEdge                                 │ │
│ │           ╲                                                 │ │
│ │            ● RegionStar (template)                         │ │
│ │                 ╲                                           │ │
│ │                  ╲ LightBridgeEdge                         │ │
│ │                   ╲                                         │ │
│ │                    ● RegionStar (philosophy)               │ │
│ │                                                             │ │
│ │                          ... more regions ...              │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌──────────────┐                          ┌─────────────────┐  │
│ │   Controls   │                          │    MiniMap      │  │
│ │  (zoom/pan)  │                          │   (overview)    │  │
│ └──────────────┘                          └─────────────────┘  │
│                                                                 │
│ ┌────────────────┐                                              │
│ │ 🌌 God View   │  (Return to full view button)                │
│ └────────────────┘                                              │
│                                                                 │
│ ╔═══════════════════════════════════════════════════════════╗ │
│ ║ CommandCenter (Bottom bar - Phase 2)                      ║ │
│ ║ ┌─────────────────────┬───────────────┬─────────────────┐ ║ │
│ ║ │  Command Input      │   Session     │  Health Status  │ ║ │
│ ║ │  [Enter cmd... ▶]   │  [Session ▼]  │  [● 85%]        │ ║ │
│ ║ └─────────────────────┴───────────────┴─────────────────┘ ║ │
│ ╚═══════════════════════════════════════════════════════════╝ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Tree

```
CosmicMap (ReactFlowProvider wrapper)
└── CosmicMapInner
    ├── CosmicBackground (z-index: 0)
    │   └── <canvas> (starfield + nebulae)
    │
    ├── ReactFlow (z-index: 1)
    │   ├── Node: RegionStar × N
    │   │   └── Custom node component
    │   │       ├── Star core (SVG circle)
    │   │       ├── Glow effect (SVG filter)
    │   │       ├── Label
    │   │       └── Health indicator
    │   │
    │   ├── Edge: LightBridgeEdge × M
    │   │   └── Custom edge component
    │   │       ├── Path (SVG path)
    │   │       ├── Glow effect
    │   │       └── Spark animation (if active)
    │   │
    │   ├── Controls (z-index: 5, bottom: 80px)
    │   │   └── ReactFlow built-in controls
    │   │
    │   └── MiniMap (z-index: 5, bottom: 80px)
    │       └── ReactFlow built-in minimap
    │
    ├── God View Button (z-index: 10, top-right)
    │   └── <button> "🌌 God View"
    │
    └── CommandCenter (z-index: 10, bottom: 0) [NEW - Phase 2]
        ├── Input Section (flex: 1)
        │   ├── Icon (⬆)
        │   ├── <input> text field
        │   └── Submit button (▶)
        │
        ├── Session Section (fixed width)
        │   ├── Trigger button
        │   │   ├── Icon (👤)
        │   │   ├── Label (session ID + time)
        │   │   └── Caret (▼)
        │   │
        │   └── Dropdown (position: absolute, bottom: 100% + 8px)
        │       └── Session options × N
        │           ├── Label (ID + time)
        │           ├── Status badge
        │           └── Checkmark (if selected)
        │
        └── Health Section (fixed width)
            └── Health indicator
                ├── Icon (⊕)
                └── Value (85%)
```

---

## File Organization

```
packages/app/src/components/CosmicMap/
│
├── index.ts                      # Export barrel
│   ├── export CosmicMap
│   ├── export CommandCenter      [NEW]
│   ├── export CosmicBackground
│   ├── export RegionStar
│   └── export LightBridgeEdge
│
├── CosmicMap.tsx                 # Main container
│   ├── CosmicMapInner            (uses ReactFlow hooks)
│   └── CosmicMap                 (ReactFlowProvider wrapper)
│
├── CosmicMap.css                 # Container styles
│   ├── .cosmic-map               (full viewport)
│   ├── .cosmic-map__flow         (ReactFlow wrapper)
│   ├── .cosmic-map__controls     (repositioned: bottom 80px)
│   ├── .cosmic-map__minimap      (repositioned: bottom 80px)
│   └── .cosmic-map__god-view-button
│
├── CommandCenter.tsx             [NEW - Phase 2]
│   ├── CommandCenter             (main component)
│   ├── handleSubmitCommand       (command callback)
│   ├── handleSessionSelect       (session switch)
│   └── calculateUniverseHealth   (health metric)
│
├── CommandCenter.css             [NEW - Phase 2]
│   ├── .command-center           (bottom bar container)
│   ├── .command-center__input-section
│   ├── .command-center__session-section
│   ├── .command-center__session-dropdown
│   └── .command-center__health-section
│
├── COMMAND_CENTER.md             [NEW - Phase 2]
│   └── Detailed documentation
│
├── COMPONENT_STRUCTURE.md        [NEW - Phase 2]
│   └── This file
│
├── CosmicBackground.tsx          (Phase 1)
│   └── Canvas-based starfield + nebulae
│
├── RegionStar.tsx                (Phase 1)
│   └── Custom ReactFlow node
│
├── RegionStar.css                (Phase 1)
│
├── LightBridgeEdge.tsx           (Phase 1)
│   └── Custom ReactFlow edge
│
└── LightBridgeEdge.css           (Phase 1)
```

---

## Data Flow

### Phase 1: Cosmic Map Rendering

```
UniverseContext
    ↓ (universe: UniverseGraph)
CosmicMap
    ↓ (transform to ReactFlow format)
    ├── RegionNode[] → Node<RegionStarData>[]
    └── LightBridge[] → Edge<LightBridgeData>[]
    ↓ (render)
ReactFlow
    ├── RegionStar components
    └── LightBridgeEdge components
```

### Phase 2: Command Center

```
SessionContext
    ↓ (sessions, activeSessionId)
CommandCenter
    ├── Session Selector Dropdown
    │   └── onClick → setActiveSession(id)
    │
UniverseContext
    ↓ (universe.regions[].health)
    └── calculateUniverseHealth()
        └── Health Indicator

User Input
    ↓ (command string)
CommandCenter
    └── onCommand(command)
        ↓
CosmicMap
    └── handleCommand(command)
        ↓
        [Future: POST /api/universe/command]
```

---

## Z-Index Layering

```
Layer 10:  CommandCenter (bottom bar)
           God View Button (top-right)

Layer 5:   ReactFlow Controls (bottom-left)
           ReactFlow MiniMap (bottom-right)

Layer 1:   ReactFlow (interactive canvas)
           ├── RegionStar nodes
           └── LightBridgeEdge edges

Layer 0:   CosmicBackground (static canvas)
```

---

## Responsive Layout

### Desktop (>768px)

```
┌─────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════╗ │
│ ║ [Input field...      ▶] [Session ▼] [● 85%]  ║ │
│ ╚═══════════════════════════════════════════════╝ │
└─────────────────────────────────────────────────────┘
```

### Mobile (≤768px)

```
┌─────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════╗ │
│ ║ [Input field...                            ▶] ║ │
│ ║ [Session ▼]                           [● 85%] ║ │
│ ╚═══════════════════════════════════════════════╝ │
└─────────────────────────────────────────────────────┘
```

---

## Integration Points

### SessionContext Integration

```typescript
const { sessions, activeSessionId, setActiveSession } = useSessionContext();

// Display active session in trigger button
const activeSession = sessions.find(s => s.id === activeSessionId);

// Switch session on user click
const handleSessionSelect = (sessionId: SessionId) => {
  setActiveSession(sessionId);
};
```

### UniverseContext Integration

```typescript
const { universe } = useUniverseContext();

// Calculate average health
const healthValues = universe.regions
  .filter(r => r.health !== undefined)
  .map(r => r.health!);

const avgHealth = healthValues.reduce((sum, h) => sum + h, 0) / healthValues.length;
```

### CosmicMap Integration

```typescript
// CosmicMap.tsx
import { CommandCenter } from './CommandCenter';

const handleCommand = useCallback((command: string) => {
  console.log('[CosmicMap] Command received:', command);
  // TODO: Integrate with orchestrator backend
}, []);

// Render
<CommandCenter
  onCommand={handleCommand}
  showHealthStatus={true}
/>
```

---

## Style Token Usage

### CommandCenter Tokens

| Token | Usage |
|-------|-------|
| `--panel-bg-elevated` | CommandCenter background |
| `--panel-bg-raised` | Session button, health indicator |
| `--input-bg-default` | Input field background |
| `--input-bg-focus` | Input field on focus |
| `--panel-border-default` | All borders |
| `--panel-glow-default` | Hover glow |
| `--panel-glow-focus` | Focus glow |
| `--cosmic-star-idle` | Icon colors |
| `--system-blue` | Focus/active states |
| `--cosmic-health-high` | Health ≥80% |
| `--cosmic-health-medium` | Health 40-79% |
| `--cosmic-health-low` | Health <40% |

---

## Phase Comparison

| Feature | Phase 1 | Phase 2 |
|---------|---------|---------|
| Cosmic Map | ✅ | ✅ |
| Region Stars | ✅ | ✅ |
| Light Bridges | ✅ | ✅ |
| Cosmic Background | ✅ | ✅ |
| Controls/MiniMap | ✅ | ✅ (repositioned) |
| God View Button | ✅ | ✅ |
| **Command Input** | ❌ | ✅ NEW |
| **Session Selector** | ❌ | ✅ NEW |
| **Health Status** | ❌ | ✅ NEW |

---

## Future Phases

### Phase 3: Command Execution
- POST /api/universe/command endpoint
- WebSocket command streaming
- Real-time status updates
- Command autocomplete
- Command history

### Phase 4: Health Dashboard
- Click health indicator to open detail panel
- Region-by-region health breakdown
- Historical health charts
- Health trend analysis
- Health alerts

### Phase 5: Multi-Session Management
- Bulk session operations
- Session search/filter
- Session creation from CommandCenter
- Session comparison view

---

## Performance Notes

**Phase 1 (Cosmic Map):**
- Canvas rendering: ~16ms per frame @ 60fps
- ReactFlow: ~50-100 nodes performant
- No virtualization needed for typical usage

**Phase 2 (Command Center):**
- Lightweight component (<1ms render time)
- Session dropdown: lazy-rendered (only when open)
- Health calculation: O(n) where n = region count
- No performance impact on Phase 1

**Optimization Opportunities:**
- Memoize health calculation
- Virtualize session dropdown (if >100 sessions)
- Debounce command input
- Web Worker for heavy calculations

---

## Testing Strategy

### Unit Tests (Future)
- CommandCenter component rendering
- Session selection logic
- Health calculation accuracy
- Command submission callback

### Integration Tests (Future)
- SessionContext integration
- UniverseContext integration
- CosmicMap parent integration

### E2E Tests (Chrome MCP)
- Command input and submission
- Session dropdown interaction
- Health indicator display
- Keyboard navigation
- Responsive layout

---

## Version History

**Phase 1 (2026-02-09)**
- CosmicMap, RegionStar, LightBridgeEdge
- CosmicBackground, UniverseContext
- 13 files created

**Phase 2 (2026-02-11)**
- CommandCenter component
- Session selector integration
- Health status indicator
- 5 new files, 2 modified files

---

**Component Structure Documentation Complete** ✅
