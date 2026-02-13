/**
 * Routing Schema Validators
 *
 * Zod-based validation for routing rules and action metadata.
 * Ensures routing infrastructure maintains correctness and consistency.
 */

import { z } from 'zod';

// ============================================================================
// Routing Rule Schema
// ============================================================================

/**
 * Confidence levels for routing decisions
 */
export const ConfidenceLevel = z.enum(['high', 'medium', 'low']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevel>;

/**
 * Valid contexts for routing
 */
export const Context = z.enum([
  'work',
  'maintenance',
  'explore',
  'review',
  'settings',
  'pm',
  'intel',
]);
export type Context = z.infer<typeof Context>;

/**
 * Routing rule condition specification
 */
export const RoutingCondition = z.object({
  context: z.array(Context).min(1),
  keywords: z.array(z.string()).min(0),
  scope_patterns: z.array(z.string()).optional(),
  input_types: z.record(z.string()).optional(),
});
export type RoutingCondition = z.infer<typeof RoutingCondition>;

/**
 * Complete routing rule specification
 */
export const RoutingRule = z.object({
  rule_id: z.string().regex(/^RR\d{3}$/),
  priority: z.number().int().min(1).max(100),
  confidence: ConfidenceLevel,
  condition: RoutingCondition,
  action: z.string().regex(/^[a-z\-]+\/$/),
  fallback: z.string().regex(/^[a-z\-]+\/$/).optional(),
  rationale: z.string().min(1),
});
export type RoutingRule = z.infer<typeof RoutingRule>;

// ============================================================================
// Action Metadata Schema
// ============================================================================

/**
 * Scope preference specification
 */
export const ScopePreference = z.object({
  single_file: z.boolean(),
  multi_file: z.boolean(),
  multi_package: z.boolean(),
});
export type ScopePreference = z.infer<typeof ScopePreference>;

/**
 * Trigger specification for action discovery
 */
export const ActionTriggers = z.object({
  keywords: z.array(z.string()).min(1),
  patterns: z.array(z.string()),
  situations: z.array(z.string()).min(1),
});
export type ActionTriggers = z.infer<typeof ActionTriggers>;

/**
 * Complete action metadata specification
 */
export const ActionMetadata = z.object({
  action: z.string().regex(/^[a-z\-]+\/$/),
  context_affinity: z.array(Context).min(1),
  capability_tags: z.array(z.string()).min(1),
  scope_preference: ScopePreference,
  confidence_threshold: ConfidenceLevel,
  parallel_safe: z.boolean(),
  dependencies: z.array(z.string().regex(/^[a-z\-]+\/$/)).default([]),
  output_types: z.array(z.string()).default([]),
  triggers: ActionTriggers,
  routing_priority: z.number().int().min(1).max(100),
});
export type ActionMetadata = z.infer<typeof ActionMetadata>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a single routing rule
 * @param rule - Rule object to validate
 * @returns Validation result with errors if any
 */
export function validateRoutingRule(rule: unknown): {
  valid: boolean;
  errors: string[];
} {
  const result = RoutingRule.safeParse(rule);
  const errors: string[] = [];

  if (!result.success) {
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      errors.push(`${path}: ${err.message}`);
    });
  }

  return {
    valid: result.success,
    errors,
  };
}

/**
 * Validate multiple routing rules
 * @param rules - Array of rules to validate
 * @returns Validation results with all errors
 */
export function validateRoutingRules(rules: unknown[]): {
  valid: boolean;
  errors: Array<{ rule_id?: string; errors: string[] }>;
} {
  const allErrors: Array<{ rule_id?: string; errors: string[] }> = [];

  for (const rule of rules) {
    const result = validateRoutingRule(rule);
    if (!result.valid) {
      allErrors.push({
        rule_id: (rule as any)?.rule_id,
        errors: result.errors,
      });
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Validate a single action metadata entry
 * @param metadata - Metadata object to validate
 * @returns Validation result with errors if any
 */
export function validateActionMetadata(metadata: unknown): {
  valid: boolean;
  errors: string[];
} {
  const result = ActionMetadata.safeParse(metadata);
  const errors: string[] = [];

  if (!result.success) {
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      errors.push(`${path}: ${err.message}`);
    });
  }

  return {
    valid: result.success,
    errors,
  };
}

/**
 * Validate multiple action metadata entries
 * @param metadataArray - Array of metadata to validate
 * @returns Validation results with all errors
 */
export function validateActionMetadataArray(metadataArray: unknown[]): {
  valid: boolean;
  errors: Array<{ action?: string; errors: string[] }>;
} {
  const allErrors: Array<{ action?: string; errors: string[] }> = [];

  for (const metadata of metadataArray) {
    const result = validateActionMetadata(metadata);
    if (!result.valid) {
      allErrors.push({
        action: (metadata as any)?.action,
        errors: result.errors,
      });
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

// ============================================================================
// Cross-Validation Helpers
// ============================================================================

/**
 * Validate that all rules reference valid actions
 * @param rules - Routing rules to check
 * @param validActions - Set of valid action names
 * @returns Errors if any rules reference invalid actions
 */
export function validateRuleActions(
  rules: RoutingRule[],
  validActions: Set<string>
): string[] {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!validActions.has(rule.action)) {
      errors.push(`Rule ${rule.rule_id}: Action "${rule.action}" not found`);
    }
    if (rule.fallback && !validActions.has(rule.fallback)) {
      errors.push(
        `Rule ${rule.rule_id}: Fallback action "${rule.fallback}" not found`
      );
    }
  }

  return errors;
}

/**
 * Validate that all metadata references valid actions with dependencies
 * @param metadataArray - Action metadata to check
 * @returns Errors if any dependencies reference invalid actions
 */
export function validateMetadataDependencies(
  metadataArray: ActionMetadata[]
): string[] {
  const errors: string[] = [];
  const validActions = new Set(metadataArray.map((m) => m.action));

  for (const metadata of metadataArray) {
    for (const dependency of metadata.dependencies) {
      if (!validActions.has(dependency)) {
        errors.push(
          `Action ${metadata.action}: Dependency "${dependency}" not found`
        );
      }
    }
  }

  return errors;
}

/**
 * Validate rule priority ordering (debugging helper)
 * @param rules - Routing rules to check
 * @returns Warnings about priority distribution
 */
export function validateRulePriorities(rules: RoutingRule[]): string[] {
  const warnings: string[] = [];
  const priorityCounts = new Map<number, number>();

  for (const rule of rules) {
    priorityCounts.set(
      rule.priority,
      (priorityCounts.get(rule.priority) ?? 0) + 1
    );
  }

  // Warn if too many rules at same priority (may cause ties)
  for (const [priority, count] of priorityCounts.entries()) {
    if (count > 3) {
      warnings.push(
        `${count} rules at priority ${priority} may cause scoring ties`
      );
    }
  }

  return warnings;
}
