/**
 * Lifecycle Manager Service
 * Coordinates all cleanup mechanisms with phase transitions, per-resource-type policies,
 * pre-eviction notifications, and a lifecycle event stream.
 *
 * Phase transitions:
 * - active: Resource is actively being used
 * - idle: Resource has been inactive for idleThresholdMs
 * - expiring: Resource has been inactive for expiringThresholdMs
 * - evicted: Resource has been removed from storage
 *
 * Coordinates with:
 * - Cleanup service (daily file cleanup with 7-day retention)
 * - FIFO eviction (MemoryStorage capacity limits)
 * - Redis TTL (automatic key expiration, 24h for sessions)
 */

import type { SessionId, LifecyclePhase, LifecycleEvent, LifecyclePolicy, Timestamp } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { telemetry } from './telemetry.js';
import { activityTracker } from './activityTracker.js';

/**
 * Default lifecycle policies
 */
const DEFAULT_POLICIES: LifecyclePolicy[] = [
  {
    resourceType: 'session',
    idleThresholdMs: 30 * 60 * 1000, // 30 minutes
    expiringThresholdMs: 2 * 60 * 60 * 1000, // 2 hours
    evictionStrategy: 'fifo',
  },
  {
    resourceType: 'chain',
    idleThresholdMs: 60 * 60 * 1000, // 1 hour
    expiringThresholdMs: 4 * 60 * 60 * 1000, // 4 hours
    evictionStrategy: 'fifo',
  },
  {
    resourceType: 'event',
    idleThresholdMs: 2 * 60 * 60 * 1000, // 2 hours
    expiringThresholdMs: 6 * 60 * 60 * 1000, // 6 hours
    evictionStrategy: 'fifo',
  },
];

/**
 * Lifecycle state for a resource
 */
interface LifecycleState {
  phase: LifecyclePhase;
  lastTransitionAt: number;
}

/**
 * Statistics about lifecycle manager state
 */
interface LifecycleStats {
  totalTracked: number;
  byPhase: Record<LifecyclePhase, number>;
  byResourceType: Record<string, number>;
}

/**
 * LifecycleManager Service
 * Centralized coordinator for all cleanup mechanisms
 */
export class LifecycleManager {
  private policies: Map<string, LifecyclePolicy> = new Map();
  private lifecycleStates: Map<string, LifecycleState> = new Map();
  private lifecycleEvents: LifecycleEvent[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  private readonly MAX_EVENTS = 1000; // Ring buffer size for lifecycle events

  constructor() {
    // Register default policies
    for (const policy of DEFAULT_POLICIES) {
      this.registerPolicy(policy);
    }

    telemetry.log('info', 'lifecycleManager', 'Lifecycle manager initialized', {
      defaultPolicies: DEFAULT_POLICIES.length,
    });
  }

  /**
   * Register a lifecycle policy for a resource type
   */
  registerPolicy(policy: LifecyclePolicy): void {
    this.policies.set(policy.resourceType, policy);
    telemetry.log('debug', 'lifecycleManager', `Policy registered for ${policy.resourceType}`, {
      resourceType: policy.resourceType,
      idleThresholdMs: policy.idleThresholdMs,
      expiringThresholdMs: policy.expiringThresholdMs,
      evictionStrategy: policy.evictionStrategy,
    });
  }

  /**
   * Get policy for a resource type
   */
  getPolicy(resourceType: string): LifecyclePolicy | undefined {
    return this.policies.get(resourceType);
  }

  /**
   * Get current lifecycle phase for a resource
   */
  getPhase(resourceType: string, resourceId: string): LifecyclePhase {
    const key = this.makeKey(resourceType, resourceId);
    const state = this.lifecycleStates.get(key);
    return state?.phase ?? 'active'; // Default to active if not tracked
  }

  /**
   * Transition a resource to a new lifecycle phase
   */
  transitionPhase(
    resourceType: string,
    resourceId: string,
    toPhase: LifecyclePhase,
    reason: string
  ): void {
    const key = this.makeKey(resourceType, resourceId);
    const currentState = this.lifecycleStates.get(key);
    const fromPhase = currentState?.phase ?? 'active';

    // Skip if already in target phase
    if (fromPhase === toPhase) {
      return;
    }

    const now = Date.now();

    // Update state
    this.lifecycleStates.set(key, {
      phase: toPhase,
      lastTransitionAt: now,
    });

    // Create lifecycle event
    const event: LifecycleEvent = {
      type: 'lifecycle:transition',
      resourceType: resourceType as 'session' | 'chain' | 'event',
      resourceId,
      fromPhase,
      toPhase,
      reason,
      timestamp: brandedTypes.currentTimestamp(),
    };

    // Store in ring buffer (FIFO eviction)
    this.lifecycleEvents.push(event);
    if (this.lifecycleEvents.length > this.MAX_EVENTS) {
      this.lifecycleEvents.shift();
    }

    // Log to telemetry
    telemetry.log(
      'info',
      'lifecycleManager',
      `Lifecycle transition: ${resourceType}/${resourceId} → ${toPhase}`,
      {
        resourceType,
        resourceId,
        fromPhase,
        toPhase,
        reason,
      }
    );
  }

  /**
   * Notify that a resource is about to be evicted
   * This gives other systems a chance to respond before eviction
   */
  notifyPreEviction(resourceType: string, resourceId: string): void {
    telemetry.log('warn', 'lifecycleManager', `Pre-eviction notification: ${resourceType}/${resourceId}`, {
      resourceType,
      resourceId,
    });

    // Transition to expiring phase if not already evicted
    const currentPhase = this.getPhase(resourceType, resourceId);
    if (currentPhase !== 'evicted') {
      this.transitionPhase(resourceType, resourceId, 'expiring', 'pre-eviction-notification');
    }
  }

  /**
   * Get all resources in a specific phase
   */
  getResourcesByPhase(resourceType: string, phase: LifecyclePhase): string[] {
    const resources: string[] = [];
    const prefix = `${resourceType}:`;

    for (const [key, state] of this.lifecycleStates.entries()) {
      if (key.startsWith(prefix) && state.phase === phase) {
        // Extract resource ID from key
        const resourceId = key.substring(prefix.length);
        resources.push(resourceId);
      }
    }

    return resources;
  }

  /**
   * Get all resources that are eligible for eviction (expiring or idle)
   */
  getEvictableResources(resourceType: string): string[] {
    const expiring = this.getResourcesByPhase(resourceType, 'expiring');
    const idle = this.getResourcesByPhase(resourceType, 'idle');
    return [...expiring, ...idle];
  }

  /**
   * Get lifecycle statistics
   */
  getStats(): LifecycleStats {
    const byPhase: Record<LifecyclePhase, number> = {
      active: 0,
      idle: 0,
      expiring: 0,
      evicted: 0,
    };

    const byResourceType: Record<string, number> = {};

    for (const [key, state] of this.lifecycleStates.entries()) {
      // Count by phase
      byPhase[state.phase]++;

      // Count by resource type
      const resourceType = key.split(':')[0];
      byResourceType[resourceType] = (byResourceType[resourceType] || 0) + 1;
    }

    return {
      totalTracked: this.lifecycleStates.size,
      byPhase,
      byResourceType,
    };
  }

  /**
   * Start lifecycle checking loop
   */
  startChecking(intervalMs: number = 60_000): void {
    if (this.checkInterval) {
      telemetry.log('warn', 'lifecycleManager', 'Lifecycle checking already started');
      return;
    }

    this.checkInterval = setInterval(() => {
      this.performLifecycleCheck();
    }, intervalMs);

    telemetry.log('info', 'lifecycleManager', `Lifecycle checking started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop lifecycle checking loop
   */
  stopChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      telemetry.log('info', 'lifecycleManager', 'Lifecycle checking stopped');
    }
  }

  /**
   * Perform a lifecycle check for all tracked resources
   */
  private performLifecycleCheck(): void {
    const now = Date.now();
    let transitionCount = 0;

    for (const [key, state] of this.lifecycleStates.entries()) {
      const [resourceType, resourceId] = key.split(':');
      const policy = this.policies.get(resourceType);

      if (!policy) {
        continue; // No policy for this resource type
      }

      // Clean up old evicted resources (older than 7 days)
      if (state.phase === 'evicted') {
        const EVICTED_CLEANUP_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
        if (now - state.lastTransitionAt > EVICTED_CLEANUP_MS) {
          this.lifecycleStates.delete(key);
        }
        continue;
      }

      // Get last activity from ActivityTracker for sessions
      let lastActivityTime: number | null = null;
      if (resourceType === 'session') {
        const activity = activityTracker.getSessionActivity(resourceId as SessionId);
        if (activity) {
          lastActivityTime = new Date(activity.lastActivityAt).getTime();
        }
      }

      // If no activity data, use last transition time
      const referenceTime = lastActivityTime ?? state.lastTransitionAt;
      const inactiveDuration = now - referenceTime;

      // Determine target phase based on inactivity duration
      let targetPhase: LifecyclePhase = state.phase;

      if (inactiveDuration >= policy.expiringThresholdMs) {
        targetPhase = 'expiring';
      } else if (inactiveDuration >= policy.idleThresholdMs) {
        targetPhase = 'idle';
      } else {
        targetPhase = 'active';
      }

      // Transition if phase changed
      if (targetPhase !== state.phase) {
        this.transitionPhase(
          resourceType,
          resourceId,
          targetPhase,
          `inactivity-duration: ${Math.round(inactiveDuration / 1000)}s`
        );
        transitionCount++;
      }
    }

    if (transitionCount > 0) {
      telemetry.log('debug', 'lifecycleManager', `Lifecycle check complete: ${transitionCount} transitions`, {
        transitionCount,
        totalTracked: this.lifecycleStates.size,
      });
    }
  }

  /**
   * Remove a resource from lifecycle tracking
   */
  removeResource(resourceType: string, resourceId: string): void {
    const key = this.makeKey(resourceType, resourceId);
    this.lifecycleStates.delete(key);
    telemetry.log('debug', 'lifecycleManager', `Resource removed from lifecycle tracking: ${key}`);
  }

  /**
   * Get recent lifecycle events
   */
  getRecentEvents(limit?: number): LifecycleEvent[] {
    if (limit && limit > 0) {
      return this.lifecycleEvents.slice(-limit);
    }
    return [...this.lifecycleEvents];
  }

  /**
   * Get lifecycle events filtered by resource type
   */
  getEventsByResourceType(resourceType: string, limit?: number): LifecycleEvent[] {
    const filtered = this.lifecycleEvents.filter((e) => e.resourceType === resourceType);
    if (limit && limit > 0) {
      return filtered.slice(-limit);
    }
    return filtered;
  }

  /**
   * Make a unique key for a resource
   */
  private makeKey(resourceType: string, resourceId: string): string {
    return `${resourceType}:${resourceId}`;
  }
}

/**
 * Singleton lifecycle manager instance
 */
export const lifecycleManager = new LifecycleManager();
