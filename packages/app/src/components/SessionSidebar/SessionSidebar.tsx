import { useSessionSidebar } from '../../hooks/useSessionSidebar';
import { SessionSidebarItem } from './SessionSidebarItem';
import type { SessionId } from '@afw/shared';
import './SessionSidebar.css';

export interface SessionSidebarProps {
  /** Callback when a session is attached to the workbench */
  onAttachSession?: (sessionId: SessionId) => void;
  /** Currently active session ID (for highlighting) */
  activeSessionId?: SessionId;
}

/**
 * SessionSidebar component - Auto-hide sidebar for session navigation
 *
 * Features:
 * - Auto-hide: Collapses to 40px strip, expands to 280px on hover
 * - Shows active sessions (in_progress) and recent sessions (last 10)
 * - Notification badges for session events
 * - Smooth slide animation with reduced-motion support
 * - Dark theme styling
 *
 * Layout (top to bottom):
 * - Header: "Sessions" label (only visible when expanded)
 * - Active Sessions section
 * - Divider
 * - Recent Sessions section
 * - Footer: Session count indicator
 */
export function SessionSidebar({
  onAttachSession,
  activeSessionId,
}: SessionSidebarProps) {
  const {
    isExpanded,
    setIsExpanded,
    activeSessions,
    recentSessions,
    notificationCounts,
    attachSession,
  } = useSessionSidebar(onAttachSession);

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  // Handle mouse leave with delay
  const handleMouseLeave = () => {
    setIsExpanded(false);
  };

  // Handle session click
  const handleSessionClick = (sessionId: SessionId) => {
    attachSession(sessionId);
  };

  // Total session count
  const totalCount = activeSessions.length + recentSessions.length;

  // Filter recent sessions that aren't already in active sessions
  const uniqueRecentSessions = recentSessions.filter(
    (recent) => !activeSessions.some((active) => active.id === recent.id)
  );

  return (
    <aside
      className={`session-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Session navigation sidebar"
    >
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-icon" aria-hidden="true">
          📋
        </div>
        {isExpanded && <h2 className="sidebar-title">Sessions</h2>}
      </div>

      {/* Scrollable content */}
      <div className="sidebar-content">
        {/* Active Sessions Section */}
        {activeSessions.length > 0 && (
          <section className="session-section">
            {isExpanded && (
              <h3 className="section-title">Active ({activeSessions.length})</h3>
            )}
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
            {isExpanded && (
              <h3 className="section-title">Recent ({uniqueRecentSessions.length})</h3>
            )}
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
        {totalCount === 0 && isExpanded && (
          <div className="empty-state">
            <p className="empty-message">No sessions yet</p>
          </div>
        )}
      </div>

      {/* Footer - Session count */}
      <div className="sidebar-footer">
        {isExpanded ? (
          <span className="session-count">
            {totalCount} {totalCount === 1 ? 'session' : 'sessions'}
          </span>
        ) : (
          <span className="session-count-compact" aria-label={`${totalCount} sessions`}>
            {totalCount}
          </span>
        )}
      </div>
    </aside>
  );
}
