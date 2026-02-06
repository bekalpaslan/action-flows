import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { Session } from '@afw/shared';
import type { WorkspaceEvent } from '@afw/shared';

export interface UseUserSessionsReturn {
  sessions: Session[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * React hook for managing user sessions
 *
 * Features:
 * - Fetches sessions from GET /api/users/:userId/sessions
 * - Auto-updates on WebSocket session events for this user
 * - Provides refresh capability
 * - Handles loading and error states
 */
export function useUserSessions(userId: string): UseUserSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const wsContext = useWebSocketContext();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch sessions for specific user from API
  const fetchSessions = useCallback(async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch sessions for user ${userId}: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Validate response structure
      if (!Array.isArray(data.sessions)) {
        throw new Error('Invalid sessions response structure');
      }

      // Map response to Session type
      const fetchedSessions: Session[] = data.sessions.map((session: any) => ({
        id: session.id,
        user: session.user,
        cwd: session.cwd,
        hostname: session.hostname,
        platform: session.platform,
        chains: session.chains || [],
        currentChain: session.currentChain,
        status: session.status || 'pending',
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.duration,
        endReason: session.endReason,
        summary: session.summary,
        totalStepsExecuted: session.totalStepsExecuted,
        totalChainsCompleted: session.totalChainsCompleted,
        criticalErrors: session.criticalErrors,
        metadata: session.metadata,
      }));

      setSessions(fetchedSessions);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error(`Error fetching sessions for user ${userId}:`, err);
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Handle WebSocket session events for this user
  const handleSessionEvent = useCallback(
    (event: WorkspaceEvent) => {
      // Only process events for this user
      if (
        event.type === 'session:started' ||
        event.type === 'session:updated' ||
        event.type === 'session:ended'
      ) {
        const sessionData = event.data as any;
        const sessionUserId = sessionData.user || sessionData.userId;

        // Check if this event is for our user
        if (sessionUserId === userId) {
          setSessions((prevSessions) => {
            const existingIndex = prevSessions.findIndex(
              (s) => s.id === sessionData.id
            );

            if (event.type === 'session:started' && existingIndex === -1) {
              // Add new session
              return [
                ...prevSessions,
                {
                  id: sessionData.id,
                  user: sessionUserId,
                  cwd: sessionData.cwd || '',
                  hostname: sessionData.hostname,
                  platform: sessionData.platform,
                  chains: [],
                  status: 'pending',
                  startedAt: sessionData.startedAt || new Date().toISOString(),
                  metadata: sessionData.metadata,
                },
              ];
            } else if (
              (event.type === 'session:updated' ||
                event.type === 'session:ended') &&
              existingIndex >= 0
            ) {
              // Update existing session
              const updated = [...prevSessions];
              updated[existingIndex] = {
                ...updated[existingIndex],
                ...sessionData,
                user: sessionUserId,
              };
              return updated;
            }

            return prevSessions;
          });
        }
      }
    },
    [userId]
  );

  // Subscribe to WebSocket events
  useEffect(() => {
    if (wsContext.onEvent) {
      const unsubscribe = wsContext.onEvent(handleSessionEvent);
      return unsubscribe;
    }
  }, [wsContext, handleSessionEvent]);

  // Initial fetch
  useEffect(() => {
    fetchSessions();

    return () => {
      // Cancel pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refresh: fetchSessions,
  };
}
