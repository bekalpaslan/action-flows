import { useEffect, useState, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { ConnectionStatus } from '../hooks/useWebSocket';
import { useUsers } from '../hooks/useUsers';
import { useAllSessions } from '../hooks/useAllSessions';
import { useAttachedSessions } from '../hooks/useAttachedSessions';
import { UserSidebar } from './UserSidebar';
import { FileExplorer } from './FileExplorer';
import { SplitPaneLayout } from './SplitPaneLayout';
import { NotificationManager } from './NotificationManager';
import { CodeEditor } from './CodeEditor';
import { TerminalTabs } from './Terminal';
import { CommandPalette } from './CommandPalette';
import { commandRegistry } from '../utils/commandRegistry';
import { exportSessionAsJSON, exportSessionLogs, exportChainTimeline } from '../utils/exportHelpers';

/**
 * Main app content component that displays real-time WebSocket connection status
 */
export default function AppContent() {
  const { status, error } = useWebSocketContext();
  const { users, currentUserId } = useUsers();
  const { sessions: allSessions } = useAllSessions();
  const [statusDisplay, setStatusDisplay] = useState<string>('Connecting...');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [fileToOpen, setFileToOpen] = useState<string | null>(null);
  const [terminalHeight, setTerminalHeight] = useState<number>(250);
  const [terminalCollapsed, setTerminalCollapsed] = useState<boolean>(false);
  const [terminalCombinedMode, setTerminalCombinedMode] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

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

  // Register export commands
  useEffect(() => {
    // Only register if we have an attached session
    if (attachedSessions.length === 0) {
      return;
    }

    const firstSession = attachedSessions[0];

    commandRegistry.register({
      id: 'export-session-json',
      label: 'Export Session as JSON',
      category: 'export',
      icon: '📄',
      description: 'Download complete session data as JSON file',
      execute: () => {
        if (firstSession) {
          exportSessionAsJSON(firstSession);
        }
      },
    });

    commandRegistry.register({
      id: 'export-session-logs',
      label: 'Export Session Logs',
      category: 'export',
      icon: '📝',
      description: 'Download terminal output logs as text file',
      execute: () => {
        if (firstSession) {
          // Get terminal content from session
          // For now, export available terminal data or empty string
          const logs = firstSession.chains
            ?.map((chain) =>
              chain.steps
                ?.map((step) => `[${step.stepNumber}] ${step.action}: ${step.description || 'N/A'}`)
                ?.join('\n')
            )
            ?.join('\n\n') || 'No logs available';

          exportSessionLogs(firstSession.id, logs);
        }
      },
    });

    commandRegistry.register({
      id: 'export-chain-timeline',
      label: 'Export Chain Timeline',
      category: 'export',
      icon: '⏱️',
      description: 'Download chain execution timeline as JSON',
      execute: () => {
        if (firstSession && firstSession.chains && firstSession.chains.length > 0) {
          exportChainTimeline(firstSession.chains, firstSession.id);
        }
      },
    });

    // Cleanup function to unregister commands when component unmounts
    return () => {
      commandRegistry.unregister('export-session-json');
      commandRegistry.unregister('export-session-logs');
      commandRegistry.unregister('export-chain-timeline');
    };
  }, [attachedSessions]);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Background notification manager */}
      <NotificationManager
        sessionIds={attachedSessionIds}
        enableStepFailures={true}
        enableChainCompletions={true}
      />

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
