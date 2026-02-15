/**
 * Health Score Aggregation Service
 *
 * Aggregates gate harmony scores into overall system health metrics.
 * Non-blocking, fire-and-forget pattern with WebSocket broadcast.
 *
 * Architecture:
 * - Reads gate traces from Harmony storage (Redis key pattern: `harmony:gate:*`)
 * - Calculates per-gate scores: 100 - (violations / total) * 100
 * - Tracks trends over 24h and 7d windows
 * - Detects threshold violations (3+ in 24h)
 * - Emits WebSocket events for real-time dashboard updates
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import type { GateTrace, GateId, HarmonyHealthScore, GateHealthScore, DriftPattern, Timestamp } from '@afw/shared';
import type { Storage } from '../storage/index.js';

/**
 * Health Score Calculator Service
 * Aggregates gate harmony data into system health metrics
 */
export class HealthScoreCalculator extends EventEmitter {
  private storage: Storage;
  private readonly VIOLATION_THRESHOLD = 3;
  private readonly WINDOW_24H_MS = 24 * 60 * 60 * 1000;
  private readonly WINDOW_7D_MS = 7 * 24 * 60 * 60 * 1000;
  /** In-memory trace buffer — works regardless of storage backend */
  private traceBuffer: GateTrace[] = [];
  private readonly MAX_BUFFER_SIZE = 10000;
  /** File path for persisting traces across restarts */
  private readonly traceFilePath: string;

  constructor(storage: Storage) {
    super();
    this.storage = storage;
    this.traceFilePath = path.join(process.cwd(), 'data', 'gate-traces.jsonl');
    this.loadPersistedTraces();
  }

  /**
   * Load traces from disk on startup
   */
  private loadPersistedTraces(): void {
    try {
      if (!fs.existsSync(this.traceFilePath)) return;
      const content = fs.readFileSync(this.traceFilePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      // Only load traces within the 7d window
      const cutoff = Date.now() - this.WINDOW_7D_MS;
      for (const line of lines) {
        try {
          const trace = JSON.parse(line) as GateTrace;
          if (new Date(trace.timestamp).getTime() >= cutoff) {
            this.traceBuffer.push(trace);
          }
        } catch { /* skip malformed lines */ }
      }
      // Trim to max
      if (this.traceBuffer.length > this.MAX_BUFFER_SIZE) {
        this.traceBuffer = this.traceBuffer.slice(-this.MAX_BUFFER_SIZE);
      }
      console.log(`[HealthScore] Loaded ${this.traceBuffer.length} persisted traces`);
    } catch (err) {
      console.warn('[HealthScore] Could not load persisted traces:', err);
    }
  }

  /**
   * Append a trace to the persistence file
   */
  private persistTrace(trace: GateTrace): void {
    try {
      const dir = path.dirname(this.traceFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(this.traceFilePath, JSON.stringify(trace) + '\n');
    } catch (err) {
      console.warn('[HealthScore] Could not persist trace:', err);
    }
  }

  /**
   * Ingest a gate trace into the in-memory buffer.
   * Called from index.ts when gateCheckpoint emits 'gate:checkpoint'.
   */
  ingestTrace(trace: GateTrace): void {
    this.traceBuffer.push(trace);
    this.persistTrace(trace);
    // Evict oldest if buffer full
    if (this.traceBuffer.length > this.MAX_BUFFER_SIZE) {
      this.traceBuffer = this.traceBuffer.slice(-this.MAX_BUFFER_SIZE);
    }
  }

  /**
   * Calculate overall health score from all gate traces
   * Non-blocking, fire-and-forget pattern
   */
  async calculateHealthScore(gateId?: GateId): Promise<HarmonyHealthScore> {
    try {
      const now = Date.now();
      const timestamp24h = new Date(now - this.WINDOW_24H_MS).toISOString() as Timestamp;
      const timestamp7d = new Date(now - this.WINDOW_7D_MS).toISOString() as Timestamp;

      // Get all gate traces (or filtered by gateId)
      const allTraces = await this.getGateTraces(gateId);

      // Calculate per-gate health scores
      const byGate: Record<GateId, GateHealthScore> = {} as Record<GateId, GateHealthScore>;
      const gateGroups = this.groupTracesByGate(allTraces);

      for (const [gId, traces] of Object.entries(gateGroups)) {
        const gateHealth = this.calculateGateHealth(
          gId as GateId,
          traces,
          timestamp24h,
          timestamp7d
        );
        byGate[gId as GateId] = gateHealth;
      }

      // Calculate overall score (weighted average of all gate scores)
      const gateScores = Object.values(byGate).map(g => g.score);
      const overall = gateScores.length > 0
        ? Math.round(gateScores.reduce((sum, s) => sum + s, 0) / gateScores.length)
        : 100;

      // Count violations in time windows
      const violations24h = allTraces.filter(t => {
        const traceTime = new Date(t.timestamp).getTime();
        const isRecent = traceTime >= (now - this.WINDOW_24H_MS);
        const hasViolation = t.validationResult && !t.validationResult.passed;
        return isRecent && hasViolation;
      }).length;

      const violationsTotal = allTraces.filter(t =>
        t.validationResult && !t.validationResult.passed
      ).length;

      // Detect drift patterns
      const driftPatterns = this.detectDriftPatterns(allTraces);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        byGate,
        violations24h,
        driftPatterns
      );

      const healthScore: HarmonyHealthScore = {
        overall,
        timestamp: new Date().toISOString() as Timestamp,
        byGate,
        violations24h,
        violationsTotal,
        driftPatterns,
        recommendations,
      };

      // Emit event for WebSocket broadcast
      this.emit('health:updated', healthScore);

      // Check threshold violations
      if (violations24h >= this.VIOLATION_THRESHOLD) {
        this.emit('harmony:threshold_exceeded', {
          violations24h,
          threshold: this.VIOLATION_THRESHOLD,
          timestamp: healthScore.timestamp,
        });
        console.warn(`[HealthScore] Threshold exceeded: ${violations24h} violations in 24h (threshold: ${this.VIOLATION_THRESHOLD})`);
      }

      return healthScore;
    } catch (error) {
      console.error('[HealthScore] Error calculating health score:', error);
      // Return degraded health score on error
      return {
        overall: 0,
        timestamp: new Date().toISOString() as Timestamp,
        byGate: {} as Record<GateId, GateHealthScore>,
        violations24h: 0,
        violationsTotal: 0,
        driftPatterns: [],
        recommendations: ['Service temporarily unavailable - check backend logs'],
      };
    }
  }

  /**
   * Get all gate traces from storage
   */
  private async getGateTraces(gateId?: GateId): Promise<GateTrace[]> {
    // Try Redis first, fall back to in-memory buffer
    try {
      const pattern = gateId ? `harmony:gate:*:${gateId}:*` : `harmony:gate:*`;

      let keys: string[] = [];
      if ('keys' in this.storage && typeof (this.storage as any).keys === 'function') {
        keys = await (this.storage as any).keys(pattern);
      }

      if (keys.length > 0) {
        const traces: GateTrace[] = [];
        for (const key of keys) {
          try {
            let data: string | null = null;
            if ('get' in this.storage && typeof (this.storage as any).get === 'function') {
              data = await (this.storage as any).get(key);
            }
            if (data) {
              traces.push(JSON.parse(data));
            }
          } catch (parseError) {
            console.warn(`[HealthScore] Failed to parse trace from key ${key}:`, parseError);
          }
        }
        return traces;
      }
    } catch (error) {
      console.error('[HealthScore] Error retrieving gate traces from storage:', error);
    }

    // Fallback: in-memory buffer (works with MemoryStorage)
    if (gateId) {
      return this.traceBuffer.filter(t => t.gateId === gateId);
    }
    return [...this.traceBuffer];
  }

  /**
   * Group traces by gate ID
   */
  private groupTracesByGate(traces: GateTrace[]): Record<string, GateTrace[]> {
    const groups: Record<string, GateTrace[]> = {};

    for (const trace of traces) {
      if (!groups[trace.gateId]) {
        groups[trace.gateId] = [];
      }
      groups[trace.gateId].push(trace);
    }

    return groups;
  }

  /**
   * Calculate health score for a single gate
   */
  private calculateGateHealth(
    gateId: GateId,
    traces: GateTrace[],
    timestamp24h: Timestamp,
    timestamp7d: Timestamp
  ): GateHealthScore {
    const passCount = traces.filter(t => t.validationResult?.passed).length;
    const violationCount = traces.filter(t => t.validationResult && !t.validationResult.passed).length;
    const total = passCount + violationCount;

    // Current score
    const score = total > 0 ? Math.round(100 - (violationCount / total) * 100) : 100;

    // 24h score
    const traces24h = traces.filter(t => new Date(t.timestamp).toISOString() >= timestamp24h);
    const pass24h = traces24h.filter(t => t.validationResult?.passed).length;
    const violation24h = traces24h.filter(t => t.validationResult && !t.validationResult.passed).length;
    const total24h = pass24h + violation24h;
    const score24h = total24h > 0 ? Math.round(100 - (violation24h / total24h) * 100) : 100;

    // 7d score
    const traces7d = traces.filter(t => new Date(t.timestamp).toISOString() >= timestamp7d);
    const pass7d = traces7d.filter(t => t.validationResult?.passed).length;
    const violation7d = traces7d.filter(t => t.validationResult && !t.validationResult.passed).length;
    const total7d = pass7d + violation7d;
    const score7d = total7d > 0 ? Math.round(100 - (violation7d / total7d) * 100) : 100;

    // Determine trend
    let trend: 'improving' | 'stable' | 'degrading';
    if (score24h > score7d + 5) {
      trend = 'improving';
    } else if (score24h < score7d - 5) {
      trend = 'degrading';
    } else {
      trend = 'stable';
    }

    // Find last violation
    const violations = traces
      .filter(t => t.validationResult && !t.validationResult.passed)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastViolation = violations[0]?.timestamp;

    return {
      gateId,
      score,
      passCount,
      violationCount,
      trend,
      lastViolation,
    };
  }

  /**
   * Detect recurring drift patterns across gates
   */
  private detectDriftPatterns(traces: GateTrace[]): DriftPattern[] {
    const patterns = new Map<string, {
      gates: Set<GateId>;
      timestamps: number[];
    }>();

    // Group violations by pattern
    for (const trace of traces) {
      if (trace.validationResult && !trace.validationResult.passed) {
        for (const violation of trace.validationResult.violations) {
          // Extract pattern from violation message
          const pattern = this.extractPattern(violation);

          if (!patterns.has(pattern)) {
            patterns.set(pattern, {
              gates: new Set(),
              timestamps: [],
            });
          }

          const entry = patterns.get(pattern)!;
          entry.gates.add(trace.gateId);
          entry.timestamps.push(new Date(trace.timestamp).getTime());
        }
      }
    }

    // Convert to DriftPattern array
    const driftPatterns: DriftPattern[] = [];

    for (const [pattern, data] of patterns.entries()) {
      const timestamps = data.timestamps.sort((a, b) => a - b);

      driftPatterns.push({
        pattern,
        gates: Array.from(data.gates),
        frequency: timestamps.length,
        firstSeen: new Date(timestamps[0]).toISOString() as Timestamp,
        lastSeen: new Date(timestamps[timestamps.length - 1]).toISOString() as Timestamp,
      });
    }

    // Sort by frequency (most common first)
    return driftPatterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Extract pattern identifier from violation message
   */
  private extractPattern(violation: string): string {
    // Common patterns
    if (violation.includes('missing') && violation.includes('field')) {
      const match = violation.match(/missing\s+(?:field\s+)?['"]?(\w+)['"]?/i);
      return match ? `missing-field-${match[1]}` : 'missing-field-unknown';
    }

    if (violation.includes('format') || violation.includes('invalid')) {
      return 'format-mismatch';
    }

    if (violation.includes('type') || violation.includes('expected')) {
      return 'type-mismatch';
    }

    if (violation.includes('status') || violation.includes('column')) {
      return 'status-column-issue';
    }

    // Default: first 50 chars as pattern identifier
    return violation.substring(0, 50);
  }

  /**
   * Generate recommendations based on health data
   */
  private generateRecommendations(
    byGate: Record<GateId, GateHealthScore>,
    violations24h: number,
    driftPatterns: DriftPattern[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for gates with low scores
    const lowScoreGates = Object.values(byGate).filter(g => g.score < 80);
    if (lowScoreGates.length > 0) {
      recommendations.push(
        `⚠️ ${lowScoreGates.length} gate(s) with score < 80: ${lowScoreGates.map(g => g.gateId).join(', ')}`
      );
    }

    // Check for degrading trends
    const degradingGates = Object.values(byGate).filter(g => g.trend === 'degrading');
    if (degradingGates.length > 0) {
      recommendations.push(
        `📉 ${degradingGates.length} gate(s) showing degrading trend: ${degradingGates.map(g => g.gateId).join(', ')}`
      );
    }

    // Check violation threshold
    if (violations24h >= this.VIOLATION_THRESHOLD) {
      recommendations.push(
        `🚨 High violation rate: ${violations24h} violations in last 24h (threshold: ${this.VIOLATION_THRESHOLD})`
      );
      recommendations.push(
        `→ Consider running: /audit-and-fix or /contract-compliance`
      );
    }

    // Check for recurring patterns
    const frequentPatterns = driftPatterns.filter(p => p.frequency >= 3);
    if (frequentPatterns.length > 0) {
      recommendations.push(
        `🔁 ${frequentPatterns.length} recurring pattern(s) detected:`
      );
      for (const pattern of frequentPatterns.slice(0, 3)) {
        recommendations.push(
          `  - ${pattern.pattern} (${pattern.frequency}x across ${pattern.gates.length} gates)`
        );
      }
    }

    // If everything is healthy
    if (recommendations.length === 0) {
      recommendations.push('✅ All gates healthy - harmony score above 80%');
    }

    return recommendations;
  }

  /**
   * Cleanup on shutdown
   */
  public shutdown(): void {
    console.log('[HealthScore] Shutting down...');
    this.removeAllListeners();
    console.log('[HealthScore] Shutdown complete');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let healthScoreCalculator: HealthScoreCalculator | null = null;

/**
 * Initialize the HealthScoreCalculator singleton
 * Call this once during backend startup
 */
export function initHealthScoreCalculator(storage: Storage): HealthScoreCalculator {
  if (!healthScoreCalculator) {
    healthScoreCalculator = new HealthScoreCalculator(storage);
    console.log('[HealthScore] Service initialized');
  }
  return healthScoreCalculator;
}

/**
 * Get the HealthScoreCalculator singleton instance
 * Throws if not initialized
 */
export function getHealthScoreCalculator(): HealthScoreCalculator {
  if (!healthScoreCalculator) {
    throw new Error('HealthScoreCalculator not initialized. Call initHealthScoreCalculator() first.');
  }
  return healthScoreCalculator;
}
