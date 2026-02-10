/**
 * Component Behavioral Contract Validator
 *
 * Validates parsed contracts for:
 * - Completeness (all required sections present)
 * - Correctness (required fields have valid values)
 * - Consistency (health check IDs are unique and properly formatted)
 * - Quality (no placeholders or TODO markers)
 */

import type { ComponentBehavioralContract, HealthCheck } from './schema.js';

/**
 * Validation error - must be fixed before contract is valid
 */
export interface ValidationError {
  rule: string;
  message: string;
  section?: string;
}

/**
 * Validation warning - should be fixed but doesn't block validity
 */
export interface ValidationWarning {
  rule: string;
  message: string;
  section?: string;
}

/**
 * Complete validation result for a single contract
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Patterns that indicate TODO/TBD placeholders
 */
const PLACEHOLDER_PATTERNS = [
  /\bTODO\b/i,
  /\bTBD\b/i,
  /\{.*?\}/,  // {placeholder}
  /\[.*?\]/,  // [placeholder]
  /placeholder/i,
  /FIXME/i,
  /XXX/i,
];

/**
 * Health check ID pattern: HC-{PREFIX}-{NUMBER}
 * Where PREFIX is 2+ uppercase letters and NUMBER is 1+ digits
 */
const HEALTH_CHECK_ID_PATTERN = /^HC-[A-Z]{2,}-\d+$/;

/**
 * Validate that a health check ID follows the required format
 * @param id - The health check ID to validate
 * @returns true if valid format, false otherwise
 */
function isValidHealthCheckId(id: string): boolean {
  return HEALTH_CHECK_ID_PATTERN.test(id);
}

/**
 * Check if content contains placeholder/TODO markers
 * @param content - Text content to check
 * @returns true if placeholders found, false otherwise
 */
function hasPlaceholders(content: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * Recursively check all string values in an object for placeholders
 * @param obj - Object to check
 * @returns array of field paths that contain placeholders
 */
function findPlaceholderFields(obj: unknown, path = ''): string[] {
  const results: string[] = [];

  if (typeof obj === 'string') {
    if (hasPlaceholders(obj)) {
      results.push(path || 'value');
    }
    return results;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      results.push(...findPlaceholderFields(item, `${path}[${index}]`));
    });
    return results;
  }

  if (obj !== null && typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = path ? `${path}.${key}` : key;
      results.push(...findPlaceholderFields(value, newPath));
    });
  }

  return results;
}

/**
 * Extract health check IDs from all sections
 * @param contract - Contract to analyze
 * @returns array of all health check IDs found
 */
function getAllHealthCheckIds(contract: ComponentBehavioralContract): string[] {
  const ids: string[] = [];

  if (contract.healthChecks.critical) {
    ids.push(...contract.healthChecks.critical.map((hc: HealthCheck) => hc.id));
  }

  if (contract.healthChecks.warning) {
    ids.push(...contract.healthChecks.warning.map((hc: HealthCheck) => hc.id));
  }

  return ids;
}

/**
 * Validate a single parsed contract
 * @param contract - The parsed contract to validate
 * @returns ValidationResult with errors and warnings
 */
export function validateContract(contract: ComponentBehavioralContract): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // =========================================================================
  // 1. Required Sections Present
  // =========================================================================

  const requiredSections = [
    { field: 'identity', label: 'Identity' },
    { field: 'renderLocation', label: 'Render Location' },
    { field: 'lifecycle', label: 'Lifecycle' },
    { field: 'propsContract', label: 'Props Contract' },
    { field: 'stateOwnership', label: 'State Ownership' },
    { field: 'interactions', label: 'Interactions' },
    { field: 'sideEffects', label: 'Side Effects' },
    { field: 'testHooks', label: 'Test Hooks' },
    { field: 'healthChecks', label: 'Health Checks' },
    { field: 'dependencies', label: 'Dependencies' },
  ];

  for (const { field, label } of requiredSections) {
    if (!(field in contract) || contract[field as keyof ComponentBehavioralContract] === undefined) {
      errors.push({
        rule: 'required-sections-present',
        message: `Required section "${label}" is missing`,
        section: label,
      });
    }
  }

  // =========================================================================
  // 2. Identity Fields Validation
  // =========================================================================

  if (!contract.identity.componentName || contract.identity.componentName.trim() === '') {
    errors.push({
      rule: 'identity-component-name',
      message: 'componentName must be non-empty',
      section: 'Identity',
    });
  }

  if (!contract.identity.filePath || contract.identity.filePath.trim() === '') {
    errors.push({
      rule: 'identity-file-path',
      message: 'filePath must be non-empty',
      section: 'Identity',
    });
  }

  const validTypes = ['page', 'feature', 'widget', 'utility'];
  if (!validTypes.includes(contract.identity.type)) {
    errors.push({
      rule: 'identity-type',
      message: `type must be one of: ${validTypes.join(', ')}. Got: ${contract.identity.type}`,
      section: 'Identity',
    });
  }

  // =========================================================================
  // 3. Health Check IDs
  // =========================================================================

  const healthCheckIds = getAllHealthCheckIds(contract);

  // Check for duplicates
  const uniqueIds = new Set(healthCheckIds);
  if (uniqueIds.size !== healthCheckIds.length) {
    const duplicates = healthCheckIds.filter(
      (id, index, arr) => arr.indexOf(id) !== index,
    );
    errors.push({
      rule: 'health-check-ids-unique',
      message: `Duplicate health check IDs found: ${[...new Set(duplicates)].join(', ')}`,
      section: 'Health Checks',
    });
  }

  // Check format of all IDs
  const invalidIds = healthCheckIds.filter((id) => !isValidHealthCheckId(id));
  if (invalidIds.length > 0) {
    errors.push({
      rule: 'health-check-ids-prefixed',
      message: `Health check IDs must match pattern HC-{PREFIX}-{NUMBER} (e.g., HC-CHAT-001). Invalid IDs: ${invalidIds.join(', ')}`,
      section: 'Health Checks',
    });
  }

  // =========================================================================
  // 4. Contract Version
  // =========================================================================

  if (!contract.metadata.contractVersion || contract.metadata.contractVersion.trim() === '') {
    errors.push({
      rule: 'contract-version-present',
      message: 'contractVersion must be present in metadata',
      section: 'Metadata',
    });
  }

  // =========================================================================
  // 5. Health Check Coverage
  // =========================================================================

  if (!contract.healthChecks.critical || contract.healthChecks.critical.length === 0) {
    errors.push({
      rule: 'at-least-one-critical-health-check',
      message: 'Every contract must have at least one critical health check',
      section: 'Health Checks',
    });
  }

  // =========================================================================
  // 6. Test Hooks - CSS Selectors
  // =========================================================================

  if (!contract.testHooks.cssSelectors || contract.testHooks.cssSelectors.length === 0) {
    errors.push({
      rule: 'test-hooks-css-selectors',
      message: 'Test Hooks must have at least one CSS selector for targeting',
      section: 'Test Hooks',
    });
  }

  // =========================================================================
  // 7. No TODO/TBD Markers
  // =========================================================================

  const placeholderFields = findPlaceholderFields(contract);
  if (placeholderFields.length > 0) {
    warnings.push({
      rule: 'no-placeholder-markers',
      message: `Contract contains TODO/TBD markers in fields: ${placeholderFields.join(', ')}`,
      section: 'Content Quality',
    });
  }

  // =========================================================================
  // Result
  // =========================================================================

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all contracts in a map
 * @param contracts - Map of contract names to parsed contracts
 * @returns Map of contract names to their validation results
 */
export function validateAllContracts(
  contracts: Map<string, ComponentBehavioralContract>,
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();

  for (const [name, contract] of contracts.entries()) {
    results.set(name, validateContract(contract));
  }

  return results;
}

/**
 * Generate a human-readable validation report
 * @param results - Map of validation results
 * @returns Formatted report string
 */
export function formatValidationReport(results: Map<string, ValidationResult>): string {
  const lines: string[] = [];
  let validCount = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  lines.push('# Contract Validation Report\n');

  for (const [name, result] of results.entries()) {
    if (result.valid) {
      validCount++;
    } else {
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;

      lines.push(`## ${name}`);
      lines.push(`Status: **INVALID** (${result.errors.length} errors, ${result.warnings.length} warnings)\n`);

      if (result.errors.length > 0) {
        lines.push('### Errors');
        result.errors.forEach((err) => {
          lines.push(`- [${err.section || 'General'}] ${err.rule}: ${err.message}`);
        });
        lines.push('');
      }

      if (result.warnings.length > 0) {
        lines.push('### Warnings');
        result.warnings.forEach((warn) => {
          lines.push(`- [${warn.section || 'General'}] ${warn.rule}: ${warn.message}`);
        });
        lines.push('');
      }
    }
  }

  const total = results.size;
  lines.unshift(`## Summary\n- Valid: ${validCount}/${total}\n- Total Errors: ${totalErrors}\n- Total Warnings: ${totalWarnings}\n`);

  return lines.join('\n');
}
