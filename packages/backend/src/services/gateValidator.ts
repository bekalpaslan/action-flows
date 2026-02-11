/**
 * Gate Validator Service
 * Validates Harmony checks when sparks pass through gate checkpoints on light bridges
 */

import { EventEmitter } from 'events';
import type { RegionId, ChainId } from '@afw/shared';

/**
 * Gate validation status
 */
export type GateStatus = 'pending' | 'pass' | 'fail';

/**
 * Gate checkpoint state tracking
 */
interface GateCheckpoint {
  fromRegion: RegionId;
  toRegion: RegionId;
  status: GateStatus;
  passCount: number;
  failCount: number;
  lastCheck: number;
}

/**
 * Gate updated event payload
 */
export interface GateUpdatedEvent {
  type: 'chain:gate_updated';
  fromRegion: RegionId;
  toRegion: RegionId;
  status: GateStatus;
  passCount: number;
  failCount: number;
  timestamp: number;
}

/**
 * GateValidator Service
 *
 * Validates Harmony when sparks pass through gate checkpoints.
 * Non-blocking, fire-and-forget pattern.
 *
 * Features:
 * - Harmony validation at gate checkpoints (bridge midpoint)
 * - Pass/fail tracking per gate
 * - Bidirectional gate keys (region pair identification)
 * - WebSocket event broadcasting
 * - Placeholder Harmony integration (ready for service connection)
 */
export class GateValidator extends EventEmitter {
  private gates: Map<string, GateCheckpoint> = new Map();

  /**
   * Get gate key for bridge (bidirectional).
   * Same key for both directions of travel.
   *
   * @param from - Source region
   * @param to - Target region
   * @returns Normalized gate key
   *
   * @example
   * getGateKey("region-work", "region-review") // "region-review→region-work"
   * getGateKey("region-review", "region-work") // "region-review→region-work" (same)
   */
  private getGateKey(from: RegionId, to: RegionId): string {
    // Sort alphabetically for bidirectional consistency
    return [from, to].sort().join('→');
  }

  /**
   * Validate Harmony when spark passes through gate checkpoint.
   * Non-blocking, fire-and-forget pattern.
   *
   * Called by SparkBroadcaster when spark reaches 50% progress (bridge midpoint).
   *
   * @param chainId - Chain identifier
   * @param fromRegion - Source region
   * @param toRegion - Target region
   * @returns Gate validation status
   */
  public async validateGate(
    chainId: ChainId,
    fromRegion: RegionId,
    toRegion: RegionId
  ): Promise<GateStatus> {
    const gateKey = this.getGateKey(fromRegion, toRegion);

    // Get or create gate checkpoint
    if (!this.gates.has(gateKey)) {
      this.gates.set(gateKey, {
        fromRegion,
        toRegion,
        status: 'pending',
        passCount: 0,
        failCount: 0,
        lastCheck: 0,
      });
    }

    const gate = this.gates.get(gateKey)!;

    // Perform Harmony check (placeholder for now)
    const harmonyPassed = await this.checkHarmony(chainId);

    // Update gate stats
    if (harmonyPassed) {
      gate.status = 'pass';
      gate.passCount++;
    } else {
      gate.status = 'fail';
      gate.failCount++;
    }
    gate.lastCheck = Date.now();

    // Broadcast gate status update
    this.broadcastGateUpdate(gate);

    console.log(
      `[GateValidator] Gate ${gateKey} validated: ${gate.status} (pass: ${gate.passCount}, fail: ${gate.failCount})`
    );

    return gate.status;
  }

  /**
   * Check Harmony for chain (placeholder).
   * Replace with actual Harmony detection service integration.
   *
   * TODO: Integrate with packages/backend/src/services/harmonyDetector.ts
   * - Listen to harmony:check events
   * - Map event context to current chain
   * - Return actual validation result
   *
   * @param chainId - Chain identifier
   * @returns True if Harmony checks pass
   * @private
   */
  private async checkHarmony(chainId: ChainId): Promise<boolean> {
    // TODO: Integrate with existing Harmony detection service
    // For now, always pass (optimistic default)
    // This prevents false negatives during development
    return true;
  }

  /**
   * Broadcast gate update event via EventEmitter.
   * Emits 'gate:updated' event for WebSocket integration.
   *
   * @param gate - Gate checkpoint state
   * @private
   */
  private broadcastGateUpdate(gate: GateCheckpoint): void {
    const event: GateUpdatedEvent = {
      type: 'chain:gate_updated',
      fromRegion: gate.fromRegion,
      toRegion: gate.toRegion,
      status: gate.status,
      passCount: gate.passCount,
      failCount: gate.failCount,
      timestamp: Date.now(),
    };

    this.emit('gate:updated', event);
  }

  /**
   * Get gate statistics for a specific bridge.
   *
   * @param fromRegion - Source region
   * @param toRegion - Target region
   * @returns Gate checkpoint state or null if not found
   */
  public getGateStats(fromRegion: RegionId, toRegion: RegionId): GateCheckpoint | null {
    const gateKey = this.getGateKey(fromRegion, toRegion);
    return this.gates.get(gateKey) || null;
  }

  /**
   * Get all gate statistics (for monitoring/debugging).
   *
   * @returns Map of gate keys to checkpoint states
   */
  public getAllGateStats(): Map<string, GateCheckpoint> {
    return new Map(this.gates);
  }

  /**
   * Reset gate statistics (useful for testing).
   *
   * @param fromRegion - Source region (optional, resets all if omitted)
   * @param toRegion - Target region (optional)
   */
  public resetGates(fromRegion?: RegionId, toRegion?: RegionId): void {
    if (fromRegion && toRegion) {
      const gateKey = this.getGateKey(fromRegion, toRegion);
      this.gates.delete(gateKey);
      console.log(`[GateValidator] Reset gate: ${gateKey}`);
    } else {
      this.gates.clear();
      console.log('[GateValidator] Reset all gates');
    }
  }

  /**
   * Cleanup on shutdown.
   */
  public shutdown(): void {
    console.log('[GateValidator] Shutting down...');
    this.gates.clear();
    this.removeAllListeners();
    console.log('[GateValidator] Shutdown complete');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let gateValidator: GateValidator | null = null;

/**
 * Initialize the GateValidator singleton.
 * Call this once during backend startup.
 */
export function initGateValidator(): GateValidator {
  if (!gateValidator) {
    gateValidator = new GateValidator();
    console.log('[GateValidator] Service initialized');
  }
  return gateValidator;
}

/**
 * Get the GateValidator singleton instance.
 * Throws if not initialized.
 */
export function getGateValidator(): GateValidator {
  if (!gateValidator) {
    throw new Error('GateValidator not initialized. Call initGateValidator() first.');
  }
  return gateValidator;
}
