/**
 * useDiscoveredSessions Hook
 * Polls for externally-running Claude Code sessions detected via IDE lock files.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DiscoveredClaudeSession } from '@afw/shared';
import { claudeCliService } from '../services/claudeCliService';

const POLL_INTERVAL_MS = 12_000;

interface UseDiscoveredSessionsResult {
  sessions: DiscoveredClaudeSession[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  lastRefreshedAt: string | null;
}

export function useDiscoveredSessions(): UseDiscoveredSessionsResult {
  const [sessions, setSessions] = useState<DiscoveredClaudeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const result = await claudeCliService.discoverSessions({ enrich: true, aliveOnly: true });
      setSessions(result);
      setError(null);
      setLastRefreshedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to discover sessions'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    intervalRef.current = setInterval(fetchSessions, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    refresh: fetchSessions,
    lastRefreshedAt,
  };
}
