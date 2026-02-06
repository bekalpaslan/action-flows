import { useState, useEffect } from 'react';
import type { Session } from '@afw/shared';
import './SessionTree.css';

export interface SessionTreeProps {
  userId: string;
  sessions: Session[];
  attachedSessionIds: string[];
  onSessionAttach: (sessionId: string) => void;
  onSessionDetach: (sessionId: string) => void;
  expanded?: boolean;
  onToggle?: () => void;
}

/**
 * SessionTree component - displays expandable tree of sessions for a user
 *
 * Features:
 * - Expandable/collapsible session list
 * - Status indicator (active, idle, ended)
 * - Current chain display
 * - Session timestamp
 * - Click to attach/detach sessions
 * - Checkmark indicator for attached sessions
 * - Smooth expand/collapse animation
 */
export function SessionTree({
  userId,
  sessions,
  attachedSessionIds,
  onSessionAttach,
  onSessionDetach,
  expanded = false,
  onToggle,
}: SessionTreeProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded]);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.();
  };

  const handleSessionClick = (sessionId: string) => {
    const isAttached = attachedSessionIds.includes(sessionId);
    if (isAttached) {
      onSessionDetach(sessionId);
    } else {
      onSessionAttach(sessionId);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'in_progress':
        return 'active';
      case 'completed':
        return 'ended';
      case 'pending':
        return 'idle';
      default:
        return 'idle';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'in_progress':
        return 'Active';
      case 'completed':
        return 'Ended';
      case 'pending':
        return 'Idle';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();

      // Less than a minute ago
      if (diff < 60000) {
        return 'now';
      }

      // Less than an hour ago
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
      }

      // Less than a day ago
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
      }

      // Format as date
      return date.toLocaleDateString();
    } catch {
      return 'unknown';
    }
  };

  const truncateId = (id: string, length: number = 8): string => {
    return id.substring(0, length);
  };

  return (
    <div className="session-tree">
      <button
        className="session-tree-toggle"
        onClick={handleToggle}
        aria-label={isExpanded ? 'Collapse sessions' : 'Expand sessions'}
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        <span className={`tree-chevron ${isExpanded ? 'expanded' : ''}`}>
          ▶
        </span>
        <span className="tree-label">Sessions ({sessions.length})</span>
      </button>

      {isExpanded && sessions.length > 0 && (
        <div className="session-tree-content">
          <ul className="session-list">
            {sessions.map((session) => {
              const isAttached = attachedSessionIds.includes(session.id);
              const statusColor = getStatusColor(session.status);
              const statusLabel = getStatusLabel(session.status);

              return (
                <li key={session.id} className="session-item">
                  <button
                    className={`session-button ${isAttached ? 'attached' : ''}`}
                    onClick={() => handleSessionClick(session.id)}
                    title={`Session ${session.id}`}
                    aria-label={`${isAttached ? 'Detach' : 'Attach'} session ${session.id}`}
                  >
                    <span className="session-content">
                      <span className="session-id-wrapper">
                        <code className="session-id">
                          {truncateId(session.id)}
                        </code>
                        {isAttached && (
                          <span className="attached-checkmark" title="Attached">
                            ✓
                          </span>
                        )}
                      </span>

                      <span className="session-details">
                        <span
                          className={`status-indicator status-${statusColor}`}
                          title={statusLabel}
                        />
                        <span className="status-label">{statusLabel}</span>

                        {session.currentChain && (
                          <span className="current-chain">
                            {session.currentChain.title}
                          </span>
                        )}
                      </span>

                      <span className="session-timestamp">
                        {formatTimestamp(session.startedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isExpanded && sessions.length === 0 && (
        <div className="session-tree-empty">
          <p>No sessions</p>
        </div>
      )}
    </div>
  );
}
