/**
 * Discovery Service - Backend Foundation for Living Universe Phase 3
 *
 * Evaluates discovery triggers and manages fog-of-war state transitions.
 * Tracks session activity and determines when regions should be revealed.
 *
 * @module discoveryService
 */

import type {
  SessionId,
  ChainId,
  RegionId,
  UniverseGraph,
  DiscoveryTrigger,
  DiscoveryCondition,
  FogState,
  Chain,
} from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import type { Storage } from '../storage/index.js';

// ============================================================================
// Activity Tracking
// ============================================================================

/**
 * Tracks session activity for discovery evaluation
 */
interface SessionActivity {
  sessionId: SessionId;
  interactionCount: number;
  completedActions: string[];
  errors: ErrorRecord[];
  sessionStartTime: number;
  lastActivityTime: number;
  discoveredRegions: RegionId[];
}

/**
 * Error record for trigger evaluation
 */
interface ErrorRecord {
  type: string;
  timestamp: number;
  chainId?: ChainId;
}

/**
 * Discovery evaluation result
 */
export interface DiscoveryResult {
  readyRegions: RegionId[];
  progress: Record<RegionId, number>;
}

// ============================================================================
// Discovery Service
// ============================================================================

/**
 * Evaluates discovery triggers and manages region revelation
 */
export class DiscoveryService {
  private storage: Storage;
  private activityMap: Map<SessionId, SessionActivity>;

  constructor(storage: Storage) {
    this.storage = storage;
    this.activityMap = new Map();
  }

  // ==========================================================================
  // Activity Recording
  // ==========================================================================

  /**
   * Record a user interaction (e.g., command submission, question asked)
   */
  async recordInteraction(sessionId: SessionId, context: string): Promise<void> {
    const activity = await this.getOrCreateActivity(sessionId);
    activity.interactionCount++;
    activity.lastActivityTime = Date.now();
    this.activityMap.set(sessionId, activity);
  }

  /**
   * Record a completed chain action
   */
  async recordChainCompleted(sessionId: SessionId, chainId: ChainId): Promise<void> {
    const activity = await this.getOrCreateActivity(sessionId);

    // Get chain details to determine action types from steps
    const chain = await this.storage.getChain(chainId);
    if (chain && chain.steps && chain.steps.length > 0) {
      // Extract action prefixes from chain steps (e.g., 'code', 'plan', 'review')
      for (const step of chain.steps) {
        if (step.action) {
          const actionPrefix = this.extractActionPrefix(step.action);
          if (!activity.completedActions.includes(actionPrefix)) {
            activity.completedActions.push(actionPrefix);
          }
        }
      }
    }

    activity.lastActivityTime = Date.now();
    this.activityMap.set(sessionId, activity);
  }

  /**
   * Record an error encountered during execution
   */
  async recordError(sessionId: SessionId, errorType: string = 'any', chainId?: ChainId): Promise<void> {
    const activity = await this.getOrCreateActivity(sessionId);
    activity.errors.push({
      type: errorType,
      timestamp: Date.now(),
      chainId,
    });
    activity.lastActivityTime = Date.now();
    this.activityMap.set(sessionId, activity);
  }

  // ==========================================================================
  // Discovery Evaluation
  // ==========================================================================

  /**
   * Evaluate all discovery triggers for a session
   * Returns list of regions that are ready to be revealed
   */
  async evaluateDiscovery(sessionId: SessionId): Promise<DiscoveryResult> {
    const universe = await this.storage.getUniverseGraph();
    if (!universe) {
      return { readyRegions: [], progress: {} };
    }

    const activity = await this.getOrCreateActivity(sessionId);
    const readyRegions: RegionId[] = [];
    const progress: Record<RegionId, number> = {};

    // Evaluate each trigger
    for (const trigger of universe.discoveryTriggers) {
      if (trigger.triggered) {
        // Already triggered, skip
        progress[trigger.regionId] = 1.0;
        continue;
      }

      // Check if region is already revealed
      const region = universe.regions.find((r) => r.id === trigger.regionId);
      if (region && region.fogState === 'revealed') {
        progress[trigger.regionId] = 1.0;
        continue;
      }

      // Evaluate condition
      const result = await this.evaluateCondition(trigger.condition, activity);
      progress[trigger.regionId] = result.progress;

      if (result.ready && !readyRegions.includes(trigger.regionId)) {
        readyRegions.push(trigger.regionId);
      }
    }

    return { readyRegions, progress };
  }

  /**
   * Evaluate a single discovery condition
   */
  private async evaluateCondition(
    condition: DiscoveryCondition,
    activity: SessionActivity
  ): Promise<{ ready: boolean; progress: number }> {
    switch (condition.type) {
      case 'interaction_count': {
        const current = activity.interactionCount;
        const threshold = condition.threshold;
        const progress = Math.min(current / threshold, 1.0);
        return { ready: current >= threshold, progress };
      }

      case 'chain_completed': {
        const action = condition.action;
        const ready = activity.completedActions.includes(action);
        return { ready, progress: ready ? 1.0 : 0.0 };
      }

      case 'error_encountered': {
        const errorType = condition.errorType;
        const ready = errorType === 'any'
          ? activity.errors.length > 0
          : activity.errors.some((e) => e.type === errorType);
        return { ready, progress: ready ? 1.0 : 0.0 };
      }

      case 'time_elapsed': {
        const elapsed = Date.now() - activity.sessionStartTime;
        const required = condition.durationMs;
        const progress = Math.min(elapsed / required, 1.0);
        return { ready: elapsed >= required, progress };
      }

      case 'region_discovered': {
        const requiredRegionId = condition.requiredRegionId;
        const ready = activity.discoveredRegions.includes(requiredRegionId);
        return { ready, progress: ready ? 1.0 : 0.0 };
      }

      case 'custom': {
        // For custom evaluators, we'll need to implement specific logic
        // For now, return false to avoid breaking
        return { ready: false, progress: 0.0 };
      }

      default:
        return { ready: false, progress: 0.0 };
    }
  }

  // ==========================================================================
  // Manual Override (Testing & Admin)
  // ==========================================================================

  /**
   * Manually reveal a region (admin/testing escape hatch)
   */
  async revealRegion(sessionId: SessionId, regionId: RegionId): Promise<void> {
    const universe = await this.storage.getUniverseGraph();
    if (!universe) return;

    // Update region fog state
    const region = universe.regions.find((r) => r.id === regionId);
    if (!region) return;

    region.fogState = 'revealed' as FogState;
    region.discoveredAt = brandedTypes.currentTimestamp();
    region.status = 'idle';

    // Update trigger
    const trigger = universe.discoveryTriggers.find((t) => t.regionId === regionId);
    if (trigger) {
      trigger.triggered = true;
      trigger.triggeredAt = brandedTypes.currentTimestamp();
      trigger.triggeredBySessionId = sessionId;
    }

    // Update activity
    const activity = await this.getOrCreateActivity(sessionId);
    if (!activity.discoveredRegions.includes(regionId)) {
      activity.discoveredRegions.push(regionId);
    }

    // Persist
    await this.storage.setUniverseGraph(universe);
    await this.storage.setRegion(region);
  }

  /**
   * Reveal all regions (testing/debug mode)
   */
  async revealAll(sessionId: SessionId): Promise<void> {
    const universe = await this.storage.getUniverseGraph();
    if (!universe) return;

    for (const region of universe.regions) {
      if (region.fogState !== 'revealed') {
        await this.revealRegion(sessionId, region.id);
      }
    }
  }

  // ==========================================================================
  // Activity Management
  // ==========================================================================

  /**
   * Get or create session activity record
   */
  private async getOrCreateActivity(sessionId: SessionId): Promise<SessionActivity> {
    if (this.activityMap.has(sessionId)) {
      return this.activityMap.get(sessionId)!;
    }

    // Check if session already has discovered regions from storage
    const universe = await this.storage.getUniverseGraph();
    const discoveredRegions: RegionId[] = [];

    if (universe) {
      for (const region of universe.regions) {
        if (region.fogState === 'revealed') {
          discoveredRegions.push(region.id);
        }
      }
    }

    const activity: SessionActivity = {
      sessionId,
      interactionCount: 0,
      completedActions: [],
      errors: [],
      sessionStartTime: Date.now(),
      lastActivityTime: Date.now(),
      discoveredRegions,
    };

    this.activityMap.set(sessionId, activity);
    return activity;
  }

  /**
   * Extract action prefix from chain type
   * Examples: 'code/backend' → 'code/', 'plan/roadmap' → 'plan/'
   */
  private extractActionPrefix(chainType: string): string {
    const parts = chainType.split('/');
    return parts.length > 0 ? `${parts[0]}/` : chainType;
  }

  /**
   * Get discovery progress for a specific region (0.0 - 1.0)
   */
  async getRegionProgress(sessionId: SessionId, regionId: RegionId): Promise<number> {
    const result = await this.evaluateDiscovery(sessionId);
    return result.progress[regionId] ?? 0.0;
  }

  /**
   * Get all regions near discovery (threshold = 0.9 by default)
   */
  async getNearDiscoveryRegions(sessionId: SessionId, threshold: number = 0.9): Promise<RegionId[]> {
    const result = await this.evaluateDiscovery(sessionId);
    return Object.entries(result.progress)
      .filter(([_, progress]) => progress >= threshold && progress < 1.0)
      .map(([regionId]) => regionId as RegionId);
  }

  /**
   * Clear activity for a session (e.g., on session deletion)
   */
  clearSessionActivity(sessionId: SessionId): void {
    this.activityMap.delete(sessionId);
  }
}

/**
 * Singleton instance (exported for use in routes/WebSocket handlers)
 */
let discoveryServiceInstance: DiscoveryService | null = null;

/**
 * Initialize the discovery service with storage
 */
export function initDiscoveryService(storage: Storage): DiscoveryService {
  discoveryServiceInstance = new DiscoveryService(storage);
  return discoveryServiceInstance;
}

/**
 * Get the current discovery service instance
 */
export function getDiscoveryService(): DiscoveryService | null {
  return discoveryServiceInstance;
}
