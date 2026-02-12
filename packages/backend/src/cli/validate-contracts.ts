#!/usr/bin/env npx tsx
/**
 * validate-contracts.ts — Behavioral Contract Validation Tool
 *
 * Validates all *.contract.md files in packages/app/src/components/ against
 * their corresponding component implementations. Ensures:
 * - Component files exist at specified paths
 * - Props interfaces match contract specifications
 * - All test hooks (data-testid) are present in component JSX
 *
 * Exit codes:
 * - 0: All contracts valid
 * - 1: Contract violations found
 *
 * Usage: node packages/backend/dist/cli/validate-contracts.js
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { resolve, join, relative } from 'path';
import { glob } from 'glob';

// Resolve project root (4 levels up from src/cli/)
const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..', '..', '..');

interface ContractFile {
  path: string;
  componentName: string;
  componentFilePath: string;
  propsInterface: string;
  testHooks: string[];
}

interface ValidationViolation {
  type: 'missing_component' | 'props_mismatch' | 'missing_test_hook' | 'contract_parse_error';
  component: string;
  message: string;
  details?: string[];
}

interface ValidationReport {
  valid: ContractFile[];
  violations: ValidationViolation[];
  totalContracts: number;
  totalValid: number;
  totalViolations: number;
}

/**
 * Parse a contract file and extract:
 * - Component name
 * - Component file path
 * - Props interface
 * - Test hook identifiers
 */
function parseContractFile(contractPath: string): ContractFile | null {
  try {
    const content = readFileSync(contractPath, 'utf-8');

    // Extract Component Name from ## Identity section
    const componentNameMatch = content.match(/\*\*Component Name:\*\*\s+(\w+)/);
    if (!componentNameMatch || !componentNameMatch[1]) {
      console.warn(`⚠️ Could not extract component name from ${contractPath}`);
      return null;
    }
    const componentName = componentNameMatch[1];

    // Extract File Path from ## Identity section
    const filePathMatch = content.match(/\*\*File Path:\*\*\s+([^\n]+)/);
    if (!filePathMatch || !filePathMatch[1]) {
      console.warn(`⚠️ Could not extract file path from ${contractPath}`);
      return null;
    }
    const componentFilePath = filePathMatch[1].trim();

    // Extract Props Contract (between ```typescript and ```)
    const propsMatch = content.match(/## Props Contract\s*\n```typescript\n([\s\S]*?)\n```/);
    const propsInterface = propsMatch ? propsMatch[1].trim() : '';

    // Extract Test Hooks (lines with data-testid=)
    const testHooksMatch = content.match(/## Test Hooks\n([\s\S]*?)(?=\n## |\n$)/);
    const testHooks: string[] = [];
    if (testHooksMatch && testHooksMatch[1]) {
      const lines = testHooksMatch[1].split('\n');
      for (const line of lines) {
        const hookMatch = line.match(/`data-testid="([^"]+)"`/);
        if (hookMatch && hookMatch[1]) {
          testHooks.push(hookMatch[1]);
        }
      }
    }

    return {
      path: contractPath,
      componentName,
      componentFilePath,
      propsInterface,
      testHooks,
    };
  } catch (error) {
    console.warn(`⚠️ Error parsing contract file ${contractPath}: ${error}`);
    return null;
  }
}

/**
 * Validate component file exists at specified path
 */
function validateComponentExists(componentFilePath: string): boolean {
  const fullPath = join(PROJECT_ROOT, componentFilePath);
  return existsSync(fullPath);
}

/**
 * Extract the interface name and properties from a props interface string
 */
function parsePropsInterface(propsInterface: string): { name?: string; properties: Map<string, string> } {
  const properties = new Map<string, string>();

  if (!propsInterface) {
    return { properties };
  }

  // Handle "// No props" or similar
  if (propsInterface.includes('No props')) {
    return { properties };
  }

  // Extract interface name
  const interfaceNameMatch = propsInterface.match(/interface\s+(\w+)/);
  const name = interfaceNameMatch ? interfaceNameMatch[1] : undefined;

  // Extract properties (name?: type or name: type)
  const propRegex = /(\w+)\??:\s*([^;}\n]+)/g;
  let match;
  while ((match = propRegex.exec(propsInterface)) !== null) {
    const propName = match[1] || '';
    const propType = match[2] ? match[2].trim() : '';
    if (propName) {
      properties.set(propName, propType);
    }
  }

  return { name, properties };
}

/**
 * Extract actual props from component TypeScript file
 */
function extractComponentProps(componentFilePath: string): Map<string, string> {
  const fullPath = join(PROJECT_ROOT, componentFilePath);
  if (!existsSync(fullPath)) {
    return new Map();
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');
    const properties = new Map<string, string>();

    // Look for interface or type definition with Props in name
    const propsDefinitionRegex = /(?:interface|type)\s+(\w*Props\w*)\s*(?:=|\{)([\s\S]*?)(?:^[}]|interface|type)/m;
    const match = propsDefinitionRegex.exec(content);

    if (match && match[2]) {
      const propsBody = match[2];
      const propRegex = /(\w+)\??:\s*([^;}\n]+)/g;
      let propMatch;
      while ((propMatch = propRegex.exec(propsBody)) !== null) {
        const propName = propMatch[1] || '';
        const propType = propMatch[2] ? propMatch[2].trim() : '';
        if (propName) {
          properties.set(propName, propType);
        }
      }
    }

    return properties;
  } catch (error) {
    return new Map();
  }
}

/**
 * Compare contract props with actual component props
 */
function validateProps(contract: ContractFile): ValidationViolation[] {
  const violations: ValidationViolation[] = [];

  const contractProps = parsePropsInterface(contract.propsInterface);
  const componentProps = extractComponentProps(contract.componentFilePath);

  // If contract says no props, check that component also has no props
  if (contractProps.properties.size === 0) {
    if (componentProps.size > 0) {
      violations.push({
        type: 'props_mismatch',
        component: contract.componentName,
        message: `Contract specifies no props but component has ${componentProps.size} prop(s)`,
        details: Array.from(componentProps.keys()),
      });
    }
    return violations;
  }

  // Check for missing props
  for (const [propName] of contractProps.properties) {
    if (!componentProps.has(propName)) {
      violations.push({
        type: 'props_mismatch',
        component: contract.componentName,
        message: `Missing prop in component: ${propName}`,
      });
    }
  }

  // Check for extra props (component has props not in contract)
  for (const [propName] of componentProps) {
    if (!contractProps.properties.has(propName)) {
      violations.push({
        type: 'props_mismatch',
        component: contract.componentName,
        message: `Extra prop in component not in contract: ${propName}`,
      });
    }
  }

  return violations;
}

/**
 * Validate test hooks exist in component file
 */
function validateTestHooks(contract: ContractFile): ValidationViolation[] {
  const violations: ValidationViolation[] = [];

  if (contract.testHooks.length === 0) {
    return violations;
  }

  const fullPath = join(PROJECT_ROOT, contract.componentFilePath);
  if (!existsSync(fullPath)) {
    return violations; // Already reported missing component
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');

    for (const hook of contract.testHooks) {
      // Check for data-testid="hook-name" in JSX
      if (!content.includes(`data-testid="${hook}"`) && !content.includes(`data-testid='${hook}'`)) {
        violations.push({
          type: 'missing_test_hook',
          component: contract.componentName,
          message: `Missing test hook in component: data-testid="${hook}"`,
        });
      }
    }
  } catch (error) {
    // Silent fail - file read error already handled
  }

  return violations;
}

/**
 * Main validation logic
 */
async function validateContracts(): Promise<void> {
  console.log('🔍 ActionFlows Behavioral Contract Validator\n');

  const contractsDir = join(PROJECT_ROOT, 'packages', 'app', 'src', 'components');

  // Find all .contract.md files
  let contractPaths: string[] = [];
  try {
    contractPaths = await glob('**/*.contract.md', {
      cwd: contractsDir,
      absolute: true,
    });
  } catch (error) {
    console.error('❌ Error globbing contract files:', error);
    process.exit(1);
  }

  if (contractPaths.length === 0) {
    console.log('⚠️ No contract files found');
    process.exit(1);
  }

  console.log(`Found ${contractPaths.length} contract file(s)\n`);

  const report: ValidationReport = {
    valid: [],
    violations: [],
    totalContracts: contractPaths.length,
    totalValid: 0,
    totalViolations: 0,
  };

  // Parse and validate each contract
  for (const contractPath of contractPaths) {
    const contract = parseContractFile(contractPath);
    if (!contract) {
      const relPath = relative(PROJECT_ROOT, contractPath);
      report.violations.push({
        type: 'contract_parse_error',
        component: relPath,
        message: 'Failed to parse contract file',
      });
      report.totalViolations++;
      continue;
    }

    // Check if component file exists
    if (!validateComponentExists(contract.componentFilePath)) {
      report.violations.push({
        type: 'missing_component',
        component: contract.componentName,
        message: `Component file not found: ${contract.componentFilePath}`,
      });
      report.totalViolations++;
      continue;
    }

    // Validate props
    const propsViolations = validateProps(contract);
    if (propsViolations.length > 0) {
      report.violations.push(...propsViolations);
      report.totalViolations += propsViolations.length;
    }

    // Validate test hooks
    const hooksViolations = validateTestHooks(contract);
    if (hooksViolations.length > 0) {
      report.violations.push(...hooksViolations);
      report.totalViolations += hooksViolations.length;
    }

    // If no violations, mark as valid
    if (propsViolations.length === 0 && hooksViolations.length === 0) {
      const testHookCount = contract.testHooks.length;
      const propCount = parsePropsInterface(contract.propsInterface).properties.size;
      console.log(
        `✅ ${contract.componentName}: Valid (${propCount} prop${propCount !== 1 ? 's' : ''}, ${testHookCount} test hook${testHookCount !== 1 ? 's' : ''})`
      );
      report.valid.push(contract);
      report.totalValid++;
    }
  }

  // Print violations
  if (report.violations.length > 0) {
    console.log('\n--- Violations ---\n');
    for (const violation of report.violations) {
      let symbol = '❌';
      if (violation.type === 'contract_parse_error') {
        symbol = '⚠️';
      }
      console.log(`${symbol} ${violation.component}: ${violation.message}`);
      if (violation.details) {
        for (const detail of violation.details) {
          console.log(`   - ${detail}`);
        }
      }
    }
  }

  // Print summary
  console.log('\n--- Summary ---\n');
  console.log(`✅ Valid contracts: ${report.totalValid}/${report.totalContracts}`);
  console.log(`❌ Violations: ${report.totalViolations}`);

  // Exit with appropriate code
  if (report.totalViolations > 0) {
    console.log('\n⚠️ Contract validation failed');
    process.exit(1);
  } else {
    console.log('\n✅ All contracts valid');
    process.exit(0);
  }
}

// Run validation
validateContracts().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
