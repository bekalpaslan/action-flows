/**
 * AgentLogPanel Component
 *
 * Expandable log display that unfolds inline beneath an agent card.
 * Renders color-coded log bubbles with auto-scroll to bottom on new entries.
 *
 * Features:
 * - Inline expand/collapse animation (slide down from agent card)
 * - Max height with auto-scroll for many logs
 * - Auto-scroll to bottom on new log entries
 * - Chat bubble style - agent "speaks" their logs
 * - Border color matches agent's glow color
 */

import React, { useEffect, useRef } from 'react';
import type { AgentLogPanelProps } from './types';
import { LogBubble } from './LogBubble';
import './AgentLogPanel.css';

export function AgentLogPanel({
  agent,
  isExpanded,
  maxHeight = 400,
  className = '',
}: AgentLogPanelProps): React.ReactElement | null {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive or panel expands
  useEffect(() => {
    if (isExpanded && scrollContainerRef.current) {
      // Use setTimeout to ensure DOM has updated before scrolling
      const timer = setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isExpanded, agent.logs]);

  if (!isExpanded) {
    return null;
  }

  return (
    <div
      className={`agent-log-panel log-panel-expanded log-panel-border-${agent.role} ${className}`}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <div className="log-panel-header">
        <span className="log-panel-agent-name">{agent.name} Logs</span>
        <span className="log-panel-count">{agent.logs.length}</span>
      </div>

      <div className="log-panel-scroll-container" ref={scrollContainerRef}>
        {agent.logs.length === 0 ? (
          <div className="log-panel-empty">
            <p>No logs yet. Waiting for output...</p>
          </div>
        ) : (
          <div className="log-bubbles-list">
            {agent.logs.map((log) => (
              <LogBubble key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
