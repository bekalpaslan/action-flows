import { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { Session, SessionWindowConfig, SessionId } from '@afw/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface EnrichedSessionWindow {
  session: Session;
  currentChain?: import('@afw/shared').Chain;
  chainsCount: number;
}

/**
 * CLI binding state
 */
export interface CliBinding {
  sessionId: SessionId;
  cliSessionId: SessionId;
  mode: 'attached' | 'standalone';
}

/**
 * useSessionWindows hook
 *
 * Manages followed sessions and session window state
 */
export function useSessionWindows() {
  const [followedSessionIds, setFollowedSessionIds] = useState<string[]>([]);
  const [sessionWindows, setSessionWindows] = useState<EnrichedSessionWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cliBindings, setCliBindings] = useState<Map<SessionId, CliBinding>>(new Map());

  const { status, onEvent } = useWebSocketContext();
  const wsConnected = status === 'connected';

  // Fetch followed sessions
  const fetchFollowedSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/session-windows`);
      if (!response.ok) {
        throw new Error('Failed to fetch session windows');
      }
      const data = await response.json();
      setSessionWindows(data.sessionWindows || []);
      setFollowedSessionIds(
        data.sessionWindows?.map((sw: EnrichedSessionWindow) => sw.session.id) || []
      );
      setError(null);
    } catch (err) {
      console.error('[useSessionWindows] Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Follow a session
  const followSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/session-windows/${sessionId}/follow`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to follow session');
      }
      setFollowedSessionIds((prev) => [...prev, sessionId]);
      await fetchFollowedSessions();
    } catch (err) {
      console.error('[useSessionWindows] Error following session:', err);
      setError(err instanceof Error ? err.message : 'Failed to follow session');
    }
  }, [fetchFollowedSessions]);

  // Unfollow a session
  const unfollowSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/session-windows/${sessionId}/follow`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to unfollow session');
      }
      setFollowedSessionIds((prev) => prev.filter((id) => id !== sessionId));
      setSessionWindows((prev) =>
        prev.filter((sw) => sw.session.id !== sessionId)
      );
    } catch (err) {
      console.error('[useSessionWindows] Error unfollowing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to unfollow session');
    }
  }, []);

  // Update session window config
  const updateConfig = useCallback(async (
    sessionId: string,
    config: Partial<SessionWindowConfig>
  ) => {
    try {
      const response = await fetch(`${API_BASE}/api/session-windows/${sessionId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error('Failed to update config');
      }
    } catch (err) {
      console.error('[useSessionWindows] Error updating config:', err);
      setError(err instanceof Error ? err.message : 'Failed to update config');
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFollowedSessions();
  }, [fetchFollowedSessions]);

  // Attach CLI to session
  const attachCliToSession = useCallback((sessionId: SessionId, cliSessionId: SessionId) => {
    const binding: CliBinding = {
      sessionId,
      cliSessionId,
      mode: 'attached',
    };

    setCliBindings(prev => new Map(prev).set(sessionId, binding));
  }, []);

  // Detach CLI from session
  const detachCliFromSession = useCallback((sessionId: SessionId) => {
    setCliBindings(prev => {
      const next = new Map(prev);
      next.delete(sessionId);
      return next;
    });
  }, []);

  // Get CLI binding for a session
  const getCliBinding = useCallback((sessionId: SessionId): CliBinding | undefined => {
    return cliBindings.get(sessionId);
  }, [cliBindings]);

  // Listen for WebSocket events and update session windows
  useEffect(() => {
    if (!wsConnected || !onEvent) return;

    const unsubscribe = onEvent((event) => {
      // Update session window if event belongs to followed session
      if (followedSessionIds.includes(event.sessionId)) {
        // Refresh followed sessions to get latest data
        fetchFollowedSessions();
      }
    });

    return unsubscribe;
  }, [followedSessionIds, wsConnected, onEvent, fetchFollowedSessions]);

  return {
    followedSessionIds,
    sessionWindows,
    loading,
    error,
    followSession,
    unfollowSession,
    updateConfig,
    refresh: fetchFollowedSessions,
    // CLI binding methods
    cliBindings,
    attachCliToSession,
    detachCliFromSession,
    getCliBinding,
  };
}
