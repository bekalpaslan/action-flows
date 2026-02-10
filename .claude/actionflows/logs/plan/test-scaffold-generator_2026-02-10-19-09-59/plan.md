# Test Scaffold Generator Plan

**Date:** 2026-02-10
**Depth:** detailed
**Agent:** plan/test-scaffold-generator
**Log Path:** `.claude/actionflows/logs/plan/test-scaffold-generator_2026-02-10-19-09-59/`

---

## Executive Summary

Design and implement a CLI tool that reads behavioral contracts (.contract.md files) and auto-generates executable test scaffolds from their health check specifications. This generator bridges the gap between contract-defined health checks and runnable E2E tests, reducing manual test authoring effort while maintaining consistency with contract specifications.

**Key Design Decisions:**
1. **Primary Output Format:** Chrome MCP test definitions (existing pattern)
2. **Generator Location:** `scripts/generate-test-scaffolds.ts` (standalone script)
3. **Output Location:** `test/e2e/generated/` (isolated from manual tests)
4. **Regeneration Strategy:** Overwrite with warning + backup of existing files
5. **CLI Interface:** Simple filter flags + dry-run mode

---

## 1. Architecture Overview

### 1.1 Data Flow

```
Contracts (.contract.md)
    ↓ (parse via parseAllContracts)
ComponentBehavioralContract objects
    ↓ (filter: has health checks)
Filtered contracts
    ↓ (extract: critical + warning HCs)
Health check data
    ↓ (template: Chrome MCP test definition)
Generated test files
    ↓ (write: test/e2e/generated/)
Test scaffolds
```

### 1.2 Component Hierarchy

```
generate-test-scaffolds.ts (CLI entry)
├── ContractLoader (parse & filter)
├── TemplateEngine (generate code)
├── FileWriter (write outputs)
└── ReportGenerator (summary report)
```

---

## 2. Key Design Decisions

### Decision 1: Output Format — Chrome MCP Test Definitions

**Choice:** Generate Chrome MCP test definitions (`.test.ts` files matching `chrome-mcp-happy-path.test.ts` pattern)

**Rationale:**
- Chrome MCP tests already exist and are working
- Orchestrator can execute them directly (no new infrastructure)
- Automation scripts in contracts are already Chrome MCP compatible (JavaScript code blocks)
- Playwright migration can happen later as Phase 2

**Alternatives Considered:**
- Playwright specs: Requires new test execution infrastructure, not currently in use
- Vitest unit tests: Wrong abstraction level (contracts define integration/E2E behaviors)

**Migration Path:**
- Phase 1 (this plan): Chrome MCP test scaffolds
- Phase 2 (future): Add `--format=playwright` flag to generator
- Phase 3 (future): Integrate with CI/CD via `pnpm test:pw`

### Decision 2: Generator Location — `scripts/generate-test-scaffolds.ts`

**Choice:** Standalone script in `scripts/` directory

**Rationale:**
- Clear separation from contract tooling (contracts are shared infrastructure)
- Easy to run manually: `pnpm run generate:tests`
- Can be integrated into CI/CD pipeline later
- Follows existing pattern (`scripts/health-check.ts`)

**Alternatives Considered:**
- `packages/shared/src/contracts/generate.ts`: Couples generator to shared package
- Test directory: Generator is dev tooling, not test code

### Decision 3: Output Location — `test/e2e/generated/`

**Choice:** Isolated subdirectory under `test/e2e/`

**Rationale:**
- Clear separation from manually-authored tests
- Easy to .gitignore if desired (generated code)
- No risk of overwriting manual tests
- Simple glob pattern for bulk operations: `test/e2e/generated/**/*.test.ts`

**File Structure:**
```
test/e2e/
├── chrome-mcp-utils.ts              # Shared types/constants (existing)
├── chrome-mcp-happy-path.test.ts    # Manual test (existing)
├── chrome-mcp-respect-check.test.ts # Manual test (existing)
└── generated/                       # NEW: Auto-generated scaffolds
    ├── README.md                    # Explains generation process
    ├── index.ts                     # Re-exports all test suites
    ├── AnimatedStepNode.test.ts     # Generated from contract
    ├── ChainDAG.test.ts             # Generated from contract
    ├── SessionSidebar.test.ts       # Generated from contract
    └── ...
```

### Decision 4: Template System — Embedded TypeScript Templates

**Choice:** Use template literal strings with substitution

**Rationale:**
- Simple, no external template engine required
- Type-safe (TypeScript checks template output)
- Easy to maintain (templates live with generator code)
- Allows conditional logic (if HC has automationScript, include it)

**Template Structure:**
```typescript
const testStepTemplate = (hc: HealthCheck, index: number, componentName: string) => `
export const step${String(index + 1).padStart(2, '0')}_${hc.id.replace('HC-', '').toLowerCase()}: TestStep = {
  id: '${hc.id}',
  name: '${hc.target}',
  description: '${hc.condition}',
  tool: ${hc.automationScript ? "'evaluate_script'" : "'take_snapshot'"},
  params: ${generateParams(hc)},
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: '${hc.condition}'
    }
  ],
  screenshot: true,
  onFailure: '${hc.type === 'critical' ? 'abort' : 'continue'}'
};
`;
```

### Decision 5: Helper Function Handling — Detection + TODO Stubs

**Choice:** Detect undefined function references, generate TODO comments

**Rationale:**
- Some automation scripts reference helpers (e.g., `rectsOverlap`) not defined in contracts
- Generator can't infer helper implementations
- Best to surface missing dependencies explicitly with TODOs
- Developer can implement helpers in `test/e2e/chrome-mcp-helpers.ts`

**Detection Pattern:**
```typescript
// Extract function calls from automation script
const functionCalls = script.match(/\b(\w+)\s*\(/g);
const undefinedRefs = functionCalls.filter(fn => !isStandardAPI(fn));
// Generate TODO comment
if (undefinedRefs.length > 0) {
  return `// TODO: Implement helper functions: ${undefinedRefs.join(', ')}`;
}
```

### Decision 6: Regeneration Strategy — Overwrite with Warning + Backup

**Choice:** Overwrite existing files but create `.backup` copies and warn user

**Rationale:**
- Contracts are source of truth → regeneration should update tests
- But generated tests may have manual edits (TODOs filled in)
- Backup preserves manual work, warning alerts user
- Dry-run mode allows preview before overwriting

**Workflow:**
```bash
# Dry-run: Preview changes without writing
pnpm run generate:tests --dry-run

# Generate: Overwrite with backup + warning
pnpm run generate:tests
# Output: "⚠️  Overwriting 3 existing files (backups saved as .backup)"

# Restore manual edits from backup
diff test/e2e/generated/AnimatedStepNode.test.ts{,.backup}
```

### Decision 7: CLI Interface — Simple Flags

**Choice:** Minimalist CLI with essential flags only

**Flags:**
- `--component=<name>` — Generate tests for specific component(s) only
- `--dry-run` — Preview output without writing files
- `--verbose` — Show detailed progress logs
- `--help` — Show usage help

**Examples:**
```bash
# Generate all test scaffolds
pnpm run generate:tests

# Generate tests for specific component
pnpm run generate:tests --component=AnimatedStepNode

# Generate tests for multiple components (comma-separated)
pnpm run generate:tests --component=AnimatedStepNode,ChainDAG

# Dry-run mode (preview without writing)
pnpm run generate:tests --dry-run

# Verbose mode (show detailed logs)
pnpm run generate:tests --verbose
```

---

## 3. Implementation Specification

### 3.1 File Structure

```
scripts/
└── generate-test-scaffolds.ts       # Main generator script

test/e2e/
├── chrome-mcp-utils.ts              # Existing (no changes)
├── chrome-mcp-helpers.ts            # NEW: Shared helper functions
└── generated/
    ├── README.md                    # NEW: Generation docs
    ├── index.ts                     # NEW: Export all tests
    ├── AnimatedStepNode.test.ts     # GENERATED
    ├── ChainDAG.test.ts             # GENERATED
    └── ...

package.json
└── scripts:
    └── generate:tests              # NEW: CLI command
```

### 3.2 Main Script: `scripts/generate-test-scaffolds.ts`

**Purpose:** CLI entry point, orchestrates generation process

**Implementation:**
```typescript
#!/usr/bin/env tsx
/**
 * Test Scaffold Generator
 *
 * Reads behavioral contracts and auto-generates Chrome MCP test scaffolds
 * from health check specifications.
 *
 * Usage:
 *   pnpm run generate:tests
 *   pnpm run generate:tests --component=AnimatedStepNode
 *   pnpm run generate:tests --dry-run
 */

import { parseAllContracts } from '../packages/shared/src/contracts/parse.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { ComponentBehavioralContract, HealthCheck } from '../packages/shared/src/contracts/schema.js';

// === Configuration ===
const CONTRACTS_DIR = 'packages/app/src/contracts';
const OUTPUT_DIR = 'test/e2e/generated';
const BACKUP_SUFFIX = '.backup';

// === CLI Arguments ===
interface CLIArgs {
  component?: string;      // Filter by component name(s)
  dryRun: boolean;        // Preview without writing
  verbose: boolean;       // Detailed logs
  help: boolean;          // Show help
}

function parseArgs(argv: string[]): CLIArgs {
  const args: CLIArgs = { dryRun: false, verbose: false, help: false };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--verbose') args.verbose = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg.startsWith('--component=')) {
      args.component = arg.split('=')[1];
    }
  }

  return args;
}

function showHelp() {
  console.log(`
Test Scaffold Generator

Usage:
  pnpm run generate:tests [options]

Options:
  --component=<name>    Generate tests for specific component(s) only (comma-separated)
  --dry-run             Preview output without writing files
  --verbose             Show detailed progress logs
  --help, -h            Show this help message

Examples:
  pnpm run generate:tests
  pnpm run generate:tests --component=AnimatedStepNode
  pnpm run generate:tests --component=AnimatedStepNode,ChainDAG
  pnpm run generate:tests --dry-run
  `);
}

// === Main Generation Logic ===
async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  console.log('🔍 Parsing contracts...');
  const contracts = await parseAllContracts(CONTRACTS_DIR);

  // Filter contracts with health checks
  const filteredContracts = filterContracts(contracts, args);
  console.log(`✅ Found ${filteredContracts.length} contracts with health checks`);

  if (filteredContracts.length === 0) {
    console.log('No contracts to process. Exiting.');
    process.exit(0);
  }

  // Generate test scaffolds
  const outputs = generateTestScaffolds(filteredContracts, args);

  if (args.dryRun) {
    console.log('\n📋 Dry-run mode: Previewing outputs (not writing files)\n');
    outputs.forEach(output => {
      console.log(`File: ${output.path}`);
      console.log(`Lines: ${output.content.split('\n').length}`);
      console.log(`HCs: ${output.healthCheckCount}`);
      console.log('---');
    });
  } else {
    writeOutputs(outputs, args);
    generateIndexFile(outputs, args);
    generateReadme(args);

    console.log(`\n✅ Generated ${outputs.length} test scaffold(s) in ${OUTPUT_DIR}`);
  }
}

// === Helper Functions ===

function filterContracts(
  contracts: Map<string, ComponentBehavioralContract>,
  args: CLIArgs
): Array<{ key: string; contract: ComponentBehavioralContract }> {
  const filtered: Array<{ key: string; contract: ComponentBehavioralContract }> = [];

  for (const [key, contract] of contracts.entries()) {
    // Filter: contracts with health checks
    const hasCritical = contract.healthChecks.critical.length > 0;
    const hasWarning = contract.healthChecks.warning.length > 0;
    if (!hasCritical && !hasWarning) continue;

    // Filter: specific component(s) if specified
    if (args.component) {
      const targetComponents = args.component.split(',').map(c => c.trim());
      if (!targetComponents.includes(contract.identity.componentName)) {
        continue;
      }
    }

    filtered.push({ key, contract });
  }

  return filtered;
}

interface TestOutput {
  path: string;
  content: string;
  healthCheckCount: number;
  componentName: string;
}

function generateTestScaffolds(
  contracts: Array<{ key: string; contract: ComponentBehavioralContract }>,
  args: CLIArgs
): TestOutput[] {
  const outputs: TestOutput[] = [];

  for (const { key, contract } of contracts) {
    const componentName = contract.identity.componentName;
    const fileName = `${componentName}.test.ts`;
    const filePath = join(OUTPUT_DIR, fileName);

    const criticalChecks = contract.healthChecks.critical;
    const warningChecks = contract.healthChecks.warning;
    const allChecks = [...criticalChecks, ...warningChecks];

    if (args.verbose) {
      console.log(`  Generating ${fileName} (${allChecks.length} health checks)`);
    }

    const content = generateTestFile(contract, allChecks);

    outputs.push({
      path: filePath,
      content,
      healthCheckCount: allChecks.length,
      componentName,
    });
  }

  return outputs;
}

function generateTestFile(
  contract: ComponentBehavioralContract,
  healthChecks: HealthCheck[]
): string {
  const componentName = contract.identity.componentName;
  const filePath = contract.identity.filePath;

  // File header
  const header = generateHeader(componentName, filePath, healthChecks.length);

  // Imports
  const imports = generateImports();

  // TODO comments for setup
  const setupTodos = generateSetupTodos(contract);

  // Test steps (one per health check)
  const steps = healthChecks.map((hc, index) =>
    generateTestStep(hc, index, componentName, contract)
  ).join('\n\n');

  // Test metadata
  const metadata = generateTestMetadata(componentName, healthChecks.length);

  return `${header}\n\n${imports}\n\n${setupTodos}\n\n${steps}\n\n${metadata}`;
}

function generateHeader(componentName: string, filePath: string, checkCount: number): string {
  return `/**
 * Generated Test Scaffold: ${componentName}
 *
 * This file was auto-generated from the behavioral contract at:
 * ${filePath.replace('packages/app/src/', '')}
 *
 * Health Checks: ${checkCount}
 *
 * IMPORTANT: This is a SCAFFOLD. You must:
 * 1. Implement setup logic (navigate to component, create fixtures)
 * 2. Fill in dynamic parameters (UIDs from snapshots)
 * 3. Implement missing helper functions (if any)
 * 4. Test manually before relying on automation
 *
 * Generated: ${new Date().toISOString()}
 * Generator: scripts/generate-test-scaffolds.ts
 */`;
}

function generateImports(): string {
  return `import type { TestStep, TestContext } from '../chrome-mcp-utils';
import { BACKEND_URL, FRONTEND_URL, TIMEOUTS, SELECTORS } from '../chrome-mcp-utils';`;
}

function generateSetupTodos(contract: ComponentBehavioralContract): string {
  const componentName = contract.identity.componentName;
  const mountsUnder = contract.renderLocation.mountsUnder.join(', ');
  const conditions = contract.renderLocation.conditions.map(c => c.description).join(', ');

  return `/**
 * TODO: Setup Logic
 *
 * This component renders under: ${mountsUnder}
 * Render conditions: ${conditions}
 *
 * Required setup steps:
 * 1. Navigate to page where ${componentName} renders
 * 2. Create necessary data fixtures (sessions, chains, etc.)
 * 3. Trigger render conditions
 * 4. Take initial snapshot to identify element UIDs
 */`;
}

function generateTestStep(
  hc: HealthCheck,
  index: number,
  componentName: string,
  contract: ComponentBehavioralContract
): string {
  const stepId = hc.id.replace('HC-', '').toLowerCase();
  const stepNumber = String(index + 1).padStart(2, '0');
  const varName = `step${stepNumber}_${stepId}`;

  // Determine tool based on automation script presence
  const tool = hc.automationScript ? 'evaluate_script' : 'take_snapshot';

  // Generate params
  const params = hc.automationScript
    ? generateEvaluateScriptParams(hc)
    : '{}';

  // Generate assertions
  const assertions = generateAssertions(hc);

  // Detect missing helpers
  const helperTodo = detectMissingHelpers(hc.automationScript);

  const onFailure = contract.healthChecks.critical.includes(hc) ? 'abort' : 'continue';

  return `${helperTodo}export const ${varName}: TestStep = {
  id: '${hc.id}',
  name: '${hc.target}',
  description: '${escapeString(hc.condition)}',
  tool: '${tool}',
  params: ${params},
  assertions: ${assertions},
  screenshot: true,
  onFailure: '${onFailure}',
};`;
}

function generateEvaluateScriptParams(hc: HealthCheck): string {
  if (!hc.automationScript) return '{}';

  // Wrap automation script in function if it's not already
  const script = hc.automationScript.trim();

  return `{
    function: \`${script}\`,
  }`;
}

function generateAssertions(hc: HealthCheck): string {
  return `[
    {
      check: 'truthy',
      expected: true,
      message: '${escapeString(hc.condition)}',
    },
  ]`;
}

function detectMissingHelpers(script?: string): string {
  if (!script) return '';

  // Extract function calls
  const functionCalls = script.match(/\b(\w+)\s*\(/g)?.map(m => m.replace('(', '')) || [];

  // Filter out standard APIs
  const standardAPIs = new Set([
    'document', 'window', 'console', 'Array', 'Object', 'Promise',
    'setTimeout', 'setInterval', 'fetch', 'querySelector', 'querySelectorAll',
    'getBoundingClientRect', 'addEventListener', 'removeEventListener',
    'throw', 'return', 'await', 'async', 'new', 'Error',
  ]);

  const undefinedRefs = functionCalls.filter(fn => !standardAPIs.has(fn));

  if (undefinedRefs.length > 0) {
    return `// TODO: Implement helper functions in chrome-mcp-helpers.ts: ${[...new Set(undefinedRefs)].join(', ')}\n`;
  }

  return '';
}

function generateTestMetadata(componentName: string, checkCount: number): string {
  return `/**
 * All test steps in execution order
 */
export const testSteps: TestStep[] = [
  ${Array.from({ length: checkCount }, (_, i) => {
    const stepNum = String(i + 1).padStart(2, '0');
    return `step${stepNum}_*`; // Placeholder, will be replaced by actual step var names
  }).join(',\n  ')}
];

/**
 * Test metadata
 */
export const testMetadata = {
  name: '${componentName} - Contract Health Checks',
  description: 'Auto-generated test scaffold from behavioral contract',
  componentName: '${componentName}',
  totalSteps: ${checkCount},
  generated: '${new Date().toISOString()}',
};`;
}

function writeOutputs(outputs: TestOutput[], args: CLIArgs) {
  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let overwriteCount = 0;

  for (const output of outputs) {
    // Check if file exists
    if (existsSync(output.path)) {
      // Create backup
      const backupPath = `${output.path}${BACKUP_SUFFIX}`;
      const existing = readFileSync(output.path, 'utf-8');
      writeFileSync(backupPath, existing, 'utf-8');
      overwriteCount++;
    }

    // Write new file
    writeFileSync(output.path, output.content, 'utf-8');

    if (args.verbose) {
      console.log(`  ✅ ${output.path}`);
    }
  }

  if (overwriteCount > 0) {
    console.log(`\n⚠️  Overwrote ${overwriteCount} existing file(s) (backups saved as ${BACKUP_SUFFIX})`);
  }
}

function generateIndexFile(outputs: TestOutput[], args: CLIArgs) {
  const indexPath = join(OUTPUT_DIR, 'index.ts');

  const exports = outputs.map(output => {
    const fileName = output.path.split('/').pop()!.replace('.ts', '');
    return `export * from './${fileName}.js';`;
  }).join('\n');

  const content = `/**
 * Generated Test Scaffolds Index
 *
 * Auto-generated by scripts/generate-test-scaffolds.ts
 * Re-exports all generated test scaffolds
 *
 * Generated: ${new Date().toISOString()}
 */

${exports}
`;

  writeFileSync(indexPath, content, 'utf-8');
}

function generateReadme(args: CLIArgs) {
  const readmePath = join(OUTPUT_DIR, 'README.md');

  const content = `# Generated Test Scaffolds

This directory contains auto-generated Chrome MCP test scaffolds created from behavioral contracts.

## Overview

These test files are **scaffolds**, not complete tests. They provide:
- Test structure matching Chrome MCP pattern
- Health check automation scripts from contracts
- Type-safe test steps with assertions
- TODO comments for manual completion

## Usage

1. **Review generated tests** — Check that health checks match expectations
2. **Implement setup logic** — Navigate to component, create fixtures
3. **Fill in dynamic parameters** — Extract UIDs from snapshots
4. **Implement helpers** — Add missing helper functions to \`chrome-mcp-helpers.ts\`
5. **Test manually** — Execute via Claude: "run test X"

## Regeneration

Regenerate all scaffolds:
\`\`\`bash
pnpm run generate:tests
\`\`\`

Regenerate specific component:
\`\`\`bash
pnpm run generate:tests --component=AnimatedStepNode
\`\`\`

Preview without writing:
\`\`\`bash
pnpm run generate:tests --dry-run
\`\`\`

**Warning:** Regeneration overwrites existing files (backups saved as \`.backup\`)

## Generated Files

Each \`.test.ts\` file corresponds to one behavioral contract with health checks.

## Manual Tests

Manual tests (not generated) are in the parent directory:
- \`../chrome-mcp-happy-path.test.ts\`
- \`../chrome-mcp-respect-check.test.ts\`

## Source

Generator: \`scripts/generate-test-scaffolds.ts\`
Contracts: \`packages/app/src/contracts/\`
Last generated: ${new Date().toISOString()}
`;

  writeFileSync(readmePath, content, 'utf-8');
}

function escapeString(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\n/g, ' ');
}

// === Entry Point ===
main().catch(error => {
  console.error('❌ Generation failed:', error);
  process.exit(1);
});
```

**Key Implementation Notes:**
1. Uses existing `parseAllContracts()` from shared package
2. Filters contracts with at least 1 health check (critical or warning)
3. Generates one test file per contract
4. Wraps automation scripts in `evaluate_script` params
5. Detects undefined helper functions and generates TODO comments
6. Creates backups before overwriting existing files
7. Generates index file for easy import

### 3.3 Helper Functions File: `test/e2e/chrome-mcp-helpers.ts`

**Purpose:** Shared helper functions referenced by automation scripts

**Implementation:**
```typescript
/**
 * Chrome MCP Test Helper Functions
 *
 * Shared utility functions used by automation scripts in generated tests.
 * When a health check automation script references an undefined function,
 * implement it here.
 */

/**
 * Check if two rectangles overlap
 */
export function rectsOverlap(
  rect1: DOMRect | { left: number; right: number; top: number; bottom: number },
  rect2: DOMRect | { left: number; right: number; top: number; bottom: number }
): boolean {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

/**
 * Wait for element to appear in DOM
 */
export async function waitForElement(
  selector: string,
  timeout: number = 5000
): Promise<Element> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

/**
 * Get computed style property
 */
export function getStyleProperty(element: Element, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Check if element is visible (not display:none or visibility:hidden)
 */
export function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

/**
 * Get all text content from element (recursive)
 */
export function getAllTextContent(element: Element): string {
  return element.textContent?.trim() || '';
}
```

### 3.4 Generated README: `test/e2e/generated/README.md`

Already included in generator implementation (see `generateReadme()` function).

### 3.5 Package.json Script

**Add to `package.json`:**
```json
{
  "scripts": {
    "generate:tests": "tsx scripts/generate-test-scaffolds.ts"
  }
}
```

---

## 4. Test File Template Specification

### 4.1 File Header

Every generated file includes:
- Component name and contract path
- Health check count
- Warning about manual completion required
- Generation timestamp
- Generator script path

### 4.2 Imports

```typescript
import type { TestStep, TestContext } from '../chrome-mcp-utils';
import { BACKEND_URL, FRONTEND_URL, TIMEOUTS, SELECTORS } from '../chrome-mcp-utils';
```

### 4.3 Setup TODO Block

```typescript
/**
 * TODO: Setup Logic
 *
 * This component renders under: FlowVisualization
 * Render conditions: Rendered by ReactFlow for each node
 *
 * Required setup steps:
 * 1. Navigate to page where AnimatedStepNode renders
 * 2. Create necessary data fixtures (sessions, chains, steps)
 * 3. Trigger render conditions
 * 4. Take initial snapshot to identify element UIDs
 */
```

### 4.4 Test Step Structure

```typescript
export const step01_asn001: TestStep = {
  id: 'HC-ASN001',
  name: 'Node Renders with Step Data',
  description: '.animated-step-node exists, has status and animation classes',
  tool: 'evaluate_script',
  params: {
    function: `async function checkNodeRender(stepNumber) {
      const node = document.querySelector(\`.animated-step-node:has(.step-number:contains("#\${stepNumber}"))\`);
      if (!node) throw new Error(\`Node \${stepNumber} not rendered\`);

      const hasStatusClass = Array.from(node.classList).some(c => c.startsWith('status-'));
      if (!hasStatusClass) throw new Error('Missing status class');

      return { rendered: true, classes: Array.from(node.classList) };
    }`,
  },
  assertions: [
    {
      check: 'truthy',
      expected: true,
      message: '.animated-step-node exists, has status and animation classes',
    },
  ],
  screenshot: true,
  onFailure: 'abort',
};
```

### 4.5 Test Metadata

```typescript
export const testSteps: TestStep[] = [
  step01_asn001,
  step02_asn002,
  step03_asn003,
];

export const testMetadata = {
  name: 'AnimatedStepNode - Contract Health Checks',
  description: 'Auto-generated test scaffold from behavioral contract',
  componentName: 'AnimatedStepNode',
  totalSteps: 3,
  generated: '2026-02-10T19:00:00.000Z',
};
```

---

## 5. Edge Cases & Handling

### 5.1 Health Checks Without Automation Scripts

**Issue:** Not all health checks have `automationScript` field

**Handling:**
- Use `take_snapshot` tool instead of `evaluate_script`
- Generate assertion checking for element presence in snapshot
- Add TODO comment: "Implement automation logic for this check"

**Example:**
```typescript
export const step04_asn004: TestStep = {
  id: 'HC-ASN004',
  name: 'Animation Classes Applied',
  description: 'Node has animation class matching animationState prop',
  tool: 'take_snapshot',
  params: {},
  assertions: [
    {
      check: 'snapshot_has_element',
      target: '.animated-step-node.anim-pulse',
      expected: true,
      message: 'Node should have animation class',
    },
  ],
  screenshot: true,
  onFailure: 'continue',
};

// TODO: Implement automation logic for this check
// The contract specifies this check but no automation script was provided
```

### 5.2 Automation Scripts with Parameters

**Issue:** Some scripts have function parameters (e.g., `checkNodeRender(stepNumber)`)

**Handling:**
- Preserve function signature
- Add TODO comment to fill in parameter values
- Use dynamic params function if possible

**Example:**
```typescript
export const step01_asn001: TestStep = {
  id: 'HC-ASN001',
  name: 'Node Renders with Step Data',
  description: '.animated-step-node exists, has status and animation classes',
  tool: 'evaluate_script',
  params: (context: TestContext) => ({
    function: `async function checkNodeRender(stepNumber) {
      // ... script ...
    }`,
    args: [
      { value: context.stepNumber || 1 }, // TODO: Set correct step number
    ],
  }),
  assertions: [
    // ...
  ],
  screenshot: true,
  onFailure: 'abort',
};
```

### 5.3 Contracts with No Health Checks

**Issue:** Some contracts may not have any health checks defined

**Handling:**
- Skip during filtering phase
- Report in generator output: "Skipped 15 contracts (no health checks)"
- No file generated

### 5.4 Duplicate Health Check IDs

**Issue:** Parser might return duplicate HCs if contract is malformed

**Handling:**
- Generator assumes valid contracts (validation should happen before generation)
- If duplicate IDs exist, TypeScript variable names will collide (intentional error)
- User must fix contract, then regenerate

### 5.5 Contracts with Invalid Automation Scripts

**Issue:** Automation script may have syntax errors

**Handling:**
- Generator doesn't validate JavaScript syntax
- Copy script verbatim (preserves contract as source of truth)
- Add TODO comment: "Verify automation script syntax before running"
- Runtime error will surface during test execution

---

## 6. Validation & Testing Strategy

### 6.1 Generator Testing

**Unit Tests (future):**
- `generateTestStep()` produces valid TypeScript
- `detectMissingHelpers()` identifies undefined functions
- `filterContracts()` correctly filters by component name
- `escapeString()` handles special characters

**Integration Testing:**
1. Run generator on real contracts: `pnpm run generate:tests`
2. Check TypeScript compilation: `tsc --noEmit test/e2e/generated/*.ts`
3. Verify generated files have correct structure
4. Manually review 2-3 generated test files

### 6.2 Generated Test Validation

**Checklist per generated file:**
- [ ] Imports resolve correctly
- [ ] All TestStep exports are valid
- [ ] testSteps array references correct variables
- [ ] Automation scripts are properly escaped
- [ ] TODO comments highlight manual work required

**Manual Test Execution:**
1. Pick one generated test (e.g., `AnimatedStepNode.test.ts`)
2. Implement setup logic (TODOs)
3. Execute via Claude: "run the AnimatedStepNode contract health checks"
4. Verify steps execute successfully
5. Document any issues in generator code

---

## 7. Migration Path

### Phase 1: Chrome MCP Test Scaffolds (This Plan)

**Deliverables:**
- Generator script: `scripts/generate-test-scaffolds.ts`
- Helper functions: `test/e2e/chrome-mcp-helpers.ts`
- Generated tests: `test/e2e/generated/*.test.ts`
- Documentation: `test/e2e/generated/README.md`
- CLI command: `pnpm run generate:tests`

**Timeline:** 1-2 hours implementation + 1 hour testing

### Phase 2: Playwright Format Support (Future)

**Changes:**
- Add `--format=playwright` flag to generator
- Create `generatePlaywrightSpec()` function
- Output to `test/playwright/specs/generated/`
- Update README with Playwright examples

**Timeline:** 2-3 hours

### Phase 3: CI/CD Integration (Future)

**Changes:**
- Add GitHub Actions workflow: `.github/workflows/contract-tests.yml`
- Run `pnpm run generate:tests` before test execution
- Execute generated Playwright tests in CI
- Report failures as contract violations

**Timeline:** 1-2 hours

---

## 8. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Automation scripts have syntax errors | Medium | Low | Copy verbatim, surface errors at runtime |
| Helper functions undefined | High | Medium | Detect missing refs, generate TODO comments |
| Contracts change after generation | High | Medium | Overwrite with backup, dry-run mode |
| Generated tests are incomplete | High | Low | Clear TODO comments, README warnings |
| TypeScript compilation fails | Low | High | Validate output with `tsc --noEmit` in CI |

---

## 9. Success Criteria

**Generator is successful if:**
1. ✅ Parses all 99 contracts without errors
2. ✅ Generates valid TypeScript for all contracts with health checks
3. ✅ Generated files compile without TypeScript errors
4. ✅ Automation scripts are preserved verbatim
5. ✅ TODO comments clearly indicate manual work required
6. ✅ CLI flags (--component, --dry-run) work as expected
7. ✅ README explains generation process clearly
8. ✅ At least 1 generated test can be executed manually

---

## 10. Implementation Checklist

### Code Implementation
- [ ] Create `scripts/generate-test-scaffolds.ts`
- [ ] Implement `parseArgs()` CLI argument parser
- [ ] Implement `filterContracts()` with component filter
- [ ] Implement `generateTestFile()` template engine
- [ ] Implement `generateTestStep()` for health checks
- [ ] Implement `detectMissingHelpers()` for undefined functions
- [ ] Implement `writeOutputs()` with backup logic
- [ ] Implement `generateIndexFile()` for re-exports
- [ ] Implement `generateReadme()` for documentation
- [ ] Create `test/e2e/chrome-mcp-helpers.ts` with utility functions

### Configuration
- [ ] Add `generate:tests` script to `package.json`
- [ ] Create `test/e2e/generated/` directory
- [ ] Add `.gitignore` entry for `*.backup` files (optional)

### Testing & Validation
- [ ] Run generator on all contracts: `pnpm run generate:tests`
- [ ] Verify TypeScript compilation: `tsc --noEmit test/e2e/generated/*.ts`
- [ ] Review 3 generated test files manually
- [ ] Test `--component` filter with specific component
- [ ] Test `--dry-run` mode
- [ ] Test overwrite + backup behavior
- [ ] Manually execute 1 generated test via Claude

### Documentation
- [ ] Update main README with generator usage
- [ ] Update contract documentation with testing section
- [ ] Add example workflow: contract → generate → test

---

## 11. Future Enhancements

### Nice-to-Have Features (Not in Scope)

1. **Auto-detect setup logic**
   - Analyze `renderLocation.mountsUnder` and generate navigation steps
   - Analyze `propsContract.inputs` and generate fixture data
   - Timeline: 4-6 hours

2. **Smart helper function generation**
   - Infer helper implementations from usage patterns
   - Generate stub implementations with TypeScript types
   - Timeline: 3-4 hours

3. **Incremental regeneration**
   - Only regenerate files when contract changes
   - Use file hashes to detect changes
   - Timeline: 2-3 hours

4. **Interactive mode**
   - Prompt user for setup choices (navigation, fixtures)
   - Generate personalized test scaffolds
   - Timeline: 6-8 hours

5. **Visual test report**
   - Generate HTML report showing coverage by contract
   - Link generated tests to source contracts
   - Timeline: 4-5 hours

---

## Learnings

**Issue:** None — execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A

**Fresh Eye Discoveries:**
- [FRESH EYE] Some automation scripts reference helper functions (e.g., `rectsOverlap`) that don't exist in the codebase. The generator should create a shared helpers file (`chrome-mcp-helpers.ts`) to consolidate these utilities.
- [FRESH EYE] Health check IDs follow a prefix pattern (`HC-{PREFIX}-{NUM}`) that could be used to group related checks (e.g., all `HC-ASN*` checks are for AnimatedStepNode). Future enhancement could generate test suites grouped by prefix.
- [FRESH EYE] Contracts define `testHooks.cssSelectors` but some automation scripts use different selectors. Generator could validate that automation scripts reference documented selectors and warn if mismatched.
- [FRESH EYE] The `onFailure` strategy could be inferred from health check type: critical checks → abort, warning checks → continue. This pattern is consistent across all contracts reviewed.

---

**Plan Complete**
**Date:** 2026-02-10
**Actionable:** Yes — Ready for code agent implementation
**Estimated Effort:** 2-3 hours implementation + 1 hour testing
