/**
 * SessionPanelLayout Component
 *
 * Top-level 25/75 horizontal split container for session panel system.
 * Left 25% contains stacked panels (info, CLI, conversation, prompts, folders).
 * Right 75% contains flow visualization.
 *
 * Features:
 * - Resizable split ratio with drag handle
 * - Persists split ratio to localStorage per session
 * - Min/max constraints (15% to 40% for left panel)
 * - Smooth transitions and dark theme
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Session, SessionId, FlowAction } from '@afw/shared';
import { LeftPanelStack } from './LeftPanelStack';
import { RightVisualizationArea } from './RightVisualizationArea';
import { ResizeHandle } from './ResizeHandle';
import './SessionPanelLayout.css';

export interface SessionPanelLayoutProps {
  /** Session to display */
  session: Session;

  /** Callback when session is closed */
  onSessionClose?: () => void;

  /** Callback when session is detached */
  onSessionDetach?: () => void;

  /** Callback when user submits input */
  onSubmitInput?: (input: string) => Promise<void>;

  /** Callback when a node is clicked in visualization */
  onNodeClick?: (nodeId: string) => void;

  /** Callback when an agent is clicked */
  onAgentClick?: (agentId: string) => void;

  /** Callback when a flow is selected */
  onSelectFlow?: (flow: FlowAction) => void;

  /** Available flows for SmartPromptLibrary */
  flows?: FlowAction[];

  /** Available actions for SmartPromptLibrary */
  actions?: FlowAction[];

  /** Show agents overlay in visualization */
  showAgents?: boolean;

  /** Default split ratio (percentage for left panel, default: 25) */
  defaultSplitRatio?: number;
}

const MIN_LEFT_WIDTH_PERCENT = 15;
const MAX_LEFT_WIDTH_PERCENT = 40;
const DEFAULT_SPLIT_RATIO = 25;

/**
 * Get localStorage key for split ratio persistence
 */
function getSplitRatioKey(sessionId: SessionId): string {
  return `session-panel-split-ratio-${sessionId}`;
}

/**
 * Load saved split ratio from localStorage
 */
function loadSplitRatio(sessionId: SessionId, defaultRatio: number): number {
  try {
    const saved = localStorage.getItem(getSplitRatioKey(sessionId));
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= MIN_LEFT_WIDTH_PERCENT && parsed <= MAX_LEFT_WIDTH_PERCENT) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('[SessionPanelLayout] Failed to load split ratio:', error);
  }
  return defaultRatio;
}

/**
 * Save split ratio to localStorage
 */
function saveSplitRatio(sessionId: SessionId, ratio: number): void {
  try {
    localStorage.setItem(getSplitRatioKey(sessionId), ratio.toString());
  } catch (error) {
    console.warn('[SessionPanelLayout] Failed to save split ratio:', error);
  }
}

/**
 * SessionPanelLayout - Main component
 */
export const SessionPanelLayout: React.FC<SessionPanelLayoutProps> = ({
  session,
  onSessionClose,
  onSessionDetach,
  onSubmitInput,
  onNodeClick,
  onAgentClick,
  onSelectFlow,
  flows = [],
  actions = [],
  showAgents = true,
  defaultSplitRatio = DEFAULT_SPLIT_RATIO,
}) => {
  // Load saved split ratio or use default
  const [splitRatio, setSplitRatio] = useState(() =>
    loadSplitRatio(session.id, defaultSplitRatio)
  );

  const [isDragging, setIsDragging] = useState(false);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  /**
   * Handle drag (adjust split ratio based on delta X)
   */
  const handleDrag = useCallback((deltaX: number) => {
    setSplitRatio(prevRatio => {
      // Calculate new ratio based on container width
      const container = document.querySelector('.session-panel-layout');
      if (!container) return prevRatio;

      const containerWidth = container.clientWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newRatio = prevRatio + deltaPercent;

      // Clamp to min/max
      const clampedRatio = Math.max(
        MIN_LEFT_WIDTH_PERCENT,
        Math.min(MAX_LEFT_WIDTH_PERCENT, newRatio)
      );

      return clampedRatio;
    });
  }, []);

  /**
   * Handle drag end (save to localStorage)
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    saveSplitRatio(session.id, splitRatio);
  }, [session.id, splitRatio]);

  /**
   * Update split ratio when session changes
   */
  useEffect(() => {
    const savedRatio = loadSplitRatio(session.id, defaultSplitRatio);
    setSplitRatio(savedRatio);
  }, [session.id, defaultSplitRatio]);

  return (
    <div className={`session-panel-layout ${isDragging ? 'dragging' : ''}`}>
      {/* Left Panel Stack (25% default) */}
      <div
        className="session-panel-layout__left"
        style={{ width: `${splitRatio}%` }}
      >
        <LeftPanelStack
          session={session}
          onSubmitInput={onSubmitInput}
          onSelectFlow={onSelectFlow}
          flows={flows}
          actions={actions}
        />
      </div>

      {/* Resize Handle */}
      <ResizeHandle
        onDrag={handleDrag}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />

      {/* Right Visualization Area (75% default) */}
      <div
        className="session-panel-layout__right"
        style={{ width: `${100 - splitRatio}%` }}
      >
        <RightVisualizationArea
          session={session}
          onNodeClick={onNodeClick}
          onAgentClick={onAgentClick}
          showAgents={showAgents}
        />
      </div>
    </div>
  );
};
