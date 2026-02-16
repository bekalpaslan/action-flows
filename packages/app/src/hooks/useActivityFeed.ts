import { useState, useEffect } from 'react';
import { useEvents } from './useEvents';
import type { SessionId, WorkspaceEvent } from '@afw/shared';
import type { ActivityItem } from '../components/shared/ActivityFeed/ActivityFeed';

/**
 * useActivityFeed Hook
 *
 * Transforms WebSocket events into ActivityItem format for the ActivityFeed component.
 * Automatically subscribes to session events and maintains a sorted activity list.
 *
 * @param sessionId - Optional session ID to filter events. If not provided, shows all events.
 * @returns Object containing activity items and loading state
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { items, isLoading } = useActivityFeed('session-123');
 *   return <ActivityFeed items={items} />;
 * }
 * ```
 */
export function useActivityFeed(sessionId?: SessionId): {
  items: ActivityItem[];
  isLoading: boolean;
} {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to events for this session
  // Always call hook (Rules of Hooks) — pass empty string if no sessionId
  const events = useEvents(sessionId || ('' as SessionId));

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    // Transform events into activity items
    const activityItems: ActivityItem[] = events
      .map((event: WorkspaceEvent): ActivityItem | null => {
        // Session events
        if (event.type === 'session:started') {
          return {
            id: `${event.eventId || event.sessionId}-${event.timestamp}`,
            type: 'session',
            title: 'Session Started',
            description: event.cwd || undefined,
            timestamp: event.timestamp,
          };
        }

        if (event.type === 'session:ended') {
          return {
            id: `${event.eventId || event.sessionId}-${event.timestamp}`,
            type: 'session',
            title: 'Session Ended',
            description: event.summary || event.reason || undefined,
            timestamp: event.timestamp,
          };
        }

        // Chain events
        if (event.type === 'chain:compiled') {
          return {
            id: `${event.eventId || event.sessionId}-${event.timestamp}`,
            type: 'chain',
            title: 'Chain Compiled',
            description: event.title || `${event.totalSteps || 0} steps`,
            timestamp: event.timestamp,
          };
        }

        if (event.type === 'chain:started') {
          return {
            id: `${event.eventId || event.sessionId}-${event.timestamp}`,
            type: 'chain',
            title: 'Chain Started',
            description: event.title || `Chain ${event.chainId}`,
            timestamp: event.timestamp,
          };
        }

        if (event.type === 'chain:completed') {
          return {
            id: `${event.eventId || event.sessionId}-${event.timestamp}`,
            type: 'chain',
            title: 'Chain Completed',
            description: `Duration: ${Math.round((event.duration || 0) / 1000)}s`,
            timestamp: event.timestamp,
          };
        }

        if (event.type === 'chain:failed') {
          return {
            id: `${event.eventId || event.sessionId}-${event.timestamp}`,
            type: 'chain',
            title: 'Chain Failed',
            description: event.reason || undefined,
            timestamp: event.timestamp,
          };
        }

        // Step events
        if (event.type === 'step:started') {
          return {
            id: `${event.eventId || event.sessionId}-${event.timestamp}`,
            type: 'step',
            title: `Step ${event.stepNumber} Started`,
            description: event.action || undefined,
            timestamp: event.timestamp,
          };
        }

        if (event.type === 'step:completed') {
          return {
            id: `${event.eventId || event.sessionId}-${event.timestamp}`,
            type: 'step',
            title: `Step ${event.stepNumber} Completed`,
            description: event.action || undefined,
            timestamp: event.timestamp,
          };
        }

        if (event.type === 'step:failed') {
          return {
            id: `${event.eventId || event.sessionId}-${event.timestamp}`,
            type: 'step',
            title: `Step ${event.stepNumber} Failed`,
            description: event.error || undefined,
            timestamp: event.timestamp,
          };
        }

        // Learning events
        if (event.type === 'learning:surfaced') {
          return {
            id: `${event.eventId || event.sessionId}-${event.timestamp}`,
            type: 'learning',
            title: 'Learning Surfaced',
            description: event.issue || undefined,
            timestamp: event.timestamp,
          };
        }

        // Generic notification fallback for unknown events
        return {
          id: `${event.eventId || event.sessionId}-${event.timestamp}`,
          type: 'notification',
          title: event.type.replace(/:/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          description: undefined,
          timestamp: event.timestamp,
        };
      })
      .filter((item): item is ActivityItem => item !== null);

    // Sort by timestamp descending (most recent first)
    const sortedItems = activityItems.sort((a, b) => {
      const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp) : a.timestamp;
      const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp) : b.timestamp;
      return timeB.getTime() - timeA.getTime();
    });

    // Limit to last 50 items
    const limitedItems = sortedItems.slice(0, 50);

    setItems(limitedItems);
    setIsLoading(false);
  }, [events, sessionId]);

  return { items, isLoading };
}
