/**
 * WorkWorkbench Component
 * Primary workbench for active development sessions
 *
 * Features:
 * - Displays 1-4 SessionTiles in a dynamic grid layout
 * - Header showing attached session count
 * - Empty state when no sessions are attached
 * - Session control callbacks (close, detach, input)
 *
 * Layout:
 * - Header bar with session count and controls
 * - SessionTileGrid for displaying attached sessions
 */

import React from 'react';
import type { Session } from '@afw/shared';
import { SessionTileGrid } from './SessionTileGrid';
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

      {/* Main Content - SessionTileGrid */}
      <div className="work-workbench__content">
        <SessionTileGrid
          sessions={sessions}
          onSessionClose={onSessionClose}
          onSessionDetach={onSessionDetach}
          onSessionInput={onSessionInput}
          onNodeClick={onNodeClick}
          onAgentClick={onAgentClick}
        />
      </div>
    </div>
  );
}
