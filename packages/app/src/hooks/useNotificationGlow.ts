/**
 * useNotificationGlow Hook
 *
 * Manages hierarchical notification glow propagation from events through
 * sessions to workbenches. Provides intensity-based glow effects based
 * on notification severity and read/dismissed status.
 *
 * Propagation flow:
 *   Event arrives with sessionId -> session glows
 *   Session maps to workbench -> workbench tab glows
 *   Higher severity = higher intensity
 *   Reading/dismissing reduces glow
 */

import { useState, useCallback, useMemo, useEffect, useContext, createContext } from 'react';
import type {
  NotificationEvent,
  NotificationLevel,
  NotificationState,
  PropagationPath,
  SessionId,
  WorkbenchId,
  WorkspaceEvent,
} from '@afw/shared';
import {
  NOTIFICATION_GLOW_COLORS,
  NOTIFICATION_GLOW_INTENSITIES,
  createNotification,
  aggregateNotificationState,
} from '@afw/shared';

// ============================================================================
// Constants
// ============================================================================

/** Maximum notifications to keep in state */
const MAX_NOTIFICATIONS = 100;

/** Level priority for calculating max severity */
const LEVEL_PRIORITY: Record<NotificationLevel, number> = {
  info: 0,
  success: 1,
  warning: 2,
  error: 3,
};

// ============================================================================
// Types
// ============================================================================

/** Glow state for a session or workbench */
export interface GlowState {
  /** Whether glow is currently active */
  active: boolean;
  /** Notification level driving the glow */
  level: NotificationLevel;
  /** Glow intensity (0-1) */
  intensity: number;
  /** Glow color (hex) */
  color: string;
}

/** Input for adding a new notification */
export type NotificationInput = Omit<NotificationEvent, 'id' | 'timestamp' | 'read' | 'dismissed'>;

/** Return type for the useNotificationGlow hook */
export interface UseNotificationGlowReturn {
  // State
  /** All notifications (newest first) */
  notifications: NotificationEvent[];
  /** Aggregated notification state */
  notificationState: NotificationState;

  // Session-level glow
  /** Get glow state for a specific session */
  getSessionGlow: (sessionId: SessionId) => GlowState;

  // Workbench-level glow
  /** Get glow state for a specific workbench */
  getWorkbenchGlow: (workbenchId: WorkbenchId) => GlowState;

  // Actions
  /** Add a new notification */
  addNotification: (notification: NotificationInput) => NotificationEvent;
  /** Mark a notification as read */
  markAsRead: (notificationId: string) => void;
  /** Dismiss a notification */
  dismissNotification: (notificationId: string) => void;
  /** Clear all notifications for a session */
  clearSessionNotifications: (sessionId: SessionId) => void;
  /** Clear all notifications for a workbench */
  clearWorkbenchNotifications: (workbenchId: WorkbenchId) => void;
  /** Get propagation path for a notification */
  getPropagationPath: (notification: NotificationEvent) => PropagationPath | null;
}

// ============================================================================
// Session-to-Workbench Mapping
// ============================================================================

/** Map of session IDs to their associated workbench */
const sessionWorkbenchMap = new Map<SessionId, WorkbenchId>();

/**
 * Register a session's workbench association
 * This should be called when a session is created/assigned to a workbench
 */
export function registerSessionWorkbench(sessionId: SessionId, workbenchId: WorkbenchId): void {
  sessionWorkbenchMap.set(sessionId, workbenchId);
}

/**
 * Unregister a session's workbench association
 */
export function unregisterSessionWorkbench(sessionId: SessionId): void {
  sessionWorkbenchMap.delete(sessionId);
}

/**
 * Get the workbench for a session, with fallback to 'work'
 */
function getWorkbenchForSession(sessionId: SessionId): WorkbenchId {
  return sessionWorkbenchMap.get(sessionId) ?? 'work';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate glow state from a list of notifications
 */
function calculateGlowState(notifications: NotificationEvent[]): GlowState {
  const unread = notifications.filter((n) => !n.read && !n.dismissed);

  if (unread.length === 0) {
    return {
      active: false,
      level: 'info',
      intensity: 0,
      color: NOTIFICATION_GLOW_COLORS.info,
    };
  }

  // Find highest severity
  let maxLevel: NotificationLevel = 'info';
  for (const notif of unread) {
    if (LEVEL_PRIORITY[notif.level] > LEVEL_PRIORITY[maxLevel]) {
      maxLevel = notif.level;
    }
  }

  // Calculate intensity based on count and severity
  // Base intensity from level + boost for multiple notifications
  const baseIntensity = NOTIFICATION_GLOW_INTENSITIES[maxLevel];
  const countBoost = Math.min(unread.length * 0.05, 0.2);
  const intensity = Math.min(baseIntensity + countBoost, 1.0);

  return {
    active: true,
    level: maxLevel,
    intensity,
    color: NOTIFICATION_GLOW_COLORS[maxLevel],
  };
}

/**
 * Check if a WebSocket event should generate a notification
 */
function shouldGenerateNotification(event: WorkspaceEvent): boolean {
  const notifiableTypes = [
    'step:failed',
    'step:completed',
    'chain:completed',
    'session:ended',
    'error:occurred',
    'warning:occurred',
  ];
  return notifiableTypes.includes(event.type);
}

/**
 * Convert a WebSocket event to notification input
 */
function eventToNotificationInput(event: WorkspaceEvent): NotificationInput | null {
  const base = {
    sessionId: 'sessionId' in event ? (event.sessionId as SessionId) : undefined,
    source: 'step' as const,
  };

  switch (event.type) {
    case 'step:failed':
      return {
        ...base,
        level: 'error',
        message: `Step failed: ${(event as { stepId?: string }).stepId ?? 'unknown'}`,
        chainId: (event as { chainId?: string }).chainId as unknown as import('@afw/shared').ChainId,
        stepId: (event as { stepId?: string }).stepId as unknown as import('@afw/shared').StepId,
      };

    case 'step:completed':
      return {
        ...base,
        level: 'success',
        message: `Step completed: ${(event as { stepId?: string }).stepId ?? 'unknown'}`,
        source: 'step',
        chainId: (event as { chainId?: string }).chainId as unknown as import('@afw/shared').ChainId,
        stepId: (event as { stepId?: string }).stepId as unknown as import('@afw/shared').StepId,
      };

    case 'chain:completed':
      return {
        ...base,
        level: 'success',
        message: `Chain completed: ${(event as { chainId?: string }).chainId ?? 'unknown'}`,
        source: 'chain',
        chainId: (event as { chainId?: string }).chainId as unknown as import('@afw/shared').ChainId,
      };

    case 'session:ended':
      return {
        ...base,
        level: 'info',
        message: 'Session ended',
        source: 'session',
      };

    case 'error:occurred':
      return {
        ...base,
        level: 'error',
        message: (event as { message?: string }).message ?? 'An error occurred',
        source: 'system',
      };

    case 'warning:occurred':
      return {
        ...base,
        level: 'warning',
        message: (event as { message?: string }).message ?? 'A warning occurred',
        source: 'system',
      };

    default:
      return null;
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing notification glow propagation
 *
 * @param wsContext - Optional WebSocket context for subscribing to events
 * @returns Notification glow state and actions
 *
 * @example
 * ```tsx
 * const { notifications, getSessionGlow, getWorkbenchGlow, addNotification } = useNotificationGlow();
 *
 * // Check if session has active glow
 * const sessionGlow = getSessionGlow(sessionId);
 * if (sessionGlow.active) {
 *   console.log(`Session glowing ${sessionGlow.color} at ${sessionGlow.intensity}`);
 * }
 *
 * // Check workbench tab glow
 * const workbenchGlow = getWorkbenchGlow('work');
 * if (workbenchGlow.active) {
 *   // Apply glow styling to tab
 * }
 * ```
 */
export function useNotificationGlow(
  wsContext?: {
    onEvent: ((callback: (event: WorkspaceEvent) => void) => () => void) | null;
  } | null
): UseNotificationGlowReturn {
  // State
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);

  // Subscribe to WebSocket events if context provided
  useEffect(() => {
    if (!wsContext?.onEvent) return;

    const unsubscribe = wsContext.onEvent((event: WorkspaceEvent) => {
      if (!shouldGenerateNotification(event)) return;

      const input = eventToNotificationInput(event);
      if (input) {
        const notification = createNotification(input);
        setNotifications((prev) => {
          const updated = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
          return updated;
        });
      }
    });

    return unsubscribe;
  }, [wsContext]);

  // Calculate aggregated state
  const notificationState = useMemo(
    () => aggregateNotificationState(notifications),
    [notifications]
  );

  // Get glow state for a session
  const getSessionGlow = useCallback(
    (sessionId: SessionId): GlowState => {
      const sessionNotifications = notifications.filter((n) => n.sessionId === sessionId);
      return calculateGlowState(sessionNotifications);
    },
    [notifications]
  );

  // Get glow state for a workbench
  const getWorkbenchGlow = useCallback(
    (workbenchId: WorkbenchId): GlowState => {
      const workbenchNotifications = notifications.filter((n) => {
        // Direct workbench assignment
        if (n.workbenchId === workbenchId) return true;

        // Session-based workbench mapping
        if (n.sessionId) {
          return getWorkbenchForSession(n.sessionId) === workbenchId;
        }

        return false;
      });
      return calculateGlowState(workbenchNotifications);
    },
    [notifications]
  );

  // Add notification
  const addNotification = useCallback((input: NotificationInput): NotificationEvent => {
    const notification = createNotification(input);

    // Auto-assign workbenchId from session if not provided
    if (!notification.workbenchId && notification.sessionId) {
      notification.workbenchId = getWorkbenchForSession(notification.sessionId);
    }

    setNotifications((prev) => {
      const updated = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
      return updated;
    });

    return notification;
  }, []);

  // Mark as read
  const markAsRead = useCallback((notificationId: string): void => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId: string): void => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, dismissed: true } : n))
    );
  }, []);

  // Clear session notifications
  const clearSessionNotifications = useCallback((sessionId: SessionId): void => {
    setNotifications((prev) =>
      prev.map((n) => (n.sessionId === sessionId ? { ...n, read: true, dismissed: true } : n))
    );
  }, []);

  // Clear workbench notifications
  const clearWorkbenchNotifications = useCallback((workbenchId: WorkbenchId): void => {
    setNotifications((prev) =>
      prev.map((n) => {
        const notifWorkbench = n.workbenchId ?? (n.sessionId ? getWorkbenchForSession(n.sessionId) : null);
        if (notifWorkbench === workbenchId) {
          return { ...n, read: true, dismissed: true };
        }
        return n;
      })
    );
  }, []);

  // Get propagation path for a notification
  const getPropagationPath = useCallback(
    (notification: NotificationEvent): PropagationPath | null => {
      const workbenchId =
        notification.workbenchId ??
        (notification.sessionId ? getWorkbenchForSession(notification.sessionId) : null);

      if (!workbenchId) return null;

      return {
        fromSessionId: notification.sessionId,
        fromChainId: notification.chainId,
        fromStepId: notification.stepId,
        toWorkbenchId: workbenchId,
        glowIntensity: NOTIFICATION_GLOW_INTENSITIES[notification.level],
        glowColor: NOTIFICATION_GLOW_COLORS[notification.level],
      };
    },
    []
  );

  return {
    notifications,
    notificationState,
    getSessionGlow,
    getWorkbenchGlow,
    addNotification,
    markAsRead,
    dismissNotification,
    clearSessionNotifications,
    clearWorkbenchNotifications,
    getPropagationPath,
  };
}

// ============================================================================
// Context (Optional)
// ============================================================================

/**
 * Context for sharing notification glow state across the component tree
 */
export const NotificationGlowContext = createContext<UseNotificationGlowReturn | null>(null);

/**
 * Hook to access the notification glow context
 * Must be used within a NotificationGlowProvider
 */
export function useNotificationGlowContext(): UseNotificationGlowReturn {
  const context = useContext(NotificationGlowContext);
  if (!context) {
    throw new Error('useNotificationGlowContext must be used within NotificationGlowProvider');
  }
  return context;
}

export default useNotificationGlow;
