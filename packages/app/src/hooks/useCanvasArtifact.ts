/**
 * useCanvasArtifact Hook
 *
 * Phase 2B of Inspiration Roadmap — Thread 4 (Live Canvas)
 *
 * Manages a single artifact's state, handles WebSocket updates
 * (artifact:created, artifact:updated, artifact:archived).
 */

import { useState, useEffect } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type {
  StoredArtifact,
  ArtifactId,
  WorkspaceEvent,
  ArtifactCreatedMessage,
  ArtifactUpdatedMessage,
  ArtifactArchivedMessage,
} from '@afw/shared';

export interface UseCanvasArtifactOptions {
  /** Artifact ID to watch */
  artifactId: ArtifactId;
  /** Whether to fetch immediately on mount */
  autoFetch?: boolean;
}

export interface UseCanvasArtifactResult {
  /** The artifact, or null if not loaded */
  artifact: StoredArtifact | null;
  /** Loading state */
  loading: boolean;
  /** Error message if fetch or update failed */
  error: string | null;
  /** Manually refresh the artifact from the server */
  refresh: () => Promise<void>;
}

/**
 * Manages a single artifact with live updates
 */
export function useCanvasArtifact({
  artifactId,
  autoFetch = true,
}: UseCanvasArtifactOptions): UseCanvasArtifactResult {
  const [artifact, setArtifact] = useState<StoredArtifact | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const { onEvent } = useWebSocketContext();

  // Fetch artifact from API
  const fetchArtifact = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/artifacts/${artifactId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setArtifact(data);
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
      fetchArtifact();
    }
  }, [artifactId, autoFetch]);

  // Listen for WebSocket updates
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribe = onEvent((event: WorkspaceEvent) => {
      // Handle artifact:created
      if (event.type === 'artifact:created') {
        const createEvent = event as ArtifactCreatedMessage;
        if (createEvent.artifact.id === artifactId) {
          setArtifact(createEvent.artifact);
        }
      }

      // Handle artifact:updated
      if (event.type === 'artifact:updated') {
        const updateEvent = event as ArtifactUpdatedMessage;
        if (updateEvent.artifactId === artifactId) {
          setArtifact(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              data: { ...prev.data, ...updateEvent.data },
              updatedAt: new Date().toISOString(),
            };
          });
        }
      }

      // Handle artifact:archived
      if (event.type === 'artifact:archived') {
        const archiveEvent = event as ArtifactArchivedMessage;
        if (archiveEvent.artifactId === artifactId) {
          setArtifact(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              status: 'archived',
              updatedAt: new Date().toISOString(),
            };
          });
        }
      }
    });

    return unsubscribe;
  }, [onEvent, artifactId]);

  return {
    artifact,
    loading,
    error,
    refresh: fetchArtifact,
  };
}
