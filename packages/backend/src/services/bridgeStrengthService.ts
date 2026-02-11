/**
 * Bridge Strength Service
 *
 * Tracks how frequently each bridge is traversed and calculates visual strength (thickness).
 * Strength is represented as a logarithmic scale from 0.3 (minimum) to 1.0 (maximum).
 *
 * Features:
 * - Traversal count tracking per bridge
 * - Logarithmic strength calculation (handles wide ranges)
 * - Bidirectional bridge keys (A→B same as B→A)
 * - Last traversal timestamp tracking
 */

import type { RegionId } from '@afw/shared';

/**
 * Bridge strength metadata
 */
interface BridgeStrength {
  /** Source region ID */
  fromRegion: RegionId;

  /** Target region ID */
  toRegion: RegionId;

  /** Total number of traversals */
  traversalCount: number;

  /** Calculated strength (0.0 to 1.0) */
  strength: number;

  /** Timestamp of last traversal */
  lastTraversal: number;
}

/**
 * Bridge Strength Service
 *
 * Manages bridge traversal tracking and strength calculation for
 * Living Universe visualization. Bridges become thicker as they are
 * traversed more frequently.
 */
export class BridgeStrengthService {
  private bridges: Map<string, BridgeStrength> = new Map();

  /**
   * Generate a bidirectional bridge key.
   * Same key for A→B and B→A (undirected bridges).
   */
  private getBridgeKey(from: RegionId, to: RegionId): string {
    return [from, to].sort().join('→');
  }

  /**
   * Record bridge traversal (called when spark completes).
   *
   * Strength formula: 0.3 + log10(count + 1) * 0.35
   * Results:
   * - 1 traversal  = 0.4 (thin)
   * - 10 traversals = 0.65 (medium)
   * - 100 traversals = 1.0 (thick)
   *
   * @param fromRegion - Source region
   * @param toRegion - Target region
   * @returns Updated strength value (0.3 to 1.0)
   */
  public recordTraversal(fromRegion: RegionId, toRegion: RegionId): number {
    const key = this.getBridgeKey(fromRegion, toRegion);

    if (!this.bridges.has(key)) {
      this.bridges.set(key, {
        fromRegion,
        toRegion,
        traversalCount: 0,
        strength: 0.3, // Minimum strength
        lastTraversal: 0,
      });
    }

    const bridge = this.bridges.get(key)!;
    bridge.traversalCount++;
    bridge.lastTraversal = Date.now();

    // Logarithmic scaling (handles wide ranges gracefully)
    // 0.3 baseline + logarithmic growth capped at 1.0
    bridge.strength = 0.3 + Math.log10(bridge.traversalCount + 1) * 0.35;
    bridge.strength = Math.min(bridge.strength, 1.0);

    console.log(
      `[BridgeStrengthService] Bridge ${key} traversed: count=${bridge.traversalCount}, strength=${bridge.strength.toFixed(2)}`
    );

    return bridge.strength;
  }

  /**
   * Get bridge strength (0.0 to 1.0).
   * Returns default 0.3 if bridge has never been traversed.
   *
   * @param fromRegion - Source region
   * @param toRegion - Target region
   * @returns Strength value (0.3 to 1.0)
   */
  public getStrength(fromRegion: RegionId, toRegion: RegionId): number {
    const key = this.getBridgeKey(fromRegion, toRegion);
    return this.bridges.get(key)?.strength ?? 0.3;
  }

  /**
   * Get all bridge strengths for visualization.
   * Returns a copy of the bridges map.
   */
  public getAllStrengths(): Map<string, BridgeStrength> {
    return new Map(this.bridges);
  }

  /**
   * Get bridge traversal count.
   *
   * @param fromRegion - Source region
   * @param toRegion - Target region
   * @returns Traversal count (0 if never traversed)
   */
  public getTraversalCount(fromRegion: RegionId, toRegion: RegionId): number {
    const key = this.getBridgeKey(fromRegion, toRegion);
    return this.bridges.get(key)?.traversalCount ?? 0;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let bridgeStrengthService: BridgeStrengthService | null = null;

/**
 * Initialize the BridgeStrengthService singleton.
 * Call this once during backend startup.
 */
export function initBridgeStrengthService(): BridgeStrengthService {
  if (!bridgeStrengthService) {
    bridgeStrengthService = new BridgeStrengthService();
    console.log('[BridgeStrengthService] Service initialized');
  }
  return bridgeStrengthService;
}

/**
 * Get the BridgeStrengthService singleton instance.
 * Throws if not initialized.
 */
export function getBridgeStrengthService(): BridgeStrengthService {
  if (!bridgeStrengthService) {
    throw new Error('BridgeStrengthService not initialized. Call initBridgeStrengthService() first.');
  }
  return bridgeStrengthService;
}
