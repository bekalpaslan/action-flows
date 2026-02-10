/**
 * Structured Telemetry Service
 * Replaces console.log black holes with queryable, structured logging
 *
 * Architecture:
 * - Ring buffer (FIFO, max 10K entries) for in-memory storage
 * - Console passthrough for dev visibility
 * - Optional WebSocket broadcast for real-time streaming
 */

import type { TelemetryEntry, TelemetryLevel, SessionId, Timestamp, TelemetryQueryFilter } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { randomUUID } from 'crypto';

const MAX_ENTRIES = 10_000;

/**
 * Statistics about telemetry entries
 */
export interface TelemetryStats {
  totalEntries: number;
  errorCount: number;
  bySource: Record<string, number>;
  byLevel: Record<string, number>;
}

/**
 * Telemetry Service
 * Lightweight custom implementation (no Winston dependency)
 */
class TelemetryService {
  private entries: TelemetryEntry[] = [];
  private broadcastFn: ((entry: TelemetryEntry) => void) | null = null;

  /**
   * Log a telemetry entry
   */
  log(
    level: TelemetryLevel,
    source: string,
    message: string,
    metadata?: Record<string, unknown>,
    sessionId?: SessionId
  ): void {
    const entry: TelemetryEntry = {
      id: randomUUID(),
      level,
      source,
      message,
      metadata,
      sessionId,
      timestamp: brandedTypes.currentTimestamp(),
    };

    // Add to ring buffer (FIFO eviction at MAX_ENTRIES)
    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.shift(); // Remove oldest
    }

    // Console passthrough for dev visibility
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    const prefix = `[${source}]`;
    const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    logFn(`${prefix} ${message}${metaStr}`);

    // WebSocket broadcast (if registered)
    if (this.broadcastFn) {
      this.broadcastFn(entry);
    }
  }

  /**
   * Query telemetry entries with optional filters
   */
  query(filter: TelemetryQueryFilter = {}): TelemetryEntry[] {
    let results = this.entries;

    // Filter by level
    if (filter.level) {
      results = results.filter(e => e.level === filter.level);
    }

    // Filter by source
    if (filter.source) {
      results = results.filter(e => e.source === filter.source);
    }

    // Filter by sessionId
    if (filter.sessionId) {
      results = results.filter(e => e.sessionId === filter.sessionId);
    }

    // Filter by time range
    if (filter.fromTimestamp) {
      const fromTime = new Date(filter.fromTimestamp).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() >= fromTime);
    }

    if (filter.toTimestamp) {
      const toTime = new Date(filter.toTimestamp).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() <= toTime);
    }

    // Apply limit (most recent first)
    if (filter.limit && filter.limit > 0) {
      results = results.slice(-filter.limit);
    }

    return results;
  }

  /**
   * Get aggregate statistics
   */
  getStats(): TelemetryStats {
    const bySource: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    let errorCount = 0;

    for (const entry of this.entries) {
      // Count by source
      bySource[entry.source] = (bySource[entry.source] || 0) + 1;

      // Count by level
      byLevel[entry.level] = (byLevel[entry.level] || 0) + 1;

      // Count errors
      if (entry.level === 'error') {
        errorCount++;
      }
    }

    return {
      totalEntries: this.entries.length,
      errorCount,
      bySource,
      byLevel,
    };
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Register a broadcast function for real-time telemetry streaming
   */
  setBroadcastFunction(fn: (entry: TelemetryEntry) => void): void {
    this.broadcastFn = fn;
  }
}

/**
 * Singleton telemetry service instance
 */
export const telemetry = new TelemetryService();
