/**
 * ChainLiveMonitor - Real-time chain monitoring with event integration
 * Shows how to use useChainState and useChainEvents together
 */

import { useMemo } from 'react';
import type { SessionId } from '@afw/shared';
import { useChainState, useChainEvents, useChainEventSummary } from '../hooks';
import { ChainDAG } from './ChainDAG';
import '../styles/ChainLiveMonitor.css';

interface ChainLiveMonitorProps {
  sessionId: SessionId;
  initialChain?: any;
}

/**
 * Complete integration of state management and event handling
 * This component demonstrates the full flow of:
 * 1. Maintaining chain state with useChainState
 * 2. Listening to WebSocket events with useChainEvents
 * 3. Updating chain state when events arrive
 * 4. Displaying real-time updates in ChainDAG
 */
export const ChainLiveMonitor: React.FC<ChainLiveMonitorProps> = ({
  sessionId,
  initialChain,
}) => {
  const { chain, updateStep, setChain } = useChainState();
  const eventSummary = useChainEventSummary(sessionId);

  // Initialize chain on mount
  useMemo(() => {
    if (initialChain && !chain) {
      setChain(initialChain);
    }
  }, [initialChain, chain, setChain]);

  /**
   * Set up event listeners for step status updates
   */
  useChainEvents(
    sessionId,
    // onStepSpawned - Step execution started
    (stepNumber) => {
      updateStep(stepNumber, {
        status: 'in_progress',
        startedAt: new Date().toISOString() as any,
      });
    },
    // onStepCompleted - Step finished successfully
    (stepNumber, duration) => {
      updateStep(stepNumber, {
        status: 'completed',
        duration: duration || 0,
        completedAt: new Date().toISOString() as any,
      });
    },
    // onStepFailed - Step encountered an error
    (stepNumber, error) => {
      updateStep(stepNumber, {
        status: 'failed',
        error: error || 'Unknown error',
        completedAt: new Date().toISOString() as any,
      });
    },
    // onStepSkipped - Step was skipped
    (stepNumber) => {
      updateStep(stepNumber, {
        status: 'skipped',
      });
    }
  );

  if (!chain) {
    return (
      <div className="chain-monitor-loading">
        <div className="spinner"></div>
        <p>Waiting for chain data...</p>
      </div>
    );
  }

  return (
    <div className="chain-live-monitor">
      <div className="monitor-header">
        <h2>Live Chain Monitor</h2>
        <div className="event-status">
          <div className="status-indicator">
            <span className="indicator-dot online"></span>
            <span className="indicator-text">
              Last event: {eventSummary.lastEventTime ? new Date(eventSummary.lastEventTime).toLocaleTimeString() : 'None'}
            </span>
          </div>
          <div className="event-counter">
            Total events: <strong>{eventSummary.totalEvents}</strong>
          </div>
        </div>
      </div>

      <div className="monitor-content">
        <ChainDAG chain={chain} />
      </div>

      <div className="monitor-footer">
        <div className="event-info">
          <span>Latest event type: <code>{eventSummary.lastEventType || 'none'}</code></span>
          <span>Recent step: <code>#{eventSummary.recentStepNumber || '-'}</code></span>
        </div>
      </div>
    </div>
  );
};
