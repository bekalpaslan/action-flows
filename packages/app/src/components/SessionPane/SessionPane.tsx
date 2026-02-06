import { useState } from 'react';
import type { Session } from '@afw/shared';
import { ChainDAG } from '../ChainDAG';
import './SessionPane.css';

export interface SessionPaneProps {
  session: Session;
  onDetach: (sessionId: string) => void;
  /** Pane position for layout styling */
  position: { row: number; col: number; totalRows: number; totalCols: number };
}

/**
 * SessionPane component - displays a single attached session with its DAG visualization
 *
 * Features:
 * - Session header with user, session ID, and detach button
 * - DAG visualization of current chain
 * - Status indicator
 * - Adaptive sizing based on grid position
 */
export function SessionPane({ session, onDetach, position }: SessionPaneProps) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const handleDetach = () => {
    if (!session.id) {
      console.error('Cannot detach session: session.id is undefined');
      return;
    }
    onDetach(session.id);
  };

  const truncateId = (id: string | undefined, length: number = 8): string => {
    if (!id) return 'unknown';
    return id.substring(0, length);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'in_progress':
        return 'active';
      case 'completed':
        return 'complete';
      case 'failed':
        return 'failed';
      case 'pending':
      default:
        return 'idle';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'in_progress':
        return 'Active';
      case 'completed':
        return 'Complete';
      case 'failed':
        return 'Failed';
      case 'pending':
      default:
        return 'Idle';
    }
  };

  const statusColor = getStatusColor(session.status);
  const statusLabel = getStatusLabel(session.status);

  return (
    <div
      className="session-pane"
      style={{
        gridRow: position.row,
        gridColumn: position.col,
      }}
    >
      <div className="session-pane-header">
        <div className="session-pane-info">
          <div className="session-user">
            <span className="user-avatar-small">
              {session.user?.substring(0, 2).toUpperCase() || 'UN'}
            </span>
            <span className="user-name">{session.user || 'Unknown'}</span>
          </div>
          <div className="session-id-display">
            <code>{truncateId(session.id)}</code>
          </div>
          <div className={`session-status status-${statusColor}`}>
            <span className="status-dot" />
            <span className="status-text">{statusLabel}</span>
          </div>
        </div>
        <button
          className="session-detach-btn"
          onClick={handleDetach}
          title="Detach session"
          aria-label="Detach this session from view"
        >
          ×
        </button>
      </div>

      <div className="session-pane-content">
        {session.currentChain ? (
          <div className="dag-wrapper">
            <ChainDAG
              chain={session.currentChain}
              onStepSelected={setSelectedStep}
            />
          </div>
        ) : (
          <div className="session-pane-empty">
            <p>No active chain</p>
            <p className="empty-hint">
              Waiting for orchestrator to compile a chain...
            </p>
          </div>
        )}
      </div>

      {session.currentChain && (
        <div className="session-pane-footer">
          <div className="chain-title">
            {session.currentChain.title || 'Untitled Chain'}
          </div>
          <div className="chain-steps">
            {session.currentChain.steps.length} step
            {session.currentChain.steps.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
