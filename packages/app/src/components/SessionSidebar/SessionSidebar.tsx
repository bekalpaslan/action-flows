import { useSessionSidebar } from '../../hooks/useSessionSidebar';
import { SessionSidebarItem } from './SessionSidebarItem';
import type { SessionId } from '@afw/shared';
import './SessionSidebar.css';

export interface SessionSidebarProps {
  /** Callback when a session is attached to the workbench */
  onAttachSession?: (sessionId: SessionId) => void;
  /** Currently active session ID (for highlighting) */
  activeSessionId?: SessionId;
  /** Callback when "New Session" is clicked */
  onNewSession?: () => void;
}

/**
 * SessionSidebar component - Static sidebar for session navigation
 *
 * Features:
 * - Always visible at 240px width
 * - Shows active sessions (in_progress) and recent sessions (last 10)
 * - Notification badges for session events
 * - "New Session" button in header
 *
 * Layout (top to bottom):
 * - Header: "Sessions" label + new session button
 * - Active Sessions section
 * - Divider
 * - Recent Sessions section
 * - Footer: Session count indicator
 */
export function SessionSidebar({
  onAttachSession,
  activeSessionId,
  onNewSession,
}: SessionSidebarProps) {
  const {
    activeSessions,
    recentSessions,
    notificationCounts,
    attachSession,
  } = useSessionSidebar(onAttachSession);

  // Handle session click
  const handleSessionClick = (sessionId: SessionId) => {
    attachSession(sessionId);
  };

  // Filter recent sessions that aren't already in active sessions
  const uniqueRecentSessions = recentSessions.filter(
    (recent) => !activeSessions.some((active) => active.id === recent.id)
  );

  // Total session count (deduplicated)
  const totalCount = activeSessions.length + uniqueRecentSessions.length;

  return (
    <aside
      className="session-sidebar"
      aria-label="Session navigation sidebar"
    >
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-icon" aria-hidden="true">
          📋
        </div>
        <h2 className="sidebar-title">Sessions</h2>
        <button
          className="sidebar-new-session-btn"
          onClick={(e) => {
            e.stopPropagation();
            onNewSession?.();
          }}
          aria-label="New session"
          title="New session"
        >
          +
        </button>
      </div>

      {/* Scrollable content */}
      <div className="sidebar-content">
        {/* Active Sessions Section */}
        {activeSessions.length > 0 && (
          <section className="session-section">
            <h3 className="section-title">Active ({activeSessions.length})</h3>
            <div className="session-list">
              {activeSessions.map((session) => (
                <SessionSidebarItem
                  key={session.id}
                  session={session}
                  notificationCount={notificationCounts.get(session.id) || 0}
                  isActive={session.id === activeSessionId}
                  onClick={() => handleSessionClick(session.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Divider (only show when both sections have content) */}
        {activeSessions.length > 0 && uniqueRecentSessions.length > 0 && (
          <div className="sidebar-divider" role="separator" />
        )}

        {/* Recent Sessions Section */}
        {uniqueRecentSessions.length > 0 && (
          <section className="session-section">
            <h3 className="section-title">Recent ({uniqueRecentSessions.length})</h3>
            <div className="session-list">
              {uniqueRecentSessions.map((session) => (
                <SessionSidebarItem
                  key={session.id}
                  session={session}
                  notificationCount={notificationCounts.get(session.id) || 0}
                  isActive={session.id === activeSessionId}
                  onClick={() => handleSessionClick(session.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {totalCount === 0 && (
          <div className="empty-state">
            <p className="empty-message">No sessions yet</p>
          </div>
        )}
      </div>

      {/* Footer - Session count */}
      <div className="sidebar-footer">
        <span className="session-count">
          {totalCount} {totalCount === 1 ? 'session' : 'sessions'}
        </span>
      </div>
    </aside>
  );
}
