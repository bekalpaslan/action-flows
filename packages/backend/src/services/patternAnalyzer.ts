import type {
  FrequencyRecord,
  ActionSequence,
  Bookmark,
  BookmarkCluster,
  DetectedPattern,
  PatternId,
  ProjectId,
  Timestamp,
  ConfidenceScore
} from '@afw/shared';
import type { Storage } from '../storage/index.js';
import { FrequencyTracker, FREQUENCY_CONFIG } from './frequencyTracker.js';
import { calculateConfidence, meetsProposalThreshold } from './confidenceScorer.js';
import { brandedTypes } from '@afw/shared';

/**
 * Result of pattern analysis
 */
export interface PatternAnalysisResult {
  frequencyPatterns: DetectedPattern[];    // High-frequency individual actions
  sequencePatterns: DetectedPattern[];      // Repeated action sequences
  bookmarkPatterns: DetectedPattern[];      // Clusters from starred items
  proposedActions: ProposedAction[];        // Suggestions from analysis
}

/**
 * Proposed action from pattern analysis
 */
export interface ProposedAction {
  patternId: PatternId;
  actionType: string;
  description: string;
  confidence: ConfidenceScore;
  suggestedLabel: string;
}

/**
 * Configuration for pattern analysis
 */
export const ANALYSIS_CONFIG = {
  /** Minimum occurrences for frequency pattern */
  minFrequencyCount: 5,
  /** Minimum sequence length to detect */
  minSequenceLength: 2,
  /** Maximum sequence length to detect */
  maxSequenceLength: 4,
  /** Minimum times a sequence must repeat */
  minSequenceRepetitions: 3,
  /** Minimum bookmarks in a cluster */
  minClusterSize: 2,
  /** Analysis window in days */
  analysisWindowDays: 30,
};

/**
 * Analyzes operator behavior to detect patterns.
 *
 * Analysis modes:
 * 1. Frequency scan: Find actions above threshold (default: 5 uses)
 * 2. Sequence detection: Find 2-4 action sequences that repeat 3+ times
 * 3. Bookmark clustering: Group starred items by category + intent keywords
 */
export class PatternAnalyzer {
  constructor(
    private frequencyTracker: FrequencyTracker,
    private storage: Storage
  ) {}

  /**
   * Run full pattern analysis for a project
   */
  async analyze(projectId: ProjectId): Promise<PatternAnalysisResult> {
    const [frequencyPatterns, bookmarkPatterns] = await Promise.all([
      this.analyzeFrequencyPatterns(projectId),
      this.analyzeBookmarkClusters(projectId),
    ]);

    // Sequence patterns would require action log - placeholder for now
    const sequencePatterns: DetectedPattern[] = [];

    // Generate proposed actions from high-confidence patterns
    const proposedActions = this.generateProposedActions([
      ...frequencyPatterns,
      ...sequencePatterns,
      ...bookmarkPatterns,
    ]);

    return {
      frequencyPatterns,
      sequencePatterns,
      bookmarkPatterns,
      proposedActions,
    };
  }

  /**
   * Analyze frequency patterns - find high-frequency actions
   */
  private async analyzeFrequencyPatterns(projectId: ProjectId): Promise<DetectedPattern[]> {
    const topActions = await this.frequencyTracker.getTopActions(projectId, 20);
    const patterns: DetectedPattern[] = [];

    for (const record of topActions) {
      if (!this.frequencyTracker.isPatternCandidate(record)) continue;

      const trend = this.frequencyTracker.getTrend(record, 7);
      const recentCount = trend.reduce((sum, n) => sum + n, 0);
      const consistency = recentCount > 0 ? recentCount / (record.count || 1) : 0;

      const confidence = calculateConfidence(
        record.count,
        record.lastSeen,
        Math.min(consistency, 1)
      );

      if (meetsProposalThreshold(confidence)) {
        patterns.push({
          id: `freq_${record.actionType}_${Date.now()}` as PatternId,
          projectId,
          patternType: 'frequency',
          confidence,
          description: `Action "${record.actionType}" used ${record.count} times`,
          actionType: record.actionType,
          relatedBookmarkIds: [],
          detectedAt: brandedTypes.currentTimestamp(),
          lastSeen: record.lastSeen,
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze bookmark clusters - group by category and find patterns
   */
  private async analyzeBookmarkClusters(projectId: ProjectId): Promise<DetectedPattern[]> {
    const bookmarks = await Promise.resolve(
      this.storage.getBookmarks(projectId, {})
    );
    const patterns: DetectedPattern[] = [];

    // Group by category
    const byCategory = new Map<string, Bookmark[]>();
    for (const bookmark of bookmarks) {
      const existing = byCategory.get(bookmark.category) || [];
      existing.push(bookmark);
      byCategory.set(bookmark.category, existing);
    }

    // Create patterns for significant clusters
    for (const [category, categoryBookmarks] of byCategory) {
      if (categoryBookmarks.length < ANALYSIS_CONFIG.minClusterSize) continue;

      // Calculate confidence based on cluster size and recency
      const latestBookmark = categoryBookmarks.reduce((latest, b) =>
        b.timestamp > latest.timestamp ? b : latest
      );

      const confidence = calculateConfidence(
        categoryBookmarks.length * 2, // Weight bookmarks more heavily
        latestBookmark.timestamp,
        categoryBookmarks.length / 10 // Consistency based on cluster size
      );

      if (meetsProposalThreshold(confidence)) {
        patterns.push({
          id: `bkmk_${category}_${Date.now()}` as PatternId,
          projectId,
          patternType: 'preference',
          confidence,
          description: `${categoryBookmarks.length} bookmarks in "${category}" category`,
          relatedBookmarkIds: categoryBookmarks.map(b => b.id),
          detectedAt: brandedTypes.currentTimestamp(),
          lastSeen: latestBookmark.timestamp,
        });
      }
    }

    return patterns;
  }

  /**
   * Generate proposed actions from detected patterns
   */
  private generateProposedActions(patterns: DetectedPattern[]): ProposedAction[] {
    return patterns
      .filter(p => meetsProposalThreshold(p.confidence))
      .map(pattern => ({
        patternId: pattern.id,
        actionType: pattern.actionType || pattern.patternType,
        description: pattern.description,
        confidence: pattern.confidence,
        suggestedLabel: this.generateLabel(pattern),
      }));
  }

  /**
   * Generate a suggested label for a pattern-based button
   */
  private generateLabel(pattern: DetectedPattern): string {
    if (pattern.actionType) {
      // Convert action type to readable label
      return pattern.actionType
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    return `${pattern.patternType} action`;
  }
}
