import { useEffect, useState, useRef, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { useUsers } from '../hooks/useUsers';
import { useAllSessions } from '../hooks/useAllSessions';
import { useAttachedSessions } from '../hooks/useAttachedSessions';
import { useSessionWindows } from '../hooks/useSessionWindows';
import { UserSidebar } from './UserSidebar';
import { FileExplorer } from './FileExplorer';
import { SplitPaneLayout } from './SplitPaneLayout';
import { NotificationManager } from './NotificationManager';
import { CodeEditor } from './CodeEditor';
import { TerminalTabs } from './Terminal';
import { ClaudeCliStartDialog } from './ClaudeCliTerminal/ClaudeCliStartDialog';
import { ClaudeCliTerminal } from './ClaudeCliTerminal/ClaudeCliTerminal';
import { SessionWindowSidebar } from './SessionWindowSidebar/SessionWindowSidebar';
import { SessionWindowGrid } from './SessionWindowGrid/SessionWindowGrid';
import type { SessionId } from '@afw/shared';

/**
 * Main app content component that displays real-time WebSocket connection status
 */
export default function AppContent() {
  const { status, error } = useWebSocketContext();
  const { users, currentUserId } = useUsers();
  const { sessions: allSessions } = useAllSessions();
  const {
    followedSessionIds,
    sessionWindows,
    followSession,
    unfollowSession,
  } = useSessionWindows();
  const [statusDisplay, setStatusDisplay] = useState<string>('Connecting...');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [fileToOpen, setFileToOpen] = useState<string | null>(null);
  const [terminalHeight, setTerminalHeight] = useState<number>(250);
  const [terminalCollapsed, setTerminalCollapsed] = useState<boolean>(false);
  const [terminalCombinedMode, setTerminalCombinedMode] = useState<boolean>(false);
  const [showClaudeCliDialog, setShowClaudeCliDialog] = useState<boolean>(false);
  const [claudeCliSessionId, setClaudeCliSessionId] = useState<SessionId | null>(null);
  const [useSessionWindowMode, setUseSessionWindowMode] = useState<boolean>(false);

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

  // Handle file opening from explorer
  const handleFileOpen = useCallback((path: string) => {
    setFileToOpen(path);
  }, []);

  // Handle Claude CLI session started
  const handleClaudeCliSessionStarted = useCallback((sessionId: SessionId) => {
    setClaudeCliSessionId(sessionId);
  }, []);

  // Map WebSocket status to display text
  useEffect(() => {
    const displayText = {
      connecting: 'Connecting...',
      connected: 'Connected',
      disconnected: 'Disconnected',
      error: 'Connection Error',
    }[status] || 'Unknown';

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
      {/* Background notification manager */}
      <NotificationManager
        sessionIds={attachedSessionIds}
        enableStepFailures={true}
        enableChainCompletions={true}
      />

      <header className="app-header">
        <h1>ActionFlows Workspace</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setUseSessionWindowMode(!useSessionWindowMode)}
            style={{
              padding: '6px 12px',
              backgroundColor: useSessionWindowMode ? '#10a37f' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            {useSessionWindowMode ? 'Classic Mode' : 'Session Window Mode'}
          </button>
          <button
            onClick={() => setShowClaudeCliDialog(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#0e639c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            Start Claude CLI
          </button>
          <div className="status-indicator">
            <span className={`status ${getStatusClass()}`}>
              {statusDisplay}
              {error && ` - ${error.message}`}
            </span>
          </div>
        </div>
      </header>

      <div className="app-container">
        {useSessionWindowMode ? (
          <>
            <SessionWindowSidebar
              sessions={allSessions}
              followedSessionIds={followedSessionIds}
              onFollow={followSession}
              onUnfollow={unfollowSession}
            />
            <SessionWindowGrid
              sessions={sessionWindows.map((sw) => sw.session)}
              onRemove={unfollowSession}
            />
          </>
        ) : (
          <>
            <div className="left-sidebar-group">
              <UserSidebar
                users={users}
                selectedUserId={selectedUserId}
                onUserSelect={setSelectedUserId}
                currentUserId={currentUserId}
                attachedSessionIds={attachedSessionIds}
                onSessionAttach={attachSession}
                onSessionDetach={detachSession}
              />

              {attachedSessionIds.length > 0 && (
                <FileExplorer
                  sessionId={attachedSessionIds[0]}
                  onFileSelect={(path) => console.log('File selected:', path)}
                  onFileOpen={handleFileOpen}
                />
              )}
            </div>

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

            {attachedSessionIds.length > 0 && (
              <CodeEditor
                sessionId={attachedSessionIds[0]}
                fileToOpen={fileToOpen}
                onFileOpened={() => setFileToOpen(null)}
              />
            )}
          </>
        )}
      </div>

      {/* Terminal Panel */}
      {attachedSessionIds.length > 0 && (
        <TerminalTabs
          sessionIds={attachedSessionIds}
          height={terminalHeight}
          onHeightChange={setTerminalHeight}
          isCollapsed={terminalCollapsed}
          onToggleCollapse={() => setTerminalCollapsed(!terminalCollapsed)}
          combinedMode={terminalCombinedMode}
          onToggleCombinedMode={() => setTerminalCombinedMode(!terminalCombinedMode)}
        />
      )}

      {/* Claude CLI Start Dialog */}
      {showClaudeCliDialog && (
        <ClaudeCliStartDialog
          onClose={() => setShowClaudeCliDialog(false)}
          onSessionStarted={handleClaudeCliSessionStarted}
        />
      )}

      {/* Claude CLI Terminal (overlay mode) */}
      {claudeCliSessionId && (
        <div style={{
          position: 'fixed',
          top: '60px',
          right: '20px',
          width: '700px',
          height: '500px',
          backgroundColor: '#1e1e1e',
          border: '1px solid #3e3e3e',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          overflow: 'hidden',
        }}>
          <ClaudeCliTerminal
            sessionId={claudeCliSessionId}
            onClose={() => setClaudeCliSessionId(null)}
          />
        </div>
      )}
    </div>
  );
}
