/**
 * Hook for session control commands
 * Provides functions to issue pause, resume, cancel, retry, and skip commands
 */

import { useCallback } from 'react';
import type { SessionId, StepNumber } from '@afw/shared';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface UseSessionControlsReturn {
  pause: (sessionId: SessionId, graceful?: boolean, reason?: string) => Promise<void>;
  resume: (sessionId: SessionId) => Promise<void>;
  cancel: (sessionId: SessionId, reason?: string) => Promise<void>;
  retry: (sessionId: SessionId, stepNumber: StepNumber) => Promise<void>;
  skip: (sessionId: SessionId, stepNumber: StepNumber) => Promise<void>;
}

export function useSessionControls(): UseSessionControlsReturn {
  const sendCommand = useCallback(
    async (sessionId: SessionId, type: string, payload?: Record<string, unknown>) => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/sessions/${sessionId}/commands`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type,
              payload,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send command');
        }

        const result = await response.json();
        console.log(`[Controls] Command ${type} queued:`, result.commandId);
        return result;
      } catch (error) {
        console.error(`[Controls] Error sending ${type} command:`, error);
        throw error;
      }
    },
    []
  );

  const pause = useCallback(
    async (sessionId: SessionId, graceful = true, reason?: string) => {
      await sendCommand(sessionId, 'pause', { graceful, reason });
    },
    [sendCommand]
  );

  const resume = useCallback(
    async (sessionId: SessionId) => {
      await sendCommand(sessionId, 'resume', { fromCurrent: true });
    },
    [sendCommand]
  );

  const cancel = useCallback(
    async (sessionId: SessionId, reason?: string) => {
      await sendCommand(sessionId, 'cancel', { reason });
    },
    [sendCommand]
  );

  const retry = useCallback(
    async (sessionId: SessionId, stepNumber: StepNumber) => {
      await sendCommand(sessionId, 'retry', { stepNumber });
    },
    [sendCommand]
  );

  const skip = useCallback(
    async (sessionId: SessionId, stepNumber: StepNumber) => {
      await sendCommand(sessionId, 'skip', { stepNumber });
    },
    [sendCommand]
  );

  return {
    pause,
    resume,
    cancel,
    retry,
    skip,
  };
}
