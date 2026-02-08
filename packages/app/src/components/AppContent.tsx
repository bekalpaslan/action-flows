import { useEffect, useState, useCallback } from 'react';
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
import { SessionWindowSidebar } from './SessionWindowSidebar/SessionWindowSidebar';
import { SessionWindowGrid } from './SessionWindowGrid/SessionWindowGrid';
import { SquadPanel } from './SquadPanel';
import { claudeCliService } from '../services/claudeCliService';
import type { Session, SessionId } from '@afw/shared';

/**
 * Main app content component that displays real-time WebSocket connection status
 */
export default function AppContent() {
  const { status, error } = useWebSocketContext();
  const { users, currentUserId } = useUsers();
  const { sessions: allSessions, addSession } = useAllSessions();
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
  const [useSessionWindowMode, setUseSessionWindowMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('sessions');
  const [isStartingCli, setIsStartingCli] = useState<boolean>(false);
  const [showSquadPanel, setShowSquadPanel] = useState<boolean>(true);

  // Manage attached sessions
  const {
    attachedSessionIds,
    attachedSessions,
    attachSession,
    detachSession,
    forceAttachSession,
  } = useAttachedSessions(allSessions, {
    maxAttached: 6,
    persistToStorage: true,
  });

  // Handle file opening from explorer
  const handleFileOpen = useCallback((path: string) => {
    setFileToOpen(path);
  }, []);

  // Start a new Claude CLI session and attach it immediately
  const handleStartClaudeSession = useCallback(async () => {
    if (isStartingCli) return;
    setIsStartingCli(true);

    try {
      const sessionId = crypto.randomUUID() as SessionId;
      const defaultCwd = attachedSessions[0]?.cwd || 'D:/ActionFlowsDashboard';

      await claudeCliService.startSession(sessionId, defaultCwd);

      // Inject session into allSessions immediately so SessionPane can render it
      addSession({
        id: sessionId,
        cwd: defaultCwd,
        chains: [],
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        metadata: { type: 'claude-cli' },
      } as Session);

      forceAttachSession(sessionId);
      setActiveTab('sessions');
    } catch (err) {
      console.error('Failed to start Claude CLI session:', err);
    } finally {
      setIsStartingCli(false);
    }
  }, [isStartingCli, attachedSessions, addSession, forceAttachSession]);

  // Handle session close (CLI stop is done inside SessionPane, this just detaches)
  const handleSessionClose = useCallback((sessionId: string) => {
    detachSession(sessionId);
  }, [detachSession]);

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
        <nav className="header-nav">
          {['sessions', 'dashboard', 'flows', 'actions', 'logs', 'settings'].map((tab) => (
            <button
              key={tab}
              className={`header-nav-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setShowSquadPanel(!showSquadPanel)}
            style={{
              padding: '6px 12px',
              backgroundColor: showSquadPanel ? '#9333ea' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            {showSquadPanel ? 'Hide Squad' : 'Show Squad'}
          </button>
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
            onClick={handleStartClaudeSession}
            disabled={isStartingCli}
            style={{
              padding: '6px 12px',
              backgroundColor: isStartingCli ? '#555' : '#0e639c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isStartingCli ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            {isStartingCli ? 'Starting...' : 'New Session'}
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

              {showSquadPanel && (
                <div style={{ borderTop: '1px solid #444', marginTop: '12px', paddingTop: '12px' }}>
                  <SquadPanel
                    sessionId={attachedSessionIds.length > 0 ? (attachedSessionIds[0] as SessionId) : null}
                    placement="left"
                    audioEnabled={false}
                  />
                </div>
              )}
            </div>

            {activeTab === 'sessions' ? (
              <>
                <main className="app-main">
                  <SplitPaneLayout
                    sessions={attachedSessions}
                    onSessionDetach={detachSession}
                    onSessionClose={handleSessionClose}
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
            ) : (
              <main className="app-main">
                <div className="placeholder-tab">
                  <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                  <p>This section is not yet implemented.</p>
                </div>
              </main>
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
    </div>
  );
}
