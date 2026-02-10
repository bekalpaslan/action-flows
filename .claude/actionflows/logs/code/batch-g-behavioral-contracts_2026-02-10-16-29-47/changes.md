# Code Changes: batch-g-behavioral-contracts

## Files Modified
None (all new files)

## Files Created
| File | Purpose |
|------|---------|
| packages/app/src/contracts/components/Squad/SquadPanel.contract.md | Behavioral contract for SquadPanel — Main container for orchestrator + subagents visualization |
| packages/app/src/contracts/components/Squad/AgentRow.contract.md | Behavioral contract for AgentRow — Responsive layout container for agent arrangement |
| packages/app/src/contracts/components/Squad/AgentAvatar.contract.md | Behavioral contract for AgentAvatar — SVG character visual with expressions and eye tracking |
| packages/app/src/contracts/components/Squad/AgentLogPanel.contract.md | Behavioral contract for AgentLogPanel — Expandable log display with auto-scroll |
| packages/app/src/contracts/components/Squad/AgentCharacterCard.contract.md | Behavioral contract for AgentCharacterCard — Interactive card with avatar, status, progress |
| packages/app/src/contracts/components/Squad/LogBubble.contract.md | Behavioral contract for LogBubble — Individual log message bubble with type-based styling |
| packages/app/src/contracts/components/Squad/SquadPanelDemo.contract.md | Behavioral contract for SquadPanelDemo — Visual test component with interactive controls |
| packages/app/src/contracts/components/Harmony/HarmonyPanel.contract.md | Behavioral contract for HarmonyPanel — Harmony metrics dashboard with drift detection |
| packages/app/src/contracts/components/Harmony/TelemetryViewer.contract.md | Behavioral contract for TelemetryViewer — Filterable log table for system telemetry |
| packages/app/src/contracts/components/Harmony/TimelineView.contract.md | Behavioral contract for TimelineView — Horizontal timeline visualization for chain steps |
| packages/app/src/contracts/components/StepInspection/StepInspector.contract.md | Behavioral contract for StepInspector — Side panel for detailed step examination |
| packages/app/src/contracts/components/StepInspection/HistoryBrowser.contract.md | Behavioral contract for HistoryBrowser — Three-column browser for past sessions |
| packages/app/src/contracts/components/Testing/WebSocketTest.contract.md | Behavioral contract for WebSocketTest — Manual testing component for WebSocket system |

## Contract Details

### Squad & Agent System (7 contracts)
1. **SquadPanel**: Main orchestrator + subagents container with placement modes (left, right, bottom, overlay), WebSocket integration, and DiscussButton support
2. **AgentRow**: Responsive layout with breakpoints (≥1200px full, 768-1199px compact, <768px icon grid), distributes subagents left/right
3. **AgentAvatar**: SVG-based character with role colors, status animations, eye tracking (calculateEyePosition), aura pulse effects
4. **AgentLogPanel**: Inline expandable panel with auto-scroll to bottom, renders LogBubbles, max height with scrolling
5. **AgentCharacterCard**: Interactive card with hover effects (scale, aura brighten), status badge, progress bar, expand indicator
6. **LogBubble**: Chat-style log message with type-based colors (info, success, error, thinking, warning), icon indicators, relative timestamps
7. **SquadPanelDemo**: Visual test harness with controls for placement, overlay settings, audio cues, demo/real mode toggle

### Harmony & Telemetry (3 contracts)
8. **HarmonyPanel**: Metrics dashboard with harmonyPercentage badge, total checks, valid/degraded/violations counts, format breakdown, recent violations (expandable)
9. **TelemetryViewer**: Table view with level/source filters, auto-refresh (10s interval), stats overview, 100-entry limit
10. **TimelineView**: Horizontal timeline with calculateTimelinePositions algorithm, parallel step stacking, StepInspector sidebar, color-coded status legend

### Step Inspection & History (2 contracts)
11. **StepInspector**: Detailed step panel with details/inputs/output/learning sections, retry/skip control buttons, ESC key close, DiscussButton integration
12. **HistoryBrowser**: Three-column layout (dates → sessions → details), 7-day retention, SessionSnapshot display with chains and events

### Testing (1 contract)
13. **WebSocketTest**: Test panel with connection status, custom message sending, event statistics, event filter, subscribe/unsubscribe controls

## Contract Structure

Each contract follows the TEMPLATE.contract.md structure with 12 sections:
1. **Identity**: Component name, introduction date, description
2. **Render Location**: Parent components, render conditions, positioning, z-index
3. **Lifecycle**: Mount triggers, key effects, cleanup actions, unmount triggers
4. **Props Contract**: Inputs, callbacks up (to parent), callbacks down (to children)
5. **State Ownership**: Local state, context consumption, derived state, custom hooks
6. **Interactions**: Parent/child/sibling/context communication patterns
7. **Side Effects**: API calls, WebSocket events, timers, localStorage, DOM manipulation, Electron IPC
8. **Test Hooks**: CSS selectors, data-testid values, ARIA labels, visual landmarks
9. **Health Checks**: Critical checks (must pass), warning checks (should pass), performance benchmarks
10. **Dependencies**: Required contexts, hooks, child components, props
11. **Notes**: Additional behavioral notes, algorithms, configuration details
12. **Version**: Contract authored date, last updated, version number

## Health Check Coverage

All contracts include:
- **Critical checks** with Chrome MCP automation scripts for:
  - Rendering verification (element exists, children render)
  - Connection validation (API/WebSocket active)
  - Interaction testing (click handlers, hover effects, keyboard shortcuts)
- **Warning checks** for non-critical but desirable behaviors
- **Performance benchmarks** with thresholds in milliseconds

## Verification
- Type check: N/A (markdown files, not TypeScript code)
- Notes: All contracts are complete with no placeholders or TODO markers

## Summary
Created 13 complete behavioral contracts for Batch G components covering Squad/Agent system, Harmony/Telemetry, Step Inspection, and Testing features. Each contract provides comprehensive behavioral documentation for health checks and E2E testing with Chrome MCP.
