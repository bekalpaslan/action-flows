import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import './Dialog.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  backdropBlur?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  icon?: React.ReactNode;
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Dialog({
  open,
  onClose,
  size = 'md',
  header,
  footer,
  children,
  closeOnEscape = true,
  closeOnBackdrop = true,
  showCloseButton = true,
  backdropBlur = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
}: DialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Store previously focused element and restore on close
  useEffect(() => {
    if (open) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    } else {
      previouslyFocusedElement.current?.focus();
      previouslyFocusedElement.current = null;
    }
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open || !contentRef.current) return;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && contentRef.current) {
        const focusableElements = Array.from(
          contentRef.current.querySelectorAll<HTMLElement>(focusableSelector)
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, onClose]);

  // Focus first focusable element on open
  useEffect(() => {
    if (open && contentRef.current) {
      const focusableSelector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      const firstFocusable = contentRef.current.querySelector<HTMLElement>(focusableSelector);
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const dialogElement = (
    <div
      className={`afw-dialog__backdrop${backdropBlur ? ' afw-dialog__backdrop--blur' : ''}`}
      onClick={handleBackdropClick}
    >
      <div
        ref={contentRef}
        className={`afw-dialog__content afw-dialog__content--${size}${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby || (header ? titleId : undefined)}
      >
        {showCloseButton && (
          <button
            type="button"
            className="afw-dialog__close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {header && (
          <div className="afw-dialog__header">
            {typeof header === 'string' ? (
              <h2 id={titleId} className="afw-dialog__header-title">
                {header}
              </h2>
            ) : (
              header
            )}
          </div>
        )}

        <div className="afw-dialog__body">{children}</div>

        {footer && <div className="afw-dialog__footer">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(dialogElement, document.body);
}

export function DialogHeader({ title, icon, children, className, ...props }: DialogHeaderProps) {
  if (children) {
    return (
      <div className={`afw-dialog__header${className ? ` ${className}` : ''}`} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={`afw-dialog__header${className ? ` ${className}` : ''}`} {...props}>
      {icon && <div className="afw-dialog__header-icon">{icon}</div>}
      {title && <h2 className="afw-dialog__header-title">{title}</h2>}
    </div>
  );
}

export function DialogFooter({ children, className, ...props }: DialogFooterProps) {
  return (
    <div className={`afw-dialog__footer${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </div>
  );
}
