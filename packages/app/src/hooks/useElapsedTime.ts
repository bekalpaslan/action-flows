import { useState, useEffect, useRef } from 'react';

/**
 * Live elapsed time counter for running pipeline nodes.
 * Ticks every 1 second while isRunning is true and startedAt is provided.
 * Returns elapsed milliseconds or null when not running.
 */
export function useElapsedTime(startedAt: string | null, isRunning: boolean): number | null {
  const [elapsed, setElapsed] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning || !startedAt) {
      setElapsed(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const start = new Date(startedAt).getTime();

    // Immediate first tick
    setElapsed(Date.now() - start);

    // Update every second
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, startedAt]);

  return elapsed;
}
