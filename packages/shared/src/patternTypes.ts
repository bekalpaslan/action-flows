/**
 * Pattern Types for ActionFlows Dashboard
 * Types for bookmark system, pattern detection, and frequency tracking
 * Supports SRD Section 3.4 Bookmark System and Section 4.0 Action Type Definitions
 */

import type { SessionId, UserId, Timestamp } from './types.js';
import type { ProjectId } from './projects.js';
import type { ButtonAction } from './buttonTypes.js';

// ============================================================================
// Branded Types
// ============================================================================

/** Branded type for bookmark IDs */
export type BookmarkId = string & { readonly __brand: 'BookmarkId' };

/** Branded type for pattern IDs */
export type PatternId = string & { readonly __brand: 'PatternId' };

// ============================================================================
// Bookmark Types
// ============================================================================

/** Categories for bookmarked items */
export type BookmarkCategory =
  | 'useful-pattern'
  | 'good-output'
  | 'want-to-automate'
  | 'reference-material'
  | 'other';

/** A bookmarked Claude response */
export interface Bookmark {
  id: BookmarkId;
  sessionId: SessionId;
  messageIndex: number;         // Position in conversation
  messageContent: string;       // The Claude response that was starred
  category: BookmarkCategory;
  explanation: string;          // User's answer to "Why are you starring?"
  timestamp: Timestamp;
  userId?: UserId;
  projectId?: ProjectId;
  tags: string[];               // Auto-extracted or user-added tags
}

// ============================================================================
// Pattern Types
// ============================================================================

/** Types of patterns that can be detected */
export type PatternType =
  | 'frequency'        // High-frequency individual actions
  | 'sequence'         // Repeated action sequences
  | 'temporal'         // Time-based patterns
  | 'error-recovery'   // Patterns in error handling
  | 'preference';      // User preference patterns

/** Confidence score for detected patterns (0.0 - 1.0) */
export type ConfidenceScore = number & { readonly __brand: 'ConfidenceScore' };

/** Action sequence for sequence patterns */
export interface ActionSequence {
  actions: string[];            // Ordered list of action types
  count: number;                // How many times this sequence appeared
  avgGapMs: number;             // Average time between actions in sequence
  lastOccurrence: Timestamp;
}

/** A detected pattern */
export interface DetectedPattern {
  id: PatternId;
  projectId: ProjectId;
  patternType: PatternType;
  confidence: ConfidenceScore;
  description: string;
  /** For frequency patterns: the action type */
  actionType?: string;
  /** For sequence patterns: the action sequence */
  sequence?: ActionSequence;
  /** Related bookmarks that contributed to this pattern */
  relatedBookmarkIds: BookmarkId[];
  detectedAt: Timestamp;
  lastSeen: Timestamp;
}

// ============================================================================
// Pattern Action (for registry entries)
// ============================================================================

/** Action definition for a detected pattern — specifies what happens when the pattern triggers */
export interface PatternAction {
  /** Unique identifier for this pattern definition */
  patternId: string;
  /** Human-readable name */
  name: string;
  /** What type of pattern this represents */
  patternType: PatternType;
  /** Trigger conditions: when should this pattern activate? */
  trigger: {
    /** Minimum confidence score to activate */
    minConfidence: number;
    /** Action types that form the trigger sequence (for sequence patterns) */
    actionSequence?: string[];
    /** Minimum frequency count (for frequency patterns) */
    minFrequency?: number;
  };
  /** What action to take when pattern triggers */
  suggestedAction: ButtonAction;
  /** Whether this pattern can auto-trigger without user confirmation */
  autoTrigger: boolean;
}

// ============================================================================
// Frequency Tracking
// ============================================================================

/** Frequency record for an action */
export interface FrequencyRecord {
  actionType: string;           // Button ID, command type, or quick action ID
  projectId?: ProjectId;
  userId?: UserId;
  count: number;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  /** Per-day counts for the last 90 days (ISO date string -> count) */
  dailyCounts: Record<string, number>;
}

/** Query parameters for frequency lookups */
export interface FrequencyQuery {
  projectId?: ProjectId;
  userId?: UserId;
  since?: Timestamp;
  minCount?: number;
  limit?: number;
  orderBy?: 'count' | 'lastSeen';
}

// ============================================================================
// Bookmark Cluster (for pattern analysis)
// ============================================================================

/** Cluster of related bookmarks */
export interface BookmarkCluster {
  category: BookmarkCategory;
  bookmarks: Bookmark[];
  commonTags: string[];
  suggestedPattern?: DetectedPattern;
}
