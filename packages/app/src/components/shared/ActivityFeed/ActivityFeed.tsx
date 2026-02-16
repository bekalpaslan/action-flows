import React from 'react';
import './ActivityFeed.css';

export interface ActivityItem {
  id: string;
  type: 'chain' | 'step' | 'learning' | 'notification' | 'session';
  icon?: React.ReactNode;
  title: string;
  description?: string;
  timestamp: Date | string;
  action?: { label: string; onClick: () => void };
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  emptyMessage?: string;
  maxItems?: number;
}

/**
 * ActivityFeed Component
 *
 * A SnowUI-style scrollable feed of recent activity items.
 * Each item displays an icon, title, description, timestamp, and optional action.
 *
 * @example
 * ```tsx
 * <ActivityFeed
 *   items={[
 *     {
 *       id: '1',
 *       type: 'chain',
 *       title: 'Chain Started',
 *       description: 'Code and Review workflow',
 *       timestamp: new Date(),
 *     }
 *   ]}
 *   maxItems={50}
 * />
 * ```
 */
export function ActivityFeed({
  items,
  emptyMessage = 'No recent activity',
  maxItems = 50,
}: ActivityFeedProps): JSX.Element {
  const displayItems = items.slice(0, maxItems);

  const formatTimestamp = (timestamp: Date | string): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString();
  };

  const getTypeColor = (type: ActivityItem['type']): string => {
    switch (type) {
      case 'chain':
        return 'var(--snow-accent-blue)';
      case 'step':
        return 'var(--snow-accent-purple)';
      case 'learning':
        return 'var(--snow-accent-green)';
      case 'notification':
        return 'var(--snow-accent-cyan)';
      case 'session':
        return 'var(--snow-accent-mint)';
      default:
        return 'var(--snow-text-muted)';
    }
  };

  if (displayItems.length === 0) {
    return (
      <div className="activity-feed activity-feed--empty">
        <p className="activity-feed__empty-message">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {displayItems.map((item) => (
        <div key={item.id} className="activity-feed__item">
          <div
            className="activity-feed__icon"
            style={{ backgroundColor: getTypeColor(item.type) }}
          >
            {item.icon || item.type.charAt(0).toUpperCase()}
          </div>

          <div className="activity-feed__content">
            <div className="activity-feed__header">
              <h4 className="activity-feed__title">{item.title}</h4>
              <time className="activity-feed__time">{formatTimestamp(item.timestamp)}</time>
            </div>

            {item.description && (
              <p className="activity-feed__description">{item.description}</p>
            )}

            {item.action && (
              <button className="activity-feed__action" onClick={item.action.onClick}>
                {item.action.label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
