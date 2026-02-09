import { useEffect } from 'react';
import { useEvents } from './useEvents';
import type {
  SessionId,
  StepSpawnedEvent,
  StepCompletedEvent,
  StepFailedEvent,
  StepSkippedEvent,
} from '@afw/shared';

/**
 * Hook that connects WebSocket events to chain state updates
 *
 * Features:
 * - Listens for step:spawned, step:completed, step:failed, and step:skipped events
 * - Maps events to chain state updates via callbacks
 * - Tracks chain progression in real-time
 * - Type-safe event handling with proper discriminated union types
 */
export function useChainEvents(
  sessionId: SessionId,
  onStepSpawned?: (stepNumber: number) => void,
  onStepCompleted?: (stepNumber: number, duration?: number) => void,
  onStepFailed?: (stepNumber: number, error?: string) => void,
  onStepSkipped?: (stepNumber: number) => void
) {
  // Listen for relevant events using colon separators
  const events = useEvents(sessionId, [
    'step:spawned',
    'step:completed',
    'step:failed',
    'step:skipped',
  ]);

  /**
   * Process events and call appropriate callbacks
   */
  useEffect(() => {
    // Get the most recent event
    if (events.length === 0) return;

    const event = events[events.length - 1];

    // Handle different event types
    switch (event.type) {
      case 'step:spawned': {
        const stepEvent = event as StepSpawnedEvent;
        const stepNumber = stepEvent.stepNumber;
        if (stepNumber !== undefined) {
          onStepSpawned?.(stepNumber);
        }
        break;
      }

      case 'step:completed': {
        const stepEvent = event as StepCompletedEvent;
        const stepNumber = stepEvent.stepNumber;
        const duration = stepEvent.duration;
        if (stepNumber !== undefined) {
          onStepCompleted?.(stepNumber, duration);
        }
        break;
      }

      case 'step:failed': {
        const stepEvent = event as StepFailedEvent;
        const stepNumber = stepEvent.stepNumber;
        const error = stepEvent.error || undefined;
        if (stepNumber !== undefined) {
          onStepFailed?.(stepNumber, error);
        }
        break;
      }

      case 'step:skipped': {
        const stepEvent = event as StepSkippedEvent;
        const stepNumber = stepEvent.stepNumber;
        if (stepNumber !== undefined) {
          onStepSkipped?.(stepNumber);
        }
        break;
      }

      default:
        break;
    }
  }, [events, onStepSpawned, onStepCompleted, onStepFailed, onStepSkipped]);
}

/**
 * Hook that monitors chain progression events
 * Returns summary of recent activity
 */
export interface ChainEventSummary {
  lastEventType: string | null;
  lastEventTime: string | null;
  recentStepNumber: number | null;
  totalEvents: number;
}

export function useChainEventSummary(sessionId: SessionId): ChainEventSummary {
  const events = useEvents(sessionId);

  if (events.length === 0) {
    return {
      lastEventType: null,
      lastEventTime: null,
      recentStepNumber: null,
      totalEvents: 0,
    };
  }

  const lastEvent = events[events.length - 1];
  const recentStepNumber =
    (
      lastEvent as
        | StepSpawnedEvent
        | StepCompletedEvent
        | StepFailedEvent
        | StepSkippedEvent
    ).stepNumber || null;

  return {
    lastEventType: lastEvent.type,
    lastEventTime: lastEvent.timestamp,
    recentStepNumber,
    totalEvents: events.length,
  };
}
