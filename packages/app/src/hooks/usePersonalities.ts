/**
 * usePersonalities Hook
 * Fetches and manages agent personality data from the backend
 *
 * Part of Phase 1 - Agent Personalities (Thread 5)
 */

import { useState, useEffect } from 'react';
import type { AgentMetadata } from '@afw/shared';

export interface UsePersonalitiesResult {
  /** List of all agent personalities */
  personalities: AgentMetadata[];

  /** Get personality for a specific action type */
  getPersonality: (actionType: string) => AgentMetadata | undefined;

  /** Loading state */
  loading: boolean;

  /** Error message if fetch failed */
  error: string | null;
}

export function usePersonalities(): UsePersonalitiesResult {
  const [personalities, setPersonalities] = useState<AgentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/personalities')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setPersonalities(data.personalities || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getPersonality = (actionType: string) =>
    personalities.find(p => p.actionType === actionType);

  return { personalities, getPersonality, loading, error };
}
