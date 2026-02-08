import type { FrequencyRecord, FrequencyQuery, ProjectId, UserId, Timestamp } from '@afw/shared';
import type { Storage } from '../storage/index.js';

/**
 * Configuration for frequency tracking
 */
export const FREQUENCY_CONFIG = {
  /** Number of days to retain daily counts */
  retentionDays: 90,
  /** Threshold count to trigger pattern detection */
  patternThreshold: 5,
  /** Count threshold for toolbar suggestion */
  toolbarThreshold: 3,
};

/**
 * Service for tracking action frequencies.
 * Wraps Storage methods with threshold detection and event emission.
 */
export class FrequencyTracker {
  constructor(private storage: Storage) {}

  /**
   * Track an action occurrence.
   * Increments count and daily breakdown, emits event if threshold crossed.
   *
   * @param actionType - Button ID, command type, or quick action ID
   * @param projectId - Optional project scope
   * @param userId - Optional user scope
   * @returns Updated frequency record
   */
  async track(
    actionType: string,
    projectId?: ProjectId,
    userId?: UserId
  ): Promise<FrequencyRecord> {
    // 1. Call storage.trackAction
    await this.storage.trackAction(actionType, projectId, userId);

    // 2. Get updated record
    const record = await this.getFrequencyAsync(actionType, projectId);

    // 3. Check if count just crossed threshold
    if (record && this.isPatternCandidate(record)) {
      // Pattern threshold crossed - could be used for event emission
      // This is where threshold events would be emitted
    }

    // 4. Return record
    return record || this.createEmptyRecord(actionType, projectId, userId);
  }

  /**
   * Query frequency records with filtering
   */
  async query(query: FrequencyQuery): Promise<FrequencyRecord[]> {
    // Use storage methods to fetch and filter
    if (query.projectId) {
      const records = await this.getTopActionsAsync(query.projectId, query.limit || 100);

      // Apply additional filters
      let filtered = records;

      if (query.minCount !== undefined) {
        filtered = filtered.filter((r) => r.count >= query.minCount!);
      }

      if (query.userId !== undefined) {
        filtered = filtered.filter((r) => r.userId === query.userId);
      }

      if (query.since !== undefined) {
        const sinceTime = new Date(query.since).getTime();
        filtered = filtered.filter((r) => new Date(r.lastSeen).getTime() >= sinceTime);
      }

      if (query.orderBy === 'lastSeen') {
        filtered.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
      } else {
        // Default: orderBy count
        filtered.sort((a, b) => b.count - a.count);
      }

      return filtered;
    }

    return [];
  }

  /**
   * Get top N actions by frequency for a project
   */
  async getTopActions(projectId: ProjectId, limit: number = 10): Promise<FrequencyRecord[]> {
    return this.getTopActionsAsync(projectId, limit);
  }

  /**
   * Check if an action has crossed the pattern threshold
   */
  isPatternCandidate(record: FrequencyRecord): boolean {
    return record.count >= FREQUENCY_CONFIG.patternThreshold;
  }

  /**
   * Check if an action should be suggested for toolbar
   */
  isToolbarCandidate(record: FrequencyRecord): boolean {
    return record.count >= FREQUENCY_CONFIG.toolbarThreshold;
  }

  /**
   * Clean up old daily counts beyond retention period
   * Should be called periodically (e.g., daily cron)
   */
  async cleanup(record: FrequencyRecord): Promise<FrequencyRecord> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - FREQUENCY_CONFIG.retentionDays);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    // Filter out daily counts older than cutoff
    const cleanedCounts: Record<string, number> = {};
    for (const [date, count] of Object.entries(record.dailyCounts)) {
      if (date >= cutoffString) {
        cleanedCounts[date] = count;
      }
    }

    return { ...record, dailyCounts: cleanedCounts };
  }

  /**
   * Get frequency trend (last N days)
   */
  getTrend(record: FrequencyRecord, days: number = 7): number[] {
    const result: number[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push(record.dailyCounts[dateStr] || 0);
    }

    return result;
  }

  /**
   * Internal helper to get frequency - handles both sync and async storage
   */
  private async getFrequencyAsync(
    actionType: string,
    projectId?: ProjectId
  ): Promise<FrequencyRecord | undefined> {
    const result = this.storage.getFrequency(actionType, projectId);
    return result instanceof Promise ? result : Promise.resolve(result);
  }

  /**
   * Internal helper to get top actions - handles both sync and async storage
   */
  private async getTopActionsAsync(projectId: ProjectId, limit: number): Promise<FrequencyRecord[]> {
    const result = this.storage.getTopActions(projectId, limit);
    return result instanceof Promise ? result : Promise.resolve(result);
  }

  /**
   * Create an empty record for initialization
   */
  private createEmptyRecord(
    actionType: string,
    projectId?: ProjectId,
    userId?: UserId
  ): FrequencyRecord {
    return {
      actionType,
      projectId,
      userId,
      count: 0,
      firstSeen: new Date().toISOString() as Timestamp,
      lastSeen: new Date().toISOString() as Timestamp,
      dailyCounts: {},
    };
  }
}
