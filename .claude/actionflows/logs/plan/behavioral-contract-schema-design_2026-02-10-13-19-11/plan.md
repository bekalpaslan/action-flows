# Implementation Plan: Component Behavioral Contract Index Schema

## Overview

Design a structured behavioral contract schema for 110+ frontend components that enables automated health checks, E2E test generation, and component interaction verification. The schema will serve as a single source of truth for component behavior, render conditions, lifecycle, side effects, and test targeting.

**Key Goals:**
1. Machine-parseable contract definitions for each component
2. Human-readable for manual authoring and code review
3. Integration with Playwright E2E tests and Chrome DevTools MCP
4. Health check automation (component integrity, connection status, render verification)
5. Contract-driven test scaffold generation

---

## 1. Contract Schema Design

### 1.1 Core Schema Structure

Each component contract defines:

```typescript
interface ComponentBehavioralContract {
  // === Identity ===
  identity: {
    componentName: string;              // e.g., "ChatPanel", "FlowVisualization"
    filePath: string;                   // relative to packages/app/src/
    parentGroup: string;                // directory group (SessionPanel, Canvas, etc.)
    type: ComponentType;                // 'page' | 'feature' | 'widget' | 'utility'
    introduced: string;                 // ISO date when component was created
  };

  // === Render Location ===
  renderLocation: {
    mountsUnder: string[];              // parent components (e.g., ["WorkbenchLayout", "WorkWorkbench"])
    conditions: RenderCondition[];      // when it renders
    position: 'fixed' | 'relative' | 'absolute' | 'sticky' | null;
    zIndex?: number;                    // if stacking context matters
  };

  // === Lifecycle ===
  lifecycle: {
    mountTriggers: string[];            // what causes mount (e.g., "session attached", "user clicks tab")
    keyEffects: LifecycleEffect[];      // useEffect dependencies + side effects
    cleanup: string[];                  // cleanup actions on unmount
    unmountTriggers: string[];          // what causes unmount
  };

  // === Props Contract ===
  propsContract: {
    inputs: PropField[];                // all props with types, required/optional, defaults
    callbacksUp: CallbackProp[];        // event handlers passed to component
    callbacksDown: CallbackProp[];      // event handlers component passes to children
  };

  // === State Ownership ===
  stateOwnership: {
    localState: StateField[];           // useState declarations
    contextConsumption: ContextField[]; // which contexts it reads from
    derivedState: DerivedField[];       // useMemo/useCallback computed values
    customHooks: string[];              // custom hooks used (e.g., "useSessionSidebar")
  };

  // === Interactions ===
  interactions: {
    parentCommunication: ParentInteraction[];      // how it talks to parents
    childCommunication: ChildInteraction[];        // how it talks to children
    siblingCommunication: SiblingInteraction[];    // sibling component coordination
    contextCommunication: ContextInteraction[];    // context provider/consumer patterns
  };

  // === Side Effects ===
  sideEffects: {
    apiCalls: APICall[];                // HTTP requests
    webSocketEvents: WebSocketEvent[];  // WS subscriptions
    timers: Timer[];                    // setTimeout/setInterval
    localStorage: LocalStorageOp[];     // localStorage read/write
    domManipulation: DOMManipulation[]; // direct DOM access
    electronIPC?: ElectronIPC[];        // Electron IPC (if applicable)
  };

  // === Test Hooks ===
  testHooks: {
    cssSelectors: string[];             // CSS class names for targeting
    dataTestIds?: string[];             // data-testid attributes (if present)
    ariaLabels?: string[];              // aria-label values for accessibility targeting
    visualLandmarks: VisualLandmark[];  // unique visual markers for snapshot identification
  };

  // === Health Check Criteria ===
  healthChecks: {
    critical: HealthCheck[];            // must pass for component to be "healthy"
    warning: HealthCheck[];             // should pass but non-blocking
    performance: PerformanceCheck[];    // optional performance benchmarks
  };

  // === Dependencies ===
  dependencies: {
    contexts: string[];                 // context providers it depends on
    hooks: string[];                    // custom hooks it uses
    childComponents: string[];          // components it renders
    requiredProps: string[];            // props that must be provided
  };

  // === Metadata ===
  metadata: {
    lastReviewed: string;               // ISO date of last contract review
    contractVersion: string;            // semantic version of contract schema
    notes?: string;                     // freeform notes for developers
  };
}
```

### 1.2 Supporting Type Definitions

```typescript
type ComponentType = 'page' | 'feature' | 'widget' | 'utility';
// - page: Top-level workbench (WorkWorkbench, ExploreWorkbench)
// - feature: Major component (SessionPanel, FlowVisualization, ChatPanel)
// - widget: Reusable UI element (DiscussButton, ChainBadge, ThemeToggle)
// - utility: Pure utility component (no state, pure presentation)

interface RenderCondition {
  type: 'prop' | 'context' | 'state' | 'route';
  description: string;
  code: string;  // condition expression (e.g., "session !== null")
}

interface LifecycleEffect {
  dependencies: string[];             // useEffect deps array
  sideEffects: string[];              // what the effect does
  cleanup?: string;                   // cleanup function if any
  runCondition?: string;              // when this effect runs
}

interface PropField {
  name: string;
  type: string;                       // TypeScript type string
  required: boolean;
  defaultValue?: string;
  description: string;
}

interface CallbackProp {
  name: string;
  signature: string;                  // function signature
  description: string;
  emittedBy?: string;                 // which child emits this callback
}

interface StateField {
  name: string;
  type: string;
  initialValue: string;
  updatedBy: string[];                // which functions update this state
}

interface ContextField {
  contextName: string;                // e.g., "WebSocketContext"
  valuesConsumed: string[];           // which values from context (e.g., ["send", "subscribe"])
}

interface DerivedField {
  name: string;
  type: string;
  dependencies: string[];
  computation: string;                // description of how it's computed
}

interface ParentInteraction {
  mechanism: 'prop-callback' | 'context' | 'event';
  description: string;
  example?: string;
}

interface ChildInteraction {
  childComponent: string;
  mechanism: 'props' | 'context' | 'ref';
  dataFlow: string;                   // what data is passed
}

interface SiblingInteraction {
  sibling: string;
  mechanism: 'context' | 'parent-mediated' | 'event';
  description: string;
}

interface ContextInteraction {
  contextName: string;
  role: 'provider' | 'consumer';
  operations: string[];               // what it does with context
}

interface APICall {
  endpoint: string;                   // e.g., "/api/sessions"
  method: string;                     // GET, POST, PUT, DELETE
  trigger: string;                    // what causes this call
  response: string;                   // what happens with response
}

interface WebSocketEvent {
  eventType: string;                  // e.g., "session:started"
  trigger: string;                    // when subscription starts
  handler: string;                    // what happens when event received
}

interface Timer {
  type: 'timeout' | 'interval';
  duration: number;                   // milliseconds
  purpose: string;
  cleanup: boolean;                   // whether it's cleaned up on unmount
}

interface LocalStorageOp {
  key: string;
  operation: 'read' | 'write';
  trigger: string;
  value?: string;
}

interface DOMManipulation {
  target: string;                     // what DOM element/property
  operation: string;                  // what is done
  trigger: string;
}

interface ElectronIPC {
  channel: string;
  direction: 'send' | 'receive';
  purpose: string;
}

interface VisualLandmark {
  description: string;                // e.g., "blue 'Send' button in bottom-right"
  cssClass: string;
  uniqueFeature: string;              // what makes it unique visually
}

interface HealthCheck {
  id: string;                         // unique check ID
  type: HealthCheckType;
  target: string;                     // what to check
  condition: string;                  // success condition
  failureMode: string;                // what breaks if this fails
  automationScript?: string;          // Chrome MCP script to run this check
}

type HealthCheckType =
  | 'render'                          // component renders without error
  | 'connection'                      // WebSocket/API connection established
  | 'context-registration'            // registered with required context
  | 'timeout'                         // operation completes within time limit
  | 'data-fetch'                      // data successfully loaded
  | 'interaction'                     // user interaction works
  | 'boundary'                        // spatial boundaries respected
  | 'accessibility';                  // accessibility features present

interface PerformanceCheck {
  metric: 'render-time' | 'bundle-size' | 'memory' | 'interaction-delay';
  threshold: number;
  unit: string;
  description: string;
}
```

---

## 2. Format Decision

### 2.1 Format Comparison

| Format | Pros | Cons | Decision |
|--------|------|------|----------|
| **Structured Markdown** | Human-readable, git-diff friendly, easy to author, supports code blocks and tables | Requires custom parser, less strict validation | ✅ **RECOMMENDED** |
| **YAML** | Structured, parseable, widely supported | Verbose, whitespace-sensitive, harder to read for large contracts | ❌ Not chosen |
| **JSON** | Machine-parseable, strict validation, TypeScript integration | Not human-friendly, no comments, hard to author/review | ❌ Not chosen |
| **TypeScript data files** | Type-safe, IDE-integrated, compile-time validation | Requires build step, harder for non-TS users to read | ⚠️ Considered for validation layer |

### 2.2 Chosen Format: Structured Markdown

**Rationale:**
1. **Human-readable**: Developers can author and review contracts without tooling
2. **Git-diff friendly**: Changes are easy to review in PRs
3. **Extensible**: Can add new sections without breaking existing contracts
4. **Documentation-friendly**: Contracts double as component documentation
5. **Parsing**: Can build custom parser for automation (Playwright, health checks)

**Validation Layer:**
- TypeScript interfaces (`packages/shared/src/contracts/ComponentContract.ts`) define schema
- Validation script (`packages/shared/src/contracts/validate.ts`) parses markdown and validates against schema
- CI integration ensures contracts stay in sync with components

### 2.3 Markdown Contract Template

```markdown
# Component Contract: {ComponentName}

**File:** `{relative/path/to/Component.tsx}`
**Type:** {page | feature | widget | utility}
**Parent Group:** {directory group}
**Contract Version:** 1.0.0
**Last Reviewed:** {YYYY-MM-DD}

---

## Identity

- **Component Name:** {ComponentName}
- **Introduced:** {YYYY-MM-DD}
- **Description:** {Brief 1-2 sentence description}

---

## Render Location

**Mounts Under:**
- {ParentComponent1}
- {ParentComponent2}

**Render Conditions:**
1. {Condition description} (`{code expression}`)
2. {Another condition} (`{code expression}`)

**Positioning:** {fixed | relative | absolute | sticky | null}
**Z-Index:** {number or N/A}

---

## Lifecycle

**Mount Triggers:**
- {trigger 1}
- {trigger 2}

**Key Effects:**
1. **Dependencies:** `[dep1, dep2]`
   - **Side Effects:** {what it does}
   - **Cleanup:** {cleanup if any}
   - **Condition:** {when it runs}

**Cleanup Actions:**
- {cleanup 1}
- {cleanup 2}

**Unmount Triggers:**
- {trigger 1}

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| {prop1} | {type} | ✅ / ❌ | {default or N/A} | {description} |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| {callback1} | `(arg: Type) => void` | {what it does} |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| {callback1} | `(arg: Type) => void` | {ChildComponent} | {what it does} |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| {state1} | {type} | {initial} | {function1, function2} |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| {ContextName} | {value1, value2} |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| {derived1} | {type} | `[dep1, dep2]` | {how computed} |

### Custom Hooks
- `{useHookName()}` — {description}

---

## Interactions

### Parent Communication
- **Mechanism:** {prop-callback | context | event}
- **Description:** {how it talks to parent}
- **Example:** {code snippet or flow}

### Child Communication
- **Child:** {ChildComponent}
- **Mechanism:** {props | context | ref}
- **Data Flow:** {what data is passed}

### Sibling Communication
- **Sibling:** {SiblingComponent}
- **Mechanism:** {context | parent-mediated | event}
- **Description:** {how coordination happens}

### Context Interaction
- **Context:** {ContextName}
- **Role:** {provider | consumer}
- **Operations:** {what it does}

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| `/api/{path}` | {GET/POST/etc} | {when called} | {what happens} |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| `{event:type}` | {when subscribed} | {what happens} |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| {timeout/interval} | {ms} | {why} | ✅ / ❌ |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| `{key}` | {read/write} | {when} | {what value} |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| {element} | {what is done} | {when} |

### Electron IPC (if applicable)
| Channel | Direction | Purpose |
|---------|-----------|---------|
| `{channel}` | {send/receive} | {why} |

---

## Test Hooks

**CSS Selectors:**
- `.{class-name-1}`
- `.{class-name-2}`

**Data Test IDs:**
- `data-testid="{test-id}"`

**ARIA Labels:**
- `aria-label="{label}"`

**Visual Landmarks:**
1. {Description} (`.{css-class}`) — {unique feature}

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-{ID}: {Check Name}
- **Type:** {render | connection | context-registration | etc}
- **Target:** {what to check}
- **Condition:** {success condition}
- **Failure Mode:** {what breaks}
- **Automation Script:**
```javascript
// Chrome MCP script
{script here}
```

### Warning Checks (Should Pass)

#### HC-{ID}: {Check Name}
- **Type:** {type}
- **Target:** {what to check}
- **Condition:** {success condition}
- **Failure Mode:** {degraded behavior}

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| {render-time} | {100} | {ms} | {Time to first paint} |

---

## Dependencies

**Required Contexts:**
- {ContextName1}
- {ContextName2}

**Required Hooks:**
- `{useHookName()}`

**Child Components:**
- {ChildComponent1}
- {ChildComponent2}

**Required Props:**
- `{prop1}`
- `{prop2}`

---

## Notes

{Any freeform notes for developers}

---

**Contract Authored:** {YYYY-MM-DD}
**Last Updated:** {YYYY-MM-DD}
**Version:** {semver}
```

---

## 3. Storage Location

### 3.1 Directory Structure

```
packages/app/src/contracts/
├── README.md                          # Contract system documentation
├── schema.ts                          # TypeScript schema definitions
├── validate.ts                        # Validation script
├── index.ts                           # Re-exports all contracts
├── contexts/                          # Context provider contracts
│   ├── WebSocketContext.contract.md
│   ├── WorkbenchContext.contract.md
│   ├── ThemeContext.contract.md
│   ├── ToastContext.contract.md
│   ├── VimNavigationContext.contract.md
│   ├── DiscussContext.contract.md
│   └── index.ts
├── hooks/                             # Custom hook contracts (if needed)
│   ├── useSessionSidebar.contract.md
│   ├── useWebSocket.contract.md
│   └── index.ts
└── components/                        # Component contracts grouped by directory
    ├── SessionPanel/
    │   ├── SessionPanelLayout.contract.md
    │   ├── LeftPanelStack.contract.md
    │   ├── RightVisualizationArea.contract.md
    │   ├── ResizeHandle.contract.md
    │   └── index.ts
    ├── Canvas/
    │   ├── FlowVisualization.contract.md
    │   ├── AnimatedStepNode.contract.md
    │   ├── AnimatedFlowEdge.contract.md
    │   ├── SwimlaneBackground.contract.md
    │   └── index.ts
    ├── ChatPanel/
    │   ├── ConversationPanel.contract.md
    │   ├── InlineButtons.contract.md
    │   └── index.ts
    ├── DiscussButton/
    │   ├── DiscussButton.contract.md
    │   ├── DiscussDialog.contract.md
    │   └── index.ts
    ├── Workbench/
    │   ├── WorkbenchLayout.contract.md
    │   ├── WorkWorkbench.contract.md
    │   ├── ExploreWorkbench.contract.md
    │   ├── HarmonyWorkbench.contract.md
    │   ├── PMWorkbench.contract.md
    │   ├── ArchiveWorkbench.contract.md
    │   └── index.ts
    ├── SessionSidebar/
    │   ├── SessionSidebar.contract.md
    │   ├── SessionSidebarItem.contract.md
    │   └── index.ts
    ├── Terminal/
    │   ├── ClaudeCliTerminal.contract.md
    │   ├── TerminalPanel.contract.md
    │   └── index.ts
    └── common/                        # Reusable widgets
        ├── DiscussButton.contract.md
        ├── ChainBadge.contract.md
        ├── HarmonyBadge.contract.md
        ├── GlowIndicator.contract.md
        ├── ThemeToggle.contract.md
        ├── CommandPalette.contract.md
        ├── Toast.contract.md
        └── index.ts
```

### 3.2 Naming Conventions

- **File name format:** `{ComponentName}.contract.md`
- **Group by directory:** Mirror `packages/app/src/components/` structure
- **Index files:** Each directory has `index.ts` that re-exports contract metadata

### 3.3 Contract Metadata Export

Each directory's `index.ts` exports contract metadata for programmatic access:

```typescript
// packages/app/src/contracts/components/SessionPanel/index.ts
import SessionPanelLayoutContract from './SessionPanelLayout.contract.md?raw';
import LeftPanelStackContract from './LeftPanelStack.contract.md?raw';
// ... more imports

export const sessionPanelContracts = {
  SessionPanelLayout: SessionPanelLayoutContract,
  LeftPanelStack: LeftPanelStackContract,
  // ... more contracts
};

export const sessionPanelContractNames = Object.keys(sessionPanelContracts);
```

---

## 4. Integration Points

### 4.1 Playwright E2E Tests

**Goal:** Auto-generate test scaffolds from contracts

**Implementation:**
1. **Contract parser** (`packages/shared/src/contracts/parse.ts`) extracts:
   - Test hooks (CSS selectors, data-testid)
   - Health checks with automation scripts
   - Side effects (API calls, WebSocket events)
   - Render conditions

2. **Test generator** (`packages/shared/src/contracts/generate-tests.ts`):
   - Reads all contracts
   - Generates Playwright test files in `test/e2e/generated/`
   - One test suite per component with critical health checks

3. **Generated test structure:**
```typescript
// test/e2e/generated/ChatPanel.test.ts (auto-generated)
import { test, expect } from '@playwright/test';
import { ChatPanelContract } from '../../../packages/app/src/contracts/components/ChatPanel';

test.describe('ChatPanel - Contract-Driven Health Checks', () => {
  test('HC-CP001: Renders without error when session provided', async ({ page }) => {
    // Generated from contract health check
    await page.goto('http://localhost:5173');
    // ... test implementation from automation script
  });

  test('HC-CP002: Registers with DiscussContext on mount', async ({ page }) => {
    // Generated from contract health check
    // ... test implementation
  });

  // ... more tests from contract
});
```

4. **Manual test enrichment:**
   - Generated tests are READ-ONLY (regenerated on contract change)
   - Manual tests live in `test/e2e/manual/` and reference contracts

### 4.2 Chrome DevTools MCP Integration

**Goal:** Use contracts for snapshot-based health checks

**Implementation:**
1. **Contract-to-MCP script converter** (`packages/shared/src/contracts/mcp-scripts.ts`):
   - Extracts health check automation scripts from contracts
   - Converts to Chrome MCP tool calls

2. **Health check runner** (orchestrator action `chrome-mcp-health-check/`):
   - Reads contracts
   - Executes health checks via Chrome MCP
   - Reports pass/fail for each component

3. **Respect check integration:**
   - Existing respect check script validates spatial boundaries
   - Contract defines additional checks (connection, context registration, data loading)

### 4.3 Framework Health Checks

**Goal:** `pnpm run health:check` validates contracts against actual components

**Implementation:**
1. **Health check CLI** (`packages/app/src/cli/health-check.ts`):
   - Reads all contracts
   - Validates contract schema compliance
   - Checks for contract drift (component exists but no contract, contract exists but no component)

2. **Contract drift detection:**
```bash
$ pnpm run health:check

✅ 110 components have contracts
⚠️  5 components missing contracts:
   - packages/app/src/components/NewComponent.tsx
   - packages/app/src/components/AnotherComponent.tsx

❌ 2 contracts with no corresponding component:
   - packages/app/src/contracts/components/RemovedComponent.contract.md

✅ All contracts valid (schema v1.0.0)
```

3. **Contract validation:**
   - Parse markdown contracts
   - Validate against TypeScript schema
   - Check required sections present
   - Verify health check IDs unique

### 4.4 CI/CD Integration

**Goal:** Prevent contract drift, enforce contract updates

**Implementation:**
1. **Pre-commit hook** (`.husky/pre-commit`):
   - Run `pnpm run health:check`
   - Block commit if contract drift detected
   - Warn if contracts not updated for changed components

2. **CI pipeline** (`.github/workflows/contract-check.yml`):
   - Run health check on every PR
   - Generate test coverage report (contract coverage vs actual tests)
   - Block merge if critical health checks fail

3. **Contract coverage report:**
```bash
$ pnpm run health:coverage

Contract Coverage Report:
- 110 components defined
- 95 components have E2E tests (86%)
- 105 components have critical health checks (95%)
- 85 components have performance benchmarks (77%)

Missing E2E tests:
- WidgetRenderer (IntelDossier)
- CodeHealthMeter (IntelDossier)
- ... (15 total)
```

---

## 5. Component Grouping for Batch Authoring

### 5.1 Batch Strategy

**Approach:** Group by directory/domain, parallelize within groups

**Rationale:**
- Components in same directory share patterns (props, state, lifecycle)
- Can author multiple contracts in parallel within a batch
- Dependencies between batches are minimal (shared types already documented)

### 5.2 Batch Definitions

#### Batch 1: Context Providers (Priority 1 — Foundation)
**Components:** 7 contracts
- WebSocketContext
- WorkbenchContext
- ThemeContext
- ToastContext
- VimNavigationContext
- DiscussContext
- (No dependencies on other components)

**Why first:** All other components depend on these

**Parallelization:** Can author all 7 in parallel (no inter-dependencies)

---

#### Batch 2: Core Layout (Priority 2 — Shell)
**Components:** 4 contracts
- AppContent
- WorkbenchLayout
- TopBar
- DashboardSidebar

**Dependencies:** Batch 1 (contexts)

**Parallelization:** Can author all 4 in parallel

---

#### Batch 3: Session Management (Priority 3 — Core Feature)
**Components:** 5 contracts
- SessionSidebar
- SessionSidebarItem
- SessionPane
- SessionArchive
- SessionTree

**Dependencies:** Batch 1 (contexts), Batch 2 (layout)

**Parallelization:** Can author all 5 in parallel

---

#### Batch 4: Session Panel System (Priority 4 — Core Feature)
**Components:** 6 contracts
- SessionPanelLayout
- LeftPanelStack
- RightVisualizationArea
- ResizeHandle
- FolderHierarchy
- ChatPanel (ConversationPanel)

**Dependencies:** Batch 1, Batch 3

**Parallelization:** Can author all 6 in parallel

---

#### Batch 5: Canvas & Visualization (Priority 5 — Core Feature)
**Components:** 9 contracts
- FlowVisualization
- AnimatedStepNode
- AnimatedFlowEdge
- SwimlaneBackground
- ChainDAG
- StepNode
- HybridFlowViz
- ChainDemo
- ChainLiveMonitor

**Dependencies:** Batch 1 (WebSocketContext)

**Parallelization:** Can author all 9 in parallel

---

#### Batch 6: Discussion System (Priority 6 — Feature)
**Components:** 3 contracts
- DiscussButton
- DiscussDialog
- InlineButtons (with InlineButtonItem)

**Dependencies:** Batch 1 (DiscussContext), Batch 4 (ChatPanel)

**Parallelization:** Can author all 3 in parallel

---

#### Batch 7: Terminal Components (Priority 7 — Feature)
**Components:** 6 contracts
- ClaudeCliTerminal
- TerminalPanel
- ProjectSelector
- ProjectForm
- ClaudeCliStartDialog
- DiscoveredSessionsList

**Dependencies:** Batch 1 (WebSocketContext)

**Parallelization:** Can author all 6 in parallel

---

#### Batch 8: Workbench-Specific Screens (Priority 8 — Features)
**Components:** 12 contracts
- WorkWorkbench
- MaintenanceWorkbench
- ExploreWorkbench
- ReviewWorkbench
- ArchiveWorkbench
- SettingsWorkbench
- PMWorkbench
- HarmonyWorkbench
- CanvasWorkbench
- EditorWorkbench
- IntelWorkbench
- RespectWorkbench (with sub-components)

**Dependencies:** Batch 1, Batch 2, Batch 3, Batch 4

**Parallelization:** Can author all 12 in parallel

---

#### Batch 9: File Explorer & Editor (Priority 9 — Feature)
**Components:** 5 contracts
- FileExplorer
- FileTree
- FileIcon
- CodeEditor
- EditorTabs

**Dependencies:** Batch 1

**Parallelization:** Can author all 5 in parallel

---

#### Batch 10: Intel & Dossier System (Priority 10 — Feature)
**Components:** 11 contracts
- DossierView
- DossierList
- DossierCreationDialog
- WidgetRenderer
- StatCard (widget)
- InsightCard (widget)
- AlertPanel (widget)
- CodeHealthMeter (widget)
- FileTree (widget)
- SnippetPreview (widget)
- Unknown (widget)

**Dependencies:** Batch 1

**Parallelization:** Can author all 11 in parallel

---

#### Batch 11: Registry & Navigation (Priority 11 — Feature)
**Components:** 4 contracts
- RegistryBrowser
- RegistryEntryCard
- PackCard
- CommandPalette (with Input/Results)

**Dependencies:** Batch 1 (contexts)

**Parallelization:** Can author all 4 in parallel

---

#### Batch 12: Reusable Widgets (Priority 12 — Utilities)
**Components:** 15 contracts
- ChainBadge
- HarmonyBadge
- HarmonyIndicator
- GlowIndicator
- ThemeToggle
- Toast
- VimModeIndicator
- StarBookmark (with dialog)
- ModifierCard
- PersistentToolbar (with button)
- QuickActionBar (with button)
- ControlButtons
- ChangePreview
- DisambiguationModal
- CustomPromptDialog

**Dependencies:** Batch 1 (contexts), but minimal

**Parallelization:** Can author all 15 in parallel

---

#### Batch 13: Squad & Agent System (Priority 13 — Feature)
**Components:** 7 contracts
- SquadPanel
- AgentRow
- AgentAvatar
- AgentLogPanel
- AgentCharacterCard
- LogBubble
- SquadPanelDemo

**Dependencies:** Batch 1

**Parallelization:** Can author all 7 in parallel

---

#### Batch 14: Harmony & Telemetry (Priority 14 — Feature)
**Components:** 3 contracts
- HarmonyPanel
- TelemetryViewer
- TimelineView

**Dependencies:** Batch 1 (WebSocketContext)

**Parallelization:** Can author all 3 in parallel

---

#### Batch 15: Step Inspection & History (Priority 15 — Feature)
**Components:** 2 contracts
- StepInspector
- HistoryBrowser

**Dependencies:** Batch 4 (SessionPanel), Batch 5 (FlowVisualization)

**Parallelization:** Can author all 2 in parallel

---

#### Batch 16: Test-Only Components (Priority 16 — Testing)
**Components:** 1 contract
- WebSocketTest

**Dependencies:** Batch 1 (WebSocketContext)

**Parallelization:** Single component

---

### 5.3 Batch Execution Plan

**Sequential Execution (Required Dependencies):**
```
Batch 1 (Contexts)
  → Batch 2 (Layout)
  → Batch 3 (Session Management)
  → Batch 4 (Session Panel)
  → [Batches 5-16 can run in parallel with each other]
```

**Parallel Execution (Within Batches):**
- Each batch can have all contracts authored in parallel by multiple code agents
- No inter-dependencies within a batch

**Estimated Effort:**
- **Batch 1-4:** 22 contracts (foundational) — Author sequentially
- **Batch 5-16:** 88 contracts (features/utilities) — Author in parallel

**Recommended Agent Allocation:**
- Batches 1-4: 1-2 agents per batch (foundational, need careful review)
- Batches 5-16: 4-8 agents in parallel (can parallelize across batches)

---

## 6. Example Contract

### 6.1 Component Selection

**Component:** `ChatPanel` (formerly ConversationPanel)
**Rationale:** Medium complexity, clear lifecycle, multiple interactions, critical health checks

### 6.2 Full Contract Example

```markdown
# Component Contract: ChatPanel

**File:** `packages/app/src/components/ConversationPanel/ConversationPanel.tsx`
**Type:** feature
**Parent Group:** SessionPanel
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ChatPanel
- **Introduced:** 2025-12-01 (estimated)
- **Description:** Chat interface for user-agent conversation within a session. Displays message history, awaiting prompts, and input field with send button. Integrates with DiscussButton system for prefill functionality.

---

## Render Location

**Mounts Under:**
- LeftPanelStack (within SessionPanelLayout)

**Render Conditions:**
1. Session is attached to workbench (`session !== null`)
2. SessionPanelLayout is rendered (user is in Work/Maintenance/Explore/Review workbench)

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User attaches a session (clicks session in SessionSidebar)
- Session is auto-attached on workbench load (if active session exists)

**Key Effects:**
1. **Dependencies:** `[session]`
   - **Side Effects:** Extracts messages from session.lastPrompt and chain steps, updates messages state
   - **Cleanup:** None
   - **Condition:** Runs when session prop changes

2. **Dependencies:** `[messages]`
   - **Side Effects:** Auto-scrolls messages container to bottom
   - **Cleanup:** None
   - **Condition:** Runs when messages array updates

3. **Dependencies:** `[]` (mount only)
   - **Side Effects:** Registers chatInputSetter with DiscussContext via registerChatInput()
   - **Cleanup:** Calls unregisterChatInput() on unmount
   - **Condition:** Runs once on mount

**Cleanup Actions:**
- Unregister from DiscussContext

**Unmount Triggers:**
- User detaches session
- User closes workbench
- User switches to workbench that doesn't support sessions

---

## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| session | `Session` | ✅ | N/A | Session object containing conversation state, chains, lastPrompt |
| onSubmitInput | `(input: string) => Promise<void>` | ✅ | N/A | Callback to submit user input to backend |

### Callbacks Up (to parent)
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSubmitInput | `(input: string) => Promise<void>` | Called when user submits message (Enter or Send button) |

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| onAction | `(action: string) => void` | InlineButtons | Handles inline button actions from assistant messages |
| onSend | `(message: string) => void` | DiscussDialog | Handles send from DiscussDialog (prefills chat input) |
| onClose | `() => void` | DiscussDialog | Closes DiscussDialog modal |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| input | `string` | `""` | handleInputChange, setInput (via DiscussContext) |
| messages | `Message[]` | `[]` | useEffect (extracts from session), handleSubmit (adds user message) |
| isSending | `boolean` | `false` | handleSubmit (set true before API call, false after) |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| DiscussContext | registerChatInput, unregisterChatInput |

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| isAwaitingInput | `boolean` | `[session.conversationState]` | `session.conversationState === 'awaiting_input'` |
| quickResponses | `string[] | null` | `[session.lastPrompt]` | Extracted from session.lastPrompt.responseOptions if present |

### Custom Hooks
- `useDiscussButton()` — Manages DiscussDialog open/close state and message prefill

---

## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onSubmitInput(inputText) when user submits message. Parent (SessionPanelLayout or WorkWorkbench) handles API call to backend.
- **Example:**
```typescript
const handleSubmit = async (inputText: string) => {
  setIsSending(true);
  await onSubmitInput(inputText);
  setIsSending(false);
};
```

### Child Communication
- **Child:** InlineButtons
- **Mechanism:** props
- **Data Flow:** Passes messageContent (string), sessionId, buttons (array), onAction callback

- **Child:** DiscussDialog
- **Mechanism:** props
- **Data Flow:** Passes componentName, componentContext, onSend callback, onClose callback

### Sibling Communication
- **Sibling:** DiscussButton (any component with DiscussButton)
- **Mechanism:** DiscussContext (ref-based registration)
- **Description:** When any DiscussButton sends a message, DiscussContext calls registeredChatInputSetter (setInput), which prefills ChatPanel input field

### Context Interaction
- **Context:** DiscussContext
- **Role:** consumer (registers itself as input setter)
- **Operations:**
  - `registerChatInput(setInput)` — Registers input setter on mount
  - `unregisterChatInput()` — Unregisters on unmount
  - Receives prefill requests from DiscussButton components

---

## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| (via parent callback) | POST | User submits input | Parent handles API call, ChatPanel adds optimistic user message to local state |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| (inherited via session prop) | Session updates from backend | Messages re-extracted from session.lastPrompt + chains |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| N/A | N/A | N/A | N/A |

### LocalStorage Operations
| Key | Operation | Trigger | Value |
|-----|-----------|---------|-------|
| N/A | N/A | N/A | N/A |

### DOM Manipulation
| Target | Operation | Trigger |
|--------|-----------|---------|
| `.chat-panel__messages` container | Scroll to bottom (`scrollTop = scrollHeight`) | When messages array updates |

### Electron IPC
| Channel | Direction | Purpose |
|---------|-----------|---------|
| N/A | N/A | N/A |

---

## Test Hooks

**CSS Selectors:**
- `.chat-panel` — Root container
- `.chat-panel__header` — Header with title, awaiting badge, DiscussButton
- `.chat-panel__messages` — Scrollable messages container
- `.chat-panel__message` — Individual message div
- `.chat-panel__message--user` — User message
- `.chat-panel__message--assistant` — Assistant message
- `.chat-panel__input-area` — Input area container
- `.chat-panel__input-field` — Textarea for user input
- `.chat-panel__send-btn` — Send button
- `.chat-panel__quick-responses` — Quick response buttons container

**Data Test IDs:**
- `data-testid="chat-panel"`
- `data-testid="chat-input"`
- `data-testid="chat-send-btn"`

**ARIA Labels:**
- `aria-label="Chat panel for session {sessionId}"`
- `aria-label="Send message"`

**Visual Landmarks:**
1. Blue "Send" button in bottom-right (`.chat-panel__send-btn`) — 36x36px, blue background
2. "Awaiting Input" badge in header (`.awaiting-badge`) — Green/yellow badge, visible when session.conversationState === 'awaiting_input'
3. DiscussButton in header (`.discuss-button`) — Speech bubble icon, top-right of header

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CP001: Renders Without Error
- **Type:** render
- **Target:** ChatPanel component
- **Condition:** Component mounts and renders without throwing error
- **Failure Mode:** Entire SessionPanel crashes, user cannot see chat history or send messages
- **Automation Script:**
```javascript
// Chrome MCP script
async () => {
  const chatPanel = document.querySelector('.chat-panel');
  return {
    exists: !!chatPanel,
    visible: chatPanel?.offsetParent !== null,
    hasInput: !!chatPanel?.querySelector('.chat-panel__input-field'),
    hasSendBtn: !!chatPanel?.querySelector('.chat-panel__send-btn')
  };
}
```

#### HC-CP002: Registers with DiscussContext
- **Type:** context-registration
- **Target:** DiscussContext.registerChatInput
- **Condition:** ChatPanel successfully registers input setter on mount
- **Failure Mode:** DiscussButton prefill will not work, users cannot send messages from other components
- **Automation Script:**
```javascript
// Chrome MCP script (requires context inspection)
async () => {
  // Trigger DiscussButton from another component
  const discussBtn = document.querySelector('.flow-visualization .discuss-button');
  if (!discussBtn) return { skipped: true, reason: 'No DiscussButton found' };

  discussBtn.click();
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check if DiscussDialog opened
  const discussDialog = document.querySelector('.discuss-dialog');
  if (!discussDialog) return { registered: false, reason: 'Dialog did not open' };

  // Type message and send
  const textarea = discussDialog.querySelector('textarea');
  const sendBtn = discussDialog.querySelector('.discuss-dialog__send-btn');
  textarea.value = 'Test message from health check';
  sendBtn.click();

  await new Promise(resolve => setTimeout(resolve, 500));

  // Check if ChatPanel input was prefilled
  const chatInput = document.querySelector('.chat-panel__input-field');
  const prefilled = chatInput?.value.includes('Test message from health check');

  return { registered: prefilled };
}
```

#### HC-CP003: Displays Messages from Session
- **Type:** data-fetch
- **Target:** Messages extracted from session.lastPrompt + chains
- **Condition:** At least one message visible in .chat-panel__messages when session has messages
- **Failure Mode:** User cannot see conversation history, chat appears empty
- **Automation Script:**
```javascript
// Chrome MCP script
async () => {
  const messagesContainer = document.querySelector('.chat-panel__messages');
  if (!messagesContainer) return { exists: false };

  const messages = messagesContainer.querySelectorAll('.chat-panel__message');
  return {
    messagesVisible: messages.length > 0,
    messageCount: messages.length,
    hasUserMessages: !!messagesContainer.querySelector('.chat-panel__message--user'),
    hasAssistantMessages: !!messagesContainer.querySelector('.chat-panel__message--assistant')
  };
}
```

#### HC-CP004: Input Enabled When Awaiting
- **Type:** interaction
- **Target:** Input field enabled/disabled based on session.conversationState
- **Condition:** Input field enabled when conversationState === 'awaiting_input', disabled otherwise
- **Failure Mode:** User can submit messages when session is not ready, or cannot submit when session IS ready
- **Automation Script:**
```javascript
// Chrome MCP script
async () => {
  const inputField = document.querySelector('.chat-panel__input-field');
  const sendBtn = document.querySelector('.chat-panel__send-btn');
  const awaitingBadge = document.querySelector('.awaiting-badge');

  const isAwaitingVisible = !!awaitingBadge && awaitingBadge.offsetParent !== null;
  const inputEnabled = !inputField?.disabled;
  const sendBtnEnabled = !sendBtn?.disabled;

  return {
    inputEnabled,
    sendBtnEnabled,
    awaitingBadgeVisible: isAwaitingVisible,
    stateConsistent: isAwaitingVisible === inputEnabled
  };
}
```

### Warning Checks (Should Pass)

#### HC-CP005: Auto-Scroll to Latest Message
- **Type:** interaction
- **Target:** Messages container auto-scrolls to bottom when new message added
- **Condition:** scrollTop approximately equals scrollHeight - clientHeight
- **Failure Mode:** User must manually scroll to see latest messages
- **Automation Script:**
```javascript
// Chrome MCP script
async () => {
  const messagesContainer = document.querySelector('.chat-panel__messages');
  if (!messagesContainer) return { exists: false };

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
  const isAtBottom = Math.abs((scrollTop + clientHeight) - scrollHeight) < 50; // 50px tolerance

  return {
    isAtBottom,
    scrollTop,
    scrollHeight,
    clientHeight,
    distanceFromBottom: scrollHeight - (scrollTop + clientHeight)
  };
}
```

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 200 | ms | Time from mount to first paint |
| message-extraction | 100 | ms | Time to extract messages from session prop |
| auto-scroll | 50 | ms | Time to scroll to bottom after message added |
| input-response | 16 | ms | Time from keypress to input field update (60fps) |

---

## Dependencies

**Required Contexts:**
- DiscussContext (for DiscussButton prefill integration)

**Required Hooks:**
- `useDiscussButton()` (from packages/app/src/hooks/useDiscussButton.ts)

**Child Components:**
- InlineButtons (conditional, only if message has inline buttons)
- DiscussDialog (conditional, when DiscussButton is clicked)

**Required Props:**
- `session` (Session object)
- `onSubmitInput` (callback function)

---

## Notes

**Known Issues:**
- Message extraction logic tightly coupled to session structure (lastPrompt + chains). If session schema changes, this will break.
- Auto-scroll sometimes fails if messages render slowly (race condition between message render and scroll effect)

**Future Improvements:**
- Add markdown rendering for assistant messages (currently plain text)
- Support for message editing (user can edit previous messages)
- Support for message reactions (thumbs up/down)

**Discuss System Integration:**
- ChatPanel is the ONLY input recipient for DiscussButton system
- Must be rendered and registered with DiscussContext for DiscussButton to work anywhere in app

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
```

---

## Dependency Graph

### Step Dependencies

```
Step 1 (Schema Design) — Complete
  ↓
Step 2 (Format Decision) — Complete
  ↓
Step 3 (Storage Location) — Complete
  ↓
Step 4 (Integration Points) — Complete
  ↓
Step 5 (Batch Grouping) — Complete
  ↓
Step 6 (Example Contract) — Complete
  ↓
Step 7 (Code Implementation) — Future work
  ├─ 7.1: Create schema types (packages/shared/src/contracts/schema.ts)
  ├─ 7.2: Create validation script (packages/shared/src/contracts/validate.ts)
  ├─ 7.3: Create parser (packages/shared/src/contracts/parse.ts)
  ├─ 7.4: Create test generator (packages/shared/src/contracts/generate-tests.ts)
  ├─ 7.5: Create health check CLI (packages/app/src/cli/health-check.ts)
  └─ 7.6: Create CI integration (.github/workflows/contract-check.yml)
  ↓
Step 8 (Contract Authoring) — Future work
  ├─ 8.1: Batch 1 (Contexts) — 7 contracts
  ├─ 8.2: Batch 2 (Layout) — 4 contracts
  ├─ 8.3: Batch 3 (Session Management) — 5 contracts
  ├─ 8.4: Batch 4 (Session Panel) — 6 contracts
  ├─ 8.5: Batches 5-16 (parallel) — 88 contracts
  └─ 8.6: Contract review and validation
```

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Contract authoring time** — 110 contracts is significant work | High | Batch authoring with parallel code agents (4-8 agents per batch), leverage component catalog for pre-populated data |
| **Contract drift** — Components change, contracts become stale | High | CI integration blocks PRs if contract drift detected, pre-commit hook warns developers |
| **Schema complexity** — Complex schema hard to author | Medium | Provide clear template, example contracts, validation script with helpful error messages |
| **Parsing brittleness** — Markdown parsing may fail on malformed contracts | Medium | Validation script catches errors early, CI enforces valid contracts |
| **Health check coverage** — Not all components have automatable health checks | Low | Focus critical checks first (render, context registration), manual checks for complex cases |
| **Test generation overhead** — Generated tests may not cover edge cases | Low | Generated tests are baseline, manual tests supplement for complex scenarios |
| **Tooling maintenance** — Parser/validator need updates when schema evolves | Medium | Version contracts (schema v1.0.0), migration scripts for schema changes |

---

## Verification

**Upon completion of this plan, verify:**
- [ ] Schema structure approved (TypeScript interfaces)
- [ ] Markdown format approved (template + example)
- [ ] Storage location approved (directory structure)
- [ ] Integration points approved (Playwright, Chrome MCP, health checks)
- [ ] Batch grouping approved (16 batches, 110 components)
- [ ] Example contract approved (ChatPanel)
- [ ] Dependencies identified (schema types, parser, validator)

**Next steps after approval:**
1. Create TypeScript schema definitions (`packages/shared/src/contracts/schema.ts`)
2. Create markdown template (`packages/app/src/contracts/TEMPLATE.md`)
3. Create directory structure (`packages/app/src/contracts/`)
4. Author Batch 1 (Contexts) — 7 contracts
5. Validate Batch 1 with parser/validator
6. Proceed with Batches 2-4 sequentially
7. Parallelize Batches 5-16

---

## Learnings

**Issue:** None encountered during planning phase

**Root Cause:** N/A

**Suggestion:** N/A

**[FRESH EYE]**
- The component catalog's existing behavioral documentation (110 components) is EXTREMELY comprehensive. Most contract fields can be directly populated from catalog data, significantly reducing authoring time.
- The existing E2E test patterns (chrome-mcp-respect-check.test.ts) provide a strong template for contract-driven health checks. The RESPECT_CHECK_SCRIPT pattern should be replicated in contracts.
- Contract schema should include a "version" field to enable schema evolution without breaking existing contracts.
- Consider auto-generating contract SKELETONS from component files (extract props from TypeScript, extract hooks from code) to bootstrap authoring process.

---

**Plan Complete**
**Generated:** 2026-02-10-13-19-11
**By:** Claude Opus 4.6 (plan agent)
