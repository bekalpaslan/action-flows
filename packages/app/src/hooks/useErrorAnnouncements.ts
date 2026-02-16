import { useCallback, useEffect, useState } from 'react';
import type { ErrorInstance, SessionId, ErrorRecoveryAction } from '@afw/shared';
import { useWebSocketContext } from '../contexts/WebSocketContext';

/**
 * Hook for managing error announcements
 * Handles fetching, creating, dismissing, and recovering from errors
 */
export function useErrorAnnouncements(sessionId?: SessionId) {
  const [errors, setErrors] = useState<ErrorInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onEvent, send } = useWebSocketContext();

  // Fetch errors for a session
  const fetchErrors = useCallback(
    async (sid?: SessionId) => {
      if (!sid) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/errors/${sid}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch errors: ${response.statusText}`);
        }
        const data = await response.json();
        setErrors(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useErrorAnnouncements] Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch errors when session changes
  useEffect(() => {
    if (sessionId) {
      fetchErrors(sessionId);
    }
  }, [sessionId, fetchErrors]);

  // Listen for error:occurred events via WebSocket context
  useEffect(() => {
    if (!onEvent || !sessionId) return;

    return onEvent((event: any) => {
      if (event.type === 'error:occurred' && event.sessionId === sessionId) {
        fetchErrors(sessionId);
      }
    });
  }, [onEvent, sessionId, fetchErrors]);

  // Dismiss an error
  const dismissError = useCallback(
    async (errorId: string) => {
      try {
        const response = await fetch(`/api/errors/${errorId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dismissed: true }),
        });

        if (!response.ok) {
          throw new Error(`Failed to dismiss error: ${response.statusText}`);
        }

        // Update local state
        setErrors(prev =>
          prev.map(e => (e.id === errorId ? { ...e, dismissed: true } : e))
        );
      } catch (err) {
        console.error('[useErrorAnnouncements] Dismiss error:', err);
      }
    },
    []
  );

  // Handle recovery action (retry, skip, cancel)
  const handleRecoveryAction = useCallback(
    async (errorId: string, action: ErrorRecoveryAction) => {
      try {
        const response = await fetch(`/api/errors/${errorId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });

        if (!response.ok) {
          throw new Error(`Failed to handle recovery action: ${response.statusText}`);
        }

        // Update local state
        setErrors(prev =>
          prev.map(e => (e.id === errorId ? { ...e, dismissed: true } : e))
        );

        // Notify orchestrator via WebSocket if available
        send({
          type: 'error:recovery',
          errorId,
          action,
          timestamp: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.error('[useErrorAnnouncements] Recovery action error:', err);
      }
    },
    [send]
  );

  // Create a new error announcement
  const createError = useCallback(
    async (errorData: Omit<ErrorInstance, 'id' | 'createdAt' | 'dismissed'>) => {
      try {
        const response = await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create error: ${response.statusText}`);
        }

        const newError = await response.json();
        setErrors(prev => [...prev, newError]);
        return newError;
      } catch (err) {
        console.error('[useErrorAnnouncements] Create error:', err);
        throw err;
      }
    },
    []
  );

  // Delete an error
  const deleteError = useCallback(async (errorId: string) => {
    try {
      const response = await fetch(`/api/errors/${errorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete error: ${response.statusText}`);
      }

      // Update local state
      setErrors(prev => prev.filter(e => e.id !== errorId));
    } catch (err) {
      console.error('[useErrorAnnouncements] Delete error:', err);
    }
  }, []);

  // Get unread/undismissed errors
  const unreadErrors = errors.filter(e => !e.dismissed);

  return {
    errors,
    unreadErrors,
    isLoading,
    error,
    fetchErrors,
    dismissError,
    handleRecoveryAction,
    createError,
    deleteError,
  };
}
