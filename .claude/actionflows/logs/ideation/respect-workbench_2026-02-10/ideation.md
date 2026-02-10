# Ideation: Respect Workbench

**Date:** 2026-02-10
**Session:** ideation/respect-workbench_2026-02-10
**Context:** explore

---

## 1. Concept Summary

The **Respect Workbench** is a live spatial health monitoring panel that displays real-time boundary compliance for all visible UI components. It combines two dimensions: (1) automated spatial checks that run continuously via flow-based detection, and (2) on-demand behavioral tests that verify component interactions using Chrome MCP tools. Think of it as a "health dashboard for spatial discipline" — components appear green when respecting boundaries, yellow for warnings, red for violations, with instant visual feedback and drill-down details.

---

## 2. Architecture Decision

**Chosen Approach:** Frontend-heavy with optional backend persistence

### Rationale
- **Spatial checks run in-browser** — The existing `RESPECT_CHECK_SCRIPT` already runs via `evaluate_script` and returns structured JSON. We can invoke this same logic directly from the workbench using native browser APIs (no need for Chrome MCP in the live monitoring flow).
- **No backend endpoint needed for live checks** — The workbench component can run checks on-demand or via ResizeObserver/MutationObserver without server involvement.
- **Backend optional for history** — If we want to persist violation history or trend data, we can add a simple `/api/respect/violations` POST endpoint later. MVP doesn't need this.
- **Behavioral tests stay manual** — Chrome MCP tests are triggered by Claude (via user request). The workbench displays a registry of available behavioral tests, and the user asks Claude to run them. Results are displayed in the workbench after Claude completes execution.

### Data Flow
```
┌─────────────────────────────────────────────────────────┐
│ Respect Workbench Component                             │
│                                                         │
│  ┌──────────────────┐      ┌─────────────────────────┐ │
│  │ Live Spatial     │      │ Behavioral Test         │ │
│  │ Monitor          │      │ Registry                │ │
│  │                  │      │                         │ │
│  │ - ResizeObserver │      │ - Test definitions      │ │
│  │ - Periodic poll  │      │ - "Run" button →        │ │
│  │ - Manual trigger │      │   asks Claude           │ │
│  └────────┬─────────┘      └───────────┬─────────────┘ │
│           │                            │               │
│           ▼                            ▼               │
│  ┌──────────────────┐      ┌─────────────────────────┐ │
│  │ RESPECT_CHECK    │      │ Chrome MCP (external)   │ │
│  │ (in-browser JS)  │      │ Claude executes test    │ │
│  └────────┬─────────┘      └───────────┬─────────────┘ │
│           │                            │               │
│           ▼                            ▼               │
│  ┌──────────────────┐      ┌─────────────────────────┐ │
│  │ Results Display  │      │ Results Display         │ │
│  │ - Category view  │      │ - Test outcome          │ │
│  │ - Violation list │      │ - Assertion status      │ │
│  └──────────────────┘      └─────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Component Structure

### React Component Hierarchy
```
RespectWorkbench/
├── RespectWorkbench.tsx              # Main container
├── RespectWorkbench.css              # Styles
├── components/
│   ├── LiveSpatialMonitor.tsx        # Left panel: live checks
│   ├── BehavioralTestRegistry.tsx    # Right panel: test catalog
│   ├── CategorySection.tsx           # Collapsible category (layout-shell, sidebar, etc.)
│   ├── ViolationItem.tsx             # Single violation detail
│   ├── ComponentHealthCard.tsx       # Green/yellow/red status card per component
│   ├── BehavioralTestCard.tsx        # Test definition + "Run" button
│   └── RespectCheckControls.tsx      # Top bar: "Run Check", auto-refresh toggle
└── hooks/
    ├── useRespectCheck.ts            # Hook to run RESPECT_CHECK_SCRIPT
    └── useBehavioralTests.ts         # Hook to manage test registry
```

### Key Responsibilities
- **RespectWorkbench.tsx** — Layout shell (split view), orchestrates live monitor + test registry
- **LiveSpatialMonitor.tsx** — Runs checks, displays results by category, handles auto-refresh
- **BehavioralTestRegistry.tsx** — Displays test catalog, shows "Ask Claude to run this test" instruction
- **useRespectCheck.ts** — Wraps the RESPECT_CHECK_SCRIPT execution, returns typed results

---

## 4. Data Flow

### Live Spatial Checks
1. **User switches to Respect workbench** → `LiveSpatialMonitor` mounts
2. **Initial check runs immediately** → `useRespectCheck()` executes RESPECT_CHECK_SCRIPT
3. **Auto-refresh options:**
   - **ResizeObserver** on `.workbench-layout` → re-check on window resize
   - **Periodic polling** (every 5 seconds, user-configurable)
   - **Manual trigger** via "Run Check" button
4. **Results parsed and categorized:**
   - Group violations by `type` field (layout-shell, sidebar, topbar, panel, etc.)
   - Sort by severity (high → medium → low)
5. **Display:**
   - Category sections (collapsible)
   - Each section shows component cards (green/yellow/red)
   - Click card → expand to show violation details

### Behavioral Tests (On-Demand)
1. **User opens Behavioral Test Registry**
2. **Registry displays pre-defined tests:**
   - "Click sidebar collapse → verify width changes"
   - "Drag panel divider → verify constraints"
   - "Send 50 messages → verify no overflow"
   - "Resize to 320px → verify responsive breakpoints"
3. **User clicks "Run" on a test** → workbench shows: "Ask Claude: 'Run the [test name] behavioral test'"
4. **Claude executes test via Chrome MCP tools** (external to dashboard)
5. **Claude returns results** → user manually updates the test card status (or we add a WebSocket event later)

**Future Enhancement:** WebSocket event from backend when Claude completes a test, auto-updates the UI.

---

## 5. Category System

### Spatial Check Categories (from RESPECT_CHECK_SCRIPT)
Based on the 24 component types in `chrome-mcp-respect-helpers.ts`:

| Category | Components | Key Checks |
|----------|-----------|------------|
| **layout-shell** | `.workbench-layout`, `.workbench-body`, `.workbench-main`, `.workbench-content` | Viewport containment, no overflow |
| **topbar** | `.top-bar`, `.top-bar-tabs` | Fixed height (52px), viewport width |
| **sidebar** | `.session-sidebar`, `.sidebar-content` | Fixed width (240px), parent containment |
| **panel** | `.session-panel-layout`, `.chat-panel`, `.left-panel-stack` | Min/max width constraints |
| **content-area** | `.chat-panel__messages`, `.chat-panel__info-bar`, `.sidebar-content` | Parent containment, no overflow |
| **input** | `.chat-panel__input-field`, `.chat-panel__send-btn` | Dimension constraints (36-120px height for input, 36x36px for button) |
| **visualization** | `.flow-visualization`, `.chain-dag-container`, `.right-visualization-area` | Parent containment |
| **widget** | `.chat-bubble`, `.squad-panel` | Max-width constraints (85% for bubbles) |
| **modal** | `.command-palette-modal` | Max dimensions (600x500px) |

### Behavioral Test Categories
| Category | Tests |
|----------|-------|
| **Interaction** | Click, drag, fill, keyboard navigation |
| **Responsive** | Viewport resize, breakpoint triggers |
| **Stress** | Rapid actions, long content, edge cases |
| **State** | Component mount/unmount, show/hide transitions |

---

## 6. Behavioral Test Design

### Challenge: Chrome MCP Tools Are Called by Claude, Not by the App

The dashboard cannot directly invoke Chrome MCP tools (they're MCP server tools, not JavaScript APIs). We have three options:

#### Option A: Dashboard Defines Test Specs, Claude Reads and Executes
- **Dashboard stores test definitions** as JSON (in `test/e2e/behavioral-test-registry.json`)
- **User clicks "Run"** → dashboard displays: "To run this test, ask Claude: 'Execute behavioral test: [test ID]'"
- **Claude reads test definition** from the registry file and executes via Chrome MCP tools
- **Claude reports results** back to the user (console output or chat message)
- **User manually marks test as pass/fail** in the workbench (or we add WebSocket sync later)

**Pros:** Clean separation, no backend changes needed, extensible
**Cons:** Manual result sync (until we add WebSocket events)

#### Option B: Dashboard Sends Request → Backend Triggers MCP
- **Dashboard POST /api/respect/behavioral-tests/:testId/run**
- **Backend spawns Claude task** via CLI to execute the test
- **Backend parses Claude output** and returns results
- **Dashboard displays results** in real-time

**Pros:** Fully automated
**Cons:** Complex backend orchestration, requires CLI integration, out of scope for MVP

#### Option C: Dashboard Uses Native Browser APIs Instead of Chrome MCP
- **Behavioral tests defined as JavaScript** that runs in-browser
- **Example:** Programmatically click sidebar collapse button, measure width before/after
- **Tests run via `evaluate_script`-like logic** but invoked from within the dashboard

**Pros:** No external dependencies, self-contained
**Cons:** Limited capabilities (can't test cross-page navigation, network throttling, etc.)

### **Chosen Approach: Option A** (for MVP)
- Test definitions live in `test/e2e/behavioral-test-registry.json`
- User clicks "Run" → workbench shows instruction to ask Claude
- Claude executes via Chrome MCP
- Results displayed in workbench after user confirms completion

### Test Definition Schema
```typescript
interface BehavioralTest {
  id: string;                          // e.g., 'sidebar-collapse-width'
  name: string;                        // 'Sidebar Collapse Width Test'
  category: 'interaction' | 'responsive' | 'stress' | 'state';
  description: string;                 // What this test verifies
  steps: Array<{
    tool: string;                      // Chrome MCP tool name
    params: Record<string, unknown>;
    assertion: string;
  }>;
  severity: 'critical' | 'important' | 'nice-to-have';
  estimatedDuration: string;           // '5 seconds'
}
```

### Example Test
```json
{
  "id": "sidebar-collapse-width",
  "name": "Sidebar Collapse Width Test",
  "category": "interaction",
  "description": "Verify sidebar width changes when collapse button is clicked",
  "steps": [
    {
      "tool": "take_snapshot",
      "params": {},
      "assertion": "Find .session-sidebar element"
    },
    {
      "tool": "evaluate_script",
      "params": {
        "function": "() => document.querySelector('.session-sidebar').getBoundingClientRect().width"
      },
      "assertion": "Width should be 240px"
    },
    {
      "tool": "click",
      "params": { "uid": "<collapse-button-uid>" },
      "assertion": "Click succeeds"
    },
    {
      "tool": "evaluate_script",
      "params": {
        "function": "() => document.querySelector('.session-sidebar').getBoundingClientRect().width"
      },
      "assertion": "Width should be 48px (collapsed)"
    }
  ],
  "severity": "important",
  "estimatedDuration": "5 seconds"
}
```

---

## 7. UI Wireframe (Text-Based)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Respect Workbench                                    [Run Check] [Auto ✓] │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─────────────────────────────┬──────────────────────────────────────┐ │
│ │ Live Spatial Monitor        │ Behavioral Test Registry             │ │
│ │ (60% width)                 │ (40% width)                          │ │
│ │                             │                                      │ │
│ │ Summary: 24 components      │ Test Categories                      │ │
│ │   22 passing ✅             │                                      │ │
│ │   1 warning ⚠️              │ ▼ Interaction (4 tests)              │ │
│ │   1 violating ❌            │   ✅ Sidebar Collapse Width          │ │
│ │                             │   ⏸️ Panel Divider Drag              │ │
│ │ ▼ layout-shell (4)          │   ⏸️ Chat Input Focus                │ │
│ │   ✅ .workbench-layout      │   ⏸️ Workbench Tab Switch            │ │
│ │   ✅ .workbench-body        │                                      │ │
│ │   ✅ .workbench-main        │ ▼ Responsive (3 tests)               │ │
│ │   ✅ .workbench-content     │   ⏸️ Narrow Viewport (320px)         │ │
│ │                             │   ⏸️ Wide Viewport (2560px)          │ │
│ │ ▼ sidebar (2)               │   ⏸️ Tablet Breakpoint               │ │
│ │   ✅ .session-sidebar       │                                      │ │
│ │   ⚠️ .sidebar-content       │ ▼ Stress (2 tests)                   │ │
│ │     → Vertical overflow     │   ⏸️ Send 50 Messages                │ │
│ │        (scrollHeight: 820px)│   ⏸️ Very Long Message (500 chars)  │ │
│ │                             │                                      │ │
│ │ ▼ panel (3)                 │ [Selected: Sidebar Collapse Width]   │ │
│ │   ✅ .session-panel-layout  │                                      │ │
│ │   ✅ .chat-panel            │ Description:                         │ │
│ │   ❌ .left-panel-stack      │ Verify sidebar width changes when    │ │
│ │     → Width exceeds 50%     │ collapse button is clicked.          │ │
│ │        of parent            │                                      │ │
│ │        (actual: 680px)      │ Steps: 4                             │ │
│ │                             │ Severity: Important                  │ │
│ │ ▼ input (2)                 │ Duration: ~5 seconds                 │ │
│ │   ✅ .chat-panel__input     │                                      │ │
│ │   ✅ .chat-panel__send-btn  │ [Run Test]                           │ │
│ │                             │                                      │ │
│ │ ... (more categories)       │ To run this test, ask Claude:        │ │
│ │                             │ "Execute behavioral test:            │ │
│ │                             │  sidebar-collapse-width"             │ │
│ └─────────────────────────────┴──────────────────────────────────────┘ │
│                                                                          │
│ Last Check: 2026-02-10 14:32:15 | Next Auto-Check: 4s                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Visual Design Notes
- **Top Controls:**
  - "Run Check" button (manual trigger)
  - "Auto ✓" toggle (enable/disable auto-refresh)
  - "Every 5s" dropdown (change polling interval)
- **Left Panel (Live Spatial Monitor):**
  - Summary stats at top (total, passing, warning, violating)
  - Collapsible category sections
  - Component cards with status icon (✅⚠️❌)
  - Click card → expand to show violation details (expected vs actual)
- **Right Panel (Behavioral Test Registry):**
  - Collapsible category sections
  - Test cards with status: ⏸️ (not run), ✅ (passed), ❌ (failed)
  - Click test → show description, steps, severity
  - "Run Test" button → displays instruction to ask Claude
- **Bottom Status Bar:**
  - Last check timestamp
  - Next auto-check countdown (if auto-refresh enabled)

---

## 8. MVP Scope

### Phase 1: Core Spatial Monitoring (MVP)
**Deliverables:**
1. `RespectWorkbench.tsx` — Main workbench component
2. `LiveSpatialMonitor.tsx` — Left panel with category view
3. `useRespectCheck.ts` — Hook that runs RESPECT_CHECK_SCRIPT in-browser
4. `CategorySection.tsx` + `ComponentHealthCard.tsx` — UI components for violation display
5. **Manual trigger only** — "Run Check" button (no auto-refresh yet)
6. **Categorized display** — Group by component type, show violations with expected/actual

**Out of MVP:**
- Auto-refresh (ResizeObserver, polling)
- Behavioral test registry (right panel)
- Violation history/trends
- Visual overlay mode (highlight violating components on-screen)
- Backend persistence

### Phase 2: Auto-Refresh + Controls
**Deliverables:**
1. Auto-refresh toggle + interval selector
2. ResizeObserver integration (re-check on window resize)
3. Periodic polling (every N seconds)
4. Enhanced controls (pause/resume, clear results)

### Phase 3: Behavioral Test Registry
**Deliverables:**
1. `BehavioralTestRegistry.tsx` — Right panel
2. `test/e2e/behavioral-test-registry.json` — Test definitions
3. `BehavioralTestCard.tsx` — Test display + "Run" instruction
4. 5-10 example behavioral tests (sidebar collapse, panel drag, chat overflow, etc.)

### Phase 4: Advanced Features
**Deliverables:**
1. Violation overlay mode (draw red boxes around violating components)
2. History tracking (store last 10 checks, show trend graph)
3. Backend persistence (`/api/respect/violations` endpoint)
4. WebSocket integration (auto-update when Claude completes behavioral tests)
5. Export report (JSON, Markdown, or PDF)

---

## 9. Open Questions

### 1. Auto-Refresh Performance Impact
**Question:** Running RESPECT_CHECK_SCRIPT every 5 seconds on 24 components — will this cause UI lag?
**Options:**
- A. Light mode: Only check layout-shell + topbar (most critical)
- B. Smart triggers: Only re-check when DOM mutations detected (MutationObserver)
- C. User-configurable: Let user choose between "light" (critical only) and "full" (all 24)
**Decision:** Start with full checks (24 components), optimize if performance issues arise. The script is fast (< 10ms per check).

### 2. Behavioral Test Result Sync
**Question:** How do we get behavioral test results back into the workbench after Claude executes them?
**Options:**
- A. Manual sync: User clicks "Mark as Passed/Failed" after Claude reports
- B. WebSocket event: Backend sends `BehavioralTestCompleted` event with results
- C. Clipboard integration: Claude copies results to clipboard, user pastes into workbench
**Decision:** MVP uses Option A (manual sync). Option B deferred to Phase 4.

### 3. Violation Severity Thresholds
**Question:** Should we auto-flag components with medium violations if they cross a threshold (e.g., 3+ medium = high)?
**Options:**
- A. Keep severity as-is (script-defined)
- B. Add workbench-level threshold logic
**Decision:** Keep as-is for MVP. Add threshold logic in Phase 4 if users request it.

### 4. Workbench Tab Placement
**Question:** Where does "Respect" appear in the TopBar tabs?
**Options:**
- A. After "Intel" (before "Canvas")
- B. After "Canvas" (before "Editor")
- C. At the end (after "Editor")
**Decision:** After "Intel", before "Canvas" (Respect is a QA/monitoring tool, similar to Harmony, fits between intel gathering and visual editing).

### 5. Known Overflow Exceptions
**Question:** `.workbench-bottom` has `knownOverflowVisible: true` — should we hide these from the violations list?
**Options:**
- A. Show but mark as "Expected Overflow" (gray/neutral status)
- B. Hide entirely from results
- C. Show in separate "Known Exceptions" section
**Decision:** Option A (show but mark as expected). Transparency is better than hiding.

### 6. Integration with Harmony Workbench
**Question:** Should Respect violations feed into the Harmony system (treat spatial violations as "sins")?
**Options:**
- A. Keep separate (Respect = spatial health, Harmony = contract sync)
- B. Cross-link (Harmony shows spatial violations as a category)
- C. Unified (merge Respect into Harmony as a sub-panel)
**Decision:** Keep separate for MVP. Both are monitoring tools but serve different purposes. Cross-linking can be added in Phase 4.

---

## Implementation Notes

### File Locations
```
packages/app/src/components/Workbench/
├── RespectWorkbench/
│   ├── RespectWorkbench.tsx
│   ├── RespectWorkbench.css
│   ├── components/
│   │   ├── LiveSpatialMonitor.tsx
│   │   ├── BehavioralTestRegistry.tsx
│   │   ├── CategorySection.tsx
│   │   ├── ViolationItem.tsx
│   │   ├── ComponentHealthCard.tsx
│   │   ├── BehavioralTestCard.tsx
│   │   └── RespectCheckControls.tsx
│   └── hooks/
│       ├── useRespectCheck.ts
│       └── useBehavioralTests.ts

packages/app/src/components/TopBar/
└── TopBar.tsx (add "Respect" tab)

packages/shared/src/
├── models.ts (add RespectCheckResult, BehavioralTest types)
└── index.ts (export new types)

test/e2e/
└── behavioral-test-registry.json (Phase 3)
```

### Type Definitions
```typescript
// packages/shared/src/models.ts

export interface RespectCheckResult {
  timestamp: string;
  viewportWidth: number;
  viewportHeight: number;
  totalChecked: number;
  totalElementsFound: number;
  totalViolations: number;
  violations: Array<{
    selector: string;
    type: ComponentType;
    violations: Array<{
      type: ViolationType;
      severity: 'high' | 'medium' | 'low';
      message: string;
      expected: string;
      actual: string;
    }>;
    metrics: {
      width: number;
      height: number;
      scrollWidth: number;
      scrollHeight: number;
      clientWidth: number;
      clientHeight: number;
    };
  }>;
  summary: {
    high: number;
    medium: number;
    low: number;
  };
  clean: Array<{
    selector: string;
    type: ComponentType;
    width: number;
    height: number;
  }>;
}

export type ComponentType =
  | 'layout-shell'
  | 'topbar'
  | 'sidebar'
  | 'panel'
  | 'content-area'
  | 'input'
  | 'visualization'
  | 'widget'
  | 'modal';

export type ViolationType =
  | 'horizontal_overflow'
  | 'vertical_overflow'
  | 'viewport_escape'
  | 'fixed_dim_mismatch'
  | 'min_constraint'
  | 'max_constraint'
  | 'parent_escape';

export interface BehavioralTest {
  id: string;
  name: string;
  category: 'interaction' | 'responsive' | 'stress' | 'state';
  description: string;
  steps: Array<{
    tool: string;
    params: Record<string, unknown>;
    assertion: string;
  }>;
  severity: 'critical' | 'important' | 'nice-to-have';
  estimatedDuration: string;
}
```

### useRespectCheck Hook (Core Logic)
```typescript
// packages/app/src/components/Workbench/RespectWorkbench/hooks/useRespectCheck.ts

import { useState, useCallback } from 'react';
import type { RespectCheckResult } from '@afw/shared';

// Import the RESPECT_CHECK_SCRIPT (we'll need to extract it to a shared location)
const RESPECT_CHECK_SCRIPT = `...`; // Copy from chrome-mcp-respect-helpers.ts

export function useRespectCheck() {
  const [result, setResult] = useState<RespectCheckResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const runCheck = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      // Execute the check script in the current document context
      // This is equivalent to Chrome MCP's evaluate_script but runs locally
      const checkFunction = new Function(`return ${RESPECT_CHECK_SCRIPT}`);
      const checkResult = checkFunction() as RespectCheckResult;

      setResult(checkResult);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsRunning(false);
    }
  }, []);

  return {
    result,
    isRunning,
    error,
    runCheck,
  };
}
```

---

## Success Criteria

### MVP Success Metrics
1. **Functional:**
   - Workbench loads without errors
   - "Run Check" button triggers RESPECT_CHECK_SCRIPT successfully
   - Results display in categorized view
   - All 24 components from the script show up in the UI
   - Violation details (expected/actual) are readable
2. **Visual:**
   - Green/yellow/red status is clear
   - Categories are collapsible
   - Layout is responsive (works on 1280px+ screens)
3. **Performance:**
   - Check completes in < 100ms
   - UI remains responsive during checks
   - No console errors or warnings

### Phase 2 Success Metrics
- Auto-refresh toggle works
- ResizeObserver triggers re-check on window resize
- Polling interval selector (5s, 10s, 30s) works
- User can pause/resume auto-refresh

### Phase 3 Success Metrics
- Behavioral test registry displays 5+ tests
- Test cards show description, steps, severity
- "Run" button displays Claude instruction
- User can manually mark tests as passed/failed

---

## Next Steps

1. **Update shared types** — Add `RespectCheckResult`, `ComponentType`, `ViolationType`, `BehavioralTest` to `packages/shared/src/models.ts`
2. **Add Respect workbench ID** — Update `WORKBENCH_IDS` in `packages/shared/src/models.ts` to include `'respect'`
3. **Create component directory** — `packages/app/src/components/Workbench/RespectWorkbench/`
4. **Build MVP components:**
   - `RespectWorkbench.tsx` (layout shell)
   - `LiveSpatialMonitor.tsx` (left panel)
   - `useRespectCheck.ts` (core hook)
   - `CategorySection.tsx` (collapsible category)
   - `ComponentHealthCard.tsx` (status card)
   - `RespectCheckControls.tsx` (top bar controls)
5. **Wire into WorkbenchLayout** — Add `RespectWorkbench` to the switch statement in `WorkbenchLayout.tsx`
6. **Add TopBar tab** — Update `TopBar.tsx` to include "Respect" tab (after "Intel")
7. **Test:** Load workbench, click "Run Check", verify results display

---

## Conclusion

The Respect Workbench is a **practical, MVP-scoped monitoring tool** that reuses existing spatial check logic and integrates cleanly into the ActionFlows Dashboard. By splitting spatial checks (automated, in-browser) from behavioral tests (on-demand, Claude-executed), we achieve a buildable-in-one-session solution that provides immediate value while leaving room for advanced features in later phases.

**Key Innovation:** The workbench acts as a "living documentation" for spatial discipline — not just a one-time test run, but a persistent health monitor that developers check regularly to ensure the UI stays within bounds as features evolve.

**Estimated Build Time:** 2-3 hours for MVP (Phase 1), assuming no major blockers.
