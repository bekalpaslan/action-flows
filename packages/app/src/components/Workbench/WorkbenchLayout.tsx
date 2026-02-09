import { type ReactNode, useState, useCallback } from 'react';
import { useWorkbenchContext } from '../../contexts/WorkbenchContext';
import { TopBar } from '../TopBar';
import { SessionSidebar } from '../SessionSidebar';
import { type WorkbenchId, type SessionId, canWorkbenchHaveSessions } from '@afw/shared';
import './WorkbenchLayout.css';

/**
 * WorkbenchLayout - Main shell layout that replaces AppContent
 *
 * Structure:
 * - TopBar at the top
 * - SessionSidebar on the left (auto-hide, only on session-capable workbenches)
 * - Main content area in the center
 * - BottomControlPanel at the bottom (placeholder for now)
 */

interface WorkbenchLayoutProps {
  children?: ReactNode;
}

export function WorkbenchLayout({ children }: WorkbenchLayoutProps) {
  const { activeWorkbench, setActiveWorkbench } = useWorkbenchContext();

  // Track attached sessions for the current workbench
  const [attachedSessions, setAttachedSessions] = useState<Set<SessionId>>(new Set());
  const [activeSessionId, setActiveSessionId] = useState<SessionId | undefined>();

  /**
   * Handle session attachment to the workbench
   */
  const handleAttachSession = useCallback((sessionId: SessionId) => {
    setAttachedSessions((prev) => new Set(prev).add(sessionId));
    setActiveSessionId(sessionId);
    // TODO: Add session tiles to the main panel
    console.log('Session attached:', sessionId);
  }, []);

  /**
   * Render workbench-specific content based on activeWorkbench
   */
  const renderWorkbenchContent = (workbench: WorkbenchId): ReactNode => {
    switch (workbench) {
      case 'work':
        return (
          <div className="workbench-placeholder">
            <h1>Work Dashboard</h1>
            <p>Session tiles will go here</p>
          </div>
        );
      case 'maintenance':
        return (
          <div className="workbench-placeholder">
            <h1>Maintenance Dashboard</h1>
            <p>Bug fixes, refactoring, and housekeeping tasks</p>
          </div>
        );
      case 'explore':
        return (
          <div className="workbench-placeholder">
            <h1>Explore Dashboard</h1>
            <p>Research, codebase exploration, and learning</p>
          </div>
        );
      case 'review':
        return (
          <div className="workbench-placeholder">
            <h1>Review Dashboard</h1>
            <p>Code reviews, PR checks, and audits</p>
          </div>
        );
      case 'archive':
        return (
          <div className="workbench-placeholder">
            <h1>Archive Dashboard</h1>
            <p>Completed and historical sessions</p>
          </div>
        );
      case 'settings':
        return (
          <div className="workbench-placeholder">
            <h1>Settings Dashboard</h1>
            <p>Configuration, preferences, and system management</p>
          </div>
        );
      case 'pm':
        return (
          <div className="workbench-placeholder">
            <h1>PM Dashboard</h1>
            <p>Project management, tasks, and documentation</p>
          </div>
        );
      case 'harmony':
        return (
          <div className="workbench-placeholder">
            <h1>Harmony Dashboard</h1>
            <p>Violations, sins, and remediations</p>
          </div>
        );
      case 'editor':
        return (
          <div className="workbench-placeholder">
            <h1>Editor Dashboard</h1>
            <p>Full-screen code editing</p>
          </div>
        );
      default:
        return (
          <div className="workbench-placeholder">
            <h1>Unknown Workbench</h1>
            <p>Workbench not found</p>
          </div>
        );
    }
  };

  // Check if current workbench supports sessions
  const showSessionSidebar = canWorkbenchHaveSessions(activeWorkbench);

  return (
    <div className="workbench-layout">
      <TopBar
        activeWorkbench={activeWorkbench}
        onWorkbenchChange={setActiveWorkbench}
      />

      {/* SessionSidebar - Only show on session-capable workbenches */}
      {showSessionSidebar && (
        <SessionSidebar
          onAttachSession={handleAttachSession}
          activeSessionId={activeSessionId}
        />
      )}

      <div className="workbench-body">
        <main className={`workbench-main ${showSessionSidebar ? 'with-sidebar' : ''}`}>
          {renderWorkbenchContent(activeWorkbench)}
          {children}
        </main>
      </div>

      <footer className="workbench-bottom">
        {/* BottomControlPanel placeholder */}
        <div className="bottom-placeholder">
          <div className="placeholder-title">Control Panel</div>
          <div className="placeholder-hint">Execution controls will appear here</div>
        </div>
      </footer>
    </div>
  );
}
