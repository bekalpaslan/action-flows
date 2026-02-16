/**
 * SidebarNavItem Component
 * Individual navigation item with icon, label, badge, and glow effect
 */

import React, { useMemo, useContext } from 'react';
import type { WorkbenchConfig, WorkbenchId } from '@afw/shared';
import { GlowIndicator, type GlowLevel } from '../common';
import { NotificationGlowContext, type GlowState } from '../../hooks/useNotificationGlow';
import { useChatWindowContext } from '../../contexts/ChatWindowContext';

export interface SidebarNavItemProps {
  workbenchId: WorkbenchId;
  config: WorkbenchConfig;
  isActive: boolean;
  isCollapsed: boolean;
  notificationCount: number;
  onClick: () => void;
}

const DEFAULT_GLOW_STATE: GlowState = {
  active: false,
  level: 'info',
  intensity: 0,
  color: '#3b82f6',
};

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  workbenchId,
  config,
  isActive,
  isCollapsed,
  notificationCount,
  onClick,
}) => {
  // Check if this workbench has a saved chat session
  const { workbenchesWithChat } = useChatWindowContext();
  const hasSavedChat = !isActive && workbenchesWithChat.includes(workbenchId);

  // Get notification glow context
  const notificationGlowContext = useContext(NotificationGlowContext);

  // Get workbench glow state from context
  const glowState: GlowState = useMemo(() => {
    if (notificationGlowContext) {
      return notificationGlowContext.getWorkbenchGlow(workbenchId);
    }
    return DEFAULT_GLOW_STATE;
  }, [notificationGlowContext, workbenchId]);

  const hasNotifications = notificationCount > 0;

  const classes = [
    'app-sidebar__nav-item',
    isActive && 'app-sidebar__nav-item--active',
    config.disabled && 'app-sidebar__nav-item--disabled',
    hasNotifications && 'app-sidebar__nav-item--has-notifications',
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
      className="app-sidebar__nav-item-glow"
    >
      <button
        className={classes}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={config.disabled}
        title={isCollapsed ? config.label : config.tooltip || config.label}
        aria-label={`${config.label} workbench${hasNotifications ? ` (${notificationCount} notifications)` : ''}${glowState.active ? ' (new notifications)' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        style={
          hasNotifications && config.glowColor
            ? {
                '--glow-color': config.glowColor,
              } as React.CSSProperties
            : undefined
        }
      >
        <span className="app-sidebar__nav-item-icon" aria-hidden="true">
          {config.icon}
          {hasSavedChat && (
            <span
              className="app-sidebar__chat-indicator"
              style={{ '--chat-glow-color': config.glowColor || '#3b82f6' } as React.CSSProperties}
              aria-label="Chat active"
            />
          )}
        </span>
        {!isCollapsed && (
          <>
            <span className="app-sidebar__nav-item-label">{config.label}</span>
            {hasNotifications && (
              <span
                className="app-sidebar__nav-item-badge"
                aria-label={`${notificationCount} notifications`}
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </>
        )}
        {isCollapsed && (
          <span className="app-sidebar__nav-item-tooltip">{config.label}</span>
        )}
      </button>
    </GlowIndicator>
  );
};
