/**
 * Routing Algorithm
 *
 * Orchestrator Gate 4 uses this algorithm to select the best action
 * for a given context, scope, and keywords.
 */

import type { RoutingRule, ActionMetadata, ConfidenceLevel } from './routingValidator.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Routing decision with confidence score and metadata
 */
export interface RoutingDecision {
  /** Selected action */
  action: string;
  /** Confidence score 0.0-1.0 */
  score: number;
  /** Rule that matched (if any) */
  matchedRule: RoutingRule | null;
  /** Why this action was selected */
  rationale: string;
  /** Was this a confident decision or fallback? */
  confidence: ConfidenceLevel;
}

/**
 * Context defaults (fallback when no rules match)
 */
const CONTEXT_DEFAULTS: Record<string, string> = {
  work: 'code/',
  maintenance: 'code/',
  explore: 'analyze/',
  review: 'review/',
  settings: 'plan/',
  pm: 'plan/',
  intel: 'analyze/',
};

/**
 * Confidence thresholds for routing decisions
 */
const CONFIDENCE_THRESHOLDS: Record<ConfidenceLevel, number> = {
  high: 0.8,
  medium: 0.5,
  low: 0.0,
};

// ============================================================================
// Glob Matching Helper
// ============================================================================

/**
 * Simple glob pattern matcher for file paths
 * Supports: **, *, ?, and character classes
 * @param path - File path to match
 * @param pattern - Glob pattern
 * @returns true if path matches pattern
 */
function globMatch(path: string, pattern: string): boolean {
  // Normalize paths to use forward slashes
  path = path.replace(/\\/g, '/');
  pattern = pattern.replace(/\\/g, '/');

  // Convert glob pattern to regex
  let regexPattern = pattern
    // Escape special regex characters except * and ?
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // Convert glob ** to regex
    .replace(/\\\*\\\*/g, '.*')
    // Convert glob * to regex (but not in **)
    .replace(/\*/g, '[^/]*')
    // Convert glob ? to regex
    .replace(/\?/g, '[^/]');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate match score for a rule against request inputs
 * Returns value 0.0-1.0 before priority adjustment
 * @param rule - Rule to score
 * @param keywords - Keywords from request
 * @param scope - File scope from request
 * @returns Raw score (before priority multiplication)
 */
export function calculateMatchScore(
  rule: RoutingRule,
  keywords: string[],
  scope?: string
): number {
  let score = 0.0;

  // Keyword matching: 0-50 points
  if (rule.condition.keywords.length > 0) {
    const matchedKeywords = rule.condition.keywords.filter((k) =>
      keywords.some((w) => w.toLowerCase().includes(k.toLowerCase()))
    );
    const keywordScore =
      (matchedKeywords.length / rule.condition.keywords.length) * 0.5;
    score += keywordScore;
  }

  // Scope pattern matching: 0-30 points
  if (scope && rule.condition.scope_patterns?.length) {
    for (const pattern of rule.condition.scope_patterns) {
      if (globMatch(scope, pattern)) {
        score += 0.3;
        break; // Only count once
      }
    }
  }

  // Input type matching: 0-20 points (future extension)
  // Currently not used; reserved for future input_types validation

  // Apply priority as multiplier
  const priorityMultiplier = rule.priority / 100;
  return score * priorityMultiplier;
}

/**
 * Apply confidence threshold filtering
 * Returns action or fallback if confidence check fails
 * @param rule - Rule being evaluated
 * @param score - Score from calculateMatchScore
 * @param metadata - Action metadata (contains confidence_threshold)
 * @returns Selected action, or fallback if threshold not met
 */
export function applyConfidenceThreshold(
  rule: RoutingRule,
  score: number,
  metadata?: ActionMetadata
): { action: string; thresholdMet: boolean } {
  const threshold = metadata
    ? CONFIDENCE_THRESHOLDS[metadata.confidence_threshold]
    : CONFIDENCE_THRESHOLDS[rule.confidence];

  if (score >= threshold) {
    return { action: rule.action, thresholdMet: true };
  }

  // Confidence threshold not met, use fallback
  const fallbackAction = rule.fallback || rule.action;
  return { action: fallbackAction, thresholdMet: false };
}

// ============================================================================
// Main Routing Algorithm
// ============================================================================

/**
 * Select the best action for a request
 * @param context - Orchestrator context (work, review, etc.)
 * @param keywords - Keywords from user request
 * @param scope - File scope/pattern if applicable
 * @param rules - All routing rules
 * @param actionMetadata - All action metadata
 * @returns Routing decision with selected action
 */
export function selectAction(
  context: string,
  keywords: string[],
  rules: RoutingRule[],
  actionMetadata?: ActionMetadata[],
  scope?: string
): RoutingDecision {
  // 1. Filter rules applicable to this context
  const applicableRules = rules.filter((r) =>
    r.condition.context.includes(context as any)
  );

  if (applicableRules.length === 0) {
    return {
      action: CONTEXT_DEFAULTS[context] || 'code/',
      score: 0,
      matchedRule: null,
      rationale: `No rules matched context "${context}", using context default`,
      confidence: 'low',
    };
  }

  // 2. Score all applicable rules
  const scoredRules: Array<{
    rule: RoutingRule;
    score: number;
    metadata?: ActionMetadata;
  }> = [];

  for (const rule of applicableRules) {
    const score = calculateMatchScore(rule, keywords, scope);

    // Only include rules with non-zero score
    if (score > 0) {
      const metadata = actionMetadata?.find((m) => m.action === rule.action);
      scoredRules.push({ rule, score, metadata });
    }
  }

  // 3. If no rules scored above zero, return context default
  if (scoredRules.length === 0) {
    return {
      action: CONTEXT_DEFAULTS[context] || 'code/',
      score: 0,
      matchedRule: null,
      rationale: `No rules scored above threshold for context "${context}", using default`,
      confidence: 'low',
    };
  }

  // 4. Sort by score (desc), then routing_priority (desc) as tiebreaker
  scoredRules.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    const aPriority = a.metadata?.routing_priority ?? 50;
    const bPriority = b.metadata?.routing_priority ?? 50;
    return bPriority - aPriority;
  });

  // 5. Get the top match (guaranteed non-null by scoredRules.length > 0 check above)
  const topMatch = scoredRules[0]!;

  // 6. Apply confidence threshold
  const thresholdResult = applyConfidenceThreshold(
    topMatch.rule,
    topMatch.score,
    topMatch.metadata
  );

  return {
    action: thresholdResult.action,
    score: topMatch.score,
    matchedRule: topMatch.rule,
    rationale: topMatch.rule.rationale,
    confidence: topMatch.rule.confidence,
  };
}

// ============================================================================
// Debugging & Logging Helpers
// ============================================================================

/**
 * Get all applicable rules for a context (for debugging)
 * @param context - Context to filter by
 * @param rules - All rules
 * @returns Rules applicable to context, sorted by priority desc
 */
export function getApplicableRules(
  context: string,
  rules: RoutingRule[]
): RoutingRule[] {
  return rules
    .filter((r) => r.condition.context.includes(context as any))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Score all rules for a request (for debugging/transparency)
 * @param context - Orchestrator context
 * @param keywords - Keywords from request
 * @param rules - All routing rules
 * @param scope - Optional file scope
 * @returns Scored rules in descending score order
 */
export function scoreAllRules(
  context: string,
  keywords: string[],
  rules: RoutingRule[],
  scope?: string
): Array<{ rule: RoutingRule; score: number }> {
  const applicableRules = getApplicableRules(context, rules);

  return applicableRules
    .map((rule) => ({
      rule,
      score: calculateMatchScore(rule, keywords, scope),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Format a routing decision for logging
 * @param decision - Routing decision result
 * @returns Formatted string for logs
 */
export function formatRoutingDecision(decision: RoutingDecision): string {
  const lines = [
    `Selected action: ${decision.action}`,
    `Confidence: ${decision.confidence}`,
    `Score: ${(decision.score * 100).toFixed(1)}%`,
    `Rule: ${decision.matchedRule?.rule_id || 'none (fallback)'}`,
    `Rationale: ${decision.rationale}`,
  ];
  return lines.join('\n');
}
