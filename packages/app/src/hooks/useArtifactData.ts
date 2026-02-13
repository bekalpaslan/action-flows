/**
 * useArtifactData Hook
 *
 * Phase 2B of Inspiration Roadmap — Thread 4 (Live Canvas)
 *
 * Fetches artifact list from /api/artifacts for a session/chain.
 * Returns collection state with live updates via WebSocket.
 */

import { useState, useEffect } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type {
  StoredArtifact,
  SessionId,
  ChainId,
  WorkspaceEvent,
  ArtifactCreatedMessage,
  ArtifactUpdatedMessage,
  ArtifactArchivedMessage,
} from '@afw/shared';

export interface UseArtifactDataOptions {
  /** Session ID to filter by */
  sessionId?: SessionId;
  /** Chain ID to filter by */
  chainId?: ChainId;
  /** Whether to fetch immediately on mount */
  autoFetch?: boolean;
}

export interface UseArtifactDataResult {
  /** List of artifacts */
  artifacts: StoredArtifact[];
  /** Loading state */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refresh the artifact list */
  refresh: () => Promise<void>;
}

/**
 * Fetches and manages a collection of artifacts with live updates
 */
export function useArtifactData({
  sessionId,
  chainId,
  autoFetch = true,
}: UseArtifactDataOptions): UseArtifactDataResult {
  const [artifacts, setArtifacts] = useState<StoredArtifact[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const { onEvent } = useWebSocketContext();

  // Fetch artifacts from API
  const fetchArtifacts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build URL based on sessionId (backend expects path param, not query param)
      const url = sessionId
        ? `/api/artifacts/session/${sessionId}`
        : '/api/artifacts';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setArtifacts(data.artifacts || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchArtifacts();
    }
  }, [sessionId, chainId, autoFetch]);

  // Listen for WebSocket updates
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribe = onEvent((event: WorkspaceEvent) => {
      // Handle artifact:created
      if (event.type === 'artifact:created') {
        const createEvent = event as ArtifactCreatedMessage;
        const artifact = createEvent.artifact;

        // Check if artifact matches our filters
        const matchesSession = !sessionId || artifact.sessionId === sessionId;
        const matchesChain = !chainId || artifact.chainId === chainId;

        if (matchesSession && matchesChain) {
          setArtifacts(prev => {
            // Avoid duplicates
            if (prev.some(a => a.id === artifact.id)) {
              return prev.map(a => a.id === artifact.id ? artifact : a);
            }
            return [...prev, artifact];
          });
        }
      }

      // Handle artifact:updated
      if (event.type === 'artifact:updated') {
        const updateEvent = event as ArtifactUpdatedMessage;
        const { artifactId, data } = updateEvent;

        setArtifacts(prev =>
          prev.map(artifact =>
            artifact.id === artifactId
              ? {
                  ...artifact,
                  data: { ...artifact.data, ...data },
                  updatedAt: new Date().toISOString(),
                }
              : artifact
          )
        );
      }

      // Handle artifact:archived
      if (event.type === 'artifact:archived') {
        const archiveEvent = event as ArtifactArchivedMessage;
        const { artifactId } = archiveEvent;

        setArtifacts(prev =>
          prev.map(artifact =>
            artifact.id === artifactId
              ? {
                  ...artifact,
                  status: 'archived' as const,
                  updatedAt: new Date().toISOString(),
                }
              : artifact
          )
        );
      }
    });

    return unsubscribe;
  }, [onEvent, sessionId, chainId]);

  return {
    artifacts,
    loading,
    error,
    refresh: fetchArtifacts,
  };
}
