/**
 * Activity-Aware TTL Tracker
 * Extends session TTLs when activity is detected (events, inputs, step progress)
 *
 * Philosophy:
 * - Chain execution lives in event-time, TTLs live in wall-clock time
 * - Long-running chains shouldn't expire mid-execution
 * - Automatic TTL extension when activity is detected
 * - Max 4 extensions (48h total from initial 24h)
 */

import type { SessionId, Timestamp } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { telemetry } from './telemetry.js';
import { storage } from '../storage/index.js';

/**
 * Activity type categories
 */
export type ActivityType = 'event' | 'input' | 'step_progress';

/**
 * TTL extension configuration
 */
const INACTIVE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const TTL_EXTENSION_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_EXTENSIONS = 4; // Max 4 extensions = 24h + (6h × 4) = 48h total

/**
 * Activity metadata for a session
 */
interface ActivityMetadata {
  lastActivityAt: number; // Timestamp in milliseconds
  extensionCount: number; // Number of TTL extensions applied
  activityType: string; // Last activity type
  lastExtensionAt: number; // When the last TTL extension was applied
}

/**
 * ActivityTracker Service
 * Tracks session activity and extends TTLs automatically
 */
class ActivityTracker {
  private activityMap: Map<string, ActivityMetadata> = new Map();

  /**
   * Track activity for a session and extend TTL if needed
   */
  trackActivity(sessionId: SessionId, activityType: ActivityType): void {
    const now = Date.now();
    const existing = this.activityMap.get(sessionId);

    // Initialize or update activity metadata
    if (!existing) {
      this.activityMap.set(sessionId, {
        lastActivityAt: now,
        extensionCount: 0,
        activityType,
        lastExtensionAt: 0,
      });
      telemetry.log('debug', 'activityTracker', `Activity tracking started for session ${sessionId}`, {
        activityType,
        sessionId,
      });
    } else {
      // Update last activity
      existing.lastActivityAt = now;
      existing.activityType = activityType;

      // Check if TTL extension is needed
      this.checkAndExtendTtl(sessionId, existing);
    }
  }

  /**
   * Check if session needs TTL extension and extend if eligible
   */
  private checkAndExtendTtl(sessionId: SessionId, metadata: ActivityMetadata): void {
    // Check if we've hit max extensions
    if (metadata.extensionCount >= MAX_EXTENSIONS) {
      telemetry.log('debug', 'activityTracker', `Session ${sessionId} has reached max TTL extensions (${MAX_EXTENSIONS})`, {
        sessionId,
        extensionCount: metadata.extensionCount,
      });
      return;
    }

    // Only extend if enough time has passed since the last extension
    // Spread extensions over time: require at least 1 hour between extensions
    const MIN_EXTENSION_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    const now = Date.now();
    if (metadata.lastExtensionAt > 0 && (now - metadata.lastExtensionAt) < MIN_EXTENSION_INTERVAL_MS) {
      return; // Too soon since last extension
    }

    // Extend TTL for this session
    const newExtensionCount = metadata.extensionCount + 1;
    metadata.extensionCount = newExtensionCount;
    metadata.lastExtensionAt = now;

    // Call storage to extend TTL
    if (storage.extendSessionTtl) {
      // Async storage (Redis)
      Promise.resolve(storage.extendSessionTtl(sessionId, TTL_EXTENSION_MS))
        .then(() => {
          telemetry.log('info', 'activityTracker', `TTL extended for session ${sessionId}`, {
            sessionId,
            extensionMs: TTL_EXTENSION_MS,
            extensionCount: newExtensionCount,
            maxExtensions: MAX_EXTENSIONS,
            totalTtlHours: 24 + (newExtensionCount * 6),
          });
        })
        .catch((error) => {
          telemetry.log('error', 'activityTracker', `Failed to extend TTL for session ${sessionId}`, {
            sessionId,
            error: String(error),
          });
        });
    } else {
      telemetry.log('warn', 'activityTracker', 'Storage does not support TTL extension', { sessionId });
    }

    // Update session metadata
    this.updateSessionMetadata(sessionId, metadata);
  }

  /**
   * Update session object with activity metadata
   */
  private async updateSessionMetadata(sessionId: SessionId, metadata: ActivityMetadata): Promise<void> {
    try {
      const session = await Promise.resolve(storage.getSession(sessionId));
      if (session) {
        session.lastActivityAt = brandedTypes.timestamp(new Date(metadata.lastActivityAt).toISOString());
        session.activityTtlExtensions = metadata.extensionCount;
        await Promise.resolve(storage.setSession(session));
      }
    } catch (error) {
      telemetry.log('error', 'activityTracker', `Failed to update session metadata for ${sessionId}`, {
        sessionId,
        error: String(error),
      });
    }
  }

  /**
   * Check if a session is active (has activity within threshold)
   */
  isSessionActive(sessionId: SessionId, inactiveThresholdMs: number = INACTIVE_THRESHOLD_MS): boolean {
    const metadata = this.activityMap.get(sessionId);
    if (!metadata) return false;

    const now = Date.now();
    const inactiveDuration = now - metadata.lastActivityAt;
    return inactiveDuration < inactiveThresholdMs;
  }

  /**
   * Get sessions that are inactive (no activity within threshold)
   */
  getInactiveSessions(inactiveThresholdMs: number): SessionId[] {
    const now = Date.now();
    const inactive: SessionId[] = [];

    for (const [sessionId, metadata] of this.activityMap.entries()) {
      const inactiveDuration = now - metadata.lastActivityAt;
      if (inactiveDuration >= inactiveThresholdMs) {
        inactive.push(sessionId as SessionId);
      }
    }

    return inactive;
  }

  /**
   * Get activity metadata for a session
   */
  getSessionActivity(sessionId: SessionId): { lastActivityAt: Timestamp; extensionCount: number } | null {
    const metadata = this.activityMap.get(sessionId);
    if (!metadata) return null;

    return {
      lastActivityAt: brandedTypes.timestamp(new Date(metadata.lastActivityAt).toISOString()),
      extensionCount: metadata.extensionCount,
    };
  }

  /**
   * Remove session from activity tracking
   */
  removeSession(sessionId: SessionId): void {
    this.activityMap.delete(sessionId);
    telemetry.log('debug', 'activityTracker', `Session removed from activity tracking: ${sessionId}`, { sessionId });
  }
}

/**
 * Singleton activity tracker instance
 */
export const activityTracker = new ActivityTracker();
