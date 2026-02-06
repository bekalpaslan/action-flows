import { useState, useEffect, useCallback } from 'react';
import type { DirectoryEntry } from '../components/FileExplorer/FileTree';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export function useFileTree(sessionId: string, showHidden: boolean = false) {
  const [tree, setTree] = useState<DirectoryEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return {
    tree,
    isLoading,
    error,
    refresh: fetchTree,
  };
}
