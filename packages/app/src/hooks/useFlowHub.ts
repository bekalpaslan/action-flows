import { useState, useEffect, useCallback, useRef } from 'react';
import type { FlowHubEntry, FlowInstallResult, FlowSource } from '@afw/shared';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface UseFlowHubReturn {
  flows: FlowHubEntry[];
  loading: boolean;
  error: Error | null;
  installFlow: (flowId: string, options?: { overrideExisting?: boolean }) => Promise<FlowInstallResult | null>;
  uninstallFlow: (flowId: string) => Promise<boolean>;
  fetchFlows: () => Promise<void>;
  clearCache: () => void;
}

/**
 * Hook for managing FlowHub state and API interactions
 * - Fetches flows from /api/flow-hub/flows
 * - Provides install/uninstall functions
 * - Caches with 5-minute TTL
 */
export function useFlowHub(): UseFlowHubReturn {
  const [flows, setFlows] = useState<FlowHubEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<CacheEntry<FlowHubEntry[]> | null>(null);

  const isCacheValid = (entry: CacheEntry<unknown>): boolean => {
    return Date.now() - entry.timestamp < CACHE_TTL;
  };

  const fetchFlows = useCallback(async () => {
    // Check cache first
    if (cacheRef.current && isCacheValid(cacheRef.current)) {
      setFlows(cacheRef.current.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/flow-hub/flows`);
      if (!response.ok) {
        throw new Error(`Failed to fetch flows: ${response.status}`);
      }

      const apiResponse = (await response.json()) as { flows: FlowHubEntry[] };
      const data = apiResponse.flows || [];
      cacheRef.current = {
        data,
        timestamp: Date.now(),
      };
      setFlows(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[useFlowHub] Error fetching flows:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const installFlow = useCallback(
    async (flowId: string, options?: { overrideExisting?: boolean }): Promise<FlowInstallResult | null> => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/flow-hub/flows/${flowId}/install`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ overrideExisting: options?.overrideExisting || false }),
        });

        if (!response.ok) {
          throw new Error(`Failed to install flow: ${response.status}`);
        }

        const result = (await response.json()) as FlowInstallResult;

        // Invalidate cache to force refresh
        cacheRef.current = null;
        await fetchFlows();

        return result;
      } catch (err) {
        console.error('[useFlowHub] Error installing flow:', err);
        return null;
      }
    },
    [fetchFlows]
  );

  const uninstallFlow = useCallback(
    async (flowId: string): Promise<boolean> => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/flow-hub/flows/${flowId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to uninstall flow: ${response.status}`);
        }

        // Invalidate cache to force refresh
        cacheRef.current = null;
        await fetchFlows();

        return true;
      } catch (err) {
        console.error('[useFlowHub] Error uninstalling flow:', err);
        return false;
      }
    },
    [fetchFlows]
  );

  const clearCache = useCallback(() => {
    cacheRef.current = null;
  }, []);

  // Fetch flows on mount
  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  return {
    flows,
    loading,
    error,
    installFlow,
    uninstallFlow,
    fetchFlows,
    clearCache,
  };
}
