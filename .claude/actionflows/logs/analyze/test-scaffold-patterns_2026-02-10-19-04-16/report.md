# Analysis Report: Test Scaffold Patterns

**Aspect:** inventory + structure
**Scope:** Contract health checks, existing test infrastructure, Chrome MCP test patterns
**Date:** 2026-02-10
**Agent:** analyze/contract-test-patterns

---

## 1. Health Check Structure Inventory

### 1.1 Contract Schema Definition

Health checks are defined programmatically in `packages/shared/src/contracts/schema.ts`:

```typescript
export interface HealthChecks {
  critical: HealthCheck[];        // must pass
  warning: HealthCheck[];         // should pass but non-blocking
  performance: PerformanceCheck[]; // optional performance benchmarks
}

export interface HealthCheck {
  id: string;                     // unique check ID (e.g., "HC-ASN001")
  type: HealthCheckType;          // render | connection | context-registration | timeout | data-fetch | interaction | boundary | data-integration | behavior | visual-feedback | integration | accessibility
  target: string;                 // what to check (e.g., "Node root div with correct classes")
  condition: string;              // success condition (e.g., ".animated-step-node exists, has status and animation classes")
  failureMode: string;            // what breaks if this fails (e.g., "Blank or missing node")
  automationScript?: string;      // Chrome MCP script to run this check (JavaScript code block)
}

export interface PerformanceCheck {
  metric: 'render-time' | 'bundle-size' | 'memory' | 'interaction-delay';
  threshold: number;
  unit: string;
  description: string;
}
```

### 1.2 Markdown Format in Contracts

Health checks appear in the `## Health Checks` section of `.contract.md` files:

```markdown
## Health Checks

### Critical Checks (Must Pass)

#### HC-ASN001: Node Renders with Step Data
- **Type:** render
- **Target:** Node root div with correct classes
- **Condition:** `.animated-step-node` exists, has status and animation classes
- **Failure Mode:** Blank or missing node
- **Automation Script:**
```javascript
async function checkNodeRender(stepNumber) {
  const node = document.querySelector(`.animated-step-node:has(.step-number:contains("#${stepNumber}"))`);
  if (!node) throw new Error(`Node ${stepNumber} not rendered`);

  const hasStatusClass = Array.from(node.classList).some(c => c.startsWith('status-'));
  if (!hasStatusClass) throw new Error('Missing status class');

  return { rendered: true, classes: Array.from(node.classList) };
}
```
```

### 1.3 Key Field Observations

| Field | Format | Notes |
|-------|--------|-------|
| **id** | `HC-{PREFIX}-{NUMBER}` | Must match pattern `/^HC-[A-Z]{2,}-\d+$/` (validated by schema) |
| **type** | 12 enum values | `render`, `connection`, `context-registration`, `timeout`, `data-fetch`, `interaction`, `boundary`, `data-integration`, `behavior`, `visual-feedback`, `integration`, `accessibility` |
| **target** | Free text | Human-readable description of what to check |
| **condition** | Free text | Success criteria in plain English |
| **failureMode** | Free text | What breaks if check fails |
| **automationScript** | JavaScript code block | Chrome MCP executable script (can be async, returns result object) |

### 1.4 Automation Script Patterns

From reviewing `AnimatedStepNode.contract.md` and `ChainDAG.contract.md`:

**Pattern A: DOM Query + Validation**
```javascript
async function checkNodeRender(stepNumber) {
  const node = document.querySelector(`.animated-step-node`);
  if (!node) throw new Error(`Node not rendered`);

  const hasStatusClass = Array.from(node.classList).some(c => c.startsWith('status-'));
  if (!hasStatusClass) throw new Error('Missing status class');

  return { rendered: true, classes: Array.from(node.classList) };
}
```

**Pattern B: Layout Validation**
```javascript
async function checkDAGLayout() {
  const nodes = document.querySelectorAll('.step-node');
  if (nodes.length === 0) throw new Error('No nodes rendered');

  // Check for overlaps
  const rects = Array.from(nodes).map(n => n.getBoundingClientRect());
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (rectsOverlap(rects[i], rects[j])) {
        throw new Error(`Nodes ${i} and ${j} overlap`);
      }
    }
  }

  return { layoutValid: true, nodeCount: nodes.length };
}
```

**Common Characteristics:**
- Scripts can be standalone functions OR inline async arrow functions
- Must be valid JavaScript (executed in browser context)
- Can use DOM APIs (querySelector, getBoundingClientRect, etc.)
- Can throw errors for failures
- Should return result objects (for success cases)
- Some scripts reference helper functions (e.g., `rectsOverlap`) that aren't defined in contract

---

## 2. Existing Test Infrastructure

### 2.1 Test Frameworks

| Framework | Config | Usage |
|-----------|--------|-------|
| **Vitest** | `packages/backend/vitest.config.ts`, `packages/app/vitest.config.ts` | Unit tests (backend, shared) |
| **Playwright** | `playwright.config.ts` | E2E tests (browser automation) |
| **Chrome MCP** | `test/e2e/chrome-mcp-*.test.ts` | Manual E2E test definitions (NOT executed by test runner) |

### 2.2 Playwright Configuration

- **Test directory:** `./test/playwright/specs` (configured but directory doesn't exist yet)
- **Base URL:** `http://localhost:5173`
- **Web servers:** Auto-starts backend (port 3001) and frontend (port 5173)
- **Browsers:** Chromium (Firefox/Webkit disabled)
- **Reporters:** HTML + JSON
- **Timeouts:** 30s per test, 10s per action, 5s per assertion

**Issue:** Playwright is configured but `test/playwright/specs/` directory doesn't exist. All existing E2E tests are in `test/e2e/` and are Chrome MCP format (not Playwright).

### 2.3 Chrome MCP Test Patterns

`test/e2e/chrome-mcp-happy-path.test.ts` defines a **structured test definition** format:

```typescript
export interface TestStep {
  id: string;                  // Unique step identifier
  name: string;                // Human-readable step name
  description: string;         // Detailed description
  tool: ChromeMcpTool;         // Chrome MCP tool to invoke (navigate_page, click, fill, etc.)
  params: Record<string, unknown> | ((context: TestContext) => Record<string, unknown>);
  assertions: Assertion[];     // Assertions to validate after tool execution
  screenshot: boolean;         // Whether to take screenshot
  onFailure: 'abort' | 'retry' | 'continue';
  captureFrom?: (response: unknown, context: TestContext) => Record<string, unknown>;
}
```

**Key Insight:** These are NOT automated tests. They are **test runbooks** that Claude reads and executes step-by-step using Chrome MCP tools. The orchestrator executes these tests directly (not via Playwright or Vitest).

### 2.4 Test Scripts in package.json

| Script | Command | Purpose |
|--------|---------|---------|
| `test` | `pnpm -r test` | Run all workspace tests (Vitest) |
| `test:e2e` | `bash test/curl-commands.sh` | Legacy curl-based API tests |
| `test:pw` | `playwright test` | Run Playwright tests (no tests exist yet) |
| `test:pw:ui` | `playwright test --ui` | Playwright UI mode |
| `health:check` | `tsx scripts/health-check.ts` | Validate contracts + drift detection |
| `health:check:ci` | `tsx scripts/health-check-ci.ts` | CI-friendly health check |

### 2.5 Contract Validation Infrastructure

`scripts/health-check.ts` + `packages/shared/src/contracts/validate.ts` provide:

- **Contract parsing:** `parseAllContracts(contractsDir)` — Walks directory tree, parses all `.contract.md` files
- **Contract validation:** `validateAllContracts(contracts)` — Validates schema, required fields, health check ID uniqueness
- **Drift detection:** `detectDrift(contractsDir, componentsDir, contextsDir)` — Finds components without contracts
- **CLI reporting:** Color-coded terminal output with errors/warnings

**Validation Rules:**
- Health check IDs must match `/^HC-[A-Z]{2,}-\d+$/`
- Health check IDs must be unique across contract
- At least 1 critical health check required
- At least 1 CSS selector in Test Hooks required
- No TODO/TBD/placeholder markers (warning only)

---

## 3. Contract Tooling Overview

### 3.1 Parser (`packages/shared/src/contracts/parse.ts`)

**Public API:**
```typescript
// Parse single contract from markdown string
export function parseContract(markdown: string): ComponentBehavioralContract

// Parse contract from file path
export async function parseContractFile(filePath: string): Promise<ComponentBehavioralContract>

// Parse all contracts from directory (recursive)
export async function parseAllContracts(contractsDir: string): Promise<Map<string, ComponentBehavioralContract>>
```

**Parser Features:**
- Splits markdown by `## {Section}` headings
- Extracts key-value pairs from `**Key:** value` format
- Parses markdown tables into arrays of objects
- Extracts list items (`- item` or `* item`)
- Extracts code blocks by language (e.g., `extractCodeBlock(text, 'javascript')`)
- Handles nested structures (effects, interactions, etc.)

**Critical for Generator:** `parseHealthCheckBlocks()` extracts health checks:
```typescript
function parseHealthCheckBlocks(text: string): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const blocks = text.split(/#### HC-/).filter(b => b.trim());

  for (const block of blocks) {
    const id = `HC-${extractId(block)}`;
    const type = extractKeyValue(block, 'Type');
    const target = extractKeyValue(block, 'Target');
    const condition = extractKeyValue(block, 'Condition');
    const failureMode = extractKeyValue(block, 'Failure Mode');
    const automationScript = extractCodeBlock(block, 'javascript');

    checks.push({ id, type, target, condition, failureMode, automationScript });
  }

  return checks;
}
```

### 3.2 Schema (`packages/shared/src/contracts/schema.ts`)

TypeScript interfaces for:
- `ComponentBehavioralContract` (root type)
- `HealthChecks`, `HealthCheck`, `PerformanceCheck`
- `TestHooks` (CSS selectors, data-testids, visual landmarks)
- All other contract sections (Identity, Props, Lifecycle, etc.)

### 3.3 Validator (`packages/shared/src/contracts/validate.ts`)

Validation functions:
```typescript
export function validateContract(contract: ComponentBehavioralContract): ValidationResult
export function validateAllContracts(contracts: Map<...>): Map<...>
export function formatValidationReport(results: Map<...>): string
```

### 3.4 Index (`packages/shared/src/contracts/index.ts`)

Likely exports all public APIs (parse, validate, schema types).

---

## 4. Generator Requirements

Based on HC structure and existing tooling:

### 4.1 Input Requirements

1. **Read all contracts** using `parseAllContracts(contractsDir)`
2. **Filter contracts with health checks:** `contract.healthChecks.critical.length > 0`
3. **Extract test information:**
   - Component name: `contract.identity.componentName`
   - File path: `contract.identity.filePath`
   - CSS selectors: `contract.testHooks.cssSelectors`
   - Critical checks: `contract.healthChecks.critical`
   - Warning checks: `contract.healthChecks.warning`

### 4.2 Output Requirements

**Option A: Chrome MCP Test Definition (Current Pattern)**

Generate TypeScript files matching `test/e2e/chrome-mcp-*.test.ts` format:

```typescript
// test/e2e/generated/AnimatedStepNode.test.ts
import type { TestStep } from '../chrome-mcp-utils';

export const step01_renderCheck: TestStep = {
  id: 'HC-ASN001',
  name: 'Node Renders with Step Data',
  description: 'Verify .animated-step-node renders with correct classes',
  tool: 'evaluate_script',
  params: {
    function: `async function checkNodeRender(stepNumber) { /* automation script */ }`
  },
  assertions: [
    { check: 'truthy', expected: true, message: 'Node should render with status classes' }
  ],
  screenshot: true,
  onFailure: 'abort'
};

export const testSteps: TestStep[] = [step01_renderCheck];
```

**Option B: Playwright Test (Future Pattern)**

Generate Playwright specs in `test/playwright/specs/generated/`:

```typescript
// test/playwright/specs/generated/AnimatedStepNode.spec.ts
import { test, expect } from '@playwright/test';

test.describe('AnimatedStepNode - Contract Health Checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Setup: create session, navigate to canvas
  });

  test('HC-ASN001: Node Renders with Step Data', async ({ page }) => {
    // Execute automation script
    const result = await page.evaluate(async () => {
      const node = document.querySelector('.animated-step-node');
      if (!node) throw new Error('Node not rendered');

      const hasStatusClass = Array.from(node.classList).some(c => c.startsWith('status-'));
      if (!hasStatusClass) throw new Error('Missing status class');

      return { rendered: true, classes: Array.from(node.classList) };
    });

    expect(result.rendered).toBe(true);
  });
});
```

### 4.3 Template Approach

**Stub Generation Strategy:**

1. **One file per contract** (e.g., `AnimatedStepNode.test.ts`)
2. **One test step per health check**
3. **Preserve automation script** (copy verbatim from contract)
4. **Add TODO comments** for missing pieces:
   - Setup/teardown logic
   - Navigation to component
   - Data fixtures (if needed)
   - Helper functions (e.g., `rectsOverlap`)

**Template Structure:**

```typescript
// File header
import { TestStep } from '../chrome-mcp-utils';

// TODO: Add setup logic
// - Navigate to page where {ComponentName} renders
// - Create necessary data fixtures (sessions, chains, etc.)

// Step for each health check
export const step{N}_{checkId}: TestStep = {
  id: '{checkId}',
  name: '{check.name}',
  description: '{check.target} - {check.condition}',
  tool: 'evaluate_script', // Default for automation scripts
  params: {
    function: `{check.automationScript}`
  },
  assertions: [
    { check: 'truthy', expected: true, message: '{check.condition}' }
  ],
  screenshot: true,
  onFailure: 'abort'
};

// Aggregated test steps
export const testSteps: TestStep[] = [step1_HC_ASN001, ...];
```

### 4.4 Generator CLI Design

**Proposed Script:** `scripts/generate-test-scaffolds.ts`

```bash
# Generate all test scaffolds from contracts
pnpm run generate:tests

# Generate tests for specific contract
pnpm run generate:tests -- AnimatedStepNode

# Generate tests with Playwright format (future)
pnpm run generate:tests -- --format=playwright
```

**Algorithm:**

1. Parse all contracts: `parseAllContracts(contractsDir)`
2. For each contract with health checks:
   - Extract critical + warning checks
   - Generate test file from template
   - Write to `test/e2e/generated/{ComponentName}.test.ts`
3. Generate index file: `test/e2e/generated/index.ts` (exports all test suites)
4. Generate README: `test/e2e/generated/README.md` (explains generated tests)

---

## 5. Recommendations

### 5.1 File Layout

```
test/
├── e2e/
│   ├── chrome-mcp-utils.ts              # Shared types/constants (existing)
│   ├── chrome-mcp-happy-path.test.ts    # Manual test definitions (existing)
│   ├── chrome-mcp-respect-check.test.ts # Manual test definitions (existing)
│   └── generated/                       # NEW: Auto-generated test scaffolds
│       ├── README.md                    # Explains generation process
│       ├── index.ts                     # Re-exports all test suites
│       ├── AnimatedStepNode.test.ts     # Generated from contract
│       ├── ChainDAG.test.ts             # Generated from contract
│       └── ...
├── playwright/
│   └── specs/                           # FUTURE: Playwright test specs
│       └── generated/                   # Auto-generated Playwright tests
└── curl-commands.sh                     # Legacy API tests
```

### 5.2 Test Framework Choice

**Recommendation: Start with Chrome MCP format**

**Rationale:**
- Chrome MCP tests already exist and are working
- Orchestrator can execute them directly (no new infrastructure)
- Automation scripts in contracts are already Chrome MCP compatible
- Playwright migration can happen later (format flag in generator)

**Migration Path:**
1. **Phase 1:** Generate Chrome MCP test stubs
2. **Phase 2:** Add Playwright format support (`--format=playwright`)
3. **Phase 3:** Integrate with CI/CD (run via `pnpm test:pw`)

### 5.3 Generator Features

**Must Have:**
- Parse contracts with `parseAllContracts()`
- Extract health checks (critical + warning)
- Generate one test file per contract
- Preserve automation scripts verbatim
- Add TODO comments for manual setup

**Nice to Have:**
- Filter by component name (`--component=AnimatedStepNode`)
- Dry-run mode (`--dry-run`)
- Update existing files (detect changes, prompt before overwriting)
- Generate helper function stubs (e.g., `rectsOverlap`)
- Validate generated code (run through TypeScript compiler)

**Future:**
- Playwright format support (`--format=playwright`)
- Auto-generate setup logic (detect component location from contract)
- Auto-generate fixture data (analyze props contract)

### 5.4 Template Design Principles

1. **Preserve automation scripts:** Copy verbatim from contract (don't modify)
2. **Add explicit TODOs:** Mark every piece that needs manual completion
3. **Use typed imports:** Import from `chrome-mcp-utils.ts` for type safety
4. **Follow naming convention:** `step{N}_{checkId}` for test steps
5. **Group by contract:** One file per contract, all health checks in that file
6. **Export test metadata:** Include component name, file path, check count

---

## Learnings

**Issue:** None — execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A

**Fresh Eye Discovery:**
- [FRESH EYE] Playwright is configured but test directory `test/playwright/specs/` doesn't exist. All E2E tests are in `test/e2e/` using Chrome MCP format. Recommend aligning Playwright config with actual test location OR creating `test/playwright/specs/` directory.
- [FRESH EYE] Chrome MCP tests are NOT automated tests—they are test runbooks executed manually by the orchestrator. This is a unique testing pattern that blurs the line between automated testing and interactive debugging.
- [FRESH EYE] Some automation scripts reference helper functions (e.g., `rectsOverlap`) that aren't defined in contracts. Generator should detect these and create TODO stubs for missing helpers.
- [FRESH EYE] Contract parser has robust markdown parsing but doesn't validate JavaScript syntax in automation scripts. Generator could add optional linting/validation step.

---

**Report Generated:** 2026-02-10
**Log Path:** `.claude/actionflows/logs/analyze/test-scaffold-patterns_2026-02-10-19-04-16/`
