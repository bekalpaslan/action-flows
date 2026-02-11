/**
 * useGateTraces Hook
 * Manages gate trace collection and filtering
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { eventGuards } from '@afw/shared';
import type { SessionId } from '@afw/shared';

/**
 * Gate trace entry
 */
export interface GateTrace {
  id: string;
  name: string;
  timestamp: string;
  status: 'pass' | 'fail' | 'pending';
  fromRegion: string;
  toRegion: string;
  passCount: number;
  failCount: number;
}

/**
 * Gate trace statistics
 */
export interface GateTraceStats {
  total: number;
  passed: number;
  violated: number;
  passRate: number;
}

/**
 * Hook options
 */
export interface UseGateTracesOptions {
  /** Max number of traces to keep in memory */
  maxTraces?: number;

  /** Session ID to listen for gate events */
  sessionId: SessionId;

  /** Callback when a new gate trace is received */
  onNewTrace?: (trace: GateTrace) => void;
}

/**
 * useGateTraces Hook
 * Listens for gate:passed and gate:violated events from WebSocket
 */
export function useGateTraces(options: UseGateTracesOptions) {
  const { maxTraces = 100, sessionId, onNewTrace } = options;

  // State
  const [traces, setTraces] = useState<GateTrace[]>([]);
  const [stats, setStats] = useState<GateTraceStats>({
    total: 0,
    passed: 0,
    violated: 0,
    passRate: 0,
  });

  // WebSocket context
  const { onEvent } = useWebSocketContext();

  // Track if we've subscribed
  const subscribedRef = useRef(false);

  /**
   * Update statistics
   */
  const updateStats = useCallback((allTraces: GateTrace[]) => {
    const total = allTraces.length;
    const passed = allTraces.filter((t) => t.status === 'pass').length;
    const violated = allTraces.filter((t) => t.status === 'fail').length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    setStats({
      total,
      passed,
      violated,
      passRate,
    });
  }, []);

  /**
   * Add a new gate trace
   */
  const addTrace = useCallback(
    (trace: GateTrace) => {
      setTraces((prev) => {
        const updated = [trace, ...prev].slice(0, maxTraces);
        updateStats(updated);
        return updated;
      });

      if (onNewTrace) {
        onNewTrace(trace);
      }
    },
    [maxTraces, updateStats, onNewTrace]
  );

  /**
   * Clear all traces
   */
  const clearTraces = useCallback(() => {
    setTraces([]);
    updateStats([]);
  }, [updateStats]);

  /**
   * Get traces filtered by status
   */
  const getTracesByStatus = useCallback(
    (status: 'pass' | 'fail' | 'pending') => {
      return traces.filter((t) => t.status === status);
    },
    [traces]
  );

  /**
   * Get trace by ID
   */
  const getTraceById = useCallback(
    (id: string) => {
      return traces.find((t) => t.id === id);
    },
    [traces]
  );

  /**
   * Subscribe to WebSocket events
   */
  useEffect(() => {
    if (!onEvent || subscribedRef.current) {
      return;
    }

    subscribedRef.current = true;

    const unsubscribe = onEvent((event) => {
      // Check if this is a gate event using type guard
      if (!eventGuards.isGateUpdated(event)) {
        return;
      }

      // Only process events for this session
      if (event.sessionId !== sessionId) {
        return;
      }

      // Extract gate data from event (now properly typed)
      const gateTrace: GateTrace = {
        id: `gate-${event.fromRegion}-${event.toRegion}-${Date.now()}`,
        name: `Gate: ${event.fromRegion} → ${event.toRegion}`,
        timestamp: event.timestamp || new Date().toISOString(),
        status: event.status || 'pending',
        fromRegion: event.fromRegion || 'Unknown',
        toRegion: event.toRegion || 'Unknown',
        passCount: event.passCount || 0,
        failCount: event.failCount || 0,
      };

      addTrace(gateTrace);
    });

    return () => {
      subscribedRef.current = false;
      unsubscribe();
    };
  }, [onEvent, sessionId, addTrace]);

  return {
    traces,
    stats,
    addTrace,
    clearTraces,
    getTracesByStatus,
    getTraceById,
  };
}
