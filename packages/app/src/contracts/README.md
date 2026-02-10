# Component Behavioral Contracts

This directory contains behavioral contract definitions for all frontend components in ActionFlows Dashboard. Contracts serve as the single source of truth for component behavior, enabling automated health checks, E2E test generation, and component interaction verification.

---

## What is a Behavioral Contract?

A **behavioral contract** is a machine-readable and human-friendly documentation of a component's:

- **Identity & Location:** Where the component lives, what type it is, when it was introduced
- **Rendering:** When and where it mounts, what triggers its lifecycle
- **Props Contract:** What inputs it accepts, what callbacks it provides
- **State Ownership:** What local state it manages, what contexts it consumes
- **Interactions:** How it communicates with parents, children, siblings, and contexts
- **Side Effects:** API calls, WebSocket events, timers, DOM manipulation
- **Test Hooks:** CSS selectors, data-testids, visual landmarks for testing
- **Health Checks:** Automated checks to verify component integrity, connection, rendering, interaction
- **Dependencies:** What contexts, hooks, and child components it requires

---

## Why Contracts?

### 1. **Automated Health Checks**
- Execute critical checks via Chrome DevTools MCP to verify component integrity
- Detect render failures, connection issues, context registration problems
- Run health checks on every deployment to ensure components are functioning

### 2. **E2E Test Generation**
- Auto-generate Playwright test scaffolds from health checks in contracts
- CSS selectors and data-testids are extracted from contracts
- Health check automation scripts are converted to Playwright test implementations

### 3. **Component Interaction Verification**
- Document parent-child-sibling communication patterns
- Verify context provider/consumer relationships
- Ensure callback signatures match across components

### 4. **Component Documentation**
- Contracts serve as living documentation for developers
- No more stale README files or outdated code comments
- Single source of truth for component behavior

### 5. **Contract Drift Detection**
- CI/CD pipeline detects when components exist without contracts
- Detects when contracts reference components that no longer exist
- Prevents contracts from becoming stale and outdated

---

## Directory Structure

```
packages/app/src/contracts/
├── README.md                          # This file
├── TEMPLATE.contract.md               # Template for authoring new contracts
├── contexts/                          # Context provider contracts
│   ├── WebSocketContext.contract.md
│   ├── WorkbenchContext.contract.md
│   ├── ThemeContext.contract.md
│   ├── ToastContext.contract.md
│   ├── VimNavigationContext.contract.md
│   ├── DiscussContext.contract.md
│   └── index.ts                       # Re-exports context contracts
├── hooks/                             # Custom hook contracts (optional)
│   ├── useSessionSidebar.contract.md
│   ├── useWebSocket.contract.md
│   └── index.ts                       # Re-exports hook contracts
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
    │   └── index.ts
    ├── ChatPanel/
    │   ├── ConversationPanel.contract.md
    │   ├── InlineButtons.contract.md
    │   └── index.ts
    ├── DiscussButton/
    ├── Workbench/
    ├── SessionSidebar/
    ├── Terminal/
    ├── FileExplorer/
    ├── IntelDossier/
    ├── Registry/
    ├── Squad/
    ├── Harmony/
    ├── StepInspection/
    ├── Common/                        # Reusable widgets
    ├── Layout/
    ├── Testing/                       # Test-only components
    └── ... (more component groups)
```

### Directory Organization

- **`contexts/`** — Context provider contracts (WebSocketContext, DiscussContext, etc.)
- **`hooks/`** — Custom hook contracts (useSessionSidebar, useWebSocket, etc.)
- **`components/`** — Component contracts grouped by directory structure
  - Mirror the structure of `packages/app/src/components/`
  - Each directory has an `index.ts` that re-exports contract metadata
  - Enables programmatic access to contracts for test generation and health checks

---

## How to Read a Contract

A contract is organized into 10 main sections:

### 1. **Identity** (Required)
- Component name, file path, type (page/feature/widget/utility), introduction date
- Brief description of what the component does

### 2. **Render Location** (Required)
- What parent components mount this component
- Render conditions (when it appears)
- CSS positioning (fixed/relative/absolute/sticky)
- Z-index if applicable

### 3. **Lifecycle** (Required)
- Mount triggers (what causes the component to mount)
- Key effects (useEffect hooks, dependencies, side effects, cleanup)
- Cleanup actions (what happens on unmount)
- Unmount triggers

### 4. **Props Contract** (Required)
- **Inputs:** All props with types, required/optional status, defaults, descriptions
- **Callbacks Up:** Event handlers passed FROM parent TO component
- **Callbacks Down:** Event handlers component passes to children

### 5. **State Ownership** (Required)
- **Local State:** useState declarations
- **Context Consumption:** Which contexts and values the component reads
- **Derived State:** useMemo/useCallback computed values
- **Custom Hooks:** Which custom hooks the component uses

### 6. **Interactions** (Required)
- **Parent Communication:** How component talks to its parent
- **Child Communication:** How component talks to its children
- **Sibling Communication:** How component coordinates with siblings
- **Context Interaction:** provider/consumer relationships

### 7. **Side Effects** (Required)
- **API Calls:** HTTP requests (endpoint, method, trigger, response handling)
- **WebSocket Events:** Subscriptions (event type, trigger, handler)
- **Timers:** setTimeout/setInterval (duration, purpose, cleanup)
- **LocalStorage:** Read/write operations
- **DOM Manipulation:** Direct DOM access if any
- **Electron IPC:** Electron inter-process communication (if applicable)

### 8. **Test Hooks** (Required)
- **CSS Selectors:** Class names for targeting elements
- **Data Test IDs:** data-testid attributes (if present)
- **ARIA Labels:** aria-label values for accessibility testing
- **Visual Landmarks:** Unique visual features for snapshot identification

### 9. **Health Checks** (Required)
- **Critical Checks:** Must pass for component to be "healthy"
  - Include automation scripts (Chrome MCP JavaScript) to run checks automatically
  - Example: Render check, context registration check, data loading check
- **Warning Checks:** Should pass but non-blocking
- **Performance Benchmarks:** Optional render time, memory, interaction delay thresholds

### 10. **Dependencies** (Required)
- Required contexts, hooks, child components, and props

---

## How to Author a New Contract

### Step 1: Copy the Template

```bash
cp packages/app/src/contracts/TEMPLATE.contract.md \
   packages/app/src/contracts/components/{GroupName}/{ComponentName}.contract.md
```

### Step 2: Fill in Identity Section

```markdown
# Component Contract: SessionPanel

**File:** `packages/app/src/components/SessionPanel/SessionPanelLayout.tsx`
**Type:** feature
**Parent Group:** SessionPanel
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** SessionPanel
- **Introduced:** 2025-12-01
- **Description:** Main panel showing session state, chain execution flow, and chat interface.
```

### Step 3: Read the Component Source Code

Understand the actual implementation:
```bash
cat packages/app/src/components/SessionPanel/SessionPanelLayout.tsx
```

Extract:
- Props interface
- useState declarations
- useEffect hooks and dependencies
- Context consumption
- Child component renders
- Event handlers and callbacks

### Step 4: Fill in Render Location Section

```markdown
## Render Location

**Mounts Under:**
- WorkWorkbench
- MaintenanceWorkbench
- ExploreWorkbench

**Render Conditions:**
1. Session attached to workbench (`session !== null`)
2. Workbench is one of: Work, Maintenance, Explore, Review

**Positioning:** relative
**Z-Index:** N/A
```

### Step 5: Document Lifecycle

Extract from useEffect hooks:

```markdown
## Lifecycle

**Mount Triggers:**
- User attaches session (clicks session in SessionSidebar)
- Session auto-attached on workbench load

**Key Effects:**
1. **Dependencies:** `[session]`
   - **Side Effects:** Initialize panel layout, restore resize position
   - **Cleanup:** None
   - **Condition:** Runs when session changes

2. **Dependencies:** `[resizePosition]`
   - **Side Effects:** Save resize position to localStorage
   - **Cleanup:** None
   - **Condition:** Runs when user drags resize handle
```

### Step 6: Document Props Contract

Extract from component props interface:

```markdown
## Props Contract

### Inputs
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| session | Session | ✅ | N/A | Session object with chains, steps, state |
| onSessionChange | (session: Session) => void | ✅ | N/A | Callback when session state changes |

### Callbacks Up
| Callback | Signature | Description |
|----------|-----------|-------------|
| onSessionChange | `(session: Session) => void` | Notifies parent when session modified |
```

### Step 7: Document State Ownership

Extract useState and context consumption:

```markdown
## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| resizePosition | number | 75 | handleDragResizeHandle |
| selectedChainId | string | null | handleSelectChain |

### Context Consumption
| Context | Values Used |
|---------|-------------|
| WebSocketContext | send, subscribe |
| WorkbenchContext | workbenchId |

### Custom Hooks
- `useWebSocket()` — Send/receive WebSocket messages
```

### Step 8: Document Interactions

Describe how component communicates:

```markdown
## Interactions

### Parent Communication
- **Mechanism:** prop-callback
- **Description:** Calls onSessionChange when session state is modified
- **Example:** User edits prompt → SessionPanel updates session object → calls onSessionChange(updatedSession)

### Child Communication
- **Child:** LeftPanelStack
- **Mechanism:** props
- **Data Flow:** Passes session, selectedChainId, onChainSelect

- **Child:** RightVisualizationArea
- **Mechanism:** props
- **Data Flow:** Passes session, selectedChainId
```

### Step 9: Document Side Effects

Extract API calls, WebSocket events, timers:

```markdown
## Side Effects

### API Calls
| Endpoint | Method | Trigger | Response Handling |
|----------|--------|---------|-------------------|
| /api/sessions/{id} | GET | On mount if session != null | Update local session object |

### WebSocket Events
| Event Type | Trigger | Handler |
|------------|---------|---------|
| session:updated | On component mount | Update messages, chains, steps |
| step:completed | WebSocket message received | Update step status in local state |

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| interval | 5000ms | Poll session status | ✅ Cleaned up on unmount |
```

### Step 10: Document Test Hooks

Extract CSS selectors, data-testids, visual features:

```markdown
## Test Hooks

**CSS Selectors:**
- `.session-panel` — Root container
- `.session-panel__left` — Left panel
- `.session-panel__right` — Right panel
- `.session-panel__resize-handle` — Drag handle between panels

**Data Test IDs:**
- `data-testid="session-panel"`
- `data-testid="resize-handle"`

**Visual Landmarks:**
1. Gray vertical resize handle between left and right panels
```

### Step 11: Document Health Checks

Define critical, warning, and performance checks:

```markdown
## Health Checks

### Critical Checks

#### HC-SP001: Renders Without Error
- **Type:** render
- **Target:** SessionPanel component
- **Condition:** Component mounts without errors
- **Failure Mode:** Entire workbench unusable
- **Automation Script:**
```javascript
async () => {
  const panel = document.querySelector('.session-panel');
  return { exists: !!panel, visible: panel?.offsetParent !== null };
}
```

#### HC-SP002: Receives Session Updates
- **Type:** data-fetch
- **Target:** WebSocket subscription to session:updated
- **Condition:** Latest session data is displayed
- **Failure Mode:** User sees stale session state
```

### Step 12: Document Dependencies

List all required contexts, hooks, components, props:

```markdown
## Dependencies

**Required Contexts:**
- WebSocketContext (for real-time updates)
- WorkbenchContext (for workbench ID)

**Required Hooks:**
- useWebSocket() — Send/receive WebSocket messages

**Child Components:**
- LeftPanelStack
- RightVisualizationArea
- ResizeHandle

**Required Props:**
- session
- onSessionChange
```

### Step 13: Add Notes

Include any important information for developers:

```markdown
## Notes

**Known Issues:**
- Resize position sometimes not restored if localStorage is cleared

**Future Improvements:**
- Add keyboard shortcuts for common actions
- Support multiple simultaneous sessions (split view)

**Related Components:**
- SessionSidebar (manages session list and selection)
- WorkWorkbench (parent that manages session attachment)
```

### Step 14: Fill in Metadata

```markdown
**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
```

---

## Integration with Testing

### Playwright E2E Tests

Contracts power contract-driven health checks in Playwright:

```typescript
// test/e2e/generated/SessionPanel.test.ts (auto-generated from contract)
import { test, expect } from '@playwright/test';

test.describe('SessionPanel - Contract Health Checks', () => {
  test('HC-SP001: Renders without error', async ({ page }) => {
    // Generated from contract automation script
    await page.goto('http://localhost:5173');
    const panel = await page.locator('.session-panel').first();
    await expect(panel).toBeVisible();
  });

  test('HC-SP002: Receives session updates', async ({ page }) => {
    // Generated from contract
    // Implementation from automation script
  });
});
```

### Chrome DevTools MCP Health Checks

Automation scripts in contracts are executed via Chrome MCP:

```bash
# Run health checks for all components
pnpm run health:check

# Check contract coverage
pnpm run health:coverage

# Validate all contracts
pnpm run contracts:validate
```

---

## Contract Authoring Workflow

### Phase 1: Foundation (Sequential)
1. **Batch 1 (Contexts)** — 7 contracts
   - WebSocketContext, WorkbenchContext, ThemeContext, ToastContext, VimNavigationContext, DiscussContext
2. **Batch 2 (Layout)** — 3 contracts
   - AppContent, WorkbenchLayout, TopBar
3. **Batch 3 (Session Management)** — 5 contracts
   - SessionSidebar, SessionSidebarItem, SessionPane, SessionArchive, SessionTree
4. **Batch 4 (Session Panel)** — 6 contracts
   - SessionPanelLayout, LeftPanelStack, RightVisualizationArea, ResizeHandle, FolderHierarchy, ChatPanel

### Phase 2: Features & Utilities (Parallel)
5. **Batches 5-16** — 88 contracts (can be authored in parallel)
   - Canvas & Visualization (9 contracts)
   - Discussion System (3 contracts)
   - Terminal Components (6 contracts)
   - Workbench-Specific Screens (12 contracts)
   - File Explorer & Editor (5 contracts)
   - Intel & Dossier System (11 contracts)
   - Registry & Navigation (4 contracts)
   - Reusable Widgets (15 contracts)
   - Squad & Agent System (7 contracts)
   - Harmony & Telemetry (3 contracts)
   - Step Inspection & History (2 contracts)
   - Test-Only Components (1 contract)

See `.claude/actionflows/logs/plan/behavioral-contract-schema-design_2026-02-10-13-19-11/plan.md` for full batch definitions.

---

## Validation & CI/CD

### Pre-Commit Hook

Contracts are validated before every commit:

```bash
# Runs automatically on git commit
pnpm run contracts:validate
```

Checks:
- All contracts have valid markdown syntax
- All required sections present
- Health check IDs are unique
- Component files exist for all contracts
- All components have corresponding contracts

### CI Pipeline

GitHub Actions workflow validates contracts on every PR:

```yaml
- Run: pnpm run contracts:validate
- Run: pnpm run health:coverage
- Block merge if contract drift detected
```

---

## Example Contracts

### Full Example: ChatPanel
See the plan document for a complete example contract showing all sections properly filled in:

**Location:** `.claude/actionflows/logs/plan/behavioral-contract-schema-design_2026-02-10-13-19-11/plan.md` (Section 6.2)

This example demonstrates:
- Complete lifecycle documentation
- Health check automation scripts
- Side effects and interactions
- Test hooks with CSS selectors
- Performance benchmarks

---

## Questions & Support

### How do I update a contract?

1. Read the current contract
2. Review the component source code
3. Update only the sections that changed
4. Update "Last Reviewed" and "Last Updated" dates
5. Increment version (patch bump for minor changes, minor bump for major changes)
6. Commit with `feat:` or `fix:` prefix

### What if a component has no props?

If a component receives no props, the Props Contract section can be simplified:

```markdown
## Props Contract

### Inputs
(No props)

### Callbacks Up
(None)

### Callbacks Down
(None)
```

### What if a component has no side effects?

Similar simplification:

```markdown
## Side Effects

### API Calls
(None)

### WebSocket Events
(None)

### Timers
(None)
```

### How do I write a health check automation script?

Health check scripts are JavaScript that runs in the browser via Chrome MCP:

```javascript
// Good: Checks element visibility
async () => {
  const element = document.querySelector('.my-component');
  return { exists: !!element, visible: element?.offsetParent !== null };
}

// Good: Interacts with component
async () => {
  const button = document.querySelector('[data-testid="submit"]');
  button.click();
  await new Promise(resolve => setTimeout(resolve, 500));
  return { clicked: true };
}

// Bad: Makes external API calls (not in Chrome context)
// Bad: Uses setTimeout without returning a Promise
```

---

## Related Documentation

- **Plan Document:** `.claude/actionflows/logs/plan/behavioral-contract-schema-design_2026-02-10-13-19-11/plan.md` — Full schema design, format decision, integration points
- **Template:** `TEMPLATE.contract.md` — Copy this to author new contracts
- **Component Source:** `packages/app/src/components/` — The actual React component implementations
- **Test Examples:** `test/e2e/` — Playwright E2E tests using contract health checks

---

## Version History

- **v1.0.0** (2026-02-10) — Initial infrastructure release
  - Directory structure created
  - Template provided
  - README published
  - Ready for Batch 1 authoring (contexts)
