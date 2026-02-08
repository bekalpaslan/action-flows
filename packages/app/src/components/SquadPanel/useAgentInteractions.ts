/**
 * useAgentInteractions - Hook for managing agent UI interactions
 * Handles hover state, expand/collapse state, and eye tracking calculations
 *
 * Features:
 * - Hover tracking with setHoveredAgent
 * - Single-agent expand state (only one expanded at a time)
 * - Eye target calculation from mouse position relative to agent
 * - Proper cleanup and memoization
 */

import { useState, useCallback } from 'react';
import type { UseAgentInteractionsResult } from './types';

/**
 * Hook to manage interaction state for agent cards
 * Provides hover tracking, expand/collapse toggles, and eye target calculation
 */
export function useAgentInteractions(): UseAgentInteractionsResult {
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  /**
   * Toggle expanded state for an agent
   * Only allows one agent to be expanded at a time
   */
  const toggleExpanded = useCallback((agentId: string) => {
    setExpandedAgentId((current) => {
      // If clicking the same agent, collapse it
      if (current === agentId) {
        return null;
      }
      // Otherwise, expand the new agent (collapse any previous)
      return agentId;
    });
  }, []);

  /**
   * Calculate eye target position from mouse event
   * Returns normalized coordinates relative to agent element for eye tracking animation
   */
  const calculateEyeTarget = useCallback(
    (event: React.MouseEvent, agentElement: HTMLElement): { x: number; y: number } => {
      const rect = agentElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = event.clientX;
      const mouseY = event.clientY;

      const deltaX = mouseX - centerX;
      const deltaY = mouseY - centerY;

      // Normalize to -1 to 1 range
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = Math.max(rect.width, rect.height) * 1.5;

      return {
        x: distance > 0 ? (deltaX / maxDistance) * 0.8 : 0,
        y: distance > 0 ? (deltaY / maxDistance) * 0.8 : 0,
      };
    },
    []
  );

  return {
    hoveredAgentId,
    setHoveredAgent: setHoveredAgentId,
    expandedAgentId,
    toggleExpanded,
    calculateEyeTarget,
  };
}
