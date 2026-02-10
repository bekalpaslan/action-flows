/**
 * SidebarNavGroup Component
 * Collapsible navigation group with header and items
 */

import React, { type ReactNode } from 'react';

export interface SidebarNavGroupProps {
  groupId: string;
  label: string;
  icon: string;
  isExpanded: boolean;
  isCollapsed: boolean;
  onToggle: (groupId: string) => void;
  children: ReactNode;
}

export const SidebarNavGroup: React.FC<SidebarNavGroupProps> = ({
  groupId,
  label,
  icon,
  isExpanded,
  isCollapsed,
  onToggle,
  children,
}) => {
  const handleToggle = () => {
    if (!isCollapsed) {
      onToggle(groupId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isCollapsed && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onToggle(groupId);
    }
  };

  return (
    <div className="app-sidebar__nav-group">
      <button
        className="app-sidebar__nav-group-header"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`${label} group`}
        title={isCollapsed ? label : undefined}
      >
        <span className="app-sidebar__nav-group-icon">{icon}</span>
        {!isCollapsed && (
          <>
            <span className="app-sidebar__nav-group-label">{label}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`app-sidebar__nav-group-expand-btn ${isExpanded ? 'expanded' : 'collapsed'}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        )}
      </button>
      <div
        className={`app-sidebar__nav-group-items ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={
          isExpanded
            ? { maxHeight: `${React.Children.count(children) * 40}px` }
            : { maxHeight: '0px' }
        }
      >
        {children}
      </div>
    </div>
  );
};
