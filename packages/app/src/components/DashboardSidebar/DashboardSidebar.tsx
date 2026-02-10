import React, { useState } from 'react';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './DashboardSidebar.css';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isExpandable?: boolean;
  prefix?: string;
  subItems?: Array<{ label: string; prefix: string }>;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  isActive,
  isExpandable,
  prefix,
  subItems
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <li className="dashboard-sidebar__menu-item-wrapper">
      <button
        className={`dashboard-sidebar__menu-item ${isActive ? 'dashboard-sidebar__menu-item--active' : ''}`}
        onClick={() => isExpandable && setIsExpanded(!isExpanded)}
      >
        <div className="dashboard-sidebar__menu-item-content">
          {prefix ? (
            <span className="dashboard-sidebar__prefix">{prefix}</span>
          ) : (
            <span className="dashboard-sidebar__icon">{icon}</span>
          )}
          <span className="dashboard-sidebar__menu-label">{label}</span>
        </div>
        {isExpandable && (
          <svg
            className={`dashboard-sidebar__expand-icon ${isExpanded ? 'dashboard-sidebar__expand-icon--expanded' : ''}`}
            width="12"
            height="8"
            viewBox="0 0 12 8"
          >
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        )}
      </button>
      {isExpandable && subItems && (
        <ul className={`dashboard-sidebar__submenu ${isExpanded ? 'dashboard-sidebar__submenu--expanded' : ''}`}>
          {subItems.map((item, index) => (
            <li key={index}>
              <button className="dashboard-sidebar__submenu-item">
                <span className="dashboard-sidebar__prefix">{item.prefix}</span>
                <span className="dashboard-sidebar__menu-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export const DashboardSidebar: React.FC = () => {
  const [isDashboardsExpanded, setIsDashboardsExpanded] = useState(true);

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend: handleDiscussSend } = useDiscussButton({
    componentName: 'DashboardSidebar',
    getContext: () => ({
      activeView: 'Analytics',
      pinnedItems: [],
    }),
  });

  // Handle discuss dialog send
  const handleDiscussDialogSend = (message: string) => {
    const formattedMessage = handleDiscussSend(message);
    console.log('Discussion message:', formattedMessage);
    closeDialog();
  };

  // Simple SVG icons
  const DashboardIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="0" y="0" width="7" height="7" fill="currentColor" />
      <rect x="9" y="0" width="7" height="7" fill="currentColor" />
      <rect x="0" y="9" width="7" height="7" fill="currentColor" />
      <rect x="9" y="9" width="7" height="7" fill="currentColor" />
    </svg>
  );

  const PageIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="2" y="0" width="12" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1" />
      <line x1="4" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1" />
      <line x1="4" y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="1" />
    </svg>
  );

  const AppIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="0" y="0" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="10" y="0" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="0" y="10" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="10" y="10" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  );

  const CartIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M1 1h2l1.68 8.39a1 1 0 001 .84h7.45a1 1 0 001-.84L15 4H4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="14" r="1" fill="currentColor" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
    </svg>
  );

  const LockIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="3" y="7" width="10" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 7V5a3 3 0 016 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="11" r="1" fill="currentColor" />
    </svg>
  );

  const DocIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M3 0h6l4 4v10a2 2 0 01-2 2H3a2 2 0 01-2-2V2a2 2 0 012-2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 0v4h4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );

  const GearIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1v2m0 10v2M1 8h2m10 0h2m-2.05-5.657l-1.414 1.414m-7.071 7.071l-1.414 1.414m9.899 0l-1.414-1.414M3.464 3.464L2.05 2.05" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );

  const ChangelogIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="2" y="1" width="12" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1" />
      <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1" />
      <line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1" />
    </svg>
  );

  const LogoIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <rect x="4" y="4" width="7" height="7" rx="1" fill="currentColor" />
      <rect x="13" y="4" width="7" height="7" rx="1" fill="currentColor" />
      <rect x="4" y="13" width="7" height="7" rx="1" fill="currentColor" />
      <rect x="13" y="13" width="7" height="7" rx="1" fill="currentColor" />
    </svg>
  );

  return (
    <nav className="dashboard-sidebar">
      {/* Logo */}
      <div className="dashboard-sidebar__logo">
        <span className="dashboard-sidebar__logo-icon">{LogoIcon}</span>
        <span className="dashboard-sidebar__logo-text">Material Dashboard 2 PRO</span>
        <DiscussButton componentName="DashboardSidebar" onClick={openDialog} size="small" />
      </div>

      <div className="dashboard-sidebar__separator"></div>

      {/* User Profile */}
      <button className="dashboard-sidebar__user-profile">
        <div className="dashboard-sidebar__avatar">BA</div>
        <span className="dashboard-sidebar__user-name">Brooklyn Alice</span>
        <svg className="dashboard-sidebar__dropdown-icon" width="12" height="8" viewBox="0 0 12 8">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </button>

      <div className="dashboard-sidebar__separator"></div>

      {/* Dashboards Section */}
      <div className="dashboard-sidebar__section">
        <button
          className="dashboard-sidebar__section-header dashboard-sidebar__section-header--expanded"
          onClick={() => setIsDashboardsExpanded(!isDashboardsExpanded)}
        >
          <div className="dashboard-sidebar__section-header-content">
            <span className="dashboard-sidebar__icon">{DashboardIcon}</span>
            <span className="dashboard-sidebar__menu-label">Dashboards</span>
          </div>
          <svg
            className={`dashboard-sidebar__expand-icon ${isDashboardsExpanded ? 'dashboard-sidebar__expand-icon--expanded' : ''}`}
            width="12"
            height="8"
            viewBox="0 0 12 8"
          >
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
        <ul className={`dashboard-sidebar__submenu ${isDashboardsExpanded ? 'dashboard-sidebar__submenu--expanded' : ''}`}>
          <li>
            <button className="dashboard-sidebar__submenu-item dashboard-sidebar__submenu-item--active">
              <span className="dashboard-sidebar__prefix">A</span>
              <span className="dashboard-sidebar__menu-label">Analytics</span>
            </button>
          </li>
          <li>
            <button className="dashboard-sidebar__submenu-item">
              <span className="dashboard-sidebar__prefix">S</span>
              <span className="dashboard-sidebar__menu-label">Smart Home</span>
            </button>
          </li>
        </ul>
      </div>

      {/* PAGES Section */}
      <div className="dashboard-sidebar__section-label">PAGES</div>
      <ul className="dashboard-sidebar__menu">
        <MenuItem icon={PageIcon} label="Pages" isExpandable />
        <MenuItem icon={AppIcon} label="Applications" isExpandable />
        <MenuItem icon={CartIcon} label="Ecommerce" isExpandable />
        <MenuItem
          icon={LockIcon}
          label="Authentication"
          isExpandable
          subItems={[
            { label: 'Error', prefix: 'E' },
            { label: 'Error 404', prefix: 'B' },
            { label: 'Error 500', prefix: 'C' }
          ]}
        />
      </ul>

      <div className="dashboard-sidebar__separator"></div>

      {/* DOCS Section */}
      <div className="dashboard-sidebar__section-label">DOCS</div>
      <ul className="dashboard-sidebar__menu">
        <MenuItem icon={DocIcon} label="Basic" />
        <MenuItem icon={GearIcon} label="Components" isExpandable />
        <MenuItem icon={ChangelogIcon} label="Changelog" />
      </ul>

      {/* DiscussDialog */}
      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="DashboardSidebar"
        componentContext={{
          activeView: 'Analytics',
          pinnedItems: [],
        }}
        onSend={handleDiscussDialogSend}
        onClose={closeDialog}
      />
    </nav>
  );
};
