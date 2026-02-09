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
 * 4. SmartPromptLibrary (180px fixed) - PLACEHOLDER
 * 5. FolderHierarchy (200px fixed) - PLACEHOLDER
 */

import React from 'react';
import type { Session, FlowAction } from '@afw/shared';
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
        <div className="panel-placeholder">
          <div className="panel-placeholder__title">Session Info</div>
          <div className="panel-placeholder__hint">
            SessionInfoPanel will be added by parallel agent
          </div>
        </div>
      </div>

      {/* 2. CliPanel - Terminal */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--cli"
        style={{
          height: heights.cli,
          flexShrink: 0,
        }}
      >
        <div className="panel-placeholder">
          <div className="panel-placeholder__title">CLI Terminal</div>
          <div className="panel-placeholder__hint">
            CliPanel will be added by parallel agent
          </div>
        </div>
      </div>

      {/* 3. ConversationPanel - Messages (flexible height) */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--conversation"
        style={{
          flex: heights.conversation === 'flex' ? 1 : undefined,
          height: heights.conversation !== 'flex' ? heights.conversation : undefined,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div className="panel-placeholder">
          <div className="panel-placeholder__title">Conversation</div>
          <div className="panel-placeholder__hint">
            ConversationPanel will be added by parallel agent
          </div>
        </div>
      </div>

      {/* 4. SmartPromptLibrary - Flow/action buttons */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--prompts"
        style={{
          height: heights.smartPrompt,
          flexShrink: 0,
        }}
      >
        <div className="panel-placeholder">
          <div className="panel-placeholder__title">Smart Prompts</div>
          <div className="panel-placeholder__hint">
            SmartPromptLibrary will be added by parallel agent
          </div>
        </div>
      </div>

      {/* 5. FolderHierarchy - Workspace navigation */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--folders"
        style={{
          height: heights.folderHierarchy,
          flexShrink: 0,
        }}
      >
        <div className="panel-placeholder">
          <div className="panel-placeholder__title">Workspace</div>
          <div className="panel-placeholder__hint">
            FolderHierarchy will be added by parallel agent
          </div>
        </div>
      </div>
    </div>
  );
};
