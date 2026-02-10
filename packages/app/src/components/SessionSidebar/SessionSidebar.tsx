import { useSessionSidebar } from '../../hooks/useSessionSidebar';
import { SessionSidebarItem } from './SessionSidebarItem';
import type { SessionId } from '@afw/shared';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './SessionSidebar.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface SessionSidebarProps {
  /** Callback when a session is attached to the workbench */
  onAttachSession?: (sessionId: SessionId) => void;
  /** Currently active session ID (for highlighting) */
  activeSessionId?: SessionId;
  /** Callback when "New Session" is clicked */
  onNewSession?: () => void;
  /** Callback when a session is deleted */
  onSessionDeleted?: (sessionId: SessionId) => void;
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
  onSessionDeleted,
}: SessionSidebarProps) {
  const {
    activeSessions,
    recentSessions,
    notificationCounts,
    attachSession,
  } = useSessionSidebar(onAttachSession);

  // Filter recent sessions that aren't already in active sessions
  const uniqueRecentSessions = recentSessions.filter(
    (recent) => !activeSessions.some((active) => active.id === recent.id)
  );

  // Total session count (deduplicated)
  const totalCount = activeSessions.length + uniqueRecentSessions.length;

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend: handleDiscussSend } = useDiscussButton({
    componentName: 'SessionSidebar',
    getContext: () => ({
      sessionCount: totalCount,
      activeSession: activeSessionId,
    }),
  });

  // Handle session click
  const handleSessionClick = (sessionId: SessionId) => {
    attachSession(sessionId);
  };

  // Handle session deletion
  const handleDeleteSession = async (sessionId: SessionId) => {
    try {
      const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Session ${sessionId} not found`);
        } else {
          throw new Error(`Failed to delete session: ${response.statusText}`);
        }
      }

      // Notify parent if this was the active session
      if (sessionId === activeSessionId && onSessionDeleted) {
        onSessionDeleted(sessionId);
      }

      // WebSocket will broadcast session:deleted event to update the UI
    } catch (err) {
      console.error('Error deleting session:', err);
      alert('Failed to delete session. Please try again.');
    }
  };

  // Handle discuss dialog send
  const handleDiscussDialogSend = (message: string) => {
    const formattedMessage = handleDiscussSend(message);
    console.log('Discussion message:', formattedMessage);
    // For now, just log the message (can be extended to send to chat, etc.)
    closeDialog();
  };

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
        <DiscussButton componentName="SessionSidebar" onClick={openDialog} size="small" />
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
                  onDelete={handleDeleteSession}
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
                  onDelete={handleDeleteSession}
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

      {/* DiscussDialog */}
      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="SessionSidebar"
        componentContext={{
          sessionCount: totalCount,
          activeSession: activeSessionId,
        }}
        onSend={handleDiscussDialogSend}
        onClose={closeDialog}
      />
    </aside>
  );
}
