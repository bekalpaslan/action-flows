import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { useAllSessions } from './useAllSessions';
import type { Session, SessionId, WorkspaceEvent } from '@afw/shared';

export interface UseSessionSidebarResult {
  /** Whether the sidebar is expanded */
  isExpanded: boolean;

  /** Set the expanded state */
  setIsExpanded: (expanded: boolean) => void;

  /** Sessions currently in progress */
  activeSessions: Session[];

  /** Recent sessions sorted by startedAt descending, limited to 10 */
  recentSessions: Session[];

  /** Notification counts per session ID */
  notificationCounts: Map<string, number>;

  /** Attach a session to the current workbench */
  attachSession: (sessionId: SessionId) => void;

  /** Clear notifications for a specific session */
  clearNotifications: (sessionId: SessionId) => void;
}

/**
 * React hook for managing session sidebar state and interactions
 *
 * Features:
 * - Expand/collapse state with hover debouncing (200ms)
 * - Recent sessions (top 10, sorted by startedAt descending)
 * - Active sessions (status: in_progress)
 * - Per-session notification counts (from WebSocket events)
 * - Session attach handler
 *
 * @param onAttachSession - Callback to attach a session to the current workbench
 */
export function useSessionSidebar(
  onAttachSession?: (sessionId: SessionId) => void
): UseSessionSidebarResult {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState<Map<string, number>>(
    new Map()
  );
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { sessions } = useAllSessions();
  const wsContext = useWebSocketContext();

  // Compute active sessions (status: in_progress)
  const activeSessions = useMemo(() => {
    return sessions.filter((session) => session.status === 'in_progress');
  }, [sessions]);

  // Compute recent sessions (sorted by startedAt descending, limit 10)
  const recentSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => {
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bTime - aTime; // Descending
    });
    return sorted.slice(0, 10);
  }, [sessions]);

  // Debounced expand state handler (uses ref for stable callback)
  const setExpandedWithDebounce = useCallback((expanded: boolean) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(expanded);
    }, 200); // 200ms delay to prevent flicker
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle WebSocket events for notifications
  const handleEvent = useCallback((event: WorkspaceEvent) => {
    // Increment notification count for events that should notify the user
    const notifiableEvents = [
      'chain:compiled',
      'chain:completed',
      'step:completed',
      'step:failed',
      'error:occurred',
      'warning:occurred',
      'awaiting:input',
    ];

    if (notifiableEvents.includes(event.type)) {
      setNotificationCounts((prev) => {
        const next = new Map(prev);
        const sessionId = event.sessionId as string;
        const currentCount = next.get(sessionId) || 0;
        next.set(sessionId, currentCount + 1);
        return next;
      });
    }

    // Clear notifications when session ends
    if (event.type === 'session:ended') {
      setNotificationCounts((prev) => {
        const next = new Map(prev);
        next.delete(event.sessionId as string);
        return next;
      });
    }
  }, []);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (wsContext.onEvent) {
      const unsubscribe = wsContext.onEvent(handleEvent);
      return unsubscribe;
    }
  }, [wsContext, handleEvent]);

  // Attach session handler
  const attachSession = useCallback(
    (sessionId: SessionId) => {
      // Clear notifications for this session
      setNotificationCounts((prev) => {
        const next = new Map(prev);
        next.delete(sessionId as string);
        return next;
      });

      // Call the provided attach callback
      if (onAttachSession) {
        onAttachSession(sessionId);
      }
    },
    [onAttachSession]
  );

  // Clear notifications for a specific session
  const clearNotifications = useCallback((sessionId: SessionId) => {
    setNotificationCounts((prev) => {
      const next = new Map(prev);
      next.delete(sessionId as string);
      return next;
    });
  }, []);

  return {
    isExpanded,
    setIsExpanded: setExpandedWithDebounce,
    activeSessions,
    recentSessions,
    notificationCounts,
    attachSession,
    clearNotifications,
  };
}
