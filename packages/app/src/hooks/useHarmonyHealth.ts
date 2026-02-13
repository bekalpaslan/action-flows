/**
 * Hook for fetching and polling harmony health metrics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionId } from '@afw/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Harmony health data structure (matches backend response)
 */
export interface HarmonyHealthData {
  overall: number;
  byGate: Record<string, {
    score: number;
    violations: number;
    trend: string;
  }>;
  healingRecommendations: Array<{
    pattern: string;
    severity: string;
    suggestedFlow: string;
    violationCount?: number;
    reason?: string;
    estimatedEffort?: string;
  }>;
  timestamp: string;
}

/**
 * Hook configuration options
 */
export interface UseHarmonyHealthOptions {
  pollInterval?: number; // default 5000ms
  enabled?: boolean; // default true
}

/**
 * Hook return value
 */
export interface UseHarmonyHealthResult {
  health: HarmonyHealthData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and poll harmony health metrics
 *
 * Features:
 * - Automatic polling with configurable interval (default 5s)
 * - Loading and error state management
 * - Page Visibility API integration (pauses when tab hidden)
 * - Manual refresh function
 *
 * @param sessionId - Session ID (currently unused but kept for future filtering)
 * @param options - Configuration options
 */
export function useHarmonyHealth(
  sessionId: SessionId | null,
  options: UseHarmonyHealthOptions = {}
): UseHarmonyHealthResult {
  const { pollInterval = 5000, enabled = true } = options;

  const [health, setHealth] = useState<HarmonyHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch health metrics from API
   */
  const fetchHealth = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch(`${API_BASE}/harmony/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health');
      console.error('[useHarmonyHealth] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Polling interval setup
  useEffect(() => {
    if (!enabled || pollInterval <= 0) return;

    intervalRef.current = setInterval(fetchHealth, pollInterval);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchHealth, pollInterval, enabled]);

  // Page Visibility API: pause polling when tab hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Tab visible - resume polling
        if (enabled && pollInterval > 0) {
          fetchHealth(); // Immediate fetch on resume
          intervalRef.current = setInterval(fetchHealth, pollInterval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchHealth, enabled, pollInterval]);

  return {
    health,
    loading,
    error,
    refresh: fetchHealth,
  };
}
