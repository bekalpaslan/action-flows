/**
 * useRegionPersonality Hook
 * Maps region activity to the personality of the active agent working in that region
 *
 * Part of Phase 2C - Personality Completion (Thread 5)
 *
 * Listens to step:started WebSocket events and determines which personality
 * is active in a specific region based on the action type.
 */

import { useState, useEffect } from 'react';
import type { RegionId, AgentPersonality, StepStartedEvent, StepCompletedEvent } from '@afw/shared';
import { mapActionToRegion } from '@afw/shared';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { usePersonalities } from './usePersonalities';

export interface RegionPersonalityState {
  /** The personality currently active in this region (null if idle) */
  activePersonality: AgentPersonality | null;
  /** Whether a step is currently executing in this region */
  isActive: boolean;
}

export function useRegionPersonality(regionId: RegionId): RegionPersonalityState {
  const ws = useWebSocketContext();
  const { getPersonality } = usePersonalities();
  const [activePersonality, setActivePersonality] = useState<AgentPersonality | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!ws.onEvent) return;

    const handleEvent = (event: any) => {
      // Handle step:started - activate personality for region
      if (event.type === 'step:started') {
        const stepEvent = event as StepStartedEvent;
        if (stepEvent.action) {
          const targetRegion = mapActionToRegion(stepEvent.action);
          if (targetRegion === regionId) {
            // Look up the personality for this action type
            const personalityData = getPersonality(stepEvent.action);
            if (personalityData?.personality) {
              setActivePersonality(personalityData.personality);
              setIsActive(true);
            }
          }
        }
      }

      // Handle step:completed - clear personality for region
      if (event.type === 'step:completed') {
        const stepEvent = event as StepCompletedEvent;
        if (stepEvent.action) {
          const targetRegion = mapActionToRegion(stepEvent.action);
          if (targetRegion === regionId) {
            // Clear after a brief delay to allow visual feedback
            setTimeout(() => {
              setActivePersonality(null);
              setIsActive(false);
            }, 1000);
          }
        }
      }
    };

    const unsubscribe = ws.onEvent(handleEvent);
    return () => {
      unsubscribe();
    };
  }, [ws, regionId, getPersonality]);

  return { activePersonality, isActive };
}
