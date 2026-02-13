#!/usr/bin/env tsx

/**
 * Routing Infrastructure Validator
 *
 * CLI tool to validate ROUTING_RULES.md and ROUTING_METADATA.md
 * Checks schema, circular dependencies, and coverage.
 *
 * Usage: pnpm run routing:validate
 */

import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import {
  validateRoutingRules,
  validateActionMetadataArray,
  validateRuleActions,
  validateMetadataDependencies,
  validateRulePriorities,
  checkRoutingCycles,
  checkDependencyCycles,
  analyzeRoutingGraph,
  formatCycleDetectionResult,
  formatRoutingGraphAnalysis,
} from '@afw/shared';

// ============================================================================
// File Loading
// ============================================================================

/**
 * Load YAML file and parse to JSON
 */
function loadYAML<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return YAML.parse(content) as T;
}

/**
 * Load rules from ROUTING_RULES.md
 */
function loadRoutingRules(): any[] {
  const projectRoot = path.resolve(__dirname, '../../..');
  const rulesFile = path.join(projectRoot, '.claude/actionflows/ROUTING_RULES.md');

  if (!fs.existsSync(rulesFile)) {
    throw new Error(`Routing rules file not found: ${rulesFile}`);
  }

  // Extract YAML blocks from markdown
  const content = fs.readFileSync(rulesFile, 'utf-8');
  const yamlBlocks = content.match(/```yaml\n([\s\S]*?)```/g) || [];

  if (yamlBlocks.length === 0) {
    throw new Error('No YAML blocks found in ROUTING_RULES.md');
  }

  const rules: any[] = [];

  for (const block of yamlBlocks) {
    const yaml = block.replace(/```yaml\n/, '').replace(/```$/, '');

    // Parse multiple rules separated by ---
    const ruleBlocks = yaml.split(/^---$/m);

    for (const ruleBlock of ruleBlocks) {
      if (ruleBlock.trim()) {
        try {
          const rule = YAML.parse(ruleBlock);
          if (rule) {
            rules.push(rule);
          }
        } catch (err) {
          console.error(`Failed to parse rule block: ${err}`);
        }
      }
    }
  }

  return rules;
}

/**
 * Load metadata from ROUTING_METADATA.md
 */
function loadActionMetadata(): any[] {
  const projectRoot = path.resolve(__dirname, '../../..');
  const metadataFile = path.join(
    projectRoot,
    '.claude/actionflows/ROUTING_METADATA.md'
  );

  if (!fs.existsSync(metadataFile)) {
    throw new Error(`Action metadata file not found: ${metadataFile}`);
  }

  // Extract YAML blocks from markdown
  const content = fs.readFileSync(metadataFile, 'utf-8');
  const yamlBlocks = content.match(/```yaml\n([\s\S]*?)```/g) || [];

  if (yamlBlocks.length === 0) {
    throw new Error('No YAML blocks found in ROUTING_METADATA.md');
  }

  const metadata: any[] = [];

  for (const block of yamlBlocks) {
    const yaml = block.replace(/```yaml\n/, '').replace(/```$/, '');

    try {
      const meta = YAML.parse(yaml);
      if (meta && meta.action) {
        metadata.push(meta);
      }
    } catch (err) {
      console.error(`Failed to parse metadata block: ${err}`);
    }
  }

  return metadata;
}

// ============================================================================
// Validation Runners
// ============================================================================

interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Run all validations
 */
function runValidation(): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('\n🔍 Routing Infrastructure Validation\n');
  console.log('=====================================\n');

  // 1. Load files
  console.log('1. Loading files...');
  let rules, metadata;

  try {
    rules = loadRoutingRules();
    console.log(`✅ Loaded ${rules.length} routing rules\n`);
  } catch (err) {
    errors.push(`Failed to load routing rules: ${err}`);
    return { valid: false, errors, warnings };
  }

  try {
    metadata = loadActionMetadata();
    console.log(`✅ Loaded ${metadata.length} action metadata entries\n`);
  } catch (err) {
    errors.push(`Failed to load action metadata: ${err}`);
    return { valid: false, errors, warnings };
  }

  // 2. Schema validation
  console.log('2. Validating schemas...');
  const rulesValidation = validateRoutingRules(rules);
  const metadataValidation = validateActionMetadataArray(metadata);

  if (!rulesValidation.valid) {
    for (const err of rulesValidation.errors) {
      const ruleId = err.rule_id || 'unknown';
      errors.push(`Rule ${ruleId}: ${err.errors.join(', ')}`);
    }
  } else {
    console.log(`✅ Routing rules schema valid`);
  }

  if (!metadataValidation.valid) {
    for (const err of metadataValidation.errors) {
      const action = err.action || 'unknown';
      errors.push(`Metadata ${action}: ${err.errors.join(', ')}`);
    }
  } else {
    console.log(`✅ Action metadata schema valid\n`);
  }

  if (!rulesValidation.valid || !metadataValidation.valid) {
    return { valid: false, errors, warnings };
  }

  // 3. Cross-validation: rules reference valid actions
  console.log('3. Validating rule action references...');
  const actionSet = new Set(metadata.map((m: any) => m.action));
  const actionErrors = validateRuleActions(rules, actionSet);

  if (actionErrors.length > 0) {
    errors.push(...actionErrors);
  } else {
    console.log(`✅ All rules reference valid actions\n`);
  }

  // 4. Circular dependency checks
  console.log('4. Checking for circular routing...');
  const routingCycles = checkRoutingCycles(rules);

  if (routingCycles.hasCycles) {
    for (const cycle of routingCycles.cycles) {
      errors.push(`Circular routing detected: ${cycle.join(' → ')}`);
    }
  } else {
    console.log(`✅ No circular routing detected`);
  }

  console.log('5. Checking for circular action dependencies...');
  const depCycles = checkDependencyCycles(metadata);

  if (depCycles.hasCycles) {
    for (const cycle of depCycles.cycles) {
      errors.push(`Circular dependency detected: ${cycle.join(' → ')}`);
    }
  } else {
    console.log(`✅ No circular action dependencies\n`);
  }

  // 5. Priority analysis
  console.log('6. Analyzing rule priorities...');
  const priorityWarnings = validateRulePriorities(rules);

  if (priorityWarnings.length > 0) {
    warnings.push(...priorityWarnings);
    console.log(`⚠️  ${priorityWarnings.length} priority warnings`);
  } else {
    console.log(`✅ Rule priorities well-distributed`);
  }

  // 6. Dependency validation
  console.log('7. Validating action dependencies...');
  const depErrors = validateMetadataDependencies(metadata);

  if (depErrors.length > 0) {
    errors.push(...depErrors);
  } else {
    console.log(`✅ All action dependencies valid\n`);
  }

  // 7. Graph analysis
  console.log('8. Analyzing routing graph topology...');
  const graphAnalysis = analyzeRoutingGraph(rules);
  console.log(formatRoutingGraphAnalysis(graphAnalysis));
  console.log('');

  // Summary
  const valid = errors.length === 0;

  if (valid) {
    console.log('✨ Routing infrastructure validation passed!\n');
  } else {
    console.log(`❌ Validation failed with ${errors.length} error(s)\n`);
  }

  return { valid, errors, warnings };
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  try {
    const report = runValidation();

    // Print detailed errors
    if (report.errors.length > 0) {
      console.log('ERRORS:');
      console.log('-------');
      for (const error of report.errors) {
        console.log(`  ❌ ${error}`);
      }
      console.log('');
    }

    // Print warnings
    if (report.warnings.length > 0) {
      console.log('WARNINGS:');
      console.log('---------');
      for (const warning of report.warnings) {
        console.log(`  ⚠️  ${warning}`);
      }
      console.log('');
    }

    // Exit with appropriate code
    process.exit(report.valid ? 0 : 1);
  } catch (err) {
    console.error(`Validation failed: ${err}`);
    process.exit(1);
  }
}

main();
