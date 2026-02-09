/**
 * Hierarchical Notification Types
 *
 * Provides types for the notification system that propagates events
 * from steps -> chains -> sessions -> workbenches with visual glow effects.
 */

import type { SessionId, ChainId, StepId } from './types.js';
import type { WorkbenchId } from './workbenchTypes.js';

// ============================================================================
// Notification Level & Source
// ============================================================================

/**
 * Severity level of a notification
 */
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

/**
 * Where the notification originated in the hierarchy
 */
export type NotificationSource =
  | 'session'    // Session-level events (start, end, state changes)
  | 'chain'      // Chain-level events (compiled, started, completed)
  | 'step'       // Step-level events (spawned, completed, failed)
  | 'system'     // System-level events (connection, configuration)
  | 'websocket'; // WebSocket connection events

// ============================================================================
// Notification Event
// ============================================================================

/**
 * A notification event that can propagate through the hierarchy
 */
export interface NotificationEvent {
  /** Unique identifier for this notification */
  id: string;

  /** Severity level */
  level: NotificationLevel;

  /** Source layer in the hierarchy */
  source: NotificationSource;

  /** Associated session (if applicable) */
  sessionId?: SessionId;

  /** Associated chain (if applicable) */
  chainId?: ChainId;

  /** Associated step (if applicable) */
  stepId?: StepId;

  /** Target workbench for routing */
  workbenchId?: WorkbenchId;

  /** Human-readable message */
  message: string;

  /** Unix timestamp (milliseconds) when notification was created */
  timestamp: number;

  /** Whether the user has seen/acknowledged this notification */
  read: boolean;

  /** Whether the user has explicitly dismissed this notification */
  dismissed: boolean;

  /** Optional metadata for custom handling */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Propagation Path
// ============================================================================

/**
 * Describes how a notification propagates from source to workbench
 * Used for visual glow effects that indicate notification origin
 */
export interface PropagationPath {
  /** Source session ID (optional - system notifications may not have one) */
  fromSessionId?: SessionId;

  /** Source chain ID (optional - session-level notifications may not have one) */
  fromChainId?: ChainId;

  /** Source step ID (optional - only step-level notifications have this) */
  fromStepId?: StepId;

  /** Target workbench where notification bubbles up to */
  toWorkbenchId: WorkbenchId;

  /**
   * Visual glow intensity (0-1)
   * Higher = more urgent/severe notification
   * Maps to CSS opacity/animation speed
   */
  glowIntensity: number;

  /**
   * Color hint for the glow effect
   * Derived from notification level
   */
  glowColor?: string;
}

// ============================================================================
// Notification State
// ============================================================================

/**
 * Aggregated notification counts for tracking unread notifications
 * across the hierarchy
 */
export interface NotificationState {
  /** Count of unread notifications per session */
  bySession: Record<string, number>;

  /** Count of unread notifications per workbench */
  byWorkbench: Record<string, number>;

  /** Total unread notifications across all sources */
  unreadCount: number;

  /** Highest severity level among unread notifications */
  maxLevel?: NotificationLevel;
}

// ============================================================================
// Notification Helpers
// ============================================================================

/**
 * Default glow colors for each notification level
 */
export const NOTIFICATION_GLOW_COLORS: Record<NotificationLevel, string> = {
  info: '#3b82f6',    // Blue (synced with GlowIndicator.css)
  success: '#10b981', // Green (synced with GlowIndicator.css)
  warning: '#f59e0b', // Amber (synced with GlowIndicator.css)
  error: '#ef4444',   // Red (synced with GlowIndicator.css)
};

/**
 * Default glow intensities for each notification level
 */
export const NOTIFICATION_GLOW_INTENSITIES: Record<NotificationLevel, number> = {
  info: 0.3,
  success: 0.5,
  warning: 0.7,
  error: 1.0,
};

/**
 * Create a new notification event
 */
export function createNotification(
  params: Omit<NotificationEvent, 'id' | 'timestamp' | 'read' | 'dismissed'>
): NotificationEvent {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    read: false,
    dismissed: false,
    ...params,
  };
}

/**
 * Create a propagation path for a notification
 */
export function createPropagationPath(
  notification: NotificationEvent,
  toWorkbenchId: WorkbenchId
): PropagationPath {
  return {
    fromSessionId: notification.sessionId,
    fromChainId: notification.chainId,
    fromStepId: notification.stepId,
    toWorkbenchId,
    glowIntensity: NOTIFICATION_GLOW_INTENSITIES[notification.level],
    glowColor: NOTIFICATION_GLOW_COLORS[notification.level],
  };
}

/**
 * Calculate aggregated notification state from a list of notifications
 */
export function aggregateNotificationState(
  notifications: NotificationEvent[]
): NotificationState {
  const state: NotificationState = {
    bySession: {},
    byWorkbench: {},
    unreadCount: 0,
    maxLevel: undefined,
  };

  const levelPriority: Record<NotificationLevel, number> = {
    info: 0,
    success: 1,
    warning: 2,
    error: 3,
  };

  for (const notif of notifications) {
    if (notif.read || notif.dismissed) continue;

    state.unreadCount++;

    if (notif.sessionId) {
      state.bySession[notif.sessionId] = (state.bySession[notif.sessionId] || 0) + 1;
    }

    if (notif.workbenchId) {
      state.byWorkbench[notif.workbenchId] = (state.byWorkbench[notif.workbenchId] || 0) + 1;
    }

    if (!state.maxLevel || levelPriority[notif.level] > levelPriority[state.maxLevel]) {
      state.maxLevel = notif.level;
    }
  }

  return state;
}
