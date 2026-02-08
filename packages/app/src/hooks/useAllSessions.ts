import { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { Session, WorkspaceEvent } from '@afw/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface UseAllSessionsReturn {
  /** All sessions from all users */
  sessions: Session[];

  /** Loading state */
  loading: boolean;

  /** Error if any */
  error: Error | null;

  /** Refresh sessions */
  refresh: () => void;
}

/**
 * React hook for managing all sessions across all users
 *
 * Features:
 * - Fetches all sessions from GET /api/sessions
 * - Auto-updates on WebSocket session events
 * - Provides refresh capability
 */
export function useAllSessions(): UseAllSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const wsContext = useWebSocketContext();

  // Fetch all sessions from API
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!Array.isArray(data.sessions)) {
        throw new Error('Invalid sessions response structure');
      }

      interface SessionResponse {
        id: string;
        user?: string;
        cwd?: string;
        hostname?: string;
        platform?: string;
        chains?: any[];
        currentChain?: any;
        status?: string;
        startedAt?: string;
        endedAt?: string;
        duration?: number;
        endReason?: string;
        summary?: string;
        totalStepsExecuted?: number;
        totalChainsCompleted?: number;
        criticalErrors?: number;
        metadata?: any;
      }

      const fetchedSessions: Session[] = data.sessions.map((session: SessionResponse) => ({
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
      console.error('Error fetching all sessions:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle WebSocket session events
  const handleSessionEvent = useCallback((event: WorkspaceEvent) => {
    if (
      event.type === 'session:started' ||
      event.type === 'session:updated' ||
      event.type === 'session:ended'
    ) {
      interface SessionEventData {
        id: string;
        user?: string;
        userId?: string;
        cwd?: string;
        hostname?: string;
        platform?: string;
        status?: string;
        startedAt?: string;
        endedAt?: string;
        duration?: number;
        endReason?: string;
        summary?: string;
        metadata?: any;
        [key: string]: any;
      }
      const sessionData = event.data as SessionEventData;

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
              user: sessionData.user || sessionData.userId,
              cwd: sessionData.cwd || '',
              hostname: sessionData.hostname,
              platform: sessionData.platform,
              chains: [],
              status: 'pending',
              startedAt: sessionData.startedAt || new Date().toISOString(),
              metadata: sessionData.metadata,
            } as Session,
          ];
        } else if (
          (event.type === 'session:updated' || event.type === 'session:ended') &&
          existingIndex >= 0
        ) {
          // Update existing session
          const updated = [...prevSessions];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...sessionData,
            user: sessionData.user || sessionData.userId,
          };
          return updated;
        }

        return prevSessions;
      });
    }
  }, []);

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
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refresh: fetchSessions,
  };
}
