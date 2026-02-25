/**
 * AppSidebar Component
 * Vertical navigation sidebar for workbench switching, replacing the horizontal TopBar.
 * Features collapsible groups, theme toggle, and connection status.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkbenchContext } from '../../contexts/WorkbenchContext';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { ThemeToggle } from '../ThemeToggle';
import { SidebarNavGroup } from './SidebarNavGroup';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarUserProfile } from './SidebarUserProfile';
import { DEFAULT_WORKBENCH_CONFIGS } from '@afw/shared';
import type { WorkbenchId } from '@afw/shared';
import './AppSidebar.css';

// Workbench grouping structure
// Phase D: Tools (editor, canvas, coverage) removed - they're not navigable destinations
const WORKBENCH_GROUPS = {
  framework: {
    id: 'framework',
    label: 'Framework Tools',
    icon: '⚙️',
    workbenches: ['harmony', 'cosmic', 'respect', 'intel', 'settings'] as WorkbenchId[],
    defaultExpanded: false,
  },
  project: {
    id: 'project',
    label: 'Project Work',
    icon: '📦',
    workbenches: ['work', 'maintenance', 'explore', 'review', 'pm', 'archive'] as WorkbenchId[],
    defaultExpanded: true,
  },
} as const;

const COLLAPSE_STORAGE_KEY = 'afw-sidebar-collapsed';
const EXPANDED_GROUPS_STORAGE_KEY = 'afw-sidebar-expanded-groups';

export interface AppSidebarProps {
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ onCollapseChange }) => {
  const { activeWorkbench, setActiveWorkbench, workbenchNotifications } = useWorkbenchContext();
  const { status: connectionStatus } = useWebSocketContext();

  // Collapse state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    return stored === 'true';
  });

  // Group expand state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(EXPANDED_GROUPS_STORAGE_KEY);
    if (stored) {
      try {
        return new Set(JSON.parse(stored));
      } catch {
        return new Set(['project']);
      }
    }
    return new Set(['project']);
  });

  // Mobile overlay state
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Persist collapse state and notify parent
  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(isCollapsed));
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  // Persist expanded groups
  useEffect(() => {
    localStorage.setItem(EXPANDED_GROUPS_STORAGE_KEY, JSON.stringify([...expandedGroups]));
  }, [expandedGroups]);

  // Toggle collapse
  const handleCollapseToggle = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Toggle group expansion
  const handleGroupToggle = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  // Handle workbench navigation
  const handleWorkbenchClick = useCallback(
    (workbenchId: WorkbenchId) => {
      setActiveWorkbench(workbenchId);
      // Close mobile overlay after selection
      if (isMobileOpen) {
        setIsMobileOpen(false);
      }
    },
    [setActiveWorkbench, isMobileOpen]
  );


  // Get connection status badge color
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'var(--system-green)';
      case 'connecting':
        return 'var(--system-yellow)';
      case 'disconnected':
        return 'var(--system-red)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B to toggle collapse
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        handleCollapseToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCollapseToggle]);

  const sidebarClasses = [
    'app-sidebar',
    isCollapsed && 'app-sidebar--collapsed',
    isMobileOpen && 'app-sidebar--mobile-open',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="app-sidebar__hamburger"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="app-sidebar__backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={sidebarClasses}
        role="navigation"
        aria-label="Main navigation"
        data-testid="app-sidebar"
      >
        {/* Header */}
        <div className="app-sidebar__header">
          <div className="app-sidebar__logo">
            <span className="app-sidebar__logo-icon">AF</span>
            {!isCollapsed && (
              <div className="app-sidebar__logo-text-group">
                <span className="app-sidebar__logo-text">ActionFlows</span>
                <span className="app-sidebar__logo-subtitle">Living Universe</span>
              </div>
            )}
          </div>
          <button
            className="app-sidebar__collapse-btn"
            onClick={handleCollapseToggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isCollapsed ? 'chevron-collapsed' : 'chevron-expanded'}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div
            className="app-sidebar__connection-status"
            data-status={connectionStatus}
            title={`Connection: ${connectionStatus}`}
            style={{ '--status-color': getConnectionStatusColor() } as React.CSSProperties}
          />
        </div>

        {/* Nav Section */}
        <div className="app-sidebar__nav-section">
          {/* Groups */}
          {Object.entries(WORKBENCH_GROUPS).map(([groupId, group]) => {
            return (
              <SidebarNavGroup
                key={groupId}
                groupId={groupId}
                label={group.label}
                icon={group.icon}
                isExpanded={expandedGroups.has(groupId)}
                isCollapsed={isCollapsed}
                onToggle={handleGroupToggle}
              >
                {group.workbenches.map(workbenchId => {
                  const config = DEFAULT_WORKBENCH_CONFIGS[workbenchId];
                  if (!config) return null;
                  return (
                    <SidebarNavItem
                      key={workbenchId}
                      workbenchId={workbenchId}
                      config={config}
                      isActive={activeWorkbench === workbenchId}
                      isCollapsed={isCollapsed}
                      notificationCount={workbenchNotifications.get(workbenchId) || 0}
                      onClick={() => handleWorkbenchClick(workbenchId)}
                    />
                  );
                })}
              </SidebarNavGroup>
            );
          })}

        </div>

        {/* Footer */}
        <div className="app-sidebar__footer">
          <ThemeToggle />
          {!isCollapsed && <SidebarUserProfile />}
        </div>
      </aside>
    </>
  );
};
