import { useEffect, useState, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { WorkspaceEvent, SessionId } from '@afw/shared';

/**
 * Hook to subscribe to and manage events for a specific session
 *
 * Features:
 * - Auto-subscribe on mount, auto-unsubscribe on unmount
 * - Maintain local event history
 * - Optional event type filtering
 * - Type-safe event filtering
 */
export function useEvents(
  sessionId: SessionId,
  eventTypes?: string[]
): WorkspaceEvent[] {
  const { subscribe, unsubscribe, onEvent } = useWebSocketContext();
  const [events, setEvents] = useState<WorkspaceEvent[]>([]);

  // Subscribe to events when hook mounts
  useEffect(() => {
    subscribe(sessionId);

    return () => {
      unsubscribe(sessionId);
    };
  }, [sessionId, subscribe, unsubscribe]);

  // Register event callback
  useEffect(() => {
    if (!onEvent) return;

    const handleEvent = (event: WorkspaceEvent) => {
      // Filter by session ID
      if (event.sessionId !== sessionId) {
        return;
      }

      // Filter by event types if specified
      if (eventTypes && !eventTypes.includes(event.type)) {
        return;
      }

      setEvents((prevEvents) => [...prevEvents, event]);
    };

    const unregister = onEvent(handleEvent);

    // Cleanup: unregister callback when component unmounts or dependencies change
    return () => {
      unregister();
    };
  }, [sessionId, eventTypes, onEvent]);

  return events;
}

/**
 * Hook to get the most recent event of a specific type
 */
export function useLatestEvent(
  sessionId: SessionId,
  eventType: string
): WorkspaceEvent | null {
  const events = useEvents(sessionId, [eventType]);
  return events.length > 0 ? events[events.length - 1] : null;
}

/**
 * Hook to filter events by a predicate function
 */
export function useFilteredEvents(
  sessionId: SessionId,
  predicate: (event: WorkspaceEvent) => boolean
): WorkspaceEvent[] {
  const events = useEvents(sessionId);
  return events.filter(predicate);
}

/**
 * Hook to get event statistics for a session
 */
export interface EventStats {
  total: number;
  byType: Record<string, number>;
  lastEventTime: string | null;
}

export function useEventStats(sessionId: SessionId): EventStats {
  const events = useEvents(sessionId);

  const stats: EventStats = {
    total: events.length,
    byType: {},
    lastEventTime: null,
  };

  events.forEach((event) => {
    stats.byType[event.type] = (stats.byType[event.type] ?? 0) + 1;
    if (!stats.lastEventTime || event.timestamp > stats.lastEventTime) {
      stats.lastEventTime = event.timestamp;
    }
  });

  return stats;
}
