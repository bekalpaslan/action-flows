/**
 * LeftPanelStack Component
 *
 * Vertical stacking container for all left-side panels.
 * Manages 5 panels with mixed height strategy (fixed + flexible).
 *
 * Panel Order (top to bottom):
 * 1. SessionInfoPanel (120px fixed)
 * 2. CliPanel (200px fixed)
 * 3. ConversationPanel (flex: 1 - grows to fill)
 * 4. SmartPromptLibrary (180px fixed)
 * 5. FolderHierarchy (200px fixed)
 */

import React from 'react';
import type { Session, FlowAction } from '@afw/shared';
import { SessionInfoPanel } from './SessionInfoPanel';
import { CliPanel } from './CliPanel';
import { ConversationPanel } from './ConversationPanel';
import { SmartPromptLibrary } from './SmartPromptLibrary';
import { FolderHierarchy } from './FolderHierarchy';
import './LeftPanelStack.css';

export interface PanelHeightConfig {
  sessionInfo?: number | string;
  cli?: number | string;
  conversation?: number | string;
  smartPrompt?: number | string;
  folderHierarchy?: number | string;
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
  sessionInfo: '120px',
  cli: '200px',
  conversation: 'flex',
  smartPrompt: '180px',
  folderHierarchy: '200px',
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
      {/* 1. SessionInfoPanel - Session metadata */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--info"
        style={{
          height: heights.sessionInfo,
          flexShrink: 0,
        }}
      >
        <SessionInfoPanel session={session} />
      </div>

      {/* 2. CliPanel - Terminal */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--cli"
        style={{
          height: heights.cli,
          flexShrink: 0,
        }}
      >
        <CliPanel sessionId={session.id} />
      </div>

      {/* 3. ConversationPanel - Messages (flexible height) */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--conversation"
        style={{
          flex: heights.conversation === 'flex' ? 1 : undefined,
          height: heights.conversation !== 'flex' ? heights.conversation : undefined,
          minHeight: '150px',
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

      {/* 5. FolderHierarchy - Workspace navigation */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--folders"
        style={{
          height: heights.folderHierarchy,
          flexShrink: 0,
        }}
      >
        <FolderHierarchy
          workspaceRoot={session.cwd || 'D:/ActionFlowsDashboard'}
        />
      </div>
    </div>
  );
};
