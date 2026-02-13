import { useState, useEffect, useCallback, useRef } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface FlowMetadata {
  id: string;
  name: string;
  description: string;
  category: 'work' | 'maintenance' | 'explore' | 'review' | 'settings' | 'pm' | 'intel';
  tags: string[];
  usageCount: number;
  successRate: number;
  lastUsedAt?: string;
  author?: string;
  version?: string;
  readme?: string;
  executionHistory?: Array<{
    startedAt: string;
    completedAt?: string;
    status: 'completed' | 'failed' | 'in_progress';
    duration?: number;
  }>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const flowCache = new Map<string, CacheEntry<FlowMetadata>>();
const allFlowsCache: CacheEntry<FlowMetadata[]> | null = null;

export interface UseFlowBrowserReturn {
  flows: FlowMetadata[];
  loading: boolean;
  error: Error | null;
  fetchFlows: () => Promise<void>;
  fetchFlowDetails: (flowId: string) => Promise<FlowMetadata | null>;
  clearCache: () => void;
}

/**
 * Hook for managing flow browser state and API interactions
 * - Fetches flows from /api/flows
 * - Caches with 5-minute TTL
 * - Provides individual flow details
 */
export function useFlowBrowser(): UseFlowBrowserReturn {
  const [flows, setFlows] = useState<FlowMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<CacheEntry<FlowMetadata[]> | null>(null);

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
      const response = await fetch(`${BACKEND_URL}/api/flows`);
      if (!response.ok) {
        throw new Error(`Failed to fetch flows: ${response.status}`);
      }

      const apiResponse = (await response.json()) as { success: boolean; flows: FlowMetadata[] };
      const data = apiResponse.flows || [];
      cacheRef.current = {
        data,
        timestamp: Date.now(),
      };
      setFlows(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[useFlowBrowser] Error fetching flows:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFlowDetails = useCallback(
    async (flowId: string): Promise<FlowMetadata | null> => {
      // Check cache first
      const cached = flowCache.get(flowId);
      if (cached && isCacheValid(cached)) {
        return cached.data;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/flows/${flowId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch flow details: ${response.status}`);
        }

        const data = (await response.json()) as FlowMetadata;
        flowCache.set(flowId, {
          data,
          timestamp: Date.now(),
        });
        return data;
      } catch (err) {
        console.error('[useFlowBrowser] Error fetching flow details:', err);
        return null;
      }
    },
    []
  );

  const clearCache = useCallback(() => {
    cacheRef.current = null;
    flowCache.clear();
  }, []);

  // Fetch flows on mount
  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  return {
    flows,
    loading,
    error,
    fetchFlows,
    fetchFlowDetails,
    clearCache,
  };
}
