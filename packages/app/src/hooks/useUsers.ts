import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { WorkspaceEvent } from '@afw/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  sessionCount: number;
  isOnline: boolean;
  name?: string;
}

export interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  currentUserId?: string;
}

/**
 * React hook for managing active users
 *
 * Features:
 * - Fetches users from GET /api/users
 * - Auto-updates on WebSocket user events
 * - Tracks current user
 * - Provides refresh capability
 */
export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  const wsContext = useWebSocketContext();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!Array.isArray(data.users)) {
        throw new Error('Invalid users response structure');
      }

      const fetchedUsers: User[] = data.users.map((user: any) => ({
        id: user.id || user.userId,
        sessionCount: typeof user.sessionCount === 'number' ? user.sessionCount : 1,
        isOnline: user.isOnline !== false,
        name: user.name || user.displayName,
      }));

      setUsers(fetchedUsers);

      // Set current user if provided
      if (data.currentUserId) {
        setCurrentUserId(data.currentUserId);
      } else if (fetchedUsers.length > 0) {
        setCurrentUserId(fetchedUsers[0].id);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error fetching users:', err);
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle WebSocket user events
  const handleUserEvent = useCallback((event: WorkspaceEvent) => {
    if (event.type === 'user:online' || event.type === 'user:offline' || event.type === 'user:session') {
      // Refresh users when user events occur
      setUsers((prevUsers) => {
        const user = event.data as any;
        const existingIndex = prevUsers.findIndex((u) => u.id === user.id);

        if (existingIndex >= 0) {
          // Update existing user
          const updated = [...prevUsers];
          updated[existingIndex] = {
            ...updated[existingIndex],
            isOnline: event.type === 'user:offline' ? false : true,
            sessionCount: user.sessionCount || updated[existingIndex].sessionCount,
            name: user.name || updated[existingIndex].name,
          };
          return updated;
        } else if (event.type !== 'user:offline') {
          // Add new user if coming online
          return [
            ...prevUsers,
            {
              id: user.id,
              sessionCount: user.sessionCount || 1,
              isOnline: true,
              name: user.name,
            },
          ];
        }

        return prevUsers;
      });
    }
  }, []);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (wsContext.onEvent) {
      const unsubscribe = wsContext.onEvent(handleUserEvent);
      return unsubscribe;
    }
  }, [wsContext, handleUserEvent]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();

    return () => {
      // Cancel pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refresh: fetchUsers,
    currentUserId,
  };
}
