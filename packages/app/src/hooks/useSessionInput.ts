/**
 * Hook for submitting user input to sessions
 * Handles POST /sessions/:id/input endpoint
 */

import { useCallback, useState } from 'react';
import type { SessionId } from '@afw/shared';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface UseSessionInputReturn {
  submitInput: (sessionId: SessionId, input: string, prompt?: string) => Promise<void>;
  isSubmitting: boolean;
  error: Error | null;
}

export function useSessionInput(): UseSessionInputReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitInput = useCallback(async (sessionId: SessionId, input: string, prompt?: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = `${BACKEND_URL}/api/sessions/${sessionId}/input`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to submit input: ${response.statusText}`);
      }

      console.log(`Input submitted for session ${sessionId}`);
    } catch (err) {
      const submitError = err instanceof Error ? err : new Error('Failed to submit input');
      console.error('Error submitting input:', submitError);
      setError(submitError);
      throw submitError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submitInput, isSubmitting, error };
}
