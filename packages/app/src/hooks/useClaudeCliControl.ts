/**
 * useClaudeCliControl hook
 * Controls a specific Claude CLI session (send input, stop)
 */

import { useCallback, useState } from 'react';
import { claudeCliService } from '../services/claudeCliService';
import type { SessionId } from '@afw/shared';

export interface UseClaudeCliControlReturn {
  sendInput: (input: string) => Promise<void>;
  stop: (signal?: 'SIGTERM' | 'SIGINT' | 'SIGKILL') => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for controlling a Claude CLI session
 */
export function useClaudeCliControl(sessionId: SessionId): UseClaudeCliControlReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendInput = useCallback(async (input: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await claudeCliService.sendInput(sessionId, input);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send input');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const stop = useCallback(async (signal?: 'SIGTERM' | 'SIGINT' | 'SIGKILL') => {
    setIsLoading(true);
    setError(null);

    try {
      await claudeCliService.stopSession(sessionId, signal);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop session');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return {
    sendInput,
    stop,
    isLoading,
    error,
  };
}
