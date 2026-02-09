import { type ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { useWorkbenchContext } from '../../contexts/WorkbenchContext';
import { TopBar } from '../TopBar';
import { SessionSidebar } from '../SessionSidebar';
import { WorkWorkbench } from './WorkWorkbench';
import { EditorWorkbench } from './EditorWorkbench';
import { ReviewWorkbench } from './ReviewWorkbench';
import { PMWorkbench, type PMTask, type DocLink, type Milestone, type TaskStatus } from './PMWorkbench';
import { MaintenanceWorkbench } from './MaintenanceWorkbench';
import { SettingsWorkbench } from './SettingsWorkbench';
import { HarmonyWorkbench } from './HarmonyWorkbench';
import { ExploreWorkbench } from './ExploreWorkbench';
import { ArchiveWorkbench } from './ArchiveWorkbench';
import { BottomControlPanel } from '../BottomControlPanel';
import { useSessionArchive } from '../../hooks/useSessionArchive';
import {
  type WorkbenchId,
  type SessionId,
  type Session,
  type QuickCommandAction,
  type FlowAction,
  canWorkbenchHaveSessions,
  brandedTypes,
} from '@afw/shared';
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

// Demo data for PM Workbench
const initialDemoTasks: PMTask[] = [
  {
    id: 'task-1',
    title: 'Implement Self-Evolving UI Phase 1',
    description: 'Create the Button System with context detection and toolbar API',
    status: 'done',
    priority: 'high',
    assignee: 'Claude Opus',
    createdAt: '2026-02-08T10:00:00Z',
    dueDate: '2026-02-08T18:00:00Z',
    tags: ['frontend', 'ui'],
  },
  {
    id: 'task-2',
    title: 'Pattern Detection System',
    description: 'Build pattern analyzer, frequency tracker, and confidence scorer',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Claude Sonnet',
    createdAt: '2026-02-08T14:00:00Z',
    dueDate: '2026-02-09T12:00:00Z',
    tags: ['backend', 'ai'],
  },
  {
    id: 'task-3',
    title: 'Registry Model Implementation',
    description: 'Create pack/button registry with storage and API endpoints',
    status: 'todo',
    priority: 'medium',
    createdAt: '2026-02-08T16:00:00Z',
    tags: ['backend', 'api'],
  },
  {
    id: 'task-4',
    title: 'Add unit tests for storage services',
    description: 'Increase test coverage for MemoryStorage and Redis implementations',
    status: 'done',
    priority: 'medium',
    assignee: 'Claude Haiku',
    createdAt: '2026-02-08T20:00:00Z',
    tags: ['testing'],
  },
  {
    id: 'task-5',
    title: 'Review Harmony Detection feature',
    description: 'Code review for orchestrator contract drift detection',
    status: 'todo',
    priority: 'low',
    createdAt: '2026-02-09T08:00:00Z',
    tags: ['review'],
  },
];

const initialDemoDocs: DocLink[] = [
  {
    id: 'doc-1',
    title: 'FRD - Self-Evolving UI',
    url: '/docs/FRD.md',
    category: 'Requirements',
    description: 'Functional Requirements Document for Self-Evolving UI',
  },
  {
    id: 'doc-2',
    title: 'SRD - Self-Evolving UI',
    url: '/docs/SRD.md',
    category: 'Requirements',
    description: 'System Requirements Document with technical specifications',
  },
  {
    id: 'doc-3',
    title: 'ActionFlows Framework',
    url: '/.claude/actionflows/ORGANIZATION.md',
    category: 'Framework',
    description: 'ActionFlows department and routing documentation',
  },
  {
    id: 'doc-4',
    title: 'Project Config',
    url: '/.claude/actionflows/project.config.md',
    category: 'Framework',
    description: 'Project-specific configuration values',
  },
  {
    id: 'doc-5',
    title: 'Implementation Status',
    url: '/docs/status/IMPLEMENTATION_STATUS.md',
    category: 'Status',
    description: 'Current implementation progress tracker',
  },
];

const initialDemoMilestones: Milestone[] = [
  {
    id: 'milestone-1',
    title: 'Phase 1: Button System',
    description: 'Context detection, toolbar API, persistent toolbar',
    dueDate: '2026-02-08T18:00:00Z',
    status: 'completed',
    progress: 100,
  },
  {
    id: 'milestone-2',
    title: 'Phase 2: Pattern Detection',
    description: 'Pattern analyzer, frequency tracking, confidence scoring',
    dueDate: '2026-02-09T18:00:00Z',
    status: 'current',
    progress: 60,
  },
  {
    id: 'milestone-3',
    title: 'Phase 3: Registry Model',
    description: 'Pack/button registry, storage, API endpoints',
    dueDate: '2026-02-10T18:00:00Z',
    status: 'upcoming',
    progress: 0,
  },
  {
    id: 'milestone-4',
    title: 'Phase 4: Self-Modification',
    description: 'Runtime button promotion, UI adaptation',
    dueDate: '2026-02-11T18:00:00Z',
    status: 'upcoming',
    progress: 0,
  },
];

export function WorkbenchLayout({ children }: WorkbenchLayoutProps) {
  const { activeWorkbench, setActiveWorkbench } = useWorkbenchContext();

  // Track attached sessions for the current workbench
  // TODO: Replace with actual session data from context/API
  const [attachedSessions, setAttachedSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<SessionId | undefined>();

  // Workbench transition state
  const [transitionClass, setTransitionClass] = useState<string>('workbench-enter-done');
  const prevWorkbench = useRef<WorkbenchId>(activeWorkbench);
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle workbench transitions
  useEffect(() => {
    if (prevWorkbench.current !== activeWorkbench) {
      // Clear any pending timeout
      if (transitionTimeout.current) {
        clearTimeout(transitionTimeout.current);
      }

      // Start enter transition
      setTransitionClass('workbench-enter');

      // Use requestAnimationFrame to ensure class is applied before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionClass('workbench-enter-active');

          // Transition to done state after animation completes
          transitionTimeout.current = setTimeout(() => {
            setTransitionClass('workbench-enter-done');
          }, 180); // Match --transition-duration from transitions.css
        });
      });

      prevWorkbench.current = activeWorkbench;
    }

    return () => {
      if (transitionTimeout.current) {
        clearTimeout(transitionTimeout.current);
      }
    };
  }, [activeWorkbench]);

  // PM Workbench state
  const [demoTasks, setDemoTasks] = useState<PMTask[]>(initialDemoTasks);
  const [demoDocs] = useState<DocLink[]>(initialDemoDocs);
  const [demoMilestones] = useState<Milestone[]>(initialDemoMilestones);

  // Archive Workbench state
  const {
    archivedSessions,
    restoreSession,
    deleteArchive,
    clearAllArchives,
  } = useSessionArchive();

  /**
   * Handle archived session restore
   */
  const handleArchiveRestore = useCallback((sessionId: string) => {
    restoreSession(sessionId as SessionId);
    console.log('Session restored from archive:', sessionId);
  }, [restoreSession]);

  /**
   * Handle archived session delete
   */
  const handleArchiveDelete = useCallback((sessionId: string) => {
    deleteArchive(sessionId as SessionId);
    console.log('Archived session deleted:', sessionId);
  }, [deleteArchive]);

  /**
   * Handle clear all archives
   */
  const handleArchiveClearAll = useCallback(() => {
    clearAllArchives();
    console.log('All archived sessions cleared');
  }, [clearAllArchives]);

  /**
   * Handle file selection in ExploreWorkbench
   */
  const handleFileSelect = useCallback((path: string) => {
    console.log('File selected:', path);
  }, []);

  /**
   * Handle file open in ExploreWorkbench
   */
  const handleFileOpen = useCallback((path: string) => {
    console.log('File opened:', path);
    // TODO: Navigate to editor workbench or open in a tab
  }, []);

  /**
   * Handle session attachment to the workbench
   */
  const handleAttachSession = useCallback((sessionId: SessionId) => {
    // TODO: Fetch actual session data and add to attachedSessions
    // For now, create a mock session structure
    const mockSession: Session = {
      id: sessionId,
      cwd: '/workspace',
      chains: [],
      status: 'in_progress',
      startedAt: brandedTypes.currentTimestamp(),
    };

    setAttachedSessions((prev) => {
      // Check if session is already attached
      if (prev.some(s => s.id === sessionId)) {
        return prev;
      }
      return [...prev, mockSession];
    });
    setActiveSessionId(sessionId);
    console.log('Session attached:', sessionId);
  }, []);

  /**
   * Handle session close
   */
  const handleSessionClose = useCallback((sessionId: string) => {
    setAttachedSessions((prev) => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(undefined);
    }
    console.log('Session closed:', sessionId);
  }, [activeSessionId]);

  /**
   * Handle session detach
   */
  const handleSessionDetach = useCallback((sessionId: string) => {
    setAttachedSessions((prev) => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(undefined);
    }
    console.log('Session detached:', sessionId);
  }, [activeSessionId]);

  /**
   * Handle session input submission
   */
  const handleSessionInput = useCallback(async (sessionId: string, input: string) => {
    // TODO: Send input to backend via WebSocket
    console.log('Session input:', sessionId, input);
  }, []);

  /**
   * Handle flow node click
   */
  const handleNodeClick = useCallback((sessionId: string, nodeId: string) => {
    console.log('Node clicked:', sessionId, nodeId);
  }, []);

  /**
   * Handle agent avatar click
   */
  const handleAgentClick = useCallback((sessionId: string, agentId: string) => {
    console.log('Agent clicked:', sessionId, agentId);
  }, []);

  /**
   * Handle input submission from BottomControlPanel
   */
  const handleSubmitInput = useCallback((input: string) => {
    if (!activeSessionId) {
      console.warn('No active session to send input to');
      return;
    }
    // TODO: Send input to backend via WebSocket/claudeCliService
    handleSessionInput(activeSessionId, input);
  }, [activeSessionId, handleSessionInput]);

  /**
   * Handle quick command execution from BottomControlPanel
   */
  const handleExecuteCommand = useCallback((action: QuickCommandAction) => {
    if (!activeSessionId) {
      console.warn('No active session to execute command on');
      return;
    }
    // TODO: Dispatch command to backend based on action type
    console.log('Execute command:', action, 'on session:', activeSessionId);
  }, [activeSessionId]);

  /**
   * Handle flow/action selection from BottomControlPanel
   */
  const handleSelectFlow = useCallback((item: FlowAction) => {
    if (!activeSessionId) {
      console.warn('No active session to apply flow to');
      return;
    }
    // TODO: Execute flow/action on the active session
    console.log('Select flow/action:', item, 'for session:', activeSessionId);
  }, [activeSessionId]);

  /**
   * PM Workbench: Handle task creation
   */
  const handleTaskCreate = useCallback((task: Omit<PMTask, 'id' | 'createdAt'>) => {
    const newTask: PMTask = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDemoTasks((prev) => [...prev, newTask]);
    console.log('Task created:', newTask);
  }, []);

  /**
   * PM Workbench: Handle task status change
   */
  const handleTaskStatusChange = useCallback((taskId: string, status: TaskStatus) => {
    setDemoTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status, updatedAt: new Date().toISOString() }
          : task
      )
    );
    console.log('Task status changed:', taskId, status);
  }, []);

  /**
   * PM Workbench: Handle task deletion
   */
  const handleTaskDelete = useCallback((taskId: string) => {
    setDemoTasks((prev) => prev.filter((task) => task.id !== taskId));
    console.log('Task deleted:', taskId);
  }, []);

  /**
   * PM Workbench: Handle doc link click
   */
  const handleDocClick = useCallback((docId: string) => {
    const doc = demoDocs.find((d) => d.id === docId);
    if (doc) {
      console.log('Doc clicked:', doc.title, doc.url);
      // In a real app, this might open the doc in a modal or navigate to it
    }
  }, [demoDocs]);

  /**
   * Render workbench-specific content based on activeWorkbench
   */
  const renderWorkbenchContent = (workbench: WorkbenchId): ReactNode => {
    switch (workbench) {
      case 'work':
        return (
          <WorkWorkbench
            sessions={attachedSessions}
            onSessionClose={handleSessionClose}
            onSessionDetach={handleSessionDetach}
            onSessionInput={handleSessionInput}
            onNodeClick={handleNodeClick}
            onAgentClick={handleAgentClick}
          />
        );
      case 'maintenance':
        return <MaintenanceWorkbench />;
      case 'explore':
        return (
          <ExploreWorkbench
            sessionId={activeSessionId}
            onFileSelect={handleFileSelect}
            onFileOpen={handleFileOpen}
          />
        );
      case 'review':
        return <ReviewWorkbench />;
      case 'archive':
        return (
          <ArchiveWorkbench
            archivedSessions={archivedSessions}
            onRestore={handleArchiveRestore}
            onDelete={handleArchiveDelete}
            onClearAll={handleArchiveClearAll}
          />
        );
      case 'settings':
        return <SettingsWorkbench />;
      case 'pm':
        return (
          <PMWorkbench
            tasks={demoTasks}
            docs={demoDocs}
            milestones={demoMilestones}
            onTaskCreate={handleTaskCreate}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskDelete={handleTaskDelete}
            onDocClick={handleDocClick}
          />
        );
      case 'harmony':
        return <HarmonyWorkbench sessionId={activeSessionId} />;
      case 'editor':
        return (
          <EditorWorkbench
            sessionId={activeSessionId || ('' as SessionId)}
          />
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
          <div className={`workbench-content ${transitionClass}`}>
            {renderWorkbenchContent(activeWorkbench)}
            {children}
          </div>
        </main>
      </div>

      <footer className="workbench-bottom">
        <BottomControlPanel
          sessionId={activeSessionId}
          onSubmitInput={handleSubmitInput}
          onExecuteCommand={handleExecuteCommand}
          onSelectFlow={handleSelectFlow}
          disabled={!activeSessionId}
        />
      </footer>
    </div>
  );
}
