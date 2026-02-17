import { useState } from 'react';
import type { Session, SessionId } from '@afw/shared';
import { ChainDAG } from '../ChainDAG';
import { TimelineView } from '../TimelineView';
import { ControlButtons } from '../ControlButtons/ControlButtons';
import { StepInspector } from '../StepInspector/StepInspector';
import { ChatPanel } from '../SessionPanel/ChatPanel';
import { ErrorModal } from '../ErrorModal';
import { useSessionInput } from '../../hooks/useSessionInput';
import { useErrorAnnouncements } from '../../hooks/useErrorAnnouncements';
import { claudeCliService } from '../../services/claudeCliService';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './SessionPane.css';

export interface SessionPaneProps {
  session: Session;
  onDetach: (sessionId: string) => void;
  onClose?: (sessionId: string) => void;
  /** Pane position for layout styling */
  position: { row: number; col: number; totalRows: number; totalCols: number };
}

/**
 * SessionPane component - displays a single attached session with its DAG visualization
 *
 * Features:
 * - Session header with user, session ID, and detach button
 * - DAG/Timeline visualization toggle
 * - Status indicator
 * - Adaptive sizing based on grid position
 */
export function SessionPane({ session, onDetach, onClose, position }: SessionPaneProps) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'dag' | 'timeline'>('dag');
  const [isClosing, setIsClosing] = useState(false);
  const [displayedErrorIndex, setDisplayedErrorIndex] = useState(0);
  const { submitInput } = useSessionInput();

  const isCliSession = session.metadata?.type === 'claude-cli';

  // Error announcements management
  const { unreadErrors, dismissError, handleRecoveryAction } = useErrorAnnouncements(session.id);
  const currentError = unreadErrors.length > 0 ? unreadErrors[displayedErrorIndex] : null;

  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'SessionPane',
    getContext: () => ({
      sessionId: session.id,
      status: session.status,
      chainsCount: session.chains?.length || 0,
    }),
  });

  const handleDetach = () => {
    if (!session.id) {
      console.error('Cannot detach session: session.id is undefined');
      return;
    }
    onDetach(session.id);
  };

  const handleClose = async () => {
    if (!session.id || isClosing) return;
    setIsClosing(true);

    try {
      if (isCliSession) {
        await claudeCliService.stopSession(session.id as SessionId);
      }
    } catch (err) {
      console.error('Failed to stop CLI session:', err);
      // Still close even if stop fails (process may have already exited)
    }

    if (onClose) {
      onClose(session.id);
    } else {
      onDetach(session.id);
    }
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

  const handleErrorDismiss = (errorId: string) => {
    dismissError(errorId);
    // Move to next unread error if available
    if (displayedErrorIndex < unreadErrors.length - 1) {
      setDisplayedErrorIndex(displayedErrorIndex + 1);
    } else {
      setDisplayedErrorIndex(0);
    }
  };

  const handleErrorRetry = (errorId: string) => {
    handleRecoveryAction(errorId, 'retry');
    handleErrorDismiss(errorId);
  };

  const handleErrorSkip = (errorId: string) => {
    handleRecoveryAction(errorId, 'skip');
    handleErrorDismiss(errorId);
  };

  const handleErrorCancel = (errorId: string) => {
    handleRecoveryAction(errorId, 'cancel');
    handleErrorDismiss(errorId);
  };

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
        <div className="session-pane-controls">
          <DiscussButton componentName="SessionPane" onClick={openDialog} size="small" />
          <ControlButtons session={session} />
          {session.currentChain && (
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'dag' ? 'active' : ''}`}
                onClick={() => setViewMode('dag')}
                title="DAG View"
              >
                DAG
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
                title="Timeline View"
              >
                Timeline
              </button>
            </div>
          )}
          <button
            className={`session-detach-btn${isCliSession ? ' session-close-btn' : ''}`}
            onClick={isCliSession ? handleClose : handleDetach}
            disabled={isClosing}
            title={isCliSession ? 'End session' : 'Detach session'}
            aria-label={isCliSession ? 'Stop CLI process and close this session' : 'Detach this session from view'}
          >
            {isClosing ? '...' : '×'}
          </button>
        </div>
      </div>

      <div className="session-pane-content">
        <div className="visualization-section">
          {session.currentChain ? (
            <div className="visualization-wrapper">
              {viewMode === 'dag' ? (
                <ChainDAG
                  chain={session.currentChain}
                  onStepSelected={setSelectedStep}
                />
              ) : (
                <TimelineView
                  chain={session.currentChain}
                  onStepSelected={setSelectedStep}
                />
              )}
            </div>
          ) : (
            <div className="session-details-panel">
              <div className="session-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`detail-value status-badge status-${getStatusColor(session.status)}`}>
                    {getStatusLabel(session.status)}
                  </span>
                </div>
                {session.cwd && (
                  <div className="detail-item">
                    <span className="detail-label">Directory</span>
                    <code className="detail-value detail-code">{session.cwd}</code>
                  </div>
                )}
                {session.hostname && (
                  <div className="detail-item">
                    <span className="detail-label">Host</span>
                    <span className="detail-value">{session.hostname}</span>
                  </div>
                )}
                {session.platform && (
                  <div className="detail-item">
                    <span className="detail-label">Platform</span>
                    <span className="detail-value">{session.platform}</span>
                  </div>
                )}
                {session.startedAt && (
                  <div className="detail-item">
                    <span className="detail-label">Started</span>
                    <span className="detail-value">{new Date(session.startedAt).toLocaleString()}</span>
                  </div>
                )}
                {session.duration != null && (
                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{Math.round(session.duration / 1000)}s</span>
                  </div>
                )}
                {session.metadata?.type && (
                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{String(session.metadata.type)}</span>
                  </div>
                )}
              </div>
              <p className="empty-hint">
                Waiting for orchestrator to compile a chain...
              </p>
            </div>
          )}
        </div>

        <div className="conversation-section">
          <ChatPanel
            sessionId={session.id as SessionId}
            session={session}
            cwd={session.cwd}
            onSendMessage={async (input) => {
              await submitInput(session.id as SessionId, input);
            }}
          />
        </div>

        {selectedStep !== null && session.currentChain && (
          <StepInspector
            step={session.currentChain.steps.find(s => s.stepNumber === selectedStep) || null}
            sessionId={session.id}
            onClose={() => setSelectedStep(null)}
          />
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
      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="SessionPane"
        componentContext={{
          sessionId: session.id,
          status: session.status,
          chainsCount: session.chains?.length || 0,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />

      <ErrorModal
        isOpen={currentError !== null}
        error={currentError}
        onDismiss={handleErrorDismiss}
        onRetry={handleErrorRetry}
        onSkip={handleErrorSkip}
        onCancel={handleErrorCancel}
      />
    </div>
  );
}
