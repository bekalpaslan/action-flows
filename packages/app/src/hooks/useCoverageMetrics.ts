/**
 * Hook for fetching and subscribing to contract coverage metrics
 * Follows the pattern of useHarmonyMetrics
 */

import { useEffect, useState, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Contract detail from health check
 */
export interface ContractDetail {
  filePath: string;
  name: string;
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  healthChecks: number;
}

/**
 * Coverage metrics response
 */
export interface CoverageMetrics {
  passed: boolean;
  timestamp: string;
  summary: {
    totalContracts: number;
    validContracts: number;
    warningContracts: number;
    errorContracts: number;
    totalHealthChecks: number;
    componentCoverage: number;
  };
  details: {
    errors: ContractDetail[];
    warnings: ContractDetail[];
    valid: ContractDetail[];
  };
  cached?: boolean;
  stale?: boolean;
  cacheAge?: number;
}

/**
 * Hook to fetch and manage contract coverage metrics
 */
export function useCoverageMetrics() {
  const [metrics, setMetrics] = useState<CoverageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { onEvent } = useWebSocketContext();

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/contracts/health`);

      if (!response.ok) {
        throw new Error(`Failed to fetch coverage metrics: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh (bypasses cache)
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/contracts/health/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh coverage metrics: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchMetrics();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [fetchMetrics]);

  // Subscribe to WebSocket updates (future: contract:health:updated event)
  useEffect(() => {
    if (!onEvent) return;

    const handleEvent = (event: any) => {
      if (event.type === 'contract:health:updated') {
        fetchMetrics();
      }
    };

    const unregister = onEvent(handleEvent);
    return () => unregister();
  }, [onEvent, fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    lastRefresh,
    refresh,
    fetchMetrics,
  };
}
