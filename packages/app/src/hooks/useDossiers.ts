/**
 * Hook for managing Intel Dossiers
 *
 * Provides CRUD operations for dossiers and subscribes to WebSocket events
 * for real-time updates.
 */

import { useState, useEffect, useCallback } from 'react';
import type { IntelDossier, DossierId, WorkspaceEvent } from '@afw/shared';
import { useWebSocketContext } from '../contexts/WebSocketContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface UseDossiersResult {
  /** List of dossiers */
  dossiers: IntelDossier[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Refresh dossiers from server */
  refresh: () => void;
  /** Create a new dossier */
  createDossier: (name: string, targets: string[], context: string) => Promise<IntelDossier>;
  /** Update an existing dossier */
  updateDossier: (id: DossierId, updates: Partial<{name: string; targets: string[]; context: string}>) => Promise<IntelDossier>;
  /** Delete a dossier */
  deleteDossier: (id: DossierId) => Promise<void>;
  /** Trigger analysis for a dossier */
  triggerAnalysis: (id: DossierId) => Promise<void>;
}

/**
 * Hook for managing Intel Dossiers with real-time updates via WebSocket.
 *
 * Features:
 * - Auto-fetches dossiers on mount
 * - Subscribes to WebSocket events for real-time updates
 * - Provides CRUD operations
 * - Error handling with graceful degradation
 *
 * @returns Object with dossiers array, loading state, error, and CRUD functions
 */
export function useDossiers(): UseDossiersResult {
  const [dossiers, setDossiers] = useState<IntelDossier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsContext = useWebSocketContext();

  // Fetch all dossiers from backend
  const fetchDossiers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/dossiers`);

      if (!response.ok) {
        throw new Error(`Failed to fetch dossiers: ${response.status}`);
      }

      const data = await response.json();
      setDossiers(data.dossiers || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useDossiers] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new dossier
  const createDossier = useCallback(async (
    name: string,
    targets: string[],
    context: string
  ): Promise<IntelDossier> => {
    const response = await fetch(`${BACKEND_URL}/api/dossiers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, targets, context }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create dossier: ${response.status}`);
    }

    const newDossier = await response.json();

    // Refresh list to include new dossier
    fetchDossiers();

    return newDossier;
  }, [fetchDossiers]);

  // Update an existing dossier
  const updateDossier = useCallback(async (
    id: DossierId,
    updates: Partial<{name: string; targets: string[]; context: string}>
  ): Promise<IntelDossier> => {
    const response = await fetch(`${BACKEND_URL}/api/dossiers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update dossier: ${response.status}`);
    }

    const updatedDossier = await response.json();

    // Update local state
    setDossiers((prev) =>
      prev.map((d) => (d.id === id ? updatedDossier : d))
    );

    return updatedDossier;
  }, []);

  // Delete a dossier
  const deleteDossier = useCallback(async (id: DossierId): Promise<void> => {
    const response = await fetch(`${BACKEND_URL}/api/dossiers/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete dossier: ${response.status}`);
    }

    // Remove from local state
    setDossiers((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Trigger analysis for a dossier
  const triggerAnalysis = useCallback(async (id: DossierId): Promise<void> => {
    const response = await fetch(`${BACKEND_URL}/api/dossiers/${id}/analyze`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger analysis: ${response.status}`);
    }

    // Refresh to get updated status
    fetchDossiers();
  }, [fetchDossiers]);

  // Initial fetch on mount
  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  // Subscribe to WebSocket dossier events
  useEffect(() => {
    if (!wsContext.onEvent) return;

    const handleDossierEvent = (event: WorkspaceEvent) => {
      // Listen for dossier-related events
      // Event types might be: 'dossier:created', 'dossier:updated', 'dossier:deleted', 'dossier:analyzed'
      if (event.type.startsWith('dossier:')) {
        console.log('[useDossiers] Dossier event received, refreshing:', event.type);
        fetchDossiers();
      }
    };

    const unsubscribe = wsContext.onEvent(handleDossierEvent);
    return unsubscribe;
  }, [wsContext, fetchDossiers]);

  return {
    dossiers,
    loading,
    error,
    refresh: fetchDossiers,
    createDossier,
    updateDossier,
    deleteDossier,
    triggerAnalysis,
  };
}
