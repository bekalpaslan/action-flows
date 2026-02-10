/**
 * Hook for fetching reminder definitions and managing reminder instances
 */

import { useState, useEffect, useCallback } from 'react';
import type { ReminderDefinition, ReminderInstance, SessionId, ChainId, ReminderVariant } from '@afw/shared';
import { useWebSocketContext } from '../contexts/WebSocketContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface UseReminderButtonsResult {
  /** Available reminder definitions */
  definitions: ReminderDefinition[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch definitions */
  refetch: () => Promise<void>;
  /** Create reminder instance */
  createInstance: (
    reminderId: string,
    sessionId: SessionId,
    chainId: ChainId | null,
    reminderText: string,
    variant: ReminderVariant
  ) => Promise<ReminderInstance | null>;
}

/**
 * Fetches reminder definitions from the backend
 *
 * @returns Object with definitions, loading state, error, refetch, and createInstance
 */
export function useReminderButtons(): UseReminderButtonsResult {
  const [definitions, setDefinitions] = useState<ReminderDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const wsContext = useWebSocketContext();

  const fetchDefinitions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = new URL(`${BACKEND_URL}/api/registry/entries`);
      url.searchParams.set('type', 'reminder');
      url.searchParams.set('enabled', 'true');

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch reminder definitions: ${response.statusText}`);
      }

      const entries = await response.json();

      // Extract reminder definitions from registry entries
      const reminderDefs: ReminderDefinition[] = entries
        .filter((entry: any) => entry.type === 'reminder' && entry.data?.definition)
        .map((entry: any) => ({ id: entry.id, ...entry.data.definition }));

      setDefinitions(reminderDefs);
    } catch (err) {
      console.error('[useReminderButtons] Error fetching definitions:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  // Refetch when registry changes
  useEffect(() => {
    if (!wsContext.onEvent) return;

    const unsubscribe = wsContext.onEvent((event) => {
      if (event.type === 'registry:changed') {
        fetchDefinitions();
      }
    });

    return unsubscribe;
  }, [wsContext, wsContext.onEvent, fetchDefinitions]);

  const createInstance = useCallback(async (
    reminderId: string,
    sessionId: SessionId,
    chainId: ChainId | null,
    reminderText: string,
    variant: ReminderVariant
  ): Promise<ReminderInstance | null> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reminders/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderId,
          sessionId,
          chainId,
          reminderText,
          variant,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create reminder instance: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('[useReminderButtons] Error creating instance:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return null;
    }
  }, []);

  return {
    definitions,
    isLoading,
    error,
    refetch: fetchDefinitions,
    createInstance,
  };
}
