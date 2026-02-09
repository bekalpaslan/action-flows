import React, { useEffect, useRef, useState, useCallback } from 'react';
import './SlidingWindow.css';

export interface SlidingWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  children: React.ReactNode;
}

const STORAGE_KEY = 'sliding-window-width';
const DEFAULT_WIDTH = 400;
const DEFAULT_MIN_WIDTH = 300;
const DEFAULT_MAX_WIDTH = 800;

export const SlidingWindow: React.FC<SlidingWindowProps> = ({
  isOpen,
  onClose,
  title,
  width: propWidth,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
  children,
}) => {
  const [currentWidth, setCurrentWidth] = useState<number>(() => {
    if (propWidth) {
      return typeof propWidth === 'number' ? propWidth : parseInt(propWidth, 10);
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  // Save width to localStorage
  useEffect(() => {
    if (!propWidth) {
      localStorage.setItem(STORAGE_KEY, currentWidth.toString());
    }
  }, [currentWidth, propWidth]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      lastFocusedElement.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else if (lastFocusedElement.current) {
      lastFocusedElement.current.focus();
      lastFocusedElement.current = null;
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusableElements = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleFocusTrap);
    return () => document.removeEventListener('keydown', handleFocusTrap);
  }, [isOpen]);

  // Resize handling
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setCurrentWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="sliding-window-backdrop"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={panelRef}
        className={`sliding-window-panel ${isOpen ? 'open' : ''}`}
        style={{ width: currentWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sliding-window-title' : undefined}
        tabIndex={-1}
      >
        <div
          className="sliding-window-resize-handle"
          onMouseDown={handleResizeStart}
          aria-hidden="true"
        />

        <div className="sliding-window-header">
          {title && (
            <h2 id="sliding-window-title" className="sliding-window-title">
              {title}
            </h2>
          )}
          <button
            className="sliding-window-close"
            onClick={onClose}
            aria-label="Close panel"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="sliding-window-content">
          {children}
        </div>
      </div>
    </div>
  );
};
