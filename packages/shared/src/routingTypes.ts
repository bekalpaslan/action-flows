/**
 * Context-Native Routing Types
 *
 * Defines types for the orchestrator routing system that routes user requests
 * directly to workbench contexts based on trigger keyword matching.
 */

import type { WorkbenchId } from './workbenchTypes.js';
import type { Timestamp } from './types.js';

// ============================================================================
// Routing Results
// ============================================================================

/**
 * Result of routing a user request to a workbench context
 */
export interface RoutingResult {
  /** The selected workbench context (null if disambiguation needed) */
  selectedContext: WorkbenchId | null;
  /** Confidence score (0.0-1.0) of the routing decision */
  confidence: number;
  /** Alternative contexts that were considered */
  alternativeContexts: Array<{
    context: WorkbenchId;
    score: number;
  }>;
  /** Trigger keywords that matched in the request */
  triggerMatches: string[];
  /** Whether user disambiguation is required */
  requiresDisambiguation: boolean;
}

// ============================================================================
// Disambiguation
// ============================================================================

/**
 * Request for user to disambiguate between multiple possible contexts
 */
export interface DisambiguationRequest {
  /** The original user request */
  originalRequest: string;
  /** Possible contexts with their scores and purposes */
  possibleContexts: Array<{
    context: WorkbenchId;
    score: number;
    purpose: string;
  }>;
}

// ============================================================================
// Routing Decisions
// ============================================================================

/**
 * Final routing decision including metadata
 */
export interface RoutingDecision {
  /** The chosen workbench context */
  context: WorkbenchId;
  /** Confidence score of the decision */
  confidence: number;
  /** How the decision was made */
  method: 'automatic' | 'disambiguated' | 'manual';
  /** When the decision was made */
  timestamp: Timestamp;
}

// ============================================================================
// Routing Thresholds
// ============================================================================

/** Confidence thresholds for the routing algorithm */
export const ROUTING_THRESHOLDS = {
  /** Minimum confidence for automatic routing (no disambiguation) */
  AUTO_ROUTE: 0.9,
  /** Minimum confidence to include in disambiguation options */
  DISAMBIGUATION: 0.5,
} as const;
