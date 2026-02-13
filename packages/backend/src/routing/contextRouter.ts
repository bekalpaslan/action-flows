/**
 * Context Router — Phase 2: Context Routing Algorithm
 *
 * Implements the core routing logic that matches user requests to workbench contexts
 * based on trigger keyword matching with confidence scoring.
 *
 * Algorithm Flow:
 * User Request → Keyword Extraction → Context Scoring → Confidence Check → Selection or Disambiguation
 */

import {
  type RoutingResult,
  ROUTING_THRESHOLDS,
  type WorkbenchId,
  DEFAULT_WORKBENCH_CONFIGS,
  ROUTABLE_WORKBENCHES,
  type AgentPersonality,
  type AgentTone,
  type AgentSpeed,
  type AgentRisk,
  type AgentCommunicationStyle,
} from '@afw/shared';

// ============================================================================
// Stop Words (Common English words to filter out)
// ============================================================================

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'he',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'that',
  'the',
  'to',
  'was',
  'will',
  'with',
  'this',
  'can',
  'you',
  'me',
  'my',
  'we',
  'our',
  'i',
]);

// ============================================================================
// Keyword Extraction
// ============================================================================

/**
 * Extract meaningful keywords from user request
 *
 * Filters out:
 * - Stop words (common English words)
 * - Short words (<= 2 characters)
 * - Whitespace
 *
 * @param request - The user's request string
 * @returns Array of lowercase keywords
 */
export function extractKeywords(request: string): string[] {
  return request
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

// ============================================================================
// Match Scoring
// ============================================================================

/**
 * Calculate match score for a single trigger phrase
 *
 * @param keywords - Extracted keywords from user request
 * @param triggerPhrase - A trigger phrase from the context (e.g., "fix bug")
 * @returns Match ratio (0.0-1.0) representing what fraction of trigger words matched
 */
function scoreTrigger(keywords: string[], triggerPhrase: string): number {
  const triggerWords = triggerPhrase
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (triggerWords.length === 0) {
    return 0;
  }

  const matchedCount = triggerWords.filter((word) => keywords.includes(word)).length;

  return matchedCount / triggerWords.length;
}

/**
 * Calculate match score between extracted keywords and a context's triggers
 *
 * Uses a refined best-match algorithm:
 * - score = bestMatchRatio * 0.7 + (matchedTriggersCount / totalTriggers) * 0.3
 * - This heavily weights the best single trigger match while also considering breadth
 *
 * @param keywords - Extracted keywords from user request
 * @param contextTriggers - All trigger phrases for a context
 * @returns Object with normalized score (0.0-1.0) and matched trigger phrases
 */
export function calculateMatchScore(
  keywords: string[],
  contextTriggers: string[]
): { score: number; matchedTriggers: string[] } {
  if (keywords.length === 0 || contextTriggers.length === 0) {
    return { score: 0, matchedTriggers: [] };
  }

  const triggerScores = contextTriggers.map((trigger) => ({
    trigger,
    matchRatio: scoreTrigger(keywords, trigger),
  }));

  // Find the best single trigger match
  const bestMatch = triggerScores.reduce(
    (best, current) => (current.matchRatio > best.matchRatio ? current : best),
    { trigger: '', matchRatio: 0 }
  );

  // Count triggers that had any match (matchRatio > 0)
  const matchedTriggers = triggerScores
    .filter((t) => t.matchRatio > 0)
    .map((t) => t.trigger);

  // Weighted score: 70% best match + 30% breadth
  const bestMatchRatio = bestMatch.matchRatio;
  const breadthRatio = matchedTriggers.length / contextTriggers.length;
  const score = bestMatchRatio * 0.7 + breadthRatio * 0.3;

  return {
    score,
    matchedTriggers,
  };
}

// ============================================================================
// Context Routing
// ============================================================================

/**
 * User personality preferences for context-aware agent selection
 * Phase 2 — Agent Personalities completion (Thread 5)
 */
export interface UserPersonalityPreference {
  userId: string;
  preferredTone?: AgentTone;
  preferredSpeed?: AgentSpeed;
  overrides?: Record<string, Partial<AgentPersonality>>; // Per-context overrides
  updatedAt: string;
}

/**
 * Get effective personality for an action in a context
 *
 * Applies personality preferences in this order:
 * 1. Start with agent's own personality (from personalityParser)
 * 2. Apply user overrides for this context if any
 * 3. Apply global user preference as fallback
 *
 * @param actionType The action type (e.g., "code/backend")
 * @param contextId The context ID (e.g., "work", "maintenance")
 * @param basePersonality The agent's base personality
 * @param userPrefs Optional user preferences
 * @returns Effective personality after applying overrides
 */
export function getEffectivePersonality(
  actionType: string,
  contextId: string,
  basePersonality: AgentPersonality,
  userPrefs?: UserPersonalityPreference
): AgentPersonality {
  if (!userPrefs) {
    return basePersonality;
  }

  // Start with base personality
  const effective = { ...basePersonality };

  // Apply global user preferences
  if (userPrefs.preferredTone) {
    effective.tone = userPrefs.preferredTone;
  }
  if (userPrefs.preferredSpeed) {
    effective.speedPreference = userPrefs.preferredSpeed;
  }

  // Apply per-context overrides
  if (userPrefs.overrides && userPrefs.overrides[contextId]) {
    Object.assign(effective, userPrefs.overrides[contextId]);
  }

  return effective;
}

/**
 * Route a user request to the most appropriate workbench context
 *
 * Algorithm:
 * 1. Extract keywords from request
 * 2. Score all routable contexts using their triggers
 * 3. Apply confidence thresholds:
 *    - score >= AUTO_ROUTE (0.9): Automatic routing
 *    - score >= DISAMBIGUATION (0.5): Include in disambiguation options
 *    - score < DISAMBIGUATION: Fallback routing
 * 4. Return RoutingResult with selectedContext, confidence, alternatives, etc.
 *
 * @param request - The user's request string
 * @returns RoutingResult with routing decision and metadata
 */
export function routeRequest(request: string): RoutingResult {
  // Step 1: Extract keywords
  const keywords = extractKeywords(request);

  if (keywords.length === 0) {
    // Empty request → route to default 'work' context with low confidence
    return {
      selectedContext: 'work',
      confidence: 0,
      alternativeContexts: [],
      triggerMatches: [],
      requiresDisambiguation: false,
    };
  }

  // Step 2: Score all routable contexts
  const contextScores: Array<{
    context: WorkbenchId;
    score: number;
    matchedTriggers: string[];
  }> = ROUTABLE_WORKBENCHES.map((contextId: WorkbenchId) => {
    const config = DEFAULT_WORKBENCH_CONFIGS[contextId];
    const { score, matchedTriggers } = calculateMatchScore(keywords, config.triggers);
    return {
      context: contextId,
      score,
      matchedTriggers,
    };
  }).sort((a, b) => b.score - a.score); // Sort descending by score

  const topMatch = contextScores[0];

  // Safety check: If no contexts available, fallback to 'work'
  if (!topMatch) {
    return {
      selectedContext: 'work',
      confidence: 0,
      alternativeContexts: [],
      triggerMatches: [],
      requiresDisambiguation: false,
    };
  }

  // Step 3: Apply confidence thresholds
  const { AUTO_ROUTE, DISAMBIGUATION } = ROUTING_THRESHOLDS;

  // High confidence: Auto-route immediately
  if (topMatch.score >= AUTO_ROUTE) {
    return {
      selectedContext: topMatch.context,
      confidence: topMatch.score,
      alternativeContexts: contextScores.slice(1, 3).map((c) => ({
        context: c.context,
        score: c.score,
      })),
      triggerMatches: topMatch.matchedTriggers,
      requiresDisambiguation: false,
    };
  }

  // Multiple viable options: Require disambiguation
  const viableContexts = contextScores.filter((c) => c.score >= DISAMBIGUATION);

  if (viableContexts.length > 1) {
    return {
      selectedContext: null,
      confidence: topMatch.score,
      alternativeContexts: viableContexts.map((c) => ({
        context: c.context,
        score: c.score,
      })),
      triggerMatches: topMatch.matchedTriggers,
      requiresDisambiguation: true,
    };
  }

  // Low confidence fallback: Route to top match (or 'work' if no matches)
  const fallbackContext = topMatch.score > 0 ? topMatch.context : 'work';

  return {
    selectedContext: fallbackContext,
    confidence: topMatch.score,
    alternativeContexts: contextScores.slice(1, 3).map((c) => ({
      context: c.context,
      score: c.score,
    })),
    triggerMatches: topMatch.matchedTriggers,
    requiresDisambiguation: false,
  };
}
