/**
 * LeftPanelStack Component
 *
 * Vertical stacking container for all left-side panels.
 * Manages 4 panels with mixed height strategy (fixed + flexible).
 *
 * Panel Order (top to bottom):
 * 1. SessionInfoPanel (60px fixed)
 * 2. CliPanel (flex: 1 - grows to fill)
 * 3. ConversationPanel (200px fixed)
 * 4. SmartPromptLibrary (160px fixed)
 */

import React from 'react';
import type { Session, FlowAction } from '@afw/shared';
import { SessionInfoPanel } from './SessionInfoPanel';
import { CliPanel } from './CliPanel';
import { ConversationPanel } from './ConversationPanel';
import { SmartPromptLibrary } from './SmartPromptLibrary';
import './LeftPanelStack.css';

export interface PanelHeightConfig {
  sessionInfo?: number | string;
  cli?: number | string;
  conversation?: number | string;
  smartPrompt?: number | string;
}

export interface LeftPanelStackProps {
  /** Session to display */
  session: Session;

  /** Callback when user submits input */
  onSubmitInput?: (input: string) => Promise<void>;

  /** Callback when a flow is selected */
  onSelectFlow?: (flow: FlowAction) => void;

  /** Available flows */
  flows?: FlowAction[];

  /** Available actions */
  actions?: FlowAction[];

  /** Optional custom panel heights */
  panelHeights?: PanelHeightConfig;
}

/**
 * Default panel heights
 */
const DEFAULT_HEIGHTS: Required<PanelHeightConfig> = {
  sessionInfo: '60px',
  cli: 'flex',
  conversation: '200px',
  smartPrompt: '160px',
};

/**
 * LeftPanelStack - Main component
 */
export const LeftPanelStack: React.FC<LeftPanelStackProps> = ({
  session,
  onSubmitInput,
  onSelectFlow,
  flows = [],
  actions = [],
  panelHeights = {},
}) => {
  // Merge custom heights with defaults
  const heights = { ...DEFAULT_HEIGHTS, ...panelHeights };

  return (
    <div className="left-panel-stack">
      {/* 1. SessionInfoPanel - Session metadata (compact) */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--info"
        style={{
          height: heights.sessionInfo,
          flexShrink: 0,
        }}
      >
        <SessionInfoPanel session={session} />
      </div>

      {/* 2. CliPanel - Terminal (flexible, takes remaining space) */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--cli"
        style={{
          flex: heights.cli === 'flex' ? 1 : undefined,
          height: heights.cli !== 'flex' ? heights.cli : undefined,
          minHeight: '200px',
        }}
      >
        <CliPanel sessionId={session.id} />
      </div>

      {/* 3. ConversationPanel - Messages */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--conversation"
        style={{
          height: heights.conversation,
          flexShrink: 0,
        }}
      >
        <ConversationPanel
          session={session}
          onSubmitInput={onSubmitInput || (async (_input: string) => {})}
        />
      </div>

      {/* 4. SmartPromptLibrary - Flow/action buttons */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--prompts"
        style={{
          height: heights.smartPrompt,
          flexShrink: 0,
        }}
      >
        <SmartPromptLibrary
          flows={flows}
          actions={actions}
          onSelectFlow={onSelectFlow || (() => {})}
        />
      </div>
    </div>
  );
};
