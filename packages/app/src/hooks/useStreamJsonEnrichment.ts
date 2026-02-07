import { useEffect, useState, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { SessionId } from '@afw/shared';
import {
  parseStreamJson,
  mapToolUseToSteps,
  detectTaskSpawns,
  type EnrichedStepData,
} from '../utils/streamJsonParser';

/**
 * Enriched session data from stream-JSON
 */
export interface StreamEnrichedSession {
  sessionId: SessionId;
  steps: EnrichedStepData[];
  tasks: Array<{
    taskName: string;
    toolUseId: string;
    timestamp: number;
  }>;
  lastUpdate: number;
}

/**
 * useStreamJsonEnrichment hook
 *
 * Listens for Claude CLI output events and parses stream-JSON to enrich session data
 * Fallback data source when ActionFlows events are not available
 */
export function useStreamJsonEnrichment(sessionId?: SessionId) {
  const [enrichedSessions, setEnrichedSessions] = useState<Map<SessionId, StreamEnrichedSession>>(
    new Map()
  );
  const { onEvent } = useWebSocketContext();

  /**
   * Parse and enrich session from CLI output
   */
  const enrichSession = useCallback((sessionId: SessionId, output: string) => {
    const blocks = parseStreamJson(output);
    const steps = mapToolUseToSteps(blocks);
    const tasks = detectTaskSpawns(blocks);

    const enriched: StreamEnrichedSession = {
      sessionId,
      steps,
      tasks,
      lastUpdate: Date.now(),
    };

    setEnrichedSessions(prev => new Map(prev).set(sessionId, enriched));

    return enriched;
  }, []);

  /**
   * Get enriched data for a session
   */
  const getEnrichedSession = useCallback(
    (sessionId: SessionId): StreamEnrichedSession | undefined => {
      return enrichedSessions.get(sessionId);
    },
    [enrichedSessions]
  );

  /**
   * Clear enriched data for a session
   */
  const clearEnrichedSession = useCallback((sessionId: SessionId) => {
    setEnrichedSessions(prev => {
      const next = new Map(prev);
      next.delete(sessionId);
      return next;
    });
  }, []);

  // Listen for claude-cli:output events
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribe = onEvent((event) => {
      // Filter for CLI output events
      if (event.type === 'claude-cli:output') {
        const eventSessionId = event.sessionId;
        const output = ('output' in event && typeof event.output === 'string') ? event.output : '';

        // If filtering by sessionId, only process matching session
        if (sessionId && eventSessionId !== sessionId) {
          return;
        }

        // Parse and enrich
        enrichSession(eventSessionId, output);
      }
    });

    return unsubscribe;
  }, [onEvent, sessionId, enrichSession]);

  return {
    enrichedSessions,
    enrichSession,
    getEnrichedSession,
    clearEnrichedSession,
  };
}
