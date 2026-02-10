#!/usr/bin/env node
/**
 * Contract Health Check CI Script
 *
 * Machine-readable JSON output for CI/CD pipelines.
 * Usage: pnpm run health:check:ci
 *
 * Outputs JSON to stdout with contract validation results.
 * Exit code 0 if no errors, 1 if errors found.
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { parseAllContracts, validateAllContracts, detectDrift } from '../packages/shared/src/contracts/index.js';
import type { ValidationResult, ValidationError, ValidationWarning } from '../packages/shared/src/contracts/validate.js';

// Setup paths for ESM module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

interface ContractDetail {
  filePath: string;
  name: string;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  healthChecks: number;
}

interface CIHealthCheckResult {
  passed: boolean;
  timestamp: string;
  summary: {
    totalContracts: number;
    validContracts: number;
    warningContracts: number;
    errorContracts: number;
    totalHealthChecks: number;
    componentCoverage: number;
  };
  details: {
    errors: ContractDetail[];
    warnings: ContractDetail[];
    valid: ContractDetail[];
  };
}

// Removed: parseContractFile - now using shared package

// Removed: findComponentsWithoutContracts - now using detectDrift from shared package

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

    // Validate all contracts using shared package
    const validationResults = validateAllContracts(parsedContracts);

    // Detect drift using shared package
    const drift = await detectDrift(contractsDir, componentsDir, contextsDir);

    // Calculate metrics
    const totalContracts = parsedContracts.size;
    const validCount = Array.from(validationResults.values()).filter(r => r.valid && r.warnings.length === 0).length;
    const warningCount = Array.from(validationResults.values()).filter(r => r.valid && r.warnings.length > 0).length;
    const errorCount = Array.from(validationResults.values()).filter(r => !r.valid).length;
    const totalHealthChecks = Array.from(parsedContracts.values()).reduce((sum, c) => sum + c.healthChecks.critical.length, 0);
    const totalComponents = drift.missingContracts.length + parsedContracts.size;
    const coverage = totalComponents > 0 ? (totalContracts / totalComponents) * 100 : 0;

    // Organize results by status
    const details = {
      errors: Array.from(parsedContracts.entries())
        .filter(([name]) => !validationResults.get(name)!.valid)
        .map(([name, contract]) => {
          const validation = validationResults.get(name)!;
          return {
            filePath: path.join(contractsDir, `${name}.contract.md`),
            name: contract.identity.componentName,
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
            healthChecks: contract.healthChecks.critical.length,
          };
        }),
      warnings: Array.from(parsedContracts.entries())
        .filter(([name]) => {
          const validation = validationResults.get(name)!;
          return validation.valid && validation.warnings.length > 0;
        })
        .map(([name, contract]) => {
          const validation = validationResults.get(name)!;
          return {
            filePath: path.join(contractsDir, `${name}.contract.md`),
            name: contract.identity.componentName,
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
            healthChecks: contract.healthChecks.critical.length,
          };
        }),
      valid: Array.from(parsedContracts.entries())
        .filter(([name]) => {
          const validation = validationResults.get(name)!;
          return validation.valid && validation.warnings.length === 0;
        })
        .map(([name, contract]) => {
          const validation = validationResults.get(name)!;
          return {
            filePath: path.join(contractsDir, `${name}.contract.md`),
            name: contract.identity.componentName,
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
            healthChecks: contract.healthChecks.critical.length,
          };
        }),
    };

    const result: CIHealthCheckResult = {
      passed: errorCount === 0,
      timestamp: new Date().toISOString(),
      summary: {
        totalContracts,
        validContracts: validCount,
        warningContracts: warningCount,
        errorContracts: errorCount,
        totalHealthChecks,
        componentCoverage: Math.round(coverage * 100) / 100,
      },
      details,
    };

    console.log(JSON.stringify(result, null, 2));
    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    const errorResult: CIHealthCheckResult = {
      passed: false,
      timestamp: new Date().toISOString(),
      summary: {
        totalContracts: 0,
        validContracts: 0,
        warningContracts: 0,
        errorContracts: 1,
        totalHealthChecks: 0,
        componentCoverage: 0,
      },
      details: {
        errors: [
          {
            filePath: '',
            name: 'fatal-error',
            valid: false,
            errors: [
              {
                rule: 'uncaught-error',
                message: error instanceof Error ? error.message : String(error),
              },
            ],
            warnings: [],
            healthChecks: 0,
          },
        ],
        warnings: [],
        valid: [],
      },
    };
    console.log(JSON.stringify(errorResult, null, 2));
    process.exit(1);
  }
}

// Run if called directly
main().catch(error => {
  console.error('Uncaught error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
