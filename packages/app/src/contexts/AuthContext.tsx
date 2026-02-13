import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from 'react';
import type { User, Permission, Role } from '@afw/shared';
import { DEFAULT_ROLE_PERMISSIONS } from '@afw/shared';
import { useWebSocketContext } from './WebSocketContext';

/**
 * Authentication Context Type Definition
 *
 * Provides:
 * - Current user info (userId, username, role, permissions)
 * - Auth verification and refresh methods
 * - Permission checking utilities
 * - WebSocket integration for real-time permission updates
 */
interface AuthContextType {
  /** Current authenticated user, null if not authenticated */
  user: User | null;

  /** Whether auth is being verified on app load */
  isLoading: boolean;

  /** Error message if auth verification failed */
  error: string | null;

  /** Get the current user info from the API */
  getCurrentUser: () => Promise<User | null>;

  /** Refresh user info (5-min cache) */
  refreshUser: () => Promise<User | null>;

  /** Check if user has a specific permission */
  hasPermission: (permission: Permission) => boolean;

  /** Verify auth on app startup */
  verifyAuth: () => Promise<boolean>;

  /** Sign out the current user */
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * AuthProvider Component
 *
 * Manages authentication state and permissions:
 * - Fetches current user on mount via /api/auth/user
 * - Caches user info with 5-min TTL to avoid repeated requests
 * - Listens for permission updates via WebSocket (auth:permission-update event)
 * - Provides permission checking utilities
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket context for permission updates
  const ws = useWebSocketContext();

  // Cache tracking
  const userCacheRef = useRef<{ data: User; timestamp: number } | null>(null);

  // Use environment variable or relative URLs (browser uses current origin)
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';

  /**
   * Get current user from API
   * No caching - always fetches fresh
   */
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          return null;
        }
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      const data = await response.json();
      return data as User;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to get current user:', message);
      return null;
    }
  }, [API_BASE_URL]);

  /**
   * Refresh user info with caching (5-min TTL)
   */
  const refreshUser = useCallback(async (): Promise<User | null> => {
    // Check cache
    if (userCacheRef.current) {
      const age = Date.now() - userCacheRef.current.timestamp;
      if (age < CACHE_TTL_MS) {
        setUser(userCacheRef.current.data);
        return userCacheRef.current.data;
      }
    }

    // Fetch fresh
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      userCacheRef.current = {
        data: currentUser,
        timestamp: Date.now(),
      };
    }
    return currentUser;
  }, [getCurrentUser]);

  /**
   * Verify auth on app startup
   * Graceful degradation: allow view-only mode if auth fails
   */
  const verifyAuth = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          return false;
        }
        throw new Error(`Auth verification failed: ${response.statusText}`);
      }

      // Fetch current user
      const currentUser = await refreshUser();
      return currentUser !== null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.warn('Auth verification failed (graceful degradation):', message);
      // Allow view-only mode
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, refreshUser]);

  /**
   * Check if user has a specific permission
   * Fails safe: returns false if user not authenticated or permission missing
   * Uses shared permission matrix for consistency across frontend/backend
   */
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return DEFAULT_ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  }, [user]);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(() => {
    setUser(null);
    userCacheRef.current = null;
    setError(null);
    // Could add POST /api/auth/logout call here if needed
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Listen for permission updates via WebSocket
  useEffect(() => {
    if (!ws) return; // WebSocket not available, graceful degradation

    try {
      const unsubscribe = ws.onEvent?.((event: any) => {
        if (event.type === 'auth:permission-update') {
          // Refresh user to get updated permissions
          refreshUser();
        }
      });

      return () => {
        unsubscribe?.();
      };
    } catch (err) {
      // Error subscribing to WebSocket events
      console.warn('Failed to subscribe to permission updates:', err);
    }
  }, [ws, refreshUser]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isLoading,
      error,
      getCurrentUser,
      refreshUser,
      hasPermission,
      verifyAuth,
      signOut,
    }),
    [user, isLoading, error, getCurrentUser, refreshUser, hasPermission, verifyAuth, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
