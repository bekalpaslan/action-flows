/**
 * Harmony Detection Types
 * Types for orchestrator output compliance monitoring
 */

import type { SessionId, Timestamp } from './types.js';
import type { ProjectId } from './projects.js';

/**
 * Result of a single harmony check
 */
export type HarmonyResult = 'valid' | 'degraded' | 'violation';

/**
 * Record of a single harmony check
 */
export interface HarmonyCheck {
  /** Unique check ID */
  id: string;

  /** Session this check belongs to */
  sessionId: SessionId;

  /** Project (if available) */
  projectId?: ProjectId;

  /** When this check occurred */
  timestamp: Timestamp;

  /** Raw orchestrator output (truncated to 500 chars) */
  text: string;

  /** Parsed format name (e.g., "ChainCompilation", "StepCompletion") or null if unknown */
  parsedFormat: string | null;

  /** Check result */
  result: HarmonyResult;

  /** Missing fields for degraded parses */
  missingFields?: string[];

  /** Optional context */
  context?: {
    stepNumber?: number;
    chainId?: string;
    actionType?: string;
  };

  /** Contract version used for parsing */
  contractVersion: string;
}

/**
 * Aggregated harmony metrics
 */
export interface HarmonyMetrics {
  /** Total checks performed */
  totalChecks: number;

  /** Number of valid parses */
  validCount: number;

  /** Number of degraded parses (partial success) */
  degradedCount: number;

  /** Number of violations (complete failure) */
  violationCount: number;

  /** Overall harmony percentage: (valid + degraded) / total * 100 */
  harmonyPercentage: number;

  /** Recent violations (last 10) */
  recentViolations: HarmonyCheck[];

  /** Format breakdown: format name -> count */
  formatBreakdown: Record<string, number>;

  /** Timestamp of last check */
  lastCheck: Timestamp;
}

/**
 * Filter options for harmony queries
 */
export interface HarmonyFilter {
  /** Filter by result type */
  result?: HarmonyResult;

  /** Filter by parsed format */
  formatType?: string;

  /** Filter by checks after this timestamp */
  since?: Timestamp;

  /** Maximum number of results */
  limit?: number;
}
