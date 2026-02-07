import { useState, useEffect, useCallback, useRef } from 'react';
import type { DirectoryEntry } from '../components/FileExplorer/FileTree';
import type { WorkspaceEvent } from '@afw/shared';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001') + '/api';

// Debounce delay for refreshing after file changes (ms)
const REFRESH_DEBOUNCE_MS = 500;

export function useFileTree(
  sessionId: string,
  showHidden: boolean = false,
  onFileEvent?: (event: WorkspaceEvent) => void
) {
  const [tree, setTree] = useState<DirectoryEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer for refreshing after file changes
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTree = useCallback(async () => {
    if (!sessionId) {
      setError('No session ID provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        showHidden: showHidden.toString(),
        depth: '3',
      });

      const response = await fetch(`${API_BASE}/files/${sessionId}/tree?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch file tree: ${response.statusText}`);
      }

      const data = await response.json();
      setTree(data.tree);
    } catch (err) {
      console.error('[useFileTree] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTree(null);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, showHidden]);

  // Debounced refresh function
  const debouncedRefresh = useCallback(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Set new timer
    refreshTimerRef.current = setTimeout(() => {
      fetchTree();
    }, REFRESH_DEBOUNCE_MS);
  }, [fetchTree]);

  // Handle file system events (called from parent component listening to WebSocket)
  const handleFileSystemEvent = useCallback((event: WorkspaceEvent) => {
    // Only refresh for file created/deleted events
    // Modified events don't affect tree structure
    if (event.type === 'file:created' || event.type === 'file:deleted') {
      console.log(`[useFileTree] File ${event.type === 'file:created' ? 'created' : 'deleted'}, refreshing tree...`);
      debouncedRefresh();
    }

    // Call optional event callback
    onFileEvent?.(event);
  }, [debouncedRefresh, onFileEvent]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  return {
    tree,
    isLoading,
    error,
    refresh: fetchTree,
    handleFileSystemEvent, // Expose for WebSocket event handling
  };
}
