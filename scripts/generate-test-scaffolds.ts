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
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import type { ComponentBehavioralContract, HealthCheck, HealthCheckType } from '../packages/shared/src/contracts/schema.js';

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

  if (args.verbose) {
    console.log(`📄 Total contracts parsed: ${contracts.size}`);
    for (const [key, contract] of contracts.entries()) {
      const criticalCount = contract.healthChecks.critical.length;
      const warningCount = contract.healthChecks.warning.length;
      console.log(`  - ${key}: ${criticalCount} critical, ${warningCount} warning checks`);
    }
  }

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

// === Health Check Parser (Direct) ===

/**
 * Parse component name directly from contract markdown
 */
function parseComponentName(content: string): string {
  const match = content.match(/^-\s*\*\*Component Name:\*\*\s*(.+)$/m);
  return match ? match[1].trim() : 'Unknown';
}

/**
 * Parse health checks directly from contract markdown
 * This is a fallback parser since the shared package parser has issues
 */
function parseHealthChecksDirectly(filePath: string): { critical: HealthCheck[]; warning: HealthCheck[] } {
  const content = readFileSync(filePath, 'utf-8');

  // Extract Health Checks section (matches until next ## section)
  const healthChecksMatch = content.match(/^## Health Checks\s*\n([\s\S]*?)(?=\n## )/m);
  if (!healthChecksMatch) {
    return { critical: [], warning: [] };
  }

  const healthChecksSection = healthChecksMatch[1];

  // Extract Critical Checks subsection (matches until next ### or ## section)
  const criticalMatch = healthChecksSection.match(/^### Critical Checks[^\n]*\n([\s\S]*?)(?=\n### |\n## )/m);
  const critical = criticalMatch ? parseHealthCheckBlocks(criticalMatch[1], true) : [];

  // Extract Warning Checks subsection (matches until next ### or ## section)
  const warningMatch = healthChecksSection.match(/^### Warning Checks[^\n]*\n([\s\S]*?)(?=\n### |\n## )/m);
  const warning = warningMatch ? parseHealthCheckBlocks(warningMatch[1], false) : [];

  return { critical, warning };
}

function parseHealthCheckBlocks(text: string, isCritical: boolean): HealthCheck[] {
  const checks: HealthCheck[] = [];

  // Split by #### HC- headers
  const blocks = text.split(/^#### (HC-[A-Z0-9]+):/m).slice(1); // Remove first empty element

  // Process in pairs: [id, content, id, content, ...]
  for (let i = 0; i < blocks.length; i += 2) {
    const id = blocks[i].trim();
    const block = blocks[i + 1];

    if (!block) continue;

    // Extract title from first line
    const titleMatch = block.match(/^\s*(.+?)(?=\n|$)/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract fields
    const type = extractField(block, 'Type') || 'render';
    const target = extractField(block, 'Target') || '';
    const condition = extractField(block, 'Condition') || '';
    const failureMode = extractField(block, 'Failure Mode') || '';
    const automationScript = extractCodeBlock(block);

    checks.push({
      id,
      type: type as HealthCheckType,
      target,
      condition,
      failureMode,
      automationScript: automationScript || undefined,
    });
  }

  return checks;
}

function extractField(text: string, fieldName: string): string {
  const regex = new RegExp(`-\\s*\\*\\*${fieldName}:\\*\\*\\s*(.+?)(?=\\n|$)`, 'm');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractCodeBlock(text: string): string {
  const match = text.match(/```(?:javascript|js)?\s*\n([\s\S]*?)\n```/);
  return match ? match[1].trim() : '';
}

// === Helper Functions ===

function filterContracts(
  contracts: Map<string, ComponentBehavioralContract>,
  args: CLIArgs
): Array<{ key: string; contract: ComponentBehavioralContract; filePath: string }> {
  const filtered: Array<{ key: string; contract: ComponentBehavioralContract; filePath: string }> = [];

  // Walk directory to find contract files
  function walkDir(dir: string, prefix: string = ''): void {
    if (args.verbose && prefix === '') {
      console.log(`\n📂 Walking directory: ${dir}`);
    }
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith('.contract.md')) {
        const key = prefix ? `${prefix}/${entry.name.replace('.contract.md', '')}` : entry.name.replace('.contract.md', '');
        const contract = contracts.get(key);

        if (!contract) {
          if (args.verbose) {
            console.log(`  [SKIP] No contract in map for key: ${key}`);
          }
          continue;
        }

        // Parse directly from file to workaround parser issues
        const fileContent = readFileSync(fullPath, 'utf-8');
        const componentName = parseComponentName(fileContent);
        const healthChecks = parseHealthChecksDirectly(fullPath);
        const hasCritical = healthChecks.critical.length > 0;
        const hasWarning = healthChecks.warning.length > 0;

        if (args.verbose) {
          console.log(`  [FOUND] ${key}: ${hasCritical ? healthChecks.critical.length : 0} critical, ${hasWarning ? healthChecks.warning.length : 0} warning (name: ${componentName})`);
        }

        if (!hasCritical && !hasWarning) {
          if (args.verbose && args.component && componentName === args.component) {
            console.log(`    [SKIP] No health checks for ${componentName}`);
          }
          continue;
        }

        // Filter: specific component(s) if specified
        if (args.component) {
          const targetComponents = args.component.split(',').map(c => c.trim());
          if (!targetComponents.includes(componentName)) {
            if (args.verbose) {
              console.log(`    [SKIP] Component filter: ${componentName} not in [${targetComponents.join(', ')}]`);
            }
            continue;
          }
        }

        // Override contract fields with directly parsed values
        contract.identity.componentName = componentName;
        contract.healthChecks = { ...contract.healthChecks, critical: healthChecks.critical, warning: healthChecks.warning };

        filtered.push({ key, contract, filePath: fullPath });
      }
    }
  }

  walkDir(CONTRACTS_DIR);

  return filtered;
}

interface TestOutput {
  path: string;
  content: string;
  healthCheckCount: number;
  componentName: string;
}

function generateTestScaffolds(
  contracts: Array<{ key: string; contract: ComponentBehavioralContract; filePath: string }>,
  args: CLIArgs
): TestOutput[] {
  const outputs: TestOutput[] = [];

  for (const { key, contract, filePath: contractFilePath } of contracts) {
    const componentName = contract.identity.componentName;
    const fileName = `${componentName}.test.ts`;
    const filePath = join(OUTPUT_DIR, fileName);

    const criticalChecks = contract.healthChecks.critical;
    const warningChecks = contract.healthChecks.warning;
    const allChecks = [...criticalChecks, ...warningChecks];

    if (args.verbose) {
      console.log(`  Generating ${fileName} (${allChecks.length} health checks)`);
    }

    const content = generateTestFile(contract, allChecks, contractFilePath);

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
  healthChecks: HealthCheck[],
  contractFilePath: string
): string {
  const componentName = contract.identity.componentName;

  // File header
  const header = generateHeader(componentName, contractFilePath, healthChecks.length);

  // Imports
  const imports = generateImports();

  // TODO comments for setup
  const setupTodos = generateSetupTodos(contract);

  // Test steps (one per health check)
  const stepVarNames: string[] = [];
  const steps = healthChecks.map((hc, index) => {
    const stepId = hc.id.replace('HC-', '').toLowerCase();
    const stepNumber = String(index + 1).padStart(2, '0');
    const varName = `step${stepNumber}_${stepId}`;
    stepVarNames.push(varName);
    return generateTestStep(hc, index, componentName, contract);
  }).join('\n\n');

  // Test metadata
  const metadata = generateTestMetadata(componentName, healthChecks.length, stepVarNames);

  return `${header}\n\n${imports}\n\n${setupTodos}\n\n${steps}\n\n${metadata}`;
}

function generateHeader(componentName: string, contractFilePath: string, checkCount: number): string {
  // Convert absolute path to relative from repo root
  const relativePath = contractFilePath.replace(/^.*[\\\/]packages[\\\/]app[\\\/]src[\\\/]/, 'packages/app/src/');

  return `/**
 * Generated Test Scaffold: ${componentName}
 *
 * This file was auto-generated from the behavioral contract at:
 * ${relativePath}
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
  name: '${escapeString(hc.target)}',
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

  const script = hc.automationScript.trim();

  // Check if script is a function declaration
  const isFunctionDeclaration = /^(?:async\s+)?function\s+\w+\s*\(/.test(script);

  let wrappedScript: string;
  if (isFunctionDeclaration) {
    // Function declaration needs IIFE wrapper with parameters
    // Extract function name for call
    const functionNameMatch = script.match(/^(?:async\s+)?function\s+(\w+)\s*\(/);
    const functionName = functionNameMatch ? functionNameMatch[1] : 'checkFunc';
    wrappedScript = `(${script}; ${functionName}(/* TODO: Fill parameters */))`;
  } else {
    // Assume it's already an expression or statement block; wrap as IIFE
    wrappedScript = `(() => { ${script} })()`;
  }

  // Escape backticks and template literals
  const escapedScript = wrappedScript.replace(/`/g, '\\`').replace(/\$/g, '\\$');

  return `{
    function: \`${escapedScript}\`,
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

  // Extract function definitions (these are NOT missing helpers)
  const functionDefs = script.match(/(?:async\s+)?function\s+(\w+)\s*\(/g)?.map(m => {
    const match = m.match(/function\s+(\w+)/);
    return match ? match[1] : '';
  }).filter(Boolean) || [];

  // Remove string literals to avoid false positives (e.g., 'rgb(250, 250, 250)')
  const scriptWithoutStrings = script
    .replace(/'[^']*'/g, '""')  // Remove single-quoted strings
    .replace(/"[^"]*"/g, '""')  // Remove double-quoted strings
    .replace(/`[^`]*`/g, '""'); // Remove template literals

  // Extract function calls from sanitized script
  const functionCalls = scriptWithoutStrings.match(/\b(\w+)\s*\(/g)?.map(m => m.replace(/\s*\($/, '')) || [];

  // Filter out standard APIs, keywords, and built-in methods
  const standardAPIs = new Set([
    // JavaScript keywords and control flow
    'if', 'for', 'while', 'do', 'switch', 'case', 'return', 'throw', 'try', 'catch',
    'typeof', 'instanceof', 'await', 'async', 'new', 'delete', 'void', 'yield',

    // Global objects and constructors
    'document', 'window', 'console', 'Array', 'Object', 'Promise', 'Error',
    'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON', 'RegExp', 'Map', 'Set',

    // Timing and async
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'fetch',
    'requestAnimationFrame', 'cancelAnimationFrame',

    // DOM queries
    'querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName',
    'getElementsByTagName', 'getElementsByName', 'closest', 'matches',

    // DOM manipulation
    'createElement', 'createTextNode', 'appendChild', 'removeChild', 'replaceChild',
    'insertBefore', 'cloneNode', 'remove', 'append', 'prepend', 'after', 'before',

    // Element methods
    'getAttribute', 'setAttribute', 'removeAttribute', 'hasAttribute',
    'getBoundingClientRect', 'getComputedStyle', 'scrollIntoView',
    'focus', 'blur', 'click', 'submit', 'reset',

    // Event handling
    'addEventListener', 'removeEventListener', 'dispatchEvent',

    // ClassList methods
    'classList', 'contains', 'add', 'toggle',

    // Array methods
    'some', 'every', 'filter', 'map', 'forEach', 'reduce', 'reduceRight',
    'find', 'findIndex', 'includes', 'indexOf', 'lastIndexOf',
    'join', 'split', 'slice', 'splice', 'concat',
    'push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'fill',
    'flat', 'flatMap', 'at', 'from', 'of', 'isArray',

    // String methods
    'trim', 'trimStart', 'trimEnd', 'toLowerCase', 'toUpperCase',
    'replace', 'replaceAll', 'match', 'matchAll', 'search',
    'startsWith', 'endsWith', 'substring', 'substr', 'charAt', 'charCodeAt',
    'padStart', 'padEnd', 'repeat', 'normalize',

    // Object methods
    'keys', 'values', 'entries', 'assign', 'freeze', 'seal', 'is',
    'create', 'defineProperty', 'getOwnPropertyNames', 'hasOwnProperty',
    'isPrototypeOf', 'propertyIsEnumerable',

    // Number and Math
    'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'toFixed', 'toPrecision',
    'toExponential', 'abs', 'ceil', 'floor', 'round', 'max', 'min', 'random',

    // Conversion methods
    'toString', 'toJSON', 'valueOf', 'toLocaleString',

    // Array-like and iteration
    'length', 'size', 'has', 'get', 'set', 'clear', 'delete',

    // Promise methods
    'then', 'catch', 'finally', 'all', 'race', 'allSettled', 'any', 'resolve', 'reject',

    // RegExp methods
    'test', 'exec',
  ]);

  // Filter: remove standard APIs and functions defined in this script
  const undefinedRefs = functionCalls.filter(fn =>
    !standardAPIs.has(fn) && !functionDefs.includes(fn)
  );

  if (undefinedRefs.length > 0) {
    return `// TODO: Implement helper functions in chrome-mcp-helpers.ts: ${[...new Set(undefinedRefs)].join(', ')}\n`;
  }

  return '';
}

function generateTestMetadata(componentName: string, checkCount: number, stepVarNames: string[]): string {
  return `/**
 * All test steps in execution order
 */
export const testSteps: TestStep[] = [
  ${stepVarNames.join(',\n  ')}
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

  // Use namespace exports to avoid name collisions (testSteps, testMetadata)
  const exports = outputs.map(output => {
    const fileName = output.componentName;
    return `export * as ${fileName} from './${fileName}.test.js';`;
  }).join('\n');

  const content = `/**
 * Generated Test Scaffolds Index
 *
 * Auto-generated by scripts/generate-test-scaffolds.ts
 * Re-exports all generated test scaffolds using namespace exports to avoid collisions
 *
 * Usage:
 *   import { AnimatedStepNode } from './generated';
 *   const steps = AnimatedStepNode.testSteps;
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
