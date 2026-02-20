import React, { forwardRef, useRef, useState, useEffect } from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'rectangle' | 'square' | 'circle' | 'pill';
  loading?: boolean;
  glow?: 'none' | 'default' | 'hover' | 'always';
  effects?: Array<'pulse' | 'shimmer'>;
  icon?: React.ReactNode;
  iconPosition?: 'leading' | 'trailing';
  iconOnly?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      shape = 'rectangle',
      loading: externalLoading = false,
      glow = 'none',
      effects = [],
      icon,
      iconPosition = 'leading',
      iconOnly = false,
      className = '',
      children,
      disabled = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const [internalLoading, setInternalLoading] = useState(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    const loading = externalLoading || internalLoading;

    const classes = [
      'afw-button',
      `afw-button--${variant}`,
      `afw-button--${size}`,
      `afw-button--${shape}`,
      loading && 'afw-button--loading',
      iconOnly && 'afw-button--icon-only',
      glow !== 'none' && `afw-button--glow-${glow}`,
      ...effects.map((effect) => `afw-button--${effect}`),
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        e.preventDefault();
        return;
      }

      if (onClick) {
        const result = onClick(e);

        if (result instanceof Promise) {
          setInternalLoading(true);
          try {
            await result;
          } finally {
            if (isMountedRef.current) {
              setInternalLoading(false);
            }
          }
        }
      }
    };

    const renderSpinner = () => (
      <svg
        className="afw-button__spinner"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="28 10"
        />
      </svg>
    );

    const renderIcon = () => {
      if (loading) {
        return renderSpinner();
      }
      if (icon) {
        return <span className="afw-button__icon">{icon}</span>;
      }
      return null;
    };

    const renderContent = () => {
      if (iconOnly) {
        return renderIcon();
      }

      if (iconPosition === 'trailing') {
        return (
          <>
            {children && <span className="afw-button__label">{children}</span>}
            {renderIcon()}
          </>
        );
      }

      return (
        <>
          {renderIcon()}
          {children && <span className="afw-button__label">{children}</span>}
        </>
      );
    };

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading}
        onClick={handleClick}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

Button.displayName = 'Button';
