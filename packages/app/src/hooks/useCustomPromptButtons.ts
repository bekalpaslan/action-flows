/**
 * Hook for fetching and converting custom prompt registry entries to ButtonDefinitions
 */

import { useState, useEffect, useCallback } from 'react';
import type { ButtonDefinition, ProjectId, ButtonId, CustomPromptDefinition } from '@afw/shared';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface UseCustomPromptButtonsResult {
  /** Custom prompt buttons as ButtonDefinitions */
  buttons: ButtonDefinition[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch function */
  refetch: () => Promise<void>;
}

/**
 * Fetches custom prompt entries from the registry and converts them to ButtonDefinitions.
 * Filters by enabled entries only.
 *
 * @param projectId - Optional project ID for scoping custom prompts
 * @returns Object with buttons array, loading state, error, and refetch function
 */
export function useCustomPromptButtons(projectId?: ProjectId): UseCustomPromptButtonsResult {
  const [buttons, setButtons] = useState<ButtonDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCustomPrompts = useCallback(async () => {
    if (!projectId) {
      // No projectId = no custom prompts to fetch
      setButtons([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`${BACKEND_URL}/api/registry/entries`);
      url.searchParams.set('type', 'custom-prompt');
      url.searchParams.set('enabled', 'true');
      if (projectId) {
        url.searchParams.set('projectId', projectId);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch custom prompts: ${response.status}`);
      }

      const entries = await response.json();

      // Convert registry entries to ButtonDefinitions
      const buttonDefs: ButtonDefinition[] = entries
        .filter((entry: any) => entry.type === 'custom-prompt' && entry.data?.definition)
        .map((entry: any) => {
          const def: CustomPromptDefinition = entry.data.definition;

          return {
            id: entry.id as ButtonId,
            label: def.label,
            icon: def.icon || '💬',
            action: {
              type: 'quick-action' as const,
              payload: {
                value: def.prompt,
                alwaysShow: def.alwaysShow,
              },
            },
            contexts: ['general' as const], // TODO: Implement contextPatterns → ButtonContext[] conversion when context pattern UI is added
            source: entry.source,
            priority: 100, // Lower priority than core buttons
            enabled: entry.enabled,
          };
        });

      setButtons(buttonDefs);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[useCustomPromptButtons] Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCustomPrompts();
  }, [fetchCustomPrompts]);

  return {
    buttons,
    isLoading,
    error,
    refetch: fetchCustomPrompts,
  };
}
