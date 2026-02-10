/**
 * LeftPanelStack Component
 *
 * Container for the left-side panel.
 * Now renders a single component: ChatPanel (with integrated session info header).
 *
 * Panel:
 * 1. ChatPanel (flex: 1 - fills entire space, session info in its header bar)
 */

import React from 'react';
import type { Session, FlowAction } from '@afw/shared';
import { ChatPanel } from './ChatPanel';
import './LeftPanelStack.css';

export interface PanelHeightConfig {
  chat?: number | string;
}

export interface LeftPanelStackProps {
  /** Session to display */
  session: Session;

  /** Callback when user sends a message */
  onSendMessage?: (message: string) => Promise<void>;

  /** Callback when user submits input (legacy, passed to ChatPanel as onSendMessage) */
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
 * LeftPanelStack - Main component
 * Single panel: ChatPanel with integrated session info header
 */
export const LeftPanelStack: React.FC<LeftPanelStackProps> = ({
  session,
  onSendMessage,
  onSubmitInput,
  onSelectFlow: _onSelectFlow,
  flows: _flows = [],
  actions: _actions = [],
  panelHeights: _panelHeights = {},
}) => {
  // Use onSendMessage if provided, fall back to onSubmitInput for backward compat
  const handleSendMessage = onSendMessage || onSubmitInput;

  return (
    <div className="left-panel-stack">
      {/* ChatPanel - Unified chat interface with integrated session info */}
      <div
        className="left-panel-stack__panel left-panel-stack__panel--chat"
        style={{
          flex: 1,
          minHeight: '300px',
        }}
      >
        <ChatPanel
          sessionId={session.id}
          session={session}
          collapsible
        />
      </div>
    </div>
  );
};
