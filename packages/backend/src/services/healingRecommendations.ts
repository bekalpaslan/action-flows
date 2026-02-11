/**
 * Healing Recommendation Engine
 *
 * Analyzes harmony violation patterns and recommends healing flows.
 * Provides intelligent suggestions for fixing contract violations.
 */

import { EventEmitter } from 'events';
import type {
  SessionId,
  ProjectId,
  Timestamp,
  WorkspaceEvent,
  HarmonyCheck,
  HarmonyMetrics
} from '@afw/shared';
import type { GateId } from '@afw/shared';
import type { Storage } from '../storage/index.js';
import { brandedTypes } from '@afw/shared';

/**
 * Healing recommendation interface
 */
export interface HealingRecommendation {
  id: string;                                 // unique ID
  gateId: GateId;
  pattern: string;                            // e.g., "missing-status-column"
  severity: 'critical' | 'high' | 'medium' | 'low';
  violationCount: number;
  suggestedFlow: string;                      // e.g., "harmony-audit-and-fix/"
  reason: string;                             // Why this recommendation
  humanReadableAction: string;                // "Fix Gate 4 format drift"
  estimatedEffort: string;                    // "5 minutes" or "2-3 hours"
  createdAt: number;                          // timestamp
  status: 'pending' | 'accepted' | 'ignored';
  sessionId?: SessionId;
  projectId?: ProjectId;
}

/**
 * Drift pattern detected from harmony checks
 */
export interface DriftPattern {
  pattern: string;
  gates: GateId[];
  frequency: number;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  affectedSessions: SessionId[];
}

/**
 * Pattern to flow mapping
 */
const PATTERN_FLOW_MAP: Record<string, string> = {
  'missing-status-column': 'harmony-audit-and-fix/',
  'missing-field': 'harmony-audit-and-fix/',
  'format-mismatch': 'contract-drift-fix/',
  'parse-failed': 'parser-update/',
  'type-error': 'contract-drift-fix/',
  'websocket-mismatch': 'harmony-audit-and-fix/',
  'unknown-format': 'contract-drift-fix/',
  'degraded-parse': 'harmony-audit-and-fix/',
};

/**
 * Flow descriptions for recommendations
 */
const FLOW_DESCRIPTIONS: Record<string, { description: string; outcome: string }> = {
  'harmony-audit-and-fix/': {
    description: 'Comprehensive audit of format compliance with automated fixes',
    outcome: 'All format violations resolved, harmony score restored to 95%+',
  },
  'contract-drift-fix/': {
    description: 'Sync CONTRACT.md specification with parser implementation',
    outcome: 'Contract and parser aligned, no drift detected',
  },
  'parser-update/': {
    description: 'Update backend parser to handle new format variations',
    outcome: 'Parser supports new formats, no parse failures',
  },
};

/**
 * Effort estimation based on severity and pattern
 */
const EFFORT_ESTIMATES: Record<string, Record<string, string>> = {
  critical: {
    'parse-failed': '1-2 hours',
    'websocket-mismatch': '2-3 hours',
    default: '2-4 hours',
  },
  high: {
    'format-mismatch': '30 minutes - 1 hour',
    'type-error': '30 minutes - 1 hour',
    default: '1-2 hours',
  },
  medium: {
    'missing-field': '15-30 minutes',
    'degraded-parse': '15-30 minutes',
    default: '30 minutes - 1 hour',
  },
  low: {
    'missing-status-column': '5-10 minutes',
    default: '15-30 minutes',
  },
};

/**
 * Configuration
 */
const HEALING_CONFIG = {
  /** TTL for recommendations (7 days) */
  ttlDays: 7,

  /** Minimum violations to trigger recommendation */
  minViolationsForRecommendation: 3,

  /** Critical threshold: violations per gate */
  criticalThreshold: 10,

  /** High threshold: violations per gate */
  highThreshold: 5,

  /** Medium threshold: violations per gate */
  mediumThreshold: 2,
};

/**
 * Healing Recommendation Service
 */
export class HealingRecommendationEngine extends EventEmitter {
  private storage: Storage;
  private recommendations = new Map<string, HealingRecommendation>();

  constructor(storage: Storage) {
    super();
    this.storage = storage;
  }

  /**
   * Analyze violations and generate recommendations
   * Called when harmony thresholds are exceeded
   */
  async analyzeAndRecommend(
    target: SessionId | ProjectId,
    targetType: 'session' | 'project' = 'session'
  ): Promise<HealingRecommendation[]> {
    // Get recent violations
    const checks = await this.storage.getHarmonyChecks(target, {
      result: 'violation',
      limit: 100,
    });

    if (checks.length === 0) {
      return [];
    }

    // Detect drift patterns
    const patterns = this.detectDriftPatterns(checks);

    // Generate recommendations
    const recommendations: HealingRecommendation[] = [];

    for (const pattern of patterns) {
      if (pattern.frequency < HEALING_CONFIG.minViolationsForRecommendation) {
        continue;
      }

      const severity = this.classifySeverity(pattern);
      const suggestedFlow = this.matchPatternToFlow(pattern.pattern);
      const recommendation = this.createRecommendation(
        pattern,
        severity,
        suggestedFlow,
        targetType === 'session' ? (target as SessionId) : undefined,
        targetType === 'project' ? (target as ProjectId) : undefined
      );

      recommendations.push(recommendation);
      this.recommendations.set(recommendation.id, recommendation);
    }

    // Emit event if recommendations generated
    if (recommendations.length > 0) {
      this.emit('harmony:recommendation_ready', {
        target,
        targetType,
        recommendations,
      });
    }

    return recommendations;
  }

  /**
   * Get all recommendations with optional filtering
   */
  async getRecommendations(filter?: {
    sessionId?: SessionId;
    projectId?: ProjectId;
    severity?: HealingRecommendation['severity'];
    status?: HealingRecommendation['status'];
  }): Promise<HealingRecommendation[]> {
    let results = Array.from(this.recommendations.values());

    if (filter?.sessionId) {
      results = results.filter(r => r.sessionId === filter.sessionId);
    }

    if (filter?.projectId) {
      results = results.filter(r => r.projectId === filter.projectId);
    }

    if (filter?.severity) {
      results = results.filter(r => r.severity === filter.severity);
    }

    if (filter?.status) {
      results = results.filter(r => r.status === filter.status);
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Update recommendation status
   */
  async updateRecommendationStatus(
    id: string,
    status: 'accepted' | 'ignored'
  ): Promise<HealingRecommendation | null> {
    const recommendation = this.recommendations.get(id);

    if (!recommendation) {
      return null;
    }

    recommendation.status = status;
    this.recommendations.set(id, recommendation);

    this.emit('recommendation:status_changed', {
      id,
      status,
      recommendation,
    });

    return recommendation;
  }

  /**
   * Subscribe to harmony threshold exceeded events
   */
  subscribeToHarmonyEvents(harmonyDetector: any): void {
    // This would be called during initialization
    // harmonyDetector.on('harmony:threshold_exceeded', async (event: any) => {
    //   await this.analyzeAndRecommend(event.target, event.targetType);
    // });
  }

  // --- Private helper methods ---

  /**
   * Detect drift patterns from harmony checks
   */
  private detectDriftPatterns(checks: HarmonyCheck[]): DriftPattern[] {
    const patternMap = new Map<string, DriftPattern>();

    for (const check of checks) {
      const pattern = this.identifyPattern(check);
      const gateId = this.inferGateFromContext(check);

      if (!patternMap.has(pattern)) {
        patternMap.set(pattern, {
          pattern,
          gates: [],
          frequency: 0,
          firstSeen: check.timestamp,
          lastSeen: check.timestamp,
          affectedSessions: [],
        });
      }

      const drift = patternMap.get(pattern)!;
      drift.frequency++;
      drift.lastSeen = check.timestamp;

      if (gateId && !drift.gates.includes(gateId)) {
        drift.gates.push(gateId);
      }

      if (!drift.affectedSessions.includes(check.sessionId)) {
        drift.affectedSessions.push(check.sessionId);
      }
    }

    return Array.from(patternMap.values());
  }

  /**
   * Identify pattern type from harmony check
   */
  private identifyPattern(check: HarmonyCheck): string {
    if (!check.parsedFormat || check.parsedFormat === 'Unknown') {
      return 'unknown-format';
    }

    if (check.result === 'violation') {
      return 'parse-failed';
    }

    if (check.result === 'degraded' && check.missingFields) {
      // Check for specific missing fields
      if (check.missingFields.includes('status')) {
        return 'missing-status-column';
      }
      return 'missing-field';
    }

    return 'format-mismatch';
  }

  /**
   * Infer gate ID from check context
   */
  private inferGateFromContext(check: HarmonyCheck): GateId | null {
    // Try to infer from context
    const context = check.context as any;

    if (context?.actionType?.includes('compile')) {
      return 'gate-04';
    }

    if (context?.actionType?.includes('execution')) {
      return 'gate-06';
    }

    if (check.parsedFormat?.includes('Chain')) {
      return 'gate-04';
    }

    if (check.parsedFormat?.includes('Step')) {
      return 'gate-06';
    }

    // Default to gate-09 (agent output validation)
    return 'gate-09';
  }

  /**
   * Classify severity based on pattern frequency and impact
   */
  private classifySeverity(pattern: DriftPattern): HealingRecommendation['severity'] {
    // Critical: System broken (multiple gates, high frequency)
    if (
      pattern.gates.length > 3 ||
      pattern.frequency >= HEALING_CONFIG.criticalThreshold
    ) {
      return 'critical';
    }

    // High: Feature degraded (multiple gates or moderate frequency)
    if (
      pattern.gates.length > 1 ||
      pattern.frequency >= HEALING_CONFIG.highThreshold
    ) {
      return 'high';
    }

    // Medium: Drift detected
    if (pattern.frequency >= HEALING_CONFIG.mediumThreshold) {
      return 'medium';
    }

    // Low: Minor issues
    return 'low';
  }

  /**
   * Match pattern to appropriate healing flow
   */
  private matchPatternToFlow(pattern: string): string {
    return PATTERN_FLOW_MAP[pattern] || 'harmony-audit-and-fix/';
  }

  /**
   * Create recommendation object
   */
  private createRecommendation(
    pattern: DriftPattern,
    severity: HealingRecommendation['severity'],
    suggestedFlow: string,
    sessionId?: SessionId,
    projectId?: ProjectId
  ): HealingRecommendation {
    const gateId = pattern.gates[0] || 'gate-09';
    const flowInfo = FLOW_DESCRIPTIONS[suggestedFlow] || {
      description: 'Fix harmony violations',
      outcome: 'Violations resolved',
    };

    const estimatedEffort =
      EFFORT_ESTIMATES[severity][pattern.pattern] ||
      EFFORT_ESTIMATES[severity].default;

    return {
      id: this.generateRecommendationId(),
      gateId,
      pattern: pattern.pattern,
      severity,
      violationCount: pattern.frequency,
      suggestedFlow,
      reason: `${flowInfo.description}. ${pattern.frequency} violations detected across ${pattern.gates.length} gate(s).`,
      humanReadableAction: this.generateHumanReadableAction(gateId, pattern.pattern, severity),
      estimatedEffort,
      createdAt: Date.now(),
      status: 'pending',
      sessionId,
      projectId,
    };
  }

  /**
   * Generate unique recommendation ID
   */
  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate human-readable action description
   */
  private generateHumanReadableAction(
    gateId: GateId,
    pattern: string,
    severity: HealingRecommendation['severity']
  ): string {
    const gateNumber = gateId.replace('gate-', '');
    const severityPrefix = severity === 'critical' ? '[URGENT]' : '';

    const actionMap: Record<string, string> = {
      'missing-status-column': `${severityPrefix} Fix missing status column at Gate ${gateNumber}`,
      'missing-field': `${severityPrefix} Add missing required fields at Gate ${gateNumber}`,
      'format-mismatch': `${severityPrefix} Resolve format drift at Gate ${gateNumber}`,
      'parse-failed': `${severityPrefix} Fix parser failures at Gate ${gateNumber}`,
      'type-error': `${severityPrefix} Correct type mismatches at Gate ${gateNumber}`,
      'websocket-mismatch': `${severityPrefix} Fix WebSocket event format at Gate ${gateNumber}`,
      'unknown-format': `${severityPrefix} Document unknown format at Gate ${gateNumber}`,
      'degraded-parse': `Fix partial parse issues at Gate ${gateNumber}`,
    };

    return actionMap[pattern] || `${severityPrefix} Fix harmony violations at Gate ${gateNumber}`;
  }

  /**
   * Cleanup on shutdown
   */
  public shutdown(): void {
    console.log('[HealingRecommendations] Shutting down...');
    this.recommendations.clear();
    this.removeAllListeners();
    console.log('[HealingRecommendations] Shutdown complete');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let healingRecommendationEngine: HealingRecommendationEngine | null = null;

/**
 * Initialize the HealingRecommendationEngine singleton
 */
export function initHealingRecommendationEngine(storage: Storage): HealingRecommendationEngine {
  if (!healingRecommendationEngine) {
    healingRecommendationEngine = new HealingRecommendationEngine(storage);
    console.log('[HealingRecommendations] Service initialized');
  }
  return healingRecommendationEngine;
}

/**
 * Get the HealingRecommendationEngine singleton instance
 */
export function getHealingRecommendationEngine(): HealingRecommendationEngine {
  if (!healingRecommendationEngine) {
    throw new Error('HealingRecommendationEngine not initialized. Call initHealingRecommendationEngine() first.');
  }
  return healingRecommendationEngine;
}
