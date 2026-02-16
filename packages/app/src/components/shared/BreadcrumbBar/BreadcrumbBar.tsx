import React from 'react';
import './BreadcrumbBar.css';

export interface BreadcrumbSegment {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface BreadcrumbBarProps {
  segments: BreadcrumbSegment[];
  actions?: React.ReactNode; // right-side action buttons (search, settings, etc.)
}

/**
 * BreadcrumbBar Component
 *
 * A SnowUI-style navigation breadcrumb bar with optional action buttons.
 * Displays hierarchical navigation path with clickable segments.
 *
 * @example
 * ```tsx
 * <BreadcrumbBar
 *   segments={[
 *     { label: 'Dashboard', icon: <HomeIcon />, onClick: () => navigate('/') },
 *     { label: 'Sessions', onClick: () => navigate('/sessions') },
 *     { label: 'Session-123' }
 *   ]}
 *   actions={<button>Settings</button>}
 * />
 * ```
 */
export function BreadcrumbBar({ segments, actions }: BreadcrumbBarProps): JSX.Element {
  return (
    <div className="breadcrumb-bar">
      <div className="breadcrumb-bar__navigation">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const isClickable = !isLast && !!segment.onClick;

          return (
            <React.Fragment key={index}>
              <div
                className={`breadcrumb-bar__segment ${
                  isLast ? 'breadcrumb-bar__segment--current' : ''
                } ${isClickable ? 'breadcrumb-bar__segment--clickable' : ''}`}
                onClick={segment.onClick}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    segment.onClick?.();
                  }
                }}
              >
                {segment.icon && <span className="breadcrumb-bar__icon">{segment.icon}</span>}
                <span className="breadcrumb-bar__label">{segment.label}</span>
              </div>

              {!isLast && <div className="breadcrumb-bar__divider">/</div>}
            </React.Fragment>
          );
        })}
      </div>

      {actions && <div className="breadcrumb-bar__actions">{actions}</div>}
    </div>
  );
}
