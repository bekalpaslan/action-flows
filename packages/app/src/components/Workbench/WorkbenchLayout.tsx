import { type ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { useWorkbenchContext } from '../../contexts/WorkbenchContext';
import { useUniverseContext } from '../../contexts/UniverseContext';
import { useSessionContext } from '../../contexts/SessionContext';
import { useChatWindowContext } from '../../contexts/ChatWindowContext';
import { useTerminal } from '../../contexts/TerminalContext';
import { useChatKeyboardShortcuts } from '../../hooks/useChatKeyboardShortcuts';
import { useFeatureFlagSimple } from '../../hooks/useFeatureFlag';
import { AppSidebar } from '../AppSidebar';

import { SlidingChatWindow } from '../SlidingChatWindow/SlidingChatWindow';
import { ChatPanel } from '../SessionPanel/ChatPanel';
import { CosmicMap as WorkbenchMap } from '../CosmicMap/CosmicMap';
import { RegionFocusView } from '../RegionFocus/RegionFocusView';
import { BreadcrumbBar } from '../shared/BreadcrumbBar';
import { WorkbenchToolbar } from './StarToolbar';
import { WorkStar as WorkWorkbench } from '../Stars/WorkStar';
import { CanvasTool } from '../Tools/CanvasTool/CanvasTool';
import { EditorTool } from '../Tools/EditorTool/EditorTool';
import { ReviewStar as ReviewWorkbench } from '../Stars/ReviewStar';
import { PMStar as PMWorkbench, type PMTask, type DocLink, type Milestone, type TaskStatus } from '../Stars/PMStar';
import { MaintenanceStar as MaintenanceWorkbench } from '../Stars/MaintenanceStar';
import { SettingsStar as SettingsWorkbench } from '../Stars/SettingsStar';
import { HarmonySpaceWorkbench } from '../Harmony/HarmonySpaceWorkbench';
import { ExploreStar as ExploreWorkbench } from '../Stars/ExploreStar';
import { ArchiveStar as ArchiveWorkbench } from '../Stars/ArchiveStar';
import { IntelStar as IntelWorkbench } from '../Stars/IntelStar';
import { RespectStar as RespectWorkbench } from '../Stars/RespectStar/RespectStar';
import { StoryStar as StoryWorkbench } from '../Stars/StoryStar/StoryStar';
import { CoverageTool } from '../Tools/CoverageTool/CoverageTool';
import { useSessionArchive } from '../../hooks/useSessionArchive';
import { CommandCenter } from '../CosmicMap/CommandCenter';
import {
  type WorkbenchId,
  type SessionId,
  type Session,
  type FlowAction,
  STAR_CONFIGS as WORKBENCH_CONFIGS,
} from '@afw/shared';
import './WorkbenchLayout.css';

/**
 * Static ActionFlows data
 * TODO: Replace with backend API when flows endpoint is implemented
 */
const ACTIONFLOWS_FLOWS: FlowAction[] = [
  {
    id: 'code-and-review',
    name: 'Code and Review',
    description: 'Standard implementation with review',
    category: 'flow',
    icon: '🔧',
  },
  {
    id: 'audit-and-fix',
    name: 'Audit and Fix',
    description: 'QA with remediation',
    category: 'flow',
    icon: '🔍',
  },
  {
    id: 'ideation',
    name: 'Ideation',
    description: 'Structured brainstorming',
    category: 'flow',
    icon: '💡',
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Framework teaching',
    category: 'flow',
    icon: '📚',
  },
  {
    id: 'doc-reorganization',
    name: 'Doc Reorganization',
    description: 'Analyze → plan → code → review',
    category: 'flow',
    icon: '📝',
  },
];

const ACTIONFLOWS_ACTIONS: FlowAction[] = [
  {
    id: 'analyze',
    name: 'Analyze',
    description: 'Data-driven analysis',
    category: 'action',
    icon: '📊',
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    description: 'Structured brainstorming',
    category: 'action',
    icon: '💭',
  },
  {
    id: 'code',
    name: 'Code',
    description: 'Code implementation',
    category: 'action',
    icon: '💻',
  },
  {
    id: 'review',
    name: 'Review',
    description: 'Code review',
    category: 'action',
    icon: '👁️',
  },
  {
    id: 'plan',
    name: 'Plan',
    description: 'Planning',
    category: 'action',
    icon: '📋',
  },
  {
    id: 'test',
    name: 'Test',
    description: 'Testing',
    category: 'action',
    icon: '🧪',
  },
  {
    id: 'commit',
    name: 'Commit',
    description: 'Git commit',
    category: 'action',
    icon: '✅',
  },
];

/**
 * WorkbenchLayout - Main shell layout that replaces AppContent
 *
 * Structure:
 * - TopBar at the top
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
    url: '/docs/specs/FRD-SelfEvolvingUI.md',
    category: 'Requirements',
    description: 'Functional Requirements Document for Self-Evolving UI',
  },
  {
    id: 'doc-2',
    title: 'SRD - Self-Evolving UI',
    url: '/docs/specs/SRD-SelfEvolvingUI.md',
    category: 'Requirements',
    description: 'System Requirements Document with technical specifications',
  },
  {
    id: 'doc-3',
    title: 'ActionFlows Framework',
    url: '/.claude/actionflows/ORGANIZATION.md',
    category: 'Framework',
    description: 'ActionFlows context and routing documentation',
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
  const { targetWorkbenchId, universe: workbenchGraph } = useUniverseContext();
  const { sessions: contextSessions, activeSessionId: contextActiveSessionId, getSession } = useSessionContext();
  const { sessionId: chatSessionId, closeChat, saveAndSwitch } = useChatWindowContext();
  const { saveAndSwitch: saveTerminalSwitch } = useTerminal();

  // Enable keyboard shortcuts for chat window
  useChatKeyboardShortcuts();

  // Save/restore chat and terminal state when switching workbenches
  const prevWorkbenchForChat = useRef<WorkbenchId>(activeWorkbench);
  useEffect(() => {
    if (prevWorkbenchForChat.current !== activeWorkbench) {
      saveAndSwitch(prevWorkbenchForChat.current, activeWorkbench);
      saveTerminalSwitch(prevWorkbenchForChat.current, activeWorkbench);
      prevWorkbenchForChat.current = activeWorkbench;
    }
  }, [activeWorkbench, saveAndSwitch, saveTerminalSwitch]);

  // Feature flags for map mode and classic mode
  const mapModeEnabled = useFeatureFlagSimple('COSMIC_MAP_ENABLED');
  const classicMode = useFeatureFlagSimple('CLASSIC_DASHBOARD_MODE');
  const commandCenterEnabled = useFeatureFlagSimple('COMMAND_CENTER_ENABLED');

  // Initial view mode: respect classic mode and verify map data exists
  const effectiveMapModeEnabled = mapModeEnabled && !classicMode && (workbenchGraph?.regions?.length ?? 0) > 0;

  // View mode state: 4-state FSM for zoom transitions
  // 'map' -> 'zooming-in' -> 'region-focus' -> 'zooming-out' -> 'map'
  type ViewMode = 'map' | 'zooming-in' | 'region-focus' | 'zooming-out' | 'workbench';
  const [viewMode, setViewMode] = useState<ViewMode>(
    effectiveMapModeEnabled ? 'map' : 'workbench'
  );

  // Track AppSidebar collapse state for layout adjustment
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem('afw-sidebar-collapsed');
    return stored === 'true';
  });

  // Sessions come from SessionContext — no local duplication needed
  const attachedSessions = contextSessions;
  const [activeSessionId, setActiveSessionId] = useState<SessionId | undefined>();

  // Sync activeSessionId from context when it changes
  useEffect(() => {
    if (contextActiveSessionId) {
      setActiveSessionId(contextActiveSessionId as SessionId);
    }
  }, [contextActiveSessionId]);

  // Workbench transition state
  const [transitionClass, setTransitionClass] = useState<string>('workbench-enter-done');
  const prevWorkbench = useRef<WorkbenchId>(activeWorkbench);
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle workbench transitions (180ms for normal, 400ms for region-focus)
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

          // Use 400ms duration when switching to region-focus, 180ms otherwise
          const duration = viewMode === 'region-focus' ? 400 : 180;

          // Transition to done state after animation completes
          transitionTimeout.current = setTimeout(() => {
            setTransitionClass('workbench-enter-done');
          }, duration);
        });
      });

      prevWorkbench.current = activeWorkbench;
    }

    return () => {
      if (transitionTimeout.current) {
        clearTimeout(transitionTimeout.current);
      }
    };
  }, [activeWorkbench, viewMode]);

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
   * Handle file selection in Explore workbench
   */
  const handleFileSelect = useCallback((path: string) => {
    console.log('File selected:', path);
  }, []);

  /**
   * Handle file open in Explore workbench
   */
  const handleFileOpen = useCallback((path: string) => {
    console.log('File opened:', path);
    // TODO: Navigate to editor tool or open in a tab
  }, []);

  /**
   * Handle session close — clear active selection
   */
  const handleSessionClose = useCallback((sessionId: string) => {
    if (activeSessionId === sessionId) {
      setActiveSessionId(undefined);
    }
  }, [activeSessionId]);

  /**
   * Handle session detach — clear active selection
   */
  const handleSessionDetach = useCallback((sessionId: string) => {
    if (activeSessionId === sessionId) {
      setActiveSessionId(undefined);
    }
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

  // Removed handleSubmitInput, handleExecuteCommand, handleSelectFlow
  // These were used by BottomControlPanel which was removed in Phase 2
  // Input submission now handled by ConversationPanel inside SessionPanelLayout
  // Flow/action selection now handled by SmartPromptLibrary inside SessionPanelLayout

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
   * Handle map region navigation
   * When user clicks a region in map view, switch to region-focus with zoom transition
   */
  useEffect(() => {
    if (viewMode === 'map' && targetWorkbenchId) {
      // Set active workbench immediately
      setActiveWorkbench(targetWorkbenchId);

      // Start zoom-in transition (FSM: map -> zooming-in)
      setViewMode('zooming-in');

      // Switch to region-focus after 400ms zoom animation (FSM: zooming-in -> region-focus)
      const timerId = setTimeout(() => {
        setViewMode('region-focus');
      }, 400);

      // Cleanup: prevent setState on unmounted component
      return () => clearTimeout(timerId);
    }
  }, [targetWorkbenchId, viewMode, setActiveWorkbench]);

  /**
   * Handle return to map button click
   * Triggers zoom-out transition back to map
   */
  const handleReturnToMap = useCallback(() => {
    // Prevent double-triggering during transition
    if (viewMode === 'zooming-out' || viewMode === 'zooming-in') return;

    // Clear any pending return timeout to prevent stacking
    if (returnTimeout.current) {
      clearTimeout(returnTimeout.current);
    }

    // Start zoom-out transition (FSM: region-focus -> zooming-out)
    setViewMode('zooming-out');

    // Switch to map after 400ms zoom animation (FSM: zooming-out -> map)
    returnTimeout.current = setTimeout(() => {
      setViewMode('map');
    }, 400);
  }, [viewMode]);

  /**
   * Render workbench-specific content based on activeWorkbench
   * Phase D: Handles workbenches + harmony. Tools are not routable destinations.
   */
  const renderWorkbenchContent = (workbench: WorkbenchId): ReactNode => {
    switch (workbench) {
      case 'work':
        return (
          <WorkWorkbench
            sessions={attachedSessions}
            activeSessionId={activeSessionId}
            onSessionClose={handleSessionClose}
            onSessionDetach={handleSessionDetach}
            onSessionInput={handleSessionInput}
            onNodeClick={handleNodeClick}
            onAgentClick={handleAgentClick}
            flows={ACTIONFLOWS_FLOWS}
            actions={ACTIONFLOWS_ACTIONS}
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
        return <HarmonySpaceWorkbench sessionId={activeSessionId} />;
      case 'intel':
        return <IntelWorkbench />;
      case 'respect':
        return <RespectWorkbench />;
      case 'story':
        return <StoryWorkbench />;
      default:
        return (
          <div className="workbench-placeholder">
            <h1>Unknown Workbench</h1>
            <p>Workbench not found: {workbench}</p>
          </div>
        );
    }
  };

  return (
    <div className="app-shell" data-testid="workbench-layout">
      <AppSidebar onCollapseChange={setSidebarCollapsed} />

      <div className="main-content" data-testid="layout-wrapper">
        {/* Layer 3: workbench-panel — contains toolbar + workbench content (chat is sibling) */}
        <div className="workbench-panel" data-testid="workbench-panel">
          {/* Map View + Zooming In/Out states */}
          {effectiveMapModeEnabled && (viewMode === 'map' || viewMode === 'zooming-in' || viewMode === 'zooming-out') ? (
            <div className="workbench-dashboard" style={{ flex: 1 }} data-testid="content-area">
              <WorkbenchMap visible={viewMode === 'map'} zooming={viewMode === 'zooming-in' || viewMode === 'zooming-out'} />
            </div>
          ) : effectiveMapModeEnabled && viewMode === 'region-focus' ? (
            /* Region Focus View - Dual-panel with workbench + chat */
            <div className="workbench-dashboard" style={{ flex: 1 }} data-testid="content-area">
              <RegionFocusView
                workbenchContent={renderWorkbenchContent(activeWorkbench)}
                chatSessionId={chatSessionId}
                onReturnToUniverse={handleReturnToMap}
                workbenchId={activeWorkbench}
              />
            </div>
          ) : (
            /* Workbench View (legacy mode when map mode is disabled or classic mode is enabled) */
            <>
              {/* WorkbenchToolbar - L4 fixed toolbar at top of workbench */}
              <WorkbenchToolbar />

              <div className="workbench-dashboard" style={{ flex: 1, transition: 'flex 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} data-testid="content-area">
                <main id="main-content" className="workbench-main" role="main">
                  <div className={`workbench-content ${transitionClass}`}>
                    {/* Return to Map button (visible when map mode is enabled and not in classic mode) */}
                    {effectiveMapModeEnabled && (
                      <button
                        className="workbench-layout__return-to-map"
                        onClick={handleReturnToMap}
                        title="Return to map view (U)"
                      >
                        Map
                      </button>
                    )}

                    {/* BreadcrumbBar (Harmony renders its own breadcrumb in header) */}
                    {activeWorkbench !== 'harmony' && (
                      <BreadcrumbBar
                        segments={[
                          { label: WORKBENCH_CONFIGS[activeWorkbench]?.label || activeWorkbench }
                        ]}
                      />
                    )}

                    {renderWorkbenchContent(activeWorkbench)}
                    {children}
                  </div>
                </main>
              </div>
            </>
          )}
        </div>

        {/* SlidingChatWindow - Now sibling of workbench-panel (L6 hierarchy fix) */}
        <SlidingChatWindow>
          {chatSessionId !== null && (
            <ChatPanel
              sessionId={chatSessionId}
              session={getSession(chatSessionId)}
              showCloseButton={true}
              onClose={closeChat}
            />
          )}
        </SlidingChatWindow>
      </div>

      {/* Layer 2: CommandCenter — app shell level, always visible */}
      {commandCenterEnabled && (
        <CommandCenter showHealthStatus={true} />
      )}

      {/* BottomControlPanel removed in Phase 2 - functionality moved to ConversationPanel + SmartPromptLibrary */}
    </div>
  );
}
