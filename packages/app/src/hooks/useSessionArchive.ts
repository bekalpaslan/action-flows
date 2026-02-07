import { useState, useEffect, useCallback } from 'react';
import type { SessionId } from '@afw/shared';

/**
 * Archived session data
 */
export interface ArchivedSession {
  sessionId: SessionId;
  archivedAt: number;
  sessionData: {
    id: SessionId;
    user: string;
    status: string;
    startedAt: string;
    endedAt?: string;
    chainsCount: number;
  };
}

const STORAGE_KEY = 'afw-archived-sessions';
const DEFAULT_AUTO_ARCHIVE_DELAY_MS = 60000; // 60 seconds

/**
 * useSessionArchive hook
 *
 * Manages archived sessions with auto-archive logic and localStorage persistence
 */
export function useSessionArchive(
  autoArchiveDelayMs: number = DEFAULT_AUTO_ARCHIVE_DELAY_MS
) {
  const [archivedSessions, setArchivedSessions] = useState<ArchivedSession[]>([]);
  const [archiveTimers, setArchiveTimers] = useState<Map<SessionId, number>>(new Map());

  // Load archived sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setArchivedSessions(parsed);
      }
    } catch (error) {
      console.error('[useSessionArchive] Failed to load archived sessions:', error);
    }
  }, []);

  // Save archived sessions to localStorage when updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(archivedSessions));
    } catch (error) {
      console.error('[useSessionArchive] Failed to save archived sessions:', error);
    }
  }, [archivedSessions]);

  /**
   * Schedule auto-archive for a session
   */
  const scheduleAutoArchive = useCallback(
    (sessionId: SessionId, sessionData: ArchivedSession['sessionData']) => {
      // Cancel existing timer if any
      const existingTimer = archiveTimers.get(sessionId);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      // Schedule new timer
      const timer = window.setTimeout(() => {
        archiveSession(sessionId, sessionData);
        setArchiveTimers(prev => {
          const next = new Map(prev);
          next.delete(sessionId);
          return next;
        });
      }, autoArchiveDelayMs);

      setArchiveTimers(prev => new Map(prev).set(sessionId, timer));
    },
    [autoArchiveDelayMs, archiveSession]
  );

  // Cleanup timers when autoArchiveDelayMs changes
  useEffect(() => {
    // When delay changes, cancel all existing timers to prevent memory leaks
    return () => {
      archiveTimers.forEach(timer => window.clearTimeout(timer));
    };
  }, [autoArchiveDelayMs, archiveTimers]);

  /**
   * Cancel scheduled auto-archive
   */
  const cancelAutoArchive = useCallback((sessionId: SessionId) => {
    const timer = archiveTimers.get(sessionId);
    if (timer) {
      window.clearTimeout(timer);
      setArchiveTimers(prev => {
        const next = new Map(prev);
        next.delete(sessionId);
        return next;
      });
    }
  }, [archiveTimers]);

  /**
   * Archive a session immediately
   */
  const archiveSession = useCallback(
    (sessionId: SessionId, sessionData: ArchivedSession['sessionData']) => {
      const archived: ArchivedSession = {
        sessionId,
        archivedAt: Date.now(),
        sessionData,
      };

      setArchivedSessions(prev => {
        // Remove existing archive for same session (if any)
        const filtered = prev.filter(s => s.sessionId !== sessionId);
        return [...filtered, archived];
      });

      // Cancel any pending timer
      cancelAutoArchive(sessionId);
    },
    [cancelAutoArchive]
  );

  /**
   * Restore an archived session
   */
  const restoreSession = useCallback((sessionId: SessionId) => {
    const session = archivedSessions.find(s => s.sessionId === sessionId);
    if (!session) {
      console.warn('[useSessionArchive] Session not found:', sessionId);
      return null;
    }

    // Remove from archive
    setArchivedSessions(prev => prev.filter(s => s.sessionId !== sessionId));

    return session.sessionData;
  }, [archivedSessions]);

  /**
   * Delete an archived session permanently
   */
  const deleteArchive = useCallback((sessionId: SessionId) => {
    setArchivedSessions(prev => prev.filter(s => s.sessionId !== sessionId));
  }, []);

  /**
   * Get all archived sessions
   */
  const getArchivedSessions = useCallback(() => {
    return [...archivedSessions];
  }, [archivedSessions]);

  /**
   * Clear all archived sessions
   */
  const clearAllArchives = useCallback(() => {
    setArchivedSessions([]);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      archiveTimers.forEach(timer => window.clearTimeout(timer));
    };
  }, [archiveTimers]);

  return {
    archivedSessions,
    scheduleAutoArchive,
    cancelAutoArchive,
    archiveSession,
    restoreSession,
    deleteArchive,
    getArchivedSessions,
    clearAllArchives,
  };
}
