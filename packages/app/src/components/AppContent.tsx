import { useEffect, useState } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { ConnectionStatus } from '../hooks/useWebSocket';
import { useUsers } from '../hooks/useUsers';
import { useAllSessions } from '../hooks/useAllSessions';
import { useAttachedSessions } from '../hooks/useAttachedSessions';
import { UserSidebar } from './UserSidebar';
import { SplitPaneLayout } from './SplitPaneLayout';

/**
 * Main app content component that displays real-time WebSocket connection status
 */
export default function AppContent() {
  const { status, error } = useWebSocketContext();
  const { users, currentUserId } = useUsers();
  const { sessions: allSessions } = useAllSessions();
  const [statusDisplay, setStatusDisplay] = useState<string>('Connecting...');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

  // Manage attached sessions
  const {
    attachedSessionIds,
    attachedSessions,
    attachSession,
    detachSession,
  } = useAttachedSessions(allSessions, {
    maxAttached: 6,
    persistToStorage: true,
  });

  // Map WebSocket status to display text
  useEffect(() => {
    const displayText = {
      connecting: 'Connecting...',
      connected: 'Connected',
      disconnected: 'Disconnected',
      error: 'Connection Error',
    }[status as ConnectionStatus] || 'Unknown';

    setStatusDisplay(displayText);
  }, [status]);

  // Determine status class for styling
  const getStatusClass = (): string => {
    switch (status) {
      case 'connected':
        return 'connected';
      case 'error':
        return 'error';
      case 'disconnected':
        return 'disconnected';
      case 'connecting':
      default:
        return 'connecting';
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>ActionFlows Workspace</h1>
        <div className="status-indicator">
          <span className={`status ${getStatusClass()}`}>
            {statusDisplay}
            {error && ` - ${error.message}`}
          </span>
        </div>
      </header>

      <div className="app-container">
        <UserSidebar
          users={users}
          selectedUserId={selectedUserId}
          onUserSelect={setSelectedUserId}
          currentUserId={currentUserId}
          attachedSessionIds={attachedSessionIds}
          onSessionAttach={attachSession}
          onSessionDetach={detachSession}
        />

        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            <ul>
              <li><a href="#dashboard">Dashboard</a></li>
              <li><a href="#flows">Flows</a></li>
              <li><a href="#actions">Actions</a></li>
              <li><a href="#logs">Logs</a></li>
              <li><a href="#settings">Settings</a></li>
            </ul>
          </nav>
        </aside>

        <main className="app-main">
          <SplitPaneLayout
            sessions={attachedSessions}
            onSessionDetach={detachSession}
          />
        </main>
      </div>
    </div>
  );
}
