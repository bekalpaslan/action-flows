import { useState } from 'react';
import type { Session } from '@afw/shared';
import { FlowVisualization } from '../FlowVisualization/FlowVisualization';
import { ClaudeCliTerminal } from '../ClaudeCliTerminal/ClaudeCliTerminal';

export interface SessionWindowTileProps {
  session: Session;
  onRemove: (sessionId: string) => void;
  /** CLI binding mode */
  cliMode?: 'attached' | 'standalone' | 'none';
  /** Callback when CLI mode toggle clicked */
  onCliModeToggle?: () => void;
}

/**
 * SessionWindowTile - individual session window card
 *
 * States:
 * - Collapsed: card with summary
 * - Expanded: flow visualization + terminal (if CLI attached)
 * - Full-screen: expanded tile covering entire grid
 */
export function SessionWindowTile({
  session,
  onRemove,
  cliMode = 'none',
  onCliModeToggle,
}: SessionWindowTileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(session.id);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleDoubleClick = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleFullScreenToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullScreen(!isFullScreen);
  };

  const handleCliModeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCliModeToggle) {
      onCliModeToggle();
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  };

  const displayId = session.id.length > 30
    ? `${session.id.slice(0, 27)}...`
    : session.id;

  const hasCurrentChain = session.currentChain !== undefined;

  return (
    <div
      className={`session-window-tile ${isExpanded ? 'expanded' : 'collapsed'} ${isFullScreen ? 'fullscreen' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      <div className="tile-header">
        <div className="tile-header-left">
          <span className="tile-session-id" title={session.id}>
            {displayId}
          </span>
          <span className={`tile-status-badge ${getStatusBadgeClass(session.status)}`}>
            {session.status}
          </span>
          {hasCurrentChain && (
            <span className="tile-cli-indicator">CLI</span>
          )}
        </div>

        <div className="tile-header-actions">
          {onCliModeToggle && (
            <button
              className={`tile-action-btn cli-mode-btn ${cliMode === 'attached' ? 'active' : ''}`}
              onClick={handleCliModeToggle}
              title={cliMode === 'attached' ? 'Detach CLI' : 'Attach CLI'}
            >
              CLI
            </button>
          )}
          <button
            className="tile-action-btn"
            onClick={handleFullScreenToggle}
            title={isFullScreen ? 'Exit full-screen' : 'Enter full-screen'}
          >
            {isFullScreen ? '⊡' : '⊞'}
          </button>
          <button
            className="tile-action-btn"
            onClick={handleToggleExpand}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button
            className="tile-action-btn remove-btn"
            onClick={handleRemove}
            title="Remove from grid"
          >
            ×
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="tile-content-expanded">
          {/* Left 4/5: Flow Visualization */}
          <div className="tile-flow-viz">
            {session.currentChain?.steps && session.currentChain.steps.length > 0 ? (
              <FlowVisualization
                chain={session.currentChain}
                onStepClick={(stepNumber) => {
                  console.log('Step clicked:', stepNumber);
                  // TODO: Open step inspector in Phase 3
                }}
                enableAnimations={true}
              />
            ) : (
              <div className="placeholder-content">
                <p>No active chain to visualize</p>
                <p className="chain-info">Waiting for chain compilation...</p>
              </div>
            )}
          </div>

          {/* Right 1/5: CLI Terminal (if attached) */}
          {cliMode === 'attached' && (
            <div className="tile-cli-terminal">
              <ClaudeCliTerminal sessionId={session.id} compact={true} />
            </div>
          )}
        </div>
      ) : (
        <div className="tile-content-collapsed">
          <div className="tile-summary">
            <div className="summary-row">
              <span className="summary-label">User:</span>
              <span className="summary-value">{session.user || 'unknown'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Chains:</span>
              <span className="summary-value">{session.chains?.length || 0}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Started:</span>
              <span className="summary-value">
                {new Date(session.startedAt).toLocaleTimeString()}
              </span>
            </div>
            {session.currentChain && (
              <div className="summary-row">
                <span className="summary-label">Current:</span>
                <span className="summary-value">
                  {session.currentChain.title || 'Untitled chain'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
