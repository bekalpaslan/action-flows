/**
 * LogBubble Component
 *
 * Individual log message bubble with timestamp and type-based styling.
 * Renders as a chat-style bubble with color coding for different log types.
 *
 * Log Types:
 * - info: neutral gray (default progress updates)
 * - success: soft green (completed tasks, successful operations)
 * - error: soft red (failures, exceptions, warnings)
 * - thinking: soft purple (processing, analysis, decision-making)
 * - warning: soft amber (cautions, potential issues)
 *
 * Includes subtle icon indicators for colorblind accessibility.
 */

import React from 'react';
import type { LogBubbleProps } from './types';
import './LogBubble.css';

/**
 * Get icon character for log type (for colorblind accessibility)
 */
function getLogTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    info: 'ℹ️',
    success: '✓',
    error: '✕',
    thinking: '◆',
    warning: '⚠',
  };
  return iconMap[type] || '•';
}

/**
 * Format timestamp to readable format
 * Shows time if within last 24h, date otherwise
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  // Less than a minute ago
  if (diffMins < 1) {
    return 'just now';
  }

  // Less than an hour ago
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  // Less than 24 hours ago
  if (diffMins < 1440) {
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  }

  // Use short date format
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LogBubble({ log, className = '' }: LogBubbleProps): React.ReactElement {
  const icon = getLogTypeIcon(log.type);
  const timestamp = formatTimestamp(log.timestamp);

  return (
    <div className={`log-bubble log-bubble-${log.type} ${className}`}>
      <div className="log-bubble-content">
        <div className="log-bubble-header">
          <span className="log-bubble-icon" title={log.type}>
            {icon}
          </span>
          <span className="log-bubble-message">{log.message}</span>
        </div>
        <div className="log-bubble-timestamp">{timestamp}</div>
      </div>
    </div>
  );
}
