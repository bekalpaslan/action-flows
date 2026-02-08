/**
 * useAgentTracking - Hook for tracking active agents
 * Listens to WebSocket events and maintains a map of agent state
 *
 * Features:
 * - Auto-subscribe/unsubscribe on sessionId change
 * - Maps WebSocket events to AgentCharacter state updates
 * - Auto-cleanup of idle agents (30s timeout)
 * - Memoized result to prevent unnecessary re-renders
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { eventGuards } from '@afw/shared';
import type { SessionId, WorkspaceEvent } from '@afw/shared';
import {
  type AgentCharacter,
  type AgentStatus,
  type UseAgentTrackingResult,
  type AgentTrackingState,
  mapActionToRole,
  AGENT_NAMES,
} from './types';
import { useDemoAgents } from './useDemoAgents';

const IDLE_AGENT_TIMEOUT_MS = 30000; // 30 seconds
const MAX_LOGS_PER_AGENT = 100; // Prevent unbounded log growth

/**
 * Hook to track and maintain state of all active agents in a session
 * Listens to WebSocket events and updates agent state accordingly
 * When sessionId is null, uses demo data for testing
 */
export function useAgentTracking(sessionId: SessionId | null): UseAgentTrackingResult {
  const { onEvent } = useWebSocketContext();

  // Load demo agents if no session ID (demo mode)
  const demoAgents = useDemoAgents(sessionId === null);

  const [state, setState] = useState<AgentTrackingState>({
    agents: new Map(),
    orchestratorId: null,
    lastEventTime: null,
  });

  const cleanupTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Clear a specific agent's cleanup timeout
   */
  const clearAgentTimeout = useCallback((agentId: string) => {
    const timeout = cleanupTimeoutsRef.current.get(agentId);
    if (timeout) {
      clearTimeout(timeout);
      cleanupTimeoutsRef.current.delete(agentId);
    }
  }, []);

  /**
   * Schedule agent cleanup if it remains idle for IDLE_AGENT_TIMEOUT_MS
   */
  const scheduleAgentCleanup = useCallback((agentId: string) => {
    // Clear existing timeout
    clearAgentTimeout(agentId);

    // Schedule new timeout
    const timeout = setTimeout(() => {
      setState((prev) => {
        const newAgents = new Map(prev.agents);
        newAgents.delete(agentId);
        return {
          ...prev,
          agents: newAgents,
        };
      });
      cleanupTimeoutsRef.current.delete(agentId);
    }, IDLE_AGENT_TIMEOUT_MS);

    cleanupTimeoutsRef.current.set(agentId, timeout);
  }, [clearAgentTimeout]);

  /**
   * Update agent status and reset idle timeout
   */
  const updateAgentStatus = useCallback(
    (agentId: string, newStatus: AgentStatus) => {
      setState((prev) => {
        const agents = new Map(prev.agents);
        const agent = agents.get(agentId);

        if (agent) {
          agent.status = newStatus;
          agents.set(agentId, { ...agent });
        }

        return {
          ...prev,
          agents,
        };
      });

      // Reset idle timeout for this agent
      scheduleAgentCleanup(agentId);
    },
    [scheduleAgentCleanup]
  );

  /**
   * Add a log entry to an agent
   */
  const addAgentLog = useCallback(
    (agentId: string, message: string, type: 'info' | 'success' | 'error' | 'thinking' | 'warning') => {
      setState((prev) => {
        const agents = new Map(prev.agents);
        const agent = agents.get(agentId);

        if (agent) {
          const logId = `${agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newLog = {
            id: logId,
            type,
            message,
            timestamp: Date.now(),
          };

          // Keep only last MAX_LOGS_PER_AGENT entries (newest at end)
          const logs = [...agent.logs, newLog].slice(-MAX_LOGS_PER_AGENT);
          agents.set(agentId, { ...agent, logs });
        }

        return {
          ...prev,
          agents,
        };
      });

      // Reset idle timeout when activity occurs
      scheduleAgentCleanup(agentId);
    },
    [scheduleAgentCleanup]
  );

  /**
   * Handle WebSocket events and update agent state
   */
  useEffect(() => {
    if (!onEvent || !sessionId) return;

    const unsubscribe = onEvent((event: WorkspaceEvent) => {
      // Filter events for this session only
      if (event.sessionId !== sessionId) return;

      // Handle session:started - create orchestrator agent
      if (eventGuards.isSessionStarted(event)) {
        setState((prev) => {
          const agents = new Map(prev.agents);
          const orchestratorId = `orchestrator-${sessionId}`;

          const orchestrator: AgentCharacter = {
            id: orchestratorId,
            role: 'orchestrator',
            name: AGENT_NAMES.orchestrator,
            status: 'idle',
            logs: [],
            progress: 0,
            currentAction: 'Initializing session...',
          };

          agents.set(orchestratorId, orchestrator);

          return {
            ...prev,
            agents,
            orchestratorId,
            lastEventTime: event.timestamp,
          };
        });

        scheduleAgentCleanup(`orchestrator-${sessionId}`);
        return;
      }

      // Handle step:spawned - create new agent for this step
      if (eventGuards.isStepSpawned(event)) {
        setState((prev) => {
          const agents = new Map(prev.agents);
          const agentId = `step-${event.stepNumber}-${event.sessionId}`;
          const role = mapActionToRole(event.action);
          const agent: AgentCharacter = {
            id: agentId,
            role,
            name: AGENT_NAMES[role],
            status: 'spawning',
            logs: [],
            progress: 0,
            currentAction: event.action || 'Initializing...',
            parentId: prev.orchestratorId || undefined,
          };

          agents.set(agentId, agent);

          return {
            ...prev,
            agents,
            lastEventTime: event.timestamp,
          };
        });

        scheduleAgentCleanup(`step-${event.stepNumber}-${event.sessionId}`);
        return;
      }

      // Handle step:started - mark agent as working
      if (eventGuards.isStepStarted(event)) {
        const agentId = `step-${event.stepNumber}-${event.sessionId}`;
        updateAgentStatus(agentId, 'working');
        addAgentLog(agentId, `Started: ${event.action || 'unknown action'}`, 'info');
        return;
      }

      // Handle step:completed - mark agent as success
      if (eventGuards.isStepCompleted(event)) {
        const agentId = `step-${event.stepNumber}-${event.sessionId}`;
        updateAgentStatus(agentId, 'success');

        let message = `Completed successfully`;
        if (event.summary) {
          message = event.summary;
        } else if (event.status) {
          message = `Status: ${event.status}`;
        }

        addAgentLog(agentId, message, 'success');

        // Update progress if available
        setState((prev) => {
          const agents = new Map(prev.agents);
          const agent = agents.get(agentId);
          if (agent) {
            agent.progress = 100;
            agents.set(agentId, { ...agent });
          }
          return { ...prev, agents };
        });

        return;
      }

      // Handle step:failed - mark agent as error
      if (eventGuards.isStepFailed(event)) {
        const agentId = `step-${event.stepNumber}-${event.sessionId}`;
        updateAgentStatus(agentId, 'error');

        let message = `Failed`;
        if (event.suggestion) {
          message = `Error: ${event.error || 'Unknown error'}. Suggestion: ${event.suggestion}`;
        } else if (event.error) {
          message = `Error: ${event.error}`;
        }

        addAgentLog(agentId, message, 'error');

        return;
      }

      // Handle chain:compiled - mark orchestrator as thinking
      if (eventGuards.isChainCompiled(event)) {
        if (state.orchestratorId) {
          updateAgentStatus(state.orchestratorId, 'thinking');
          addAgentLog(
            state.orchestratorId,
            event.title ? `Compiled chain: ${event.title}` : 'Chain compiled',
            'info'
          );
        }
        return;
      }

      // Handle chain:completed - mark orchestrator as idle/success
      if (eventGuards.isChainCompleted(event)) {
        if (state.orchestratorId) {
          const status = event.overallStatus === 'success' ? 'success' : 'idle';
          updateAgentStatus(state.orchestratorId, status);

          let message = `Chain completed: ${event.overallStatus}`;
          if (event.summary) {
            message = event.summary;
          }

          addAgentLog(state.orchestratorId, message, status === 'success' ? 'success' : 'info');
        }
        return;
      }
    });

    return unsubscribe;
  }, [onEvent, sessionId, state.orchestratorId, updateAgentStatus, addAgentLog, scheduleAgentCleanup]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clear all pending timeouts
      cleanupTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      cleanupTimeoutsRef.current.clear();
    };
  }, []);

  /**
   * Memoize result to prevent unnecessary re-renders
   * Use demo agents when sessionId is null (demo mode)
   */
  const result = useMemo<UseAgentTrackingResult>(() => {
    // Demo mode: return demo agents
    if (sessionId === null) {
      const agents = new Map<string, AgentCharacter>();
      demoAgents.allAgents.forEach((agent) => {
        agents.set(agent.id, agent);
      });

      return {
        agents,
        orchestrator: demoAgents.orchestrator,
        subagents: demoAgents.subagents,
      };
    }

    // Real mode: use WebSocket-driven state
    const orchestrator = state.orchestratorId ? (state.agents.get(state.orchestratorId) ?? null) : null;

    const subagents = Array.from(state.agents.values()).filter(
      (agent) => agent.id !== state.orchestratorId
    );

    return {
      agents: state.agents,
      orchestrator,
      subagents,
    };
  }, [state.agents, state.orchestratorId, sessionId, demoAgents]);

  return result;
}
