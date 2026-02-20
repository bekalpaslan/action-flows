/**
 * WorkStar Component
 * Primary workbench for active development sessions
 *
 * Features:
 * - Header showing attached session count
 * - Empty state when no sessions are attached
 * - Session control callbacks (close, detach, input)
 * - Chat interface now provided by SlidingChatWindow in WorkbenchLayout
 *
 * Layout:
 * - Header bar with session count and controls
 */

import React from 'react';
import type { Session, FlowAction, SessionId, WorkbenchId } from '@afw/shared';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import { StatCard, StatCardRow } from '../shared/StatCard';
import { DashboardCard } from '../shared/DashboardCard';
import { useWorkbenchContext } from '../../contexts/WorkbenchContext';
import { useTerminal } from '../../contexts/TerminalContext';
import LazyTerminal from '../LazyTerminal';
import './WorkStar.css';

export interface WorkStarProps {
  /** Sessions currently attached to this workbench */
  sessions: Session[];

  /** Active session ID (determines which session to display) */
  activeSessionId?: string;

  /** Callback when a session is closed */
  onSessionClose?: (sessionId: string) => void;

  /** Callback when a session is detached from the workbench */
  onSessionDetach?: (sessionId: string) => void;

  /** Callback when user submits input in a session */
  onSessionInput?: (sessionId: string, input: string) => Promise<void>;

  /** Callback when a flow node is clicked */
  onNodeClick?: (sessionId: string, nodeId: string) => void;

  /** Callback when an agent avatar is clicked */
  onAgentClick?: (sessionId: string, agentId: string) => void;

  /** Available flows for SmartPromptLibrary */
  flows?: FlowAction[];

  /** Available actions for SmartPromptLibrary */
  actions?: FlowAction[];
}

/**
 * WorkStar - Main workbench for active development work
 */
export function WorkStar({
  sessions,
  activeSessionId,
  onSessionClose,
  onSessionDetach,
  onSessionInput,
  onNodeClick,
  onAgentClick,
  flows = [],
  actions = [],
}: WorkStarProps): React.ReactElement {
  const sessionCount = sessions.length;
  const { activeWorkbench } = useWorkbenchContext();
  const { perWorkbenchState, updateHeight, toggleCollapsed } = useTerminal();

  // Determine the active session: use activeSessionId if provided, else default to first session
  const activeSession = activeSessionId
    ? sessions.find(s => s.id === activeSessionId) || sessions[0]
    : sessions[0];

  // Get terminal state for current workbench
  const terminalState = perWorkbenchState.get(activeWorkbench as WorkbenchId) || {
    isVisible: false,
    sessionId: null,
    height: 200,
    isCollapsed: false,
  };

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'WorkStar',
    getContext: () => ({
      sessionCount: sessions.length,
      activeSession: activeSession?.id || null,
    }),
  });

  // Calculate metrics for StatCards
  const activeSessions = sessions.filter(s => s.status === 'in_progress' || s.status === 'pending').length;
  const totalChains = sessions.reduce((acc, s) => acc + (s.chains?.length || 0), 0);
  const completedSteps = sessions.reduce((acc, s) => {
    return acc + (s.chains || []).reduce((chainAcc, chain) => {
      return chainAcc + (chain.steps || []).filter(step => step.status === 'completed').length;
    }, 0);
  }, 0);
  const healthScore = activeSessions > 0 ? Math.min(100, Math.round((completedSteps / Math.max(1, totalChains * 3)) * 100)) : 0;

  return (
    <div className="work-workbench">
      {/* Header Bar */}
      <div className="work-workbench__header">
        <div className="work-workbench__header-left">
          <h1 className="work-workbench__title">Work Dashboard</h1>
          <div className="work-workbench__session-count">
            <span className="session-count-badge">
              {sessionCount === 0 ? 'No sessions' : `${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'}`}
            </span>
          </div>
        </div>
        <div className="work-workbench__header-right">
          <DiscussButton componentName="WorkStar" onClick={openDialog} size="small" />
          {/* Future: Add workbench controls (layout toggle, etc.) */}
        </div>
      </div>

      {/* Main Content - Chat functionality now provided by SlidingChatWindow */}
      <div className="work-workbench__content">
        {/* StatCards at the top */}
        <StatCardRow>
          <StatCard
            label="Active Sessions"
            value={activeSessions.toString()}
            trend={activeSessions > 0 ? 'up' : 'neutral'}
            change=""
            accentColor="var(--snow-accent-blue)"
          />
          <StatCard
            label="Total Chains"
            value={totalChains.toString()}
            trend="neutral"
            change=""
            accentColor="var(--snow-accent-purple)"
          />
          <StatCard
            label="Completed Steps"
            value={completedSteps.toString()}
            trend={completedSteps > 0 ? 'up' : 'neutral'}
            change=""
            accentColor="var(--snow-accent-green)"
          />
          <StatCard
            label="Health Score"
            value={`${healthScore}%`}
            trend="neutral"
            change=""
            accentColor="var(--snow-accent-mint)"
          />
        </StatCardRow>

        {/* Existing content wrapped in DashboardCard */}
        {sessionCount === 0 ? (
          <DashboardCard title="Sessions" variant="info">
            <div className="work-workbench__empty-state">
              <p>No sessions attached. Select a session from the sidebar to begin.</p>
            </div>
          </DashboardCard>
        ) : activeSession ? (
          <DashboardCard title="Active Session" variant="default">
            <div className="work-workbench__session-info">
              <p>Session: {activeSession.id}</p>
              <p>Use the chat panel on the right to interact with this session.</p>
            </div>
          </DashboardCard>
        ) : (
          <DashboardCard title="Sessions" variant="warning">
            <div className="work-workbench__empty-state">
              <p>Active session not found. Select a session from the sidebar.</p>
            </div>
          </DashboardCard>
        )}

        {/* Terminal - mounted via LazyTerminal for code-splitting */}
        {activeSessionId && (
          <div className="work-workbench__terminal-container" style={{ marginTop: '20px' }}>
            <LazyTerminal
              sessionId={activeSessionId as SessionId}
              height={terminalState.height}
              onHeightChange={(height: number) => updateHeight(activeWorkbench as WorkbenchId, height)}
              isCollapsed={terminalState.isCollapsed}
              onToggleCollapse={() => toggleCollapsed(activeWorkbench as WorkbenchId)}
            />
          </div>
        )}
      </div>

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="WorkStar"
        componentContext={{
          sessionCount: sessions.length,
          activeSession: activeSession?.id || null,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
