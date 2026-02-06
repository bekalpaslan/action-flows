import { useEffect } from 'react';
import { useEvents } from './useEvents';
import type { SessionId, WorkspaceEvent } from '@afw/shared';

/**
 * Hook that connects WebSocket events to chain state updates
 *
 * Features:
 * - Listens for step_spawned and step_completed events
 * - Maps events to chain state updates via updateStep callback
 * - Tracks chain progression in real-time
 * - Type-safe event handling
 */
export function useChainEvents(
  sessionId: SessionId,
  onStepSpawned?: (stepNumber: number) => void,
  onStepCompleted?: (stepNumber: number, duration?: number) => void,
  onStepFailed?: (stepNumber: number, error?: string) => void,
  onStepSkipped?: (stepNumber: number) => void
) {
  // Listen for relevant events
  const events = useEvents(sessionId, [
    'step_spawned',
    'step_completed',
    'step_failed',
    'step_skipped',
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
      case 'step_spawned': {
        const data = (event as any).data || {};
        const stepNumber = data.stepNumber || data.step;
        if (stepNumber !== undefined) {
          onStepSpawned?.(stepNumber);
        }
        break;
      }

      case 'step_completed': {
        const data = (event as any).data || {};
        const stepNumber = data.stepNumber || data.step;
        const duration = data.duration || undefined;
        if (stepNumber !== undefined) {
          onStepCompleted?.(stepNumber, duration);
        }
        break;
      }

      case 'step_failed': {
        const data = (event as any).data || {};
        const stepNumber = data.stepNumber || data.step;
        const error = data.error || data.message || undefined;
        if (stepNumber !== undefined) {
          onStepFailed?.(stepNumber, error);
        }
        break;
      }

      case 'step_skipped': {
        const data = (event as any).data || {};
        const stepNumber = data.stepNumber || data.step;
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
  const recentStepNumber = (lastEvent as any).data?.stepNumber || null;

  return {
    lastEventType: lastEvent.type,
    lastEventTime: lastEvent.timestamp,
    recentStepNumber,
    totalEvents: events.length,
  };
}
