/**
 * Hook for handling terminal output events from WebSocket
 */

import { useEffect, useRef } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { eventGuards, type TerminalOutputEvent, type SessionId } from '@afw/shared';

interface UseTerminalEventsProps {
  sessionIds: SessionId[];
  onTerminalOutput: (event: TerminalOutputEvent) => void;
}

export function useTerminalEvents({
  sessionIds,
  onTerminalOutput,
}: UseTerminalEventsProps) {
  const { onEvent } = useWebSocketContext();
  const sessionIdsRef = useRef(sessionIds);

  // Update ref when sessionIds change
  useEffect(() => {
    sessionIdsRef.current = sessionIds;
  }, [sessionIds]);

  // Subscribe to terminal output events
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribe = onEvent((event) => {
      // Only process terminal output events for sessions we're tracking
      if (
        eventGuards.isTerminalOutput(event) &&
        sessionIdsRef.current.includes(event.sessionId)
      ) {
        onTerminalOutput(event);
      }
    });

    return unsubscribe;
  }, [onEvent, onTerminalOutput]);
}
