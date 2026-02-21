import React, { forwardRef, useEffect } from 'react';
import './Toast.css';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant;
  title?: string;
  message: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  duration?: number;
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      variant = 'info',
      title,
      message,
      icon,
      dismissible = true,
      onDismiss,
      duration,
      className,
      ...props
    },
    ref
  ) => {
    useEffect(() => {
      if (duration && onDismiss) {
        const timer = setTimeout(() => {
          onDismiss();
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [duration, onDismiss]);

    const containerClassName = [
      'afw-toast',
      `afw-toast--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={containerClassName}
        {...props}
      >
        {icon && <div className="afw-toast__icon">{icon}</div>}
        <div className="afw-toast__content">
          {title && <div className="afw-toast__title">{title}</div>}
          <div className="afw-toast__message">{message}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            type="button"
            className="afw-toast__dismiss"
            onClick={onDismiss}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';
