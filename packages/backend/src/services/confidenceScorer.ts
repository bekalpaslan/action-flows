import type { ConfidenceScore, Timestamp } from '@afw/shared';

/**
 * Default weights for confidence calculation
 */
export const DEFAULT_WEIGHTS = {
  frequency: 0.4,
  recency: 0.3,
  consistency: 0.3,
};

/**
 * Thresholds for pattern actions
 */
export const CONFIDENCE_THRESHOLDS = {
  /** Minimum confidence to generate a proposal */
  proposal: 0.7,
  /** Minimum confidence for auto-apply (minor modifications) */
  autoApply: 0.9,
};

/**
 * Configuration for recency decay
 */
export const RECENCY_CONFIG = {
  /** Number of days before recency score starts decaying */
  decayStartDays: 7,
  /** Number of days at which recency score reaches 0 */
  decayEndDays: 90,
};

interface ConfidenceWeights {
  frequency: number;
  recency: number;
  consistency: number;
}

/**
 * Calculates confidence score for a detected pattern.
 *
 * Formula:
 *   confidence = (w_freq * frequencyScore) + (w_rec * recencyScore) + (w_con * consistencyScore)
 *
 * Where:
 *   frequencyScore = min(count / threshold, 1.0)
 *   recencyScore = max(0, 1.0 - (daysSinceLastSeen / decayDays))
 *   consistencyScore = occurrencesInLastN / N  (for sequence patterns)
 *
 * @param frequency - Number of times the action/pattern occurred
 * @param lastSeen - Timestamp of last occurrence
 * @param consistency - Consistency ratio (0.0-1.0), how regularly the pattern occurs
 * @param options - Optional configuration
 * @returns Confidence score between 0.0 and 1.0
 */
export function calculateConfidence(
  frequency: number,
  lastSeen: Timestamp,
  consistency: number,
  options?: {
    weights?: Partial<ConfidenceWeights>;
    frequencyThreshold?: number;
    now?: Date;
  }
): ConfidenceScore {
  const weights = { ...DEFAULT_WEIGHTS, ...options?.weights };
  const frequencyThreshold = options?.frequencyThreshold ?? 10;
  const now = options?.now ?? new Date();

  // Normalize weights to sum to 1.0
  const weightSum = weights.frequency + weights.recency + weights.consistency;
  const normalizedWeights = {
    frequency: weights.frequency / weightSum,
    recency: weights.recency / weightSum,
    consistency: weights.consistency / weightSum,
  };

  // Calculate frequency score (capped at 1.0)
  const frequencyScore = Math.min(frequency / frequencyThreshold, 1.0);

  // Calculate recency score (1.0 for recent, decays to 0.0)
  const lastSeenDate = new Date(lastSeen);
  const daysSinceLastSeen =
    (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = calculateRecencyScore(daysSinceLastSeen);

  // Consistency is passed directly (0.0-1.0)
  const consistencyScore = Math.max(0, Math.min(1, consistency));

  // Weighted sum
  const rawScore =
    normalizedWeights.frequency * frequencyScore +
    normalizedWeights.recency * recencyScore +
    normalizedWeights.consistency * consistencyScore;

  // Clamp to [0, 1] and brand
  return Math.max(0, Math.min(1, rawScore)) as ConfidenceScore;
}

/**
 * Calculate recency score based on days since last seen
 */
function calculateRecencyScore(daysSinceLastSeen: number): number {
  if (daysSinceLastSeen <= RECENCY_CONFIG.decayStartDays) {
    return 1.0;
  }

  if (daysSinceLastSeen >= RECENCY_CONFIG.decayEndDays) {
    return 0.0;
  }

  // Linear decay between start and end
  const decayRange =
    RECENCY_CONFIG.decayEndDays - RECENCY_CONFIG.decayStartDays;
  const daysIntoDecay =
    daysSinceLastSeen - RECENCY_CONFIG.decayStartDays;
  return 1.0 - daysIntoDecay / decayRange;
}

/**
 * Check if a confidence score meets the proposal threshold
 */
export function meetsProposalThreshold(score: ConfidenceScore): boolean {
  return score >= CONFIDENCE_THRESHOLDS.proposal;
}

/**
 * Check if a confidence score meets the auto-apply threshold
 */
export function meetsAutoApplyThreshold(score: ConfidenceScore): boolean {
  return score >= CONFIDENCE_THRESHOLDS.autoApply;
}

/**
 * Calculate consistency score for an action sequence
 *
 * @param recentOccurrences - Number of times the sequence occurred in the analysis window
 * @param analysisWindowSize - Number of opportunities for the sequence to occur
 * @returns Consistency score between 0.0 and 1.0
 */
export function calculateConsistency(
  recentOccurrences: number,
  analysisWindowSize: number
): number {
  if (analysisWindowSize <= 0) return 0;
  return Math.min(recentOccurrences / analysisWindowSize, 1.0);
}
