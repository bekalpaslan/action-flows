/**
 * Chain Type Detection Utility
 * Detects chain type from actions (explicit Type field or inferred from step patterns)
 * Supports: openspec, code-review, audit, test, generic
 */

import type { Chain, ChainStep } from '@afw/shared';

export type ChainType = 'openspec' | 'code-review' | 'audit' | 'test' | 'generic';

export interface ChainMetadata {
  /** Detected or explicit chain type */
  type: ChainType;

  /** true if from explicit Type field in inputs, false if inferred from actions */
  isExplicit: boolean;

  /** Display badge label (emoji + text) */
  badge: string;

  /** Optional change ID for openspec chains */
  changeId?: string;
}

/**
 * Detects chain type using dual approach:
 * 1. Check for explicit Type field in first step inputs
 * 2. Infer type from action patterns if no explicit type
 */
export function detectChainType(chain: Chain): ChainMetadata {
  // Check for explicit Type field in first step
  if (chain.steps.length > 0) {
    const firstStep = chain.steps[0];
    if (firstStep.inputs && typeof firstStep.inputs === 'object') {
      const explicitType = (firstStep.inputs as Record<string, unknown>)['Type'];
      if (explicitType && isValidChainType(explicitType)) {
        const changeId = extractChangeId(chain);
        return {
          type: explicitType as ChainType,
          isExplicit: true,
          badge: getChainBadge(explicitType as ChainType),
          changeId,
        };
      }
    }
  }

  // Infer type from action patterns
  const inferredType = inferTypeFromActions(chain.steps);
  const changeId = extractChangeId(chain);

  return {
    type: inferredType,
    isExplicit: false,
    badge: getChainBadge(inferredType),
    changeId,
  };
}

/**
 * Infer chain type from sequence of actions
 */
export function inferTypeFromActions(steps: ChainStep[]): ChainType {
  if (steps.length === 0) return 'generic';

  const actions = steps.map(s => s.action.toLowerCase());

  // OpenSpec: contains openspec-propose or openspec-apply
  if (
    actions.some(a => a.includes('openspec-propose') || a.includes('openspec-apply'))
  ) {
    return 'openspec';
  }

  // Code Review: has code followed by review
  if (hasPatternSequence(actions, ['code', 'review'])) {
    return 'code-review';
  }

  // Audit: primary action is audit (possibly with fixes)
  if (
    actions.some(a => a === 'audit') &&
    actions.length <= 3 &&
    !actions.some(a => a === 'review')
  ) {
    return 'audit';
  }

  // Test: primary action is test or coverage
  if (actions.some(a => a === 'test' || a === 'coverage')) {
    // If it's mostly test/coverage steps (>50% of chain)
    const testCount = actions.filter(a => a === 'test' || a === 'coverage').length;
    if (testCount / actions.length >= 0.5) {
      return 'test';
    }
  }

  return 'generic';
}

/**
 * Check if actions contain a specific sequence pattern
 */
function hasPatternSequence(actions: string[], pattern: string[]): boolean {
  if (pattern.length === 0) return false;
  if (pattern.length > actions.length) return false;

  for (let i = 0; i <= actions.length - pattern.length; i++) {
    if (actions[i] === pattern[0]) {
      // Check if pattern matches from this position
      let matches = true;
      for (let j = 1; j < pattern.length; j++) {
        if (actions[i + j] !== pattern[j]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
  }

  return false;
}

/**
 * Extract change ID from openspec chain
 */
export function extractChangeId(chain: Chain): string | undefined {
  // Look for changeId in any step's inputs
  for (const step of chain.steps) {
    if (step.inputs && typeof step.inputs === 'object') {
      const inputs = step.inputs as Record<string, unknown>;

      // Direct changeId field
      if (typeof inputs.changeId === 'string') {
        return inputs.changeId;
      }

      // In proposal/apply inputs
      if (typeof inputs.proposal_id === 'string') {
        return inputs.proposal_id;
      }
    }
  }

  // Try to extract from ref field
  const refMatch = chain.ref?.match(/change-(\d+)/i);
  if (refMatch?.[1]) {
    return refMatch[1];
  }

  return undefined;
}

/**
 * Check if value is a valid chain type
 */
function isValidChainType(value: unknown): value is ChainType {
  const validTypes: ChainType[] = ['openspec', 'code-review', 'audit', 'test', 'generic'];
  return typeof value === 'string' && validTypes.includes(value as ChainType);
}

/**
 * Get display badge for chain type
 */
export function getChainBadge(type: ChainType): string {
  const badges: Record<ChainType, string> = {
    openspec: '📋 OpenSpec',
    'code-review': '💻 Code Review',
    audit: '🔍 Audit',
    test: '🧪 Test',
    generic: '',
  };

  return badges[type];
}

/**
 * Get CSS class for chain type styling
 */
export function getChainTypeClass(type: ChainType): string {
  return `chain-type-${type}`;
}
