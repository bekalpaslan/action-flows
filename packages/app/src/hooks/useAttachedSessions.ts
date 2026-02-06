import { useState, useCallback, useEffect } from 'react';
import type { Session } from '@afw/shared';

export interface UseAttachedSessionsReturn {
  /** List of currently attached session IDs */
  attachedSessionIds: string[];

  /** List of full session objects for attached sessions */
  attachedSessions: Session[];

  /** Attach a session by ID */
  attachSession: (sessionId: string) => void;

  /** Detach a session by ID */
  detachSession: (sessionId: string) => void;

  /** Clear all attached sessions */
  clearAll: () => void;

  /** Check if a session is attached */
  isAttached: (sessionId: string) => boolean;
}

/**
 * React hook for managing attached sessions state
 *
 * Features:
 * - Tracks which sessions are currently attached to the view
 * - Provides attach/detach operations
 * - Resolves session IDs to full session objects
 * - Persists attached session IDs to localStorage (optional)
 * - Validates that sessions exist before attaching
 */
export function useAttachedSessions(
  allSessions: Session[] = [],
  options: {
    maxAttached?: number;
    persistToStorage?: boolean;
    storageKey?: string;
  } = {}
): UseAttachedSessionsReturn {
  const {
    maxAttached = 6,
    persistToStorage = false,
    storageKey = 'afw:attached-sessions',
  } = options;

  // Load initial state from localStorage if enabled
  const loadInitialState = (): string[] => {
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (err) {
        console.error('Failed to load attached sessions from storage:', err);
      }
    }
    return [];
  };

  const [attachedIds, setAttachedIds] = useState<string[]>(loadInitialState);

  // Persist to localStorage when state changes
  useEffect(() => {
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(attachedIds));
      } catch (err) {
        console.error('Failed to save attached sessions to storage:', err);
      }
    }
  }, [attachedIds, persistToStorage, storageKey]);

  // Resolve attached session IDs to full session objects
  const attachedSessions = attachedIds
    .map((id) => allSessions.find((s) => s.id === id))
    .filter((s): s is Session => s !== undefined);

  // Attach a session
  const attachSession = useCallback(
    (sessionId: string) => {
      setAttachedIds((current) => {
        // Check if already attached
        if (current.includes(sessionId)) {
          return current;
        }

        // Check max limit
        if (current.length >= maxAttached) {
          console.warn(
            `Maximum ${maxAttached} sessions can be attached. Detach a session first.`
          );
          return current;
        }

        // Verify session exists
        const sessionExists = allSessions.some((s) => s.id === sessionId);
        if (!sessionExists) {
          console.warn(`Session ${sessionId} not found in available sessions.`);
          return current;
        }

        return [...current, sessionId];
      });
    },
    [allSessions, maxAttached]
  );

  // Detach a session
  const detachSession = useCallback((sessionId: string) => {
    setAttachedIds((current) => current.filter((id) => id !== sessionId));
  }, []);

  // Clear all attached sessions
  const clearAll = useCallback(() => {
    setAttachedIds([]);
  }, []);

  // Check if a session is attached
  const isAttached = useCallback(
    (sessionId: string): boolean => {
      return attachedIds.includes(sessionId);
    },
    [attachedIds]
  );

  return {
    attachedSessionIds: attachedIds,
    attachedSessions,
    attachSession,
    detachSession,
    clearAll,
    isAttached,
  };
}
