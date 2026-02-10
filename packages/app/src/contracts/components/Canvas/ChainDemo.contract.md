# Component Contract: ChainDemo

**File:** `packages/app/src/components/ChainDemo.tsx`
**Type:** page
**Parent Group:** Canvas & Visualization
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** ChainDemo
- **Introduced:** 2025-Q4
- **Description:** Interactive demo for testing chain status updates without backend, includes automated scenarios and manual controls.

---

## Render Location

**Mounts Under:**
- Direct route component (demo page)

**Render Conditions:**
1. Navigated to demo route

**Positioning:** relative
**Z-Index:** N/A

---

## Lifecycle

**Mount Triggers:**
- User navigates to ChainDemo page

**Key Effects:**
None (all state changes are user-triggered)

**Cleanup Actions:**
None

**Unmount Triggers:**
- User navigates away from ChainDemo page

---

## Props Contract

### Inputs
No props (self-contained demo component)

### Callbacks Up (to parent)
None

### Callbacks Down (to children)
| Callback | Signature | Passed To | Description |
|----------|-----------|-----------|-------------|
| N/A | N/A | ChainDAG | Chain data passed as prop |

---

## State Ownership

### Local State
| State | Type | Initial | Updated By |
|-------|------|---------|------------|
| chain | Chain | sampleChain | updateStepStatus, handleReset |
| isRunning | boolean | false | runScenario (start/end) |
| currentStep | number | 0 | runScenario loop |

### Context Consumption
None

### Derived State
| Name | Type | Dependencies | Computation |
|------|------|--------------|-------------|
| scenarios | DemoStep[] | useMemo, [] | Predefined simulation scenarios array |

### Custom Hooks
None

---

## Interactions

### Parent Communication
None (standalone page)

### Child Communication
- **Child:** ChainDAG
- **Mechanism:** props
- **Data Flow:** Passes `chain` state object for visualization

### Sibling Communication
None

### Context Interaction
None

---

## Side Effects

### API Calls
None (demo component with no backend calls)

### WebSocket Events
None

### Timers
| Type | Duration | Purpose | Cleanup |
|------|----------|---------|---------|
| setTimeout | Variable (scenarios array) | Automated scenario execution delays | ✅ (async/await pattern) |

### LocalStorage Operations
None

### DOM Manipulation
None

### Electron IPC
None

---

## Test Hooks

**CSS Selectors:**
- `.chain-demo-container`
- `.chain-demo-controls`
- `.demo-button`
- `.step-controls`
- `.chain-demo-visualization`
- `.chain-demo-header`
- `.control-section`
- `.step-control-group`
- `.legend`

**Data Test IDs:**
None

**ARIA Labels:**
None

**Visual Landmarks:**
1. Header with title "Chain Status Updates Demo" (`.chain-demo-header`)
2. Three control sections: Automated Scenario, Manual Step Controls, Status Legend
3. ChainDAG visualization area (`.chain-demo-visualization`)

---

## Health Checks

### Critical Checks (Must Pass)

#### HC-CD-001: Component Render
- **Type:** render
- **Target:** ChainDemo container
- **Condition:** `.chain-demo-container` exists
- **Failure Mode:** Page blank, no demo UI
- **Automation Script:**
```javascript
const demo = document.querySelector('.chain-demo-container');
if (!demo) throw new Error('ChainDemo not rendered');
return true;
```

#### HC-CD-002: Control Buttons
- **Type:** render
- **Target:** Demo controls
- **Condition:** Run button and Reset button present
- **Failure Mode:** Cannot trigger scenarios
- **Automation Script:**
```javascript
const demo = document.querySelector('.chain-demo-container');
const runButton = demo.querySelector('.demo-button.primary');
const resetButton = demo.querySelector('.demo-button:not(.primary)');
if (!runButton || !resetButton) throw new Error('Control buttons missing');
return true;
```

#### HC-CD-003: ChainDAG Rendering
- **Type:** render
- **Target:** Visualization component
- **Condition:** ChainDAG renders inside visualization area
- **Failure Mode:** No visual feedback for chain state
- **Automation Script:**
```javascript
const demo = document.querySelector('.chain-demo-container');
const runButton = demo.querySelector('.demo-button.primary');
if (!runButton) throw new Error('Run button missing');
runButton.click();
await new Promise(r => setTimeout(r, 2000));
const dag = demo.querySelector('.chain-dag-container');
if (!dag) throw new Error('DAG not rendered');
return true;
```

### Warning Checks (Should Pass)

#### HC-CD-004: Manual Controls
- **Type:** render
- **Target:** Step control buttons
- **Condition:** 5 step control groups present
- **Failure Mode:** Manual testing limited

### Performance Benchmarks

| Metric | Threshold | Unit | Description |
|--------|-----------|------|-------------|
| render-time | 100 | ms | Time to first paint |
| scenario-run | 10000 | ms | Full automated scenario completion |

---

## Dependencies

**Required Contexts:**
None

**Required Hooks:**
- useState
- useCallback
- useMemo

**Child Components:**
- ChainDAG

**Required Props:**
None (self-contained)

---

## Notes

- This is a demo/testing component, not production UI
- Uses sampleChain from `../data/sampleChain` for initial state
- Scenarios array defines automated test sequence
- Manual controls allow testing individual step state transitions
- Does not connect to backend or WebSocket
- Useful for testing ChainDAG visualization rendering

---

**Contract Authored:** 2026-02-10
**Last Updated:** 2026-02-10
**Version:** 1.0.0
