import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import type { Session, SessionId, WorkbenchId } from '@afw/shared';

/**
 * SessionContext Type Definition
 *
 * Provides app-level session management with:
 * - Global session state (all active sessions)
 * - Active session tracking with localStorage persistence
 * - Async operations (create, delete) with loading state
 * - Session lookup helpers
 */
interface SessionContextType {
  /** All sessions loaded from backend */
  sessions: Session[];

  /** Currently active session ID (null if none selected) */
  activeSessionId: SessionId | null;

  /** Whether sessions are being loaded from backend */
  isLoading: boolean;

  /** Create a new session on the backend and add to local state */
  createSession: (cwd?: string, name?: string, workbenchId?: WorkbenchId) => Promise<SessionId>;

  /** Delete a session from backend and remove from local state */
  deleteSession: (sessionId: SessionId) => Promise<void>;

  /** Set the active session ID (persisted to localStorage) */
  setActiveSession: (sessionId: SessionId | null) => void;

  /** Helper: Get a session by ID from local state */
  getSession: (sessionId: SessionId) => Session | undefined;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * SessionProvider Component
 *
 * Manages session state at the app level:
 * - Fetches sessions from GET /api/sessions on mount
 * - Syncs activeSessionId to/from localStorage
 * - Provides create/delete/get session methods
 * - Implements session pruning (max 20 sessions)
 */
export function SessionProvider({ children }: SessionProviderProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<SessionId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Initialize: Fetch sessions from backend and restore activeSessionId from localStorage
  useEffect(() => {
    const initializeSessions = async () => {
      try {
        setIsLoading(true);

        // Fetch all sessions from backend
        const response = await fetch(`${API_BASE_URL}/api/sessions`);
        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.statusText}`);
        }

        const data = await response.json();
        const fetchedSessions = Array.isArray(data.sessions)
          ? data.sessions
          : [];

        // Apply session pruning: Keep max 20 sessions (remove oldest)
        let prunedSessions = fetchedSessions;
        if (prunedSessions.length > 20) {
          prunedSessions = prunedSessions
            .sort(
              (a, b) =>
                new Date(b.startedAt).getTime() -
                new Date(a.startedAt).getTime()
            )
            .slice(0, 20);
        }

        setSessions(prunedSessions);

        // Restore activeSessionId from localStorage
        const savedActiveSessionId = localStorage.getItem(
          'afw-active-session'
        );
        if (savedActiveSessionId) {
          // Verify the saved ID still exists
          const sessionExists = prunedSessions.some(
            (s) => s.id === savedActiveSessionId
          );
          if (sessionExists) {
            setActiveSessionId(savedActiveSessionId as SessionId);
          }
        }
      } catch (error) {
        console.error('[SessionContext] Failed to initialize sessions:', error);
        // Continue with empty state if fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    initializeSessions();
  }, [API_BASE_URL]);

  /**
   * Create a new session on the backend
   * @param cwd Working directory (optional)
   * @param name Session display name (optional, e.g., "work: Discuss AuthPanel")
   * @param workbenchId Workbench that owns this session (optional)
   * @returns The new session's ID
   */
  const createSession = useCallback(
    async (cwd?: string, name?: string, workbenchId?: WorkbenchId): Promise<SessionId> => {
      try {
        // Normalize platform to match backend enum (win32, darwin, linux)
        const rawPlatform = typeof navigator !== 'undefined' ? navigator.platform : 'unknown';
        const normalizedPlatform = rawPlatform.toLowerCase().startsWith('win') ? 'win32'
          : rawPlatform.toLowerCase().startsWith('mac') ? 'darwin'
          : rawPlatform.toLowerCase().startsWith('linux') ? 'linux'
          : undefined;

        const payload = {
          cwd: cwd || import.meta.env.VITE_PROJECT_DIR || (typeof process !== 'undefined' ? process.cwd?.() : undefined) || '/app',
          hostname: typeof window !== 'undefined' ? 'browser' : 'unknown',
          ...(normalizedPlatform ? { platform: normalizedPlatform } : {}),
          ...(name ? { name } : {}),
          ...(workbenchId ? { workbenchId } : {}),
        };

        const response = await fetch(`${API_BASE_URL}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `Failed to create session`);
        }

        const newSession: Session = await response.json();

        // Add to local state
        setSessions((prev) => {
          const updated = [newSession, ...prev];
          // Apply pruning: keep max 20 sessions
          if (updated.length > 20) {
            return updated.slice(0, 20);
          }
          return updated;
        });

        // Set as active
        setActiveSessionId(newSession.id);
        localStorage.setItem('afw-active-session', newSession.id);

        return newSession.id;
      } catch (error) {
        console.error('[SessionContext] Failed to create session:', error);
        throw error;
      }
    },
    [API_BASE_URL]
  );

  /**
   * Delete a session from the backend and local state
   * @param sessionId ID of session to delete
   */
  const deleteSession = useCallback(
    async (sessionId: SessionId): Promise<void> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/sessions/${sessionId}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `Failed to delete session`);
        }

        // Remove from local state
        setSessions((prev) =>
          prev.filter((s) => s.id !== sessionId)
        );

        // If deleted session was active, clear activeSessionId
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          localStorage.removeItem('afw-active-session');
        }
      } catch (error) {
        console.error('[SessionContext] Failed to delete session:', error);
        throw error;
      }
    },
    [API_BASE_URL, activeSessionId]
  );

  /**
   * Set the active session ID and persist to localStorage
   * @param sessionId ID to set as active, or null to clear
   */
  const handleSetActiveSession = useCallback(
    (sessionId: SessionId | null) => {
      setActiveSessionId(sessionId);
      if (sessionId) {
        localStorage.setItem('afw-active-session', sessionId);
      } else {
        localStorage.removeItem('afw-active-session');
      }
    },
    []
  );

  /**
   * Helper: Get a session by ID from local state
   * @param sessionId ID to look up
   * @returns Session object or undefined
   */
  const getSession = useCallback(
    (sessionId: SessionId) => sessions.find((s) => s.id === sessionId),
    [sessions]
  );

  const value = useMemo(
    () => ({
      sessions,
      activeSessionId,
      isLoading,
      createSession,
      deleteSession,
      setActiveSession: handleSetActiveSession,
      getSession,
    }),
    [
      sessions,
      activeSessionId,
      isLoading,
      createSession,
      deleteSession,
      handleSetActiveSession,
      getSession,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/**
 * useSessionContext Hook
 *
 * Provides access to the SessionContext. Must be called within SessionProvider.
 *
 * @throws Error if used outside SessionProvider
 * @returns SessionContextType with all session management operations
 */
export function useSessionContext(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error(
      'useSessionContext must be used within a SessionProvider. ' +
        'Make sure SessionProvider wraps your component tree.'
    );
  }
  return context;
}
