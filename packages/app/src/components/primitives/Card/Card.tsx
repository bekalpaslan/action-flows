import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  span?: 1 | 2 | 3 | 'full';
  hoverEffect?: 'none' | 'lift' | 'scale' | 'glow' | 'border';
  accentColor?: 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple' | 'none';
  interactive?: boolean;
  selected?: boolean;
  state?: 'idle' | 'error' | 'success' | 'warning';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      span = 1,
      hoverEffect = 'none',
      accentColor = 'none',
      interactive = false,
      selected = false,
      state = 'idle',
      header,
      footer,
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (interactive && onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick(event);
      }
    };

    const classNames = [
      'afw-card',
      `afw-card--${variant}`,
      `afw-card--span-${span}`,
      hoverEffect !== 'none' && `afw-card--hover-${hoverEffect}`,
      accentColor !== 'none' && `afw-card--accent-${accentColor}`,
      interactive && 'afw-card--interactive',
      selected && 'afw-card--selected',
      state !== 'idle' && `afw-card--${state}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={classNames}
        role={interactive ? 'button' : 'article'}
        tabIndex={interactive ? 0 : undefined}
        onClick={interactive ? onClick : undefined}
        onKeyDown={interactive ? handleKeyDown : undefined}
        {...props}
      >
        {header && <div className="afw-card__header">{header}</div>}
        <div className="afw-card__body">{children}</div>
        {footer && <div className="afw-card__footer">{footer}</div>}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
  className,
  children,
  ...props
}) => {
  if (children) {
    return (
      <div className={`afw-card__header ${className || ''}`.trim()} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={`afw-card__header ${className || ''}`.trim()} {...props}>
      {icon && <div className="afw-card__header-icon">{icon}</div>}
      {(title || subtitle) && (
        <div className="afw-card__header-text">
          {title && <div className="afw-card__header-title">{title}</div>}
          {subtitle && <div className="afw-card__header-subtitle">{subtitle}</div>}
        </div>
      )}
      {(badge || actions) && (
        <div className="afw-card__header-trailing">
          {badge}
          {actions}
        </div>
      )}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

export const CardFooter: React.FC<CardFooterProps> = ({ children, className, ...props }) => {
  return (
    <div className={`afw-card__footer ${className || ''}`.trim()} {...props}>
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';
