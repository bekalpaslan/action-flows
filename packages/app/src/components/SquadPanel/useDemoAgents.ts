/**
 * useDemoAgents - Hook for generating demo agent data
 * Provides mock agents with realistic states for testing SquadPanel
 *
 * Features:
 * - 1 orchestrator + 3-4 subagents with varied roles
 * - Different states: idle, working, thinking, success, error
 * - Sample logs for each agent
 * - Simulated activity with periodic updates
 */

import { useEffect, useState, useCallback } from 'react';
import type { AgentCharacter } from './types';
import { AGENT_NAMES } from './types';

const DEMO_AGENTS_ROLES = ['bash', 'read', 'write', 'grep'] as const;

/**
 * Generate initial orchestrator agent
 */
function createDemoOrchestrator(): AgentCharacter {
  return {
    id: 'demo-orchestrator',
    role: 'orchestrator',
    name: AGENT_NAMES.orchestrator,
    status: 'idle',
    logs: [
      {
        id: 'log-orch-1',
        type: 'info',
        message: 'Session initialized and ready',
        timestamp: Date.now() - 5000,
      },
      {
        id: 'log-orch-2',
        type: 'info',
        message: 'Orchestrator standing by for tasks',
        timestamp: Date.now() - 3000,
      },
    ],
    progress: 0,
    currentAction: 'Waiting for tasks',
  };
}

/**
 * Generate demo subagents with varied roles and initial states
 */
function createDemoSubagents(): AgentCharacter[] {
  const statuses = ['idle', 'thinking', 'working', 'success', 'error'] as const;
  const roles = DEMO_AGENTS_ROLES;

  return roles.map((role, index) => {
    const status = statuses[index % statuses.length];
    const agentId = `demo-agent-${role}-${index}`;

    // Generate realistic logs based on status
    const logs = generateLogsForStatus(agentId, status);

    return {
      id: agentId,
      role,
      name: AGENT_NAMES[role],
      status,
      logs,
      progress: status === 'working' ? Math.random() * 60 + 20 : status === 'success' ? 100 : 0,
      currentAction: getActionForRole(role, status),
      parentId: 'demo-orchestrator',
    };
  });
}

/**
 * Generate realistic logs for a given agent status
 */
function generateLogsForStatus(
  agentId: string,
  status: 'idle' | 'thinking' | 'working' | 'success' | 'error'
): AgentCharacter['logs'] {
  const baseTime = Date.now();

  switch (status) {
    case 'idle':
      return [
        {
          id: `${agentId}-log-1`,
          type: 'info',
          message: 'Agent initialized',
          timestamp: baseTime - 8000,
        },
        {
          id: `${agentId}-log-2`,
          type: 'info',
          message: 'Ready to execute tasks',
          timestamp: baseTime - 5000,
        },
      ];

    case 'thinking':
      return [
        {
          id: `${agentId}-log-1`,
          type: 'info',
          message: 'Task received',
          timestamp: baseTime - 6000,
        },
        {
          id: `${agentId}-log-2`,
          type: 'thinking',
          message: 'Analyzing requirements...',
          timestamp: baseTime - 3000,
        },
        {
          id: `${agentId}-log-3`,
          type: 'thinking',
          message: 'Planning execution strategy',
          timestamp: baseTime - 1000,
        },
      ];

    case 'working':
      return [
        {
          id: `${agentId}-log-1`,
          type: 'info',
          message: 'Task started',
          timestamp: baseTime - 7000,
        },
        {
          id: `${agentId}-log-2`,
          type: 'info',
          message: 'Executing step 1/3',
          timestamp: baseTime - 4000,
        },
        {
          id: `${agentId}-log-3`,
          type: 'info',
          message: 'Step 1 completed, processing step 2...',
          timestamp: baseTime - 2000,
        },
        {
          id: `${agentId}-log-4`,
          type: 'thinking',
          message: 'Computing results',
          timestamp: baseTime - 500,
        },
      ];

    case 'success':
      return [
        {
          id: `${agentId}-log-1`,
          type: 'info',
          message: 'Task started',
          timestamp: baseTime - 10000,
        },
        {
          id: `${agentId}-log-2`,
          type: 'info',
          message: 'Processing in progress',
          timestamp: baseTime - 6000,
        },
        {
          id: `${agentId}-log-3`,
          type: 'info',
          message: 'All checks passed',
          timestamp: baseTime - 2000,
        },
        {
          id: `${agentId}-log-4`,
          type: 'success',
          message: 'Task completed successfully',
          timestamp: baseTime - 100,
        },
      ];

    case 'error':
      return [
        {
          id: `${agentId}-log-1`,
          type: 'info',
          message: 'Task started',
          timestamp: baseTime - 8000,
        },
        {
          id: `${agentId}-log-2`,
          type: 'warning',
          message: 'Unexpected condition detected',
          timestamp: baseTime - 4000,
        },
        {
          id: `${agentId}-log-3`,
          type: 'error',
          message: 'Task failed: Resource not found',
          timestamp: baseTime - 500,
        },
      ];

    default:
      return [];
  }
}

/**
 * Get an appropriate action message for a role and status
 */
function getActionForRole(
  role: string,
  status: 'idle' | 'thinking' | 'working' | 'success' | 'error'
): string {
  const baseActions: Record<string, string> = {
    bash: 'Executing command',
    read: 'Reading file',
    write: 'Writing content',
    grep: 'Searching patterns',
  };

  const statusSuffixes: Record<typeof status, string> = {
    idle: 'Waiting...',
    thinking: 'Analyzing...',
    working: 'Processing...',
    success: 'Completed',
    error: 'Failed',
  };

  const baseAction = baseActions[role] || 'Working';
  return `${baseAction} - ${statusSuffixes[status]}`;
}

export interface UseDemoAgentsResult {
  orchestrator: AgentCharacter;
  subagents: AgentCharacter[];
  allAgents: AgentCharacter[];
}

/**
 * Hook that returns demo agents with optional periodic updates
 * @param enableUpdates If true, agents will change state periodically (for demo effect)
 */
export function useDemoAgents(enableUpdates: boolean = false): UseDemoAgentsResult {
  const [agents, setAgents] = useState<{
    orchestrator: AgentCharacter;
    subagents: AgentCharacter[];
  }>(() => ({
    orchestrator: createDemoOrchestrator(),
    subagents: createDemoSubagents(),
  }));

  /**
   * Simulate activity by updating agent states and logs
   */
  const simulateActivity = useCallback(() => {
    setAgents((prev) => {
      const orchestrator = { ...prev.orchestrator };
      const subagents = prev.subagents.map((agent) => {
        const agent_copy = { ...agent };

        // Randomly change status
        const statuses = ['idle', 'thinking', 'working', 'success', 'error'] as const;
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        // Add a new log entry occasionally
        if (Math.random() > 0.6) {
          const newLog = {
            id: `${agent.id}-log-${Date.now()}`,
            type: (['info', 'thinking', 'warning', 'success', 'error'] as const)[
              Math.floor(Math.random() * 4)
            ],
            message: `Activity update at ${new Date().toLocaleTimeString()}`,
            timestamp: Date.now(),
          };

          agent_copy.logs = [newLog, ...agent_copy.logs].slice(0, 20);
        }

        return agent_copy;
      });

      return { orchestrator, subagents };
    });
  }, []);

  /**
   * Set up periodic updates if enabled
   */
  useEffect(() => {
    if (!enableUpdates) return;

    const interval = setInterval(simulateActivity, 3000);
    return () => clearInterval(interval);
  }, [enableUpdates, simulateActivity]);

  return {
    orchestrator: agents.orchestrator,
    subagents: agents.subagents,
    allAgents: [agents.orchestrator, ...agents.subagents],
  };
}
