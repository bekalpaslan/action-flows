/**
 * WorkWorkbench Component
 * Primary workbench for active development sessions
 *
 * Features:
 * - Displays active session using SessionPanelLayout with 25/75 split panel architecture
 * - Header showing attached session count
 * - Empty state when no sessions are attached
 * - Session control callbacks (close, detach, input)
 *
 * Layout:
 * - Header bar with session count and controls
 * - SessionPanelLayout for displaying active session
 */

import React from 'react';
import type { Session, FlowAction } from '@afw/shared';
import { SessionPanelLayout } from '../SessionPanel';
import './WorkWorkbench.css';

export interface WorkWorkbenchProps {
  /** Sessions currently attached to this workbench */
  sessions: Session[];

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
  onSessionClose,
  onSessionDetach,
  onSessionInput,
  onNodeClick,
  onAgentClick,
  flows = [],
  actions = [],
}: WorkWorkbenchProps): React.ReactElement {
  const sessionCount = sessions.length;

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
          {/* Future: Add workbench controls (layout toggle, etc.) */}
        </div>
      </div>

      {/* Main Content - SessionPanelLayout for active session */}
      <div className="work-workbench__content">
        {sessionCount === 0 ? (
          <div className="work-workbench__empty-state">
            <p>No sessions attached. Select a session from the sidebar to begin.</p>
          </div>
        ) : (
          <SessionPanelLayout
            session={sessions[0]}
            onSessionClose={() => onSessionClose?.(sessions[0].id)}
            onSessionDetach={() => onSessionDetach?.(sessions[0].id)}
            onSubmitInput={async (input) => {
              await onSessionInput?.(sessions[0].id, input);
            }}
            onNodeClick={(nodeId) => onNodeClick?.(sessions[0].id, nodeId)}
            onAgentClick={(agentId) => onAgentClick?.(sessions[0].id, agentId)}
            flows={flows}
            actions={actions}
          />
        )}
      </div>
    </div>
  );
}
