/**
 * Hook for fetching and converting custom prompt registry entries to ButtonDefinitions
 */

import { useState, useEffect, useCallback } from 'react';
import type { ButtonDefinition, ProjectId, ButtonId, CustomPromptDefinition, ButtonContext, WorkspaceEvent, RegistryChangedEvent } from '@afw/shared';
import { useWebSocketContext } from '../contexts/WebSocketContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Converts context patterns (regex strings) to ButtonContext values.
 * Uses pattern analysis to infer likely contexts based on file path patterns.
 *
 * @param patterns - Array of regex pattern strings
 * @returns Array of ButtonContext values
 */
function convertPatternsToContexts(patterns?: string[]): ButtonContext[] {
  if (!patterns || patterns.length === 0) {
    return ['general'];
  }

  const contexts = new Set<ButtonContext>();

  for (const pattern of patterns) {
    const lower = pattern.toLowerCase();

    // Code-related patterns
    if (
      lower.includes('.ts') ||
      lower.includes('.tsx') ||
      lower.includes('.js') ||
      lower.includes('.jsx') ||
      lower.includes('.py') ||
      lower.includes('.go') ||
      lower.includes('.rs') ||
      lower.includes('src/') ||
      lower.includes('code')
    ) {
      contexts.add('code-change');
      contexts.add('file-modification');
    }

    // Error/bug patterns
    if (
      lower.includes('error') ||
      lower.includes('bug') ||
      lower.includes('fix') ||
      lower.includes('test')
    ) {
      contexts.add('error-message');
    }

    // Analysis patterns
    if (
      lower.includes('report') ||
      lower.includes('analysis') ||
      lower.includes('audit') ||
      lower.includes('review')
    ) {
      contexts.add('analysis-report');
    }

    // Documentation patterns
    if (
      lower.includes('.md') ||
      lower.includes('readme') ||
      lower.includes('doc')
    ) {
      contexts.add('file-modification');
    }
  }

  // If no specific contexts matched, default to general
  if (contexts.size === 0) {
    contexts.add('general');
  }

  return Array.from(contexts);
}

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
  const wsContext = useWebSocketContext();

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
            contexts: convertPatternsToContexts(def.contextPatterns),
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

  // Initial fetch on mount and when projectId changes
  useEffect(() => {
    fetchCustomPrompts();
  }, [fetchCustomPrompts]);

  // Subscribe to WebSocket registry change events
  useEffect(() => {
    if (!wsContext.onEvent) return;

    const handleRegistryEvent = (event: WorkspaceEvent) => {
      // Check if this is a registry:changed event for custom-prompt entries
      if (event.type === 'registry:changed') {
        const registryEvent = event as RegistryChangedEvent;

        // Refetch if the change affects custom-prompt entries
        // We refetch on any registry change for simplicity, but could filter by entry type
        console.log('[useCustomPromptButtons] Registry changed, refetching custom prompts');
        fetchCustomPrompts();
      }
    };

    const unsubscribe = wsContext.onEvent(handleRegistryEvent);
    return unsubscribe;
  }, [wsContext, fetchCustomPrompts]);

  return {
    buttons,
    isLoading,
    error,
    refetch: fetchCustomPrompts,
  };
}
