import React, { forwardRef, useState } from 'react';
import './Panel.css';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'elevated' | 'raised';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  closeable?: boolean;
  onClose?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  scrollable?: boolean;
}

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
}

export interface PanelFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      variant = 'base',
      header,
      footer,
      collapsible = false,
      collapsed: controlledCollapsed,
      onCollapse,
      closeable = false,
      onClose,
      padding = 'md',
      scrollable = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalCollapsed, setInternalCollapsed] = useState(false);
    const collapsed = controlledCollapsed ?? internalCollapsed;

    const handleCollapse = () => {
      const newCollapsed = !collapsed;
      if (onCollapse) {
        onCollapse(newCollapsed);
      } else {
        setInternalCollapsed(newCollapsed);
      }
    };

    const panelClasses = [
      'afw-panel',
      `afw-panel--${variant}`,
      collapsible && 'afw-panel--collapsible',
      collapsed && 'afw-panel--collapsed',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const bodyClasses = [
      'afw-panel__body',
      padding !== 'none' && `afw-panel__body--pad-${padding}`,
      scrollable && 'afw-panel__body--scrollable',
    ]
      .filter(Boolean)
      .join(' ');

    // Determine aria-label for region
    const ariaLabel =
      props['aria-label'] ||
      (typeof header === 'string' ? header : undefined) ||
      (React.isValidElement(header) &&
      typeof header.props.title === 'string'
        ? header.props.title
        : undefined);

    return (
      <div
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        className={panelClasses}
        {...props}
      >
        {header && (
          <div className="afw-panel__header">
            {React.isValidElement(header) ? (
              React.cloneElement(header as React.ReactElement<any>, {
                collapsible,
                collapsed,
                onCollapse: collapsible ? handleCollapse : undefined,
                closeable,
                onClose,
              })
            ) : (
              <div className="afw-panel__header-row">
                {header}
                {collapsible && (
                  <button
                    className="afw-panel__collapse-btn"
                    onClick={handleCollapse}
                    aria-expanded={!collapsed}
                    aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 2L8 6L4 10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
                {closeable && (
                  <button
                    className="afw-panel__close-btn"
                    onClick={onClose}
                    aria-label="Close panel"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 2L10 10M2 10L10 2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className={bodyClasses}>{children}</div>

        {footer && !collapsed && <div className="afw-panel__footer">{footer}</div>}
      </div>
    );
  }
);

Panel.displayName = 'Panel';

export const PanelHeader = forwardRef<HTMLDivElement, PanelHeaderProps>(
  (
    {
      title,
      icon,
      actions,
      tabs,
      className,
      collapsible,
      collapsed,
      onCollapse,
      closeable,
      onClose,
      ...props
    }: PanelHeaderProps & {
      collapsible?: boolean;
      collapsed?: boolean;
      onCollapse?: () => void;
      closeable?: boolean;
      onClose?: () => void;
    },
    ref
  ) => {
    const headerRowClasses = ['afw-panel__header-row', className]
      .filter(Boolean)
      .join(' ');

    const headerContent = (
      <>
        {icon && <div className="afw-panel__header-icon">{icon}</div>}
        {title && <div className="afw-panel__header-title">{title}</div>}
        {actions && <div className="afw-panel__header-actions">{actions}</div>}
        {collapsible && (
          <button
            className="afw-panel__collapse-btn"
            onClick={onCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 2L8 6L4 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {closeable && (
          <button
            className="afw-panel__close-btn"
            onClick={onClose}
            aria-label="Close panel"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 2L10 10M2 10L10 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </>
    );

    return (
      <>
        <div ref={ref} className={headerRowClasses} {...props}>
          {headerContent}
        </div>
        {tabs && <div className="afw-panel__header-tabs">{tabs}</div>}
      </>
    );
  }
);

PanelHeader.displayName = 'PanelHeader';

export const PanelFooter = forwardRef<HTMLDivElement, PanelFooterProps>(
  ({ children, className, ...props }, ref) => {
    const footerClasses = ['afw-panel__footer', className]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={footerClasses} {...props}>
        {children}
      </div>
    );
  }
);

PanelFooter.displayName = 'PanelFooter';
