import { useState, useEffect, useCallback } from 'react';
import type { Chain, SessionId } from '@afw/shared';
import { useEvents } from './useEvents';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Hook that fetches and subscribes to chain updates for a session
 *
 * Features:
 * - Fetches chains from backend on mount
 * - Returns active chain (most recent) and all chains
 * - Refetches when chain:compiled events arrive
 * - Provides loading state
 */
export interface UseActiveChainResult {
  /** Most recent chain (active chain) */
  activeChain: Chain | null;
  /** All chains for the session */
  allChains: Chain[];
  /** Loading state */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch chains manually */
  refetch: () => Promise<void>;
}

export function useActiveChain(sessionId: SessionId): UseActiveChainResult {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for chain-related events
  const events = useEvents(sessionId, ['chain:compiled', 'chain:started', 'chain:completed']);

  /**
   * Fetch chains from backend
   */
  const fetchChains = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/chains`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chains: ${response.statusText}`);
      }

      const data = await response.json();
      setChains(data.chains || []);
    } catch (err) {
      console.error('[useActiveChain] Error fetching chains:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setChains([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * Fetch chains on mount and when sessionId changes
   */
  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  /**
   * Refetch when chain events arrive
   */
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[events.length - 1];
      // Refetch on chain lifecycle events
      if (
        latestEvent.type === 'chain:compiled' ||
        latestEvent.type === 'chain:started' ||
        latestEvent.type === 'chain:completed'
      ) {
        fetchChains();
      }
    }
  }, [events, fetchChains]);

  // Most recent chain is the active chain
  const activeChain = chains.length > 0 ? chains[chains.length - 1] : null;

  return {
    activeChain,
    allChains: chains,
    loading,
    error,
    refetch: fetchChains,
  };
}
