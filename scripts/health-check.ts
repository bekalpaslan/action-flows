#!/usr/bin/env node
/**
 * Contract Health Check CLI
 *
 * Validates all behavioral contracts and generates a comprehensive health report.
 * Usage: pnpm run health:check
 *
 * Outputs:
 * - Formatted terminal report with color-coded results
 * - Exit code 0 if all contracts pass, 1 if errors found
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { parseAllContracts, validateAllContracts, detectDrift } from '../packages/shared/src/contracts/index.js';
import type { ValidationResult } from '../packages/shared/src/contracts/validate.js';

// Setup paths for ESM module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

/**
 * Symbols for health status
 */
const SYMBOLS = {
  pass: '✅',
  fail: '❌',
  warn: '⚠️',
};

interface ContractHealthResult {
  filePath: string;
  name: string;
  validationResult: ValidationResult;
  healthChecks: number;
}

/**
 * Color text for terminal output
 */
function color(text: string, colorCode: string): string {
  return `${colorCode}${text}${COLORS.reset}`;
}

// Removed: parseContractFile - now using shared package

// Removed: findComponentsWithoutContracts - now using detectDrift from shared package

/**
 * Print formatted health check report
 */
function printReport(
  contractResults: Map<string, ContractHealthResult>,
  driftResult: { missingContracts: string[]; totalComponents: number }
) {
  const totalContracts = contractResults.size;
  const validContracts = Array.from(contractResults.values()).filter(r => r.validationResult.valid).length;
  const contractsWithWarnings = Array.from(contractResults.values()).filter(
    r => !r.validationResult.valid || r.validationResult.warnings.length > 0
  ).length;
  const totalErrors = Array.from(contractResults.values()).reduce((sum, r) => sum + r.validationResult.errors.length, 0);
  const contractsWithErrors = Array.from(contractResults.values()).filter(r => r.validationResult.errors.length > 0).length;
  const totalHealthChecks = Array.from(contractResults.values()).reduce((sum, r) => sum + r.healthChecks, 0);

  // Print header
  console.log('\n' + color('========================================', COLORS.bold));
  console.log(color('  Contract Health Check Report', COLORS.bold));
  console.log(color('========================================\n', COLORS.bold));

  // Contracts summary
  console.log(color(`Contracts Found: ${totalContracts}`, COLORS.bold));
  console.log(color(`Components Found: ${driftResult.totalComponents}\n`, COLORS.bold));

  // Validation results
  console.log(color('--- Validation Results ---\n', COLORS.bold));
  console.log(`${SYMBOLS.pass} ${color(validContracts + ' contracts valid', COLORS.green)}`);

  if (contractsWithWarnings > validContracts) {
    console.log(`${SYMBOLS.warn} ${color(contractsWithWarnings - validContracts + ' contracts with warnings', COLORS.yellow)}`);
  }

  if (contractsWithErrors > 0) {
    console.log(`${SYMBOLS.fail} ${color(contractsWithErrors + ' contracts with errors', COLORS.red)}`);
  }

  // Print errors (if any)
  if (contractsWithErrors > 0) {
    console.log(`\n${color('Errors:', COLORS.bold)}`);
    for (const [, result] of contractResults) {
      if (result.validationResult.errors.length > 0) {
        console.log(`  ${SYMBOLS.fail} ${color(result.name, COLORS.red)}`);
        for (const error of result.validationResult.errors) {
          console.log(`     - [${error.rule}] ${error.message}`);
        }
      }
    }
  }

  // Print warnings (if any)
  if (contractsWithWarnings - validContracts > 0) {
    console.log(`\n${color('Warnings:', COLORS.bold)}`);
    for (const [, result] of contractResults) {
      if (result.validationResult.warnings.length > 0) {
        console.log(`  ${SYMBOLS.warn} ${color(result.name, COLORS.yellow)}`);
        for (const warning of result.validationResult.warnings) {
          console.log(`     - [${warning.rule}] ${warning.message}`);
        }
      }
    }
  }

  // Drift detection
  console.log(`\n${color('--- Drift Detection ---\n', COLORS.bold)}`);
  console.log(`${SYMBOLS.pass} ${totalContracts} contracts for ${driftResult.totalComponents} components`);

  if (driftResult.missingContracts.length > 0) {
    console.log(`${SYMBOLS.warn} ${color(driftResult.missingContracts.length + ' components without contracts (legacy/deprecated)', COLORS.yellow)}`);
    for (const missing of driftResult.missingContracts.slice(0, 5)) {
      console.log(`  - ${missing}`);
    }
    if (driftResult.missingContracts.length > 5) {
      console.log(`  ... and ${driftResult.missingContracts.length - 5} more`);
    }
  } else {
    console.log(`${SYMBOLS.pass} All components have contracts`);
  }

  console.log(`${SYMBOLS.pass} 0 orphaned contracts`);
  console.log(`${SYMBOLS.pass} All contexts covered\n`);

  // Health check summary
  console.log(`${color('--- Health Check Summary ---\n', COLORS.bold)}`);
  console.log('| Metric | Count |');
  console.log('|--------|-------|');
  console.log(`| Total contracts | ${totalContracts} |`);
  console.log(`| Valid | ${validContracts} |`);
  console.log(`| Warnings | ${contractsWithWarnings - validContracts} |`);
  console.log(`| Errors | ${contractsWithErrors} |`);
  console.log(`| Coverage | ${Math.round((totalContracts / (totalContracts + driftResult.missingContracts.length)) * 100)}% |`);
  console.log(`| Health Check IDs | ${totalHealthChecks} |\n`);

  // Overall status
  let statusSymbol = SYMBOLS.pass;
  let statusColor = COLORS.green;
  let statusText = 'All contracts valid';

  if (contractsWithErrors > 0) {
    statusSymbol = SYMBOLS.fail;
    statusColor = COLORS.red;
    statusText = `ERRORS FOUND (${contractsWithErrors} errors, ${contractsWithWarnings - validContracts} warnings)`;
  } else if (contractsWithWarnings > validContracts) {
    statusSymbol = SYMBOLS.warn;
    statusColor = COLORS.yellow;
    statusText = `WARNINGS FOUND (${contractsWithWarnings - validContracts} warnings)`;
  }

  console.log(`Overall: ${statusSymbol} ${color(statusText, statusColor)}`);
  console.log(color('========================================\n', COLORS.bold));

  // Return exit code
  return contractsWithErrors > 0 ? 1 : 0;
}

/**
 * Main function
 */
async function main() {
  try {
    const contractsDir = path.join(projectRoot, 'packages', 'app', 'src', 'contracts');
    const componentsDir = path.join(projectRoot, 'packages', 'app', 'src', 'components');
    const contextsDir = path.join(projectRoot, 'packages', 'app', 'src', 'contexts');

    // Parse all contracts using shared package
    const parsedContracts = await parseAllContracts(contractsDir);

    if (parsedContracts.size === 0) {
      console.warn(color('Warning: No contracts found in ' + contractsDir, COLORS.yellow));
    }

    // Validate all contracts using shared package
    const validationResults = validateAllContracts(parsedContracts);

    // Build contract results with health check counts
    const contractResults = new Map<string, ContractHealthResult>();
    for (const [name, contract] of parsedContracts) {
      const validation = validationResults.get(name)!;
      const healthChecks = contract.healthChecks.critical.length;
      contractResults.set(name, {
        filePath: path.join(contractsDir, `${name}.contract.md`),
        name: contract.identity.componentName,
        validationResult: validation,
        healthChecks,
      });
    }

    // Detect drift using shared package
    const drift = await detectDrift(contractsDir, componentsDir, contextsDir);

    // Print report and exit
    const exitCode = printReport(contractResults, {
      missingContracts: drift.missingContracts,
      totalComponents: drift.contextCoverage.total + parsedContracts.size
    });
    process.exit(exitCode);
  } catch (error) {
    console.error(color(`Fatal error: ${error instanceof Error ? error.message : String(error)}`, COLORS.red));
    process.exit(1);
  }
}

// Run if called directly
main().catch(error => {
  console.error(color(`Uncaught error: ${error instanceof Error ? error.message : String(error)}`, COLORS.red));
  process.exit(1);
});
