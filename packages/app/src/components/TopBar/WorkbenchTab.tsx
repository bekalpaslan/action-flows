/**
 * WorkbenchTab Component
 * Displays a clickable tab for workbench navigation with notification badge and glow effect.
 * Integrates with the notification glow system to show workbench-level notifications.
 */

import React from 'react';
import type { WorkbenchConfig, WorkbenchId } from '@afw/shared';
import { GlowIndicator, type GlowLevel } from '../common';
import { NotificationGlowContext, type GlowState } from '../../hooks/useNotificationGlow';
import './WorkbenchTab.css';

export interface WorkbenchTabProps {
  /** Workbench configuration */
  config: WorkbenchConfig;
  /** Whether this tab is currently active */
  isActive: boolean;
  /** Click handler for tab selection */
  onClick: () => void;
  /** Optional notification count override */
  notificationCount?: number;
}

/** Default glow state when no notification context is available */
const DEFAULT_GLOW_STATE: GlowState = {
  active: false,
  level: 'info',
  intensity: 0,
  color: '#3b82f6',
};

export const WorkbenchTab: React.FC<WorkbenchTabProps> = ({
  config,
  isActive,
  onClick,
  notificationCount,
}) => {
  // Get notification glow context (may be null if provider not mounted)
  const notificationGlowContext = React.useContext(NotificationGlowContext);

  // Get workbench glow state from context, fallback to default
  const glowState: GlowState = React.useMemo(() => {
    if (notificationGlowContext) {
      return notificationGlowContext.getWorkbenchGlow(config.id as WorkbenchId);
    }
    return DEFAULT_GLOW_STATE;
  }, [notificationGlowContext, config.id]);

  const finalNotificationCount = notificationCount ?? config.notificationCount;
  const hasNotifications = config.hasNotifications && finalNotificationCount > 0;

  const classes = [
    'workbench-tab',
    isActive && 'active',
    config.disabled && 'disabled',
    hasNotifications && 'has-notifications',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (!config.disabled) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!config.disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <GlowIndicator
      active={glowState.active}
      level={glowState.level as GlowLevel}
      intensity={glowState.intensity}
      pulse={glowState.active}
      className="workbench-tab-glow"
    >
      <button
        className={classes}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={config.disabled}
        title={config.tooltip || config.label}
        aria-label={`${config.label} workbench${hasNotifications ? ` (${finalNotificationCount} notifications)` : ''}${glowState.active ? ' (new notifications)' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        style={
          hasNotifications && config.glowColor
            ? {
                '--glow-color': config.glowColor,
              } as React.CSSProperties
            : undefined
        }
      >
        <span className="tab-icon" aria-hidden="true">
          {config.icon}
        </span>
        <span className="tab-label">{config.label}</span>

        {hasNotifications && (
          <span className="tab-badge" aria-label={`${finalNotificationCount} notifications`}>
            {finalNotificationCount > 99 ? '99+' : finalNotificationCount}
          </span>
        )}
      </button>
    </GlowIndicator>
  );
};
