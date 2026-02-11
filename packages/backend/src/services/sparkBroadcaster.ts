/**
 * Spark Broadcaster Service
 * Broadcasts real-time spark position updates for Living Universe chain execution visualization
 */

import { EventEmitter } from 'events';
import type { ChainId, SessionId, RegionId } from '@afw/shared';
import { mapActionToRegion } from '@afw/shared';

/**
 * Spark state for tracking animation progress
 */
interface SparkState {
  chainId: ChainId;
  sessionId: SessionId;
  fromRegion: RegionId;
  toRegion: RegionId;
  progress: number; // 0.0 to 1.0
  startTime: number;
  estimatedDuration: number;
  lastBroadcast: number; // timestamp
  lastBroadcastProgress: number; // last progress value broadcasted
}

/**
 * Spark traveling event payload
 */
export interface SparkTravelingEvent {
  type: 'chain:spark_traveling';
  chainId: ChainId;
  sessionId: SessionId;
  fromRegion: RegionId;
  toRegion: RegionId;
  progress: number;
  timestamp: number;
}

/**
 * SparkBroadcaster Service
 *
 * Listens to chain step events and broadcasts real-time spark position updates
 * via WebSocket for visual animation on the cosmic map.
 *
 * Features:
 * - 100ms broadcast intervals (max 10 FPS)
 * - 5% progress throttling (only broadcast if progress changes by ≥5%)
 * - Self-loop filtering (skip same-region transitions)
 * - Max 5 concurrent sparks (performance limit)
 * - Automatic cleanup on spark completion
 */
export class SparkBroadcaster extends EventEmitter {
  private activeSparks: Map<ChainId, SparkState> = new Map();
  private intervalTimers: Map<ChainId, NodeJS.Timeout> = new Map();

  private readonly BROADCAST_INTERVAL = 100; // ms (10 FPS)
  private readonly PROGRESS_THRESHOLD = 0.05; // 5%
  private readonly MAX_CONCURRENT_SPARKS = 5;

  /**
   * Start spark animation for a chain step transition.
   *
   * @param chainId - Chain identifier
   * @param sessionId - Session identifier
   * @param currentAction - Current step action (e.g., "code/backend")
   * @param nextAction - Next step action (e.g., "review")
   * @param estimatedDuration - Estimated travel time in ms (default: 3000ms)
   */
  public startSpark(
    chainId: ChainId,
    sessionId: SessionId,
    currentAction: string,
    nextAction: string,
    estimatedDuration: number = 3000
  ): void {
    // Limit concurrent sparks
    if (this.activeSparks.size >= this.MAX_CONCURRENT_SPARKS) {
      console.warn('[SparkBroadcaster] Max concurrent sparks reached, skipping');
      return;
    }

    const fromRegion = mapActionToRegion(currentAction);
    const toRegion = mapActionToRegion(nextAction);

    // Skip self-loops (same region transitions)
    if (fromRegion === toRegion) {
      console.log(`[SparkBroadcaster] Self-loop detected (${fromRegion}), skipping spark animation`);
      return;
    }

    const spark: SparkState = {
      chainId,
      sessionId,
      fromRegion,
      toRegion,
      progress: 0.0,
      startTime: Date.now(),
      estimatedDuration,
      lastBroadcast: 0,
      lastBroadcastProgress: 0.0,
    };

    this.activeSparks.set(chainId, spark);

    // Broadcast initial position
    this.broadcastSpark(spark);

    // Start progress updates
    const timer = setInterval(() => {
      this.updateSparkProgress(chainId);
    }, this.BROADCAST_INTERVAL);

    this.intervalTimers.set(chainId, timer);

    console.log(`[SparkBroadcaster] Started spark: ${chainId} (${fromRegion} -> ${toRegion})`);
  }

  /**
   * Complete spark animation (reached destination).
   * Broadcasts final position at 100% progress then cleans up.
   *
   * @param chainId - Chain identifier
   */
  public completeSpark(chainId: ChainId): void {
    const spark = this.activeSparks.get(chainId);
    if (!spark) {
      return;
    }

    // Final broadcast at 100% progress
    spark.progress = 1.0;
    spark.lastBroadcastProgress = 1.0;
    this.broadcastSpark(spark);

    // Cleanup
    this.stopSpark(chainId);

    console.log(`[SparkBroadcaster] Completed spark: ${chainId}`);
  }

  /**
   * Stop spark animation prematurely (e.g., on error or cancellation).
   *
   * @param chainId - Chain identifier
   */
  public stopSpark(chainId: ChainId): void {
    const timer = this.intervalTimers.get(chainId);
    if (timer) {
      clearInterval(timer);
      this.intervalTimers.delete(chainId);
    }
    this.activeSparks.delete(chainId);
  }

  /**
   * Update spark progress and broadcast if threshold met.
   *
   * @param chainId - Chain identifier
   * @private
   */
  private updateSparkProgress(chainId: ChainId): void {
    const spark = this.activeSparks.get(chainId);
    if (!spark) {
      return;
    }

    const elapsed = Date.now() - spark.startTime;
    const newProgress = Math.min(elapsed / spark.estimatedDuration, 0.95); // Cap at 95%

    // 5% throttling - only broadcast if progress increased by at least 5%
    if (newProgress - spark.lastBroadcastProgress < this.PROGRESS_THRESHOLD) {
      return;
    }

    spark.progress = newProgress;
    this.broadcastSpark(spark);
  }

  /**
   * Broadcast spark position via EventEmitter.
   * Emits 'spark:traveling' event for WebSocket integration.
   *
   * @param spark - Spark state to broadcast
   * @private
   */
  private broadcastSpark(spark: SparkState): void {
    const now = Date.now();
    spark.lastBroadcast = now;
    spark.lastBroadcastProgress = spark.progress;

    const event: SparkTravelingEvent = {
      type: 'chain:spark_traveling',
      chainId: spark.chainId,
      sessionId: spark.sessionId,
      fromRegion: spark.fromRegion,
      toRegion: spark.toRegion,
      progress: spark.progress,
      timestamp: now,
    };

    this.emit('spark:traveling', event);
  }

  /**
   * Cleanup all active sparks on shutdown.
   */
  public shutdown(): void {
    console.log('[SparkBroadcaster] Shutting down...');

    for (const chainId of this.activeSparks.keys()) {
      this.stopSpark(chainId);
    }

    console.log('[SparkBroadcaster] Shutdown complete');
  }

  /**
   * Get active spark count (for monitoring/debugging).
   */
  public getActiveSparkCount(): number {
    return this.activeSparks.size;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let sparkBroadcaster: SparkBroadcaster | null = null;

/**
 * Initialize the SparkBroadcaster singleton.
 * Call this once during backend startup.
 */
export function initSparkBroadcaster(): SparkBroadcaster {
  if (!sparkBroadcaster) {
    sparkBroadcaster = new SparkBroadcaster();
    console.log('[SparkBroadcaster] Service initialized');
  }
  return sparkBroadcaster;
}

/**
 * Get the SparkBroadcaster singleton instance.
 * Throws if not initialized.
 */
export function getSparkBroadcaster(): SparkBroadcaster {
  if (!sparkBroadcaster) {
    throw new Error('SparkBroadcaster not initialized. Call initSparkBroadcaster() first.');
  }
  return sparkBroadcaster;
}
