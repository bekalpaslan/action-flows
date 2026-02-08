/**
 * Hook for fetching and subscribing to harmony metrics
 */

import { useEffect, useState, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { HarmonyMetrics, HarmonyCheck, SessionId, ProjectId } from '@afw/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Hook to fetch and subscribe to harmony metrics
 */
export function useHarmonyMetrics(
  target: SessionId | ProjectId,
  targetType: 'session' | 'project'
) {
  const [metrics, setMetrics] = useState<HarmonyMetrics | null>(null);
  const [recentChecks, setRecentChecks] = useState<HarmonyCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { onEvent } = useWebSocketContext();

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = targetType === 'session'
        ? `${API_BASE}/harmony/${target}`
        : `${API_BASE}/harmony/project/${target}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Failed to fetch harmony metrics: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setRecentChecks(data.recentChecks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [target, targetType]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Subscribe to real-time updates for sessions
  useEffect(() => {
    if (targetType !== 'session' || !onEvent) return;

    const handleEvent = (event: any) => {
      // Refresh metrics on harmony events
      if (
        event.type === 'harmony:check' ||
        event.type === 'harmony:violation' ||
        event.type === 'harmony:metrics-updated'
      ) {
        if (event.sessionId === target) {
          fetchMetrics();
        }
      }
    };

    const unregister = onEvent(handleEvent);
    return () => unregister();
  }, [target, targetType, onEvent, fetchMetrics]);

  return {
    metrics,
    recentChecks,
    loading,
    error,
    refresh: fetchMetrics,
  };
}

/**
 * Hook to get harmony status color based on percentage
 */
export function useHarmonyStatus(percentage: number): {
  color: 'green' | 'yellow' | 'orange' | 'red';
  label: string;
} {
  if (percentage >= 90) {
    return { color: 'green', label: 'Excellent' };
  } else if (percentage >= 75) {
    return { color: 'yellow', label: 'Good' };
  } else if (percentage >= 50) {
    return { color: 'orange', label: 'Degraded' };
  } else {
    return { color: 'red', label: 'Critical' };
  }
}
