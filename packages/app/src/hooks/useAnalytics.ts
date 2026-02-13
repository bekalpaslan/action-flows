import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export type TimeRange = '24h' | '7d' | '30d';

export interface AnalyticsSummary {
  totalSessions: number;
  totalChains: number;
  totalSteps: number;
  successRate: number;
  timeRange: TimeRange;
  updatedAt: string;
}

export interface FlowMetrics {
  flowId: string;
  flowName: string;
  usageCount: number;
  successRate: number;
  averageDuration: number;
  lastUsed?: string;
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  tasksCompleted: number;
  successRate: number;
  averageDuration: number;
  lastActive?: string;
}

export interface TimelinePoint {
  timestamp: string;
  sessions: number;
  chains: number;
  steps: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface UseAnalyticsReturn {
  summary: AnalyticsSummary | null;
  flowMetrics: FlowMetrics[];
  agentMetrics: AgentMetrics[];
  timeline: TimelinePoint[];
  loading: boolean;
  error: Error | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing analytics data with WebSocket real-time updates
 * - Fetches analytics from /api/analytics/* endpoints
 * - Subscribes to analytics:update WebSocket events
 * - Caches with 5-minute TTL
 * - Auto-refreshes every 5 seconds
 */
export function useAnalytics(): UseAnalyticsReturn {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [flowMetrics, setFlowMetrics] = useState<FlowMetrics[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const cacheRef = useRef<Map<string, CacheEntry<unknown>>>(new Map());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isCacheValid = (entry: CacheEntry<unknown>): boolean => {
    return Date.now() - entry.timestamp < CACHE_TTL;
  };

  const getCacheKey = (endpoint: string): string => `${endpoint}_${timeRange}`;

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const summaryKey = getCacheKey('summary');
      const flowsKey = getCacheKey('flows');
      const agentsKey = getCacheKey('agents');
      const timelineKey = getCacheKey('timeline');

      // Check caches
      const summaryCache = cacheRef.current.get(summaryKey);
      const flowsCache = cacheRef.current.get(flowsKey);
      const agentsCache = cacheRef.current.get(agentsKey);
      const timelineCache = cacheRef.current.get(timelineKey);

      const promises = [];

      // Fetch summary if not cached
      if (!summaryCache || !isCacheValid(summaryCache)) {
        promises.push(
          fetch(`${BACKEND_URL}/api/analytics/summary?timeRange=${timeRange}`)
            .then(r => r.json())
            .then(data => {
              const summary = {
                ...data,
                timeRange,
                updatedAt: new Date().toISOString(),
              } as AnalyticsSummary;
              cacheRef.current.set(summaryKey, { data: summary, timestamp: Date.now() });
              setSummary(summary);
            })
        );
      } else {
        setSummary(summaryCache.data as AnalyticsSummary);
      }

      // Fetch flow metrics if not cached
      if (!flowsCache || !isCacheValid(flowsCache)) {
        promises.push(
          fetch(`${BACKEND_URL}/api/analytics/flows?timeRange=${timeRange}&limit=10`)
            .then(r => r.json())
            .then(data => {
              const flows = (data.flows || []) as FlowMetrics[];
              cacheRef.current.set(flowsKey, { data: flows, timestamp: Date.now() });
              setFlowMetrics(flows);
            })
        );
      } else {
        setFlowMetrics(flowsCache.data as FlowMetrics[]);
      }

      // Fetch agent metrics if not cached
      if (!agentsCache || !isCacheValid(agentsCache)) {
        promises.push(
          fetch(`${BACKEND_URL}/api/analytics/agents?timeRange=${timeRange}&limit=10`)
            .then(r => r.json())
            .then(data => {
              const agents = (data.agents || []) as AgentMetrics[];
              cacheRef.current.set(agentsKey, { data: agents, timestamp: Date.now() });
              setAgentMetrics(agents);
            })
        );
      } else {
        setAgentMetrics(agentsCache.data as AgentMetrics[]);
      }

      // Fetch timeline if not cached
      if (!timelineCache || !isCacheValid(timelineCache)) {
        promises.push(
          fetch(`${BACKEND_URL}/api/analytics/timeline?timeRange=${timeRange}`)
            .then(r => r.json())
            .then(data => {
              const points = (data.timeline || []) as TimelinePoint[];
              cacheRef.current.set(timelineKey, { data: points, timestamp: Date.now() });
              setTimeline(points);
            })
        );
      } else {
        setTimeline(timelineCache.data as TimelinePoint[]);
      }

      await Promise.all(promises);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[useAnalytics] Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // WebSocket subscription for real-time updates
  useWebSocket({
    url: WS_URL,
    onEvent: (event) => {
      if (event.type === 'analytics:update') {
        // Invalidate caches on update
        cacheRef.current.clear();
        fetchAnalytics();
      }
    },
  });

  // Fetch analytics on mount and when timeRange changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, timeRange]);

  // Set up auto-refresh interval
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      fetchAnalytics();
    }, 5000); // Refresh every 5 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchAnalytics]);

  return {
    summary,
    flowMetrics,
    agentMetrics,
    timeline,
    loading,
    error,
    timeRange,
    setTimeRange,
    refresh: fetchAnalytics,
  };
}
