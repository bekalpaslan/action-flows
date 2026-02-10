/**
 * WorkWorkbench Component
 * Primary workbench for active development sessions
 *
 * Features:
 * - Header showing attached session count
 * - Empty state when no sessions are attached
 * - Session control callbacks (close, detach, input)
 * - Chat interface now provided by SlidingChatWindow in WorkbenchLayout
 *
 * Layout:
 * - Header bar with session count and controls
 */

import React from 'react';
import type { Session, FlowAction } from '@afw/shared';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './WorkWorkbench.css';

export interface WorkWorkbenchProps {
  /** Sessions currently attached to this workbench */
  sessions: Session[];

  /** Active session ID (determines which session to display) */
  activeSessionId?: string;

  /** Callback when a session is closed */
  onSessionClose?: (sessionId: string) => void;

  /** Callback when a session is detached from the workbench */
  onSessionDetach?: (sessionId: string) => void;

  /** Callback when user submits input in a session */
  onSessionInput?: (sessionId: string, input: string) => Promise<void>;

  /** Callback when a flow node is clicked */
  onNodeClick?: (sessionId: string, nodeId: string) => void;

  /** Callback when an agent avatar is clicked */
  onAgentClick?: (sessionId: string, agentId: string) => void;

  /** Available flows for SmartPromptLibrary */
  flows?: FlowAction[];

  /** Available actions for SmartPromptLibrary */
  actions?: FlowAction[];
}

/**
 * WorkWorkbench - Main workbench for active development work
 */
export function WorkWorkbench({
  sessions,
  activeSessionId,
  onSessionClose,
  onSessionDetach,
  onSessionInput,
  onNodeClick,
  onAgentClick,
  flows = [],
  actions = [],
}: WorkWorkbenchProps): React.ReactElement {
  const sessionCount = sessions.length;

  // Determine the active session: use activeSessionId if provided, else default to first session
  const activeSession = activeSessionId
    ? sessions.find(s => s.id === activeSessionId) || sessions[0]
    : sessions[0];

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'WorkWorkbench',
    getContext: () => ({
      sessionCount: sessions.length,
      activeSession: activeSession?.id || null,
    }),
  });

  return (
    <div className="work-workbench">
      {/* Header Bar */}
      <div className="work-workbench__header">
        <div className="work-workbench__header-left">
          <h1 className="work-workbench__title">Work Dashboard</h1>
          <div className="work-workbench__session-count">
            <span className="session-count-badge">
              {sessionCount === 0 ? 'No sessions' : `${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'}`}
            </span>
          </div>
        </div>
        <div className="work-workbench__header-right">
          <DiscussButton componentName="WorkWorkbench" onClick={openDialog} size="small" />
          {/* Future: Add workbench controls (layout toggle, etc.) */}
        </div>
      </div>

      {/* Main Content - Chat functionality now provided by SlidingChatWindow */}
      <div className="work-workbench__content">
        {sessionCount === 0 ? (
          <div className="work-workbench__empty-state">
            <p>No sessions attached. Select a session from the sidebar to begin.</p>
          </div>
        ) : activeSession ? (
          <div className="work-workbench__session-info">
            <p>Session: {activeSession.id}</p>
            <p>Use the chat panel on the right to interact with this session.</p>
          </div>
        ) : (
          <div className="work-workbench__empty-state">
            <p>Active session not found. Select a session from the sidebar.</p>
          </div>
        )}
      </div>

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="WorkWorkbench"
        componentContext={{
          sessionCount: sessions.length,
          activeSession: activeSession?.id || null,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
