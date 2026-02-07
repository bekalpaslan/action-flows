/**
 * useClaudeCliSessions hook
 * Manages Claude CLI sessions with WebSocket event tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { claudeCliService } from '../services/claudeCliService';
import type { ClaudeCliSession, SessionId, ClaudeCliStartedEvent, ClaudeCliExitedEvent, WorkspaceEvent } from '@afw/shared';

export interface UseClaudeCliSessionsReturn {
  sessions: Map<SessionId, ClaudeCliSession>;
  startSession: (sessionId: SessionId, cwd: string, prompt?: string, flags?: string[]) => Promise<void>;
  stopSession: (sessionId: SessionId) => Promise<void>;
  getSession: (sessionId: SessionId) => ClaudeCliSession | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for managing Claude CLI sessions
 */
export function useClaudeCliSessions(): UseClaudeCliSessionsReturn {
  const [sessions, setSessions] = useState<Map<SessionId, ClaudeCliSession>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { onEvent } = useWebSocketContext();

  // Listen for Claude CLI events
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribe = onEvent((event: WorkspaceEvent) => {
      // Handle Claude CLI started event
      if (event.type === 'claude-cli:started') {
        const startedEvent = event as ClaudeCliStartedEvent;
        setSessions(prev => {
          const next = new Map(prev);
          const existing = next.get(startedEvent.sessionId);
          next.set(startedEvent.sessionId, {
            id: startedEvent.sessionId,
            pid: startedEvent.pid,
            status: 'running',
            cwd: startedEvent.cwd,
            startedAt: startedEvent.timestamp,
            spawnArgs: startedEvent.args,
            metadata: {
              prompt: startedEvent.prompt || undefined,
            },
          });
          return next;
        });
      }

      // Handle Claude CLI exited event
      if (event.type === 'claude-cli:exited') {
        const exitedEvent = event as ClaudeCliExitedEvent;
        setSessions(prev => {
          const next = new Map(prev);
          const session = next.get(exitedEvent.sessionId);
          if (session) {
            next.set(exitedEvent.sessionId, {
              ...session,
              status: 'stopped',
              exitCode: exitedEvent.exitCode ?? undefined,
              exitSignal: exitedEvent.exitSignal ?? undefined,
              endedAt: exitedEvent.timestamp,
            });
          }
          return next;
        });
      }
    });

    return unsubscribe;
  }, [onEvent]);

  // Start a new Claude CLI session
  const startSession = useCallback(async (
    sessionId: SessionId,
    cwd: string,
    prompt?: string,
    flags?: string[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await claudeCliService.startSession(sessionId, cwd, prompt, flags);
      // Session will be added via WebSocket event
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start Claude CLI session');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop a Claude CLI session
  const stopSession = useCallback(async (sessionId: SessionId) => {
    setIsLoading(true);
    setError(null);

    try {
      await claudeCliService.stopSession(sessionId);
      // Session will be updated via WebSocket event
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop Claude CLI session');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a session by ID
  const getSession = useCallback((sessionId: SessionId): ClaudeCliSession | undefined => {
    return sessions.get(sessionId);
  }, [sessions]);

  return {
    sessions,
    startSession,
    stopSession,
    getSession,
    isLoading,
    error,
  };
}
