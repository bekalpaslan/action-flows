import React, { useState, useCallback } from 'react';
import type { ButtonDefinition, ToolbarSlot } from '@afw/shared';
import './PersistentToolbarButton.css';

export interface PersistentToolbarButtonProps {
  /** Button definition */
  button: ButtonDefinition;
  /** Toolbar slot configuration */
  slot?: ToolbarSlot;
  /** Click handler for button execution */
  onClick: () => void;
  /** Callback when pin status changes */
  onTogglePin: (pinned: boolean) => void;
  /** Callback when button is removed from toolbar */
  onRemove: () => void;
}

/**
 * Individual persistent toolbar button with:
 * - Icon + label rendering
 * - Pin indicator (pinned status)
 * - Usage count badge (optional)
 * - Right-click context menu for pin/unpin/remove
 * - Click handler for action execution
 */
export function PersistentToolbarButton({
  button,
  slot,
  onClick,
  onTogglePin,
  onRemove,
}: PersistentToolbarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const handleClick = useCallback(async () => {
    if (!button.enabled || isLoading) return;

    setIsLoading(true);
    try {
      onClick();
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [button.enabled, isLoading, onClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  const handlePinToggle = useCallback(() => {
    if (slot) {
      onTogglePin(!slot.pinned);
    }
    setShowContextMenu(false);
  }, [slot, onTogglePin]);

  const handleRemove = useCallback(() => {
    onRemove();
    setShowContextMenu(false);
  }, [onRemove]);

  // Get icon SVG or emoji
  const getIcon = () => {
    if (!button.icon) {
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    }

    // Check if icon is emoji
    if (button.icon.length <= 2) {
      return <span className="button-emoji">{button.icon}</span>;
    }

    // Otherwise, try to render as SVG name
    return <span className="button-icon-name">{button.icon}</span>;
  };

  const isPinned = slot?.pinned ?? false;

  return (
    <>
      <div className="persistent-toolbar-button-wrapper">
        <button
          className={`persistent-toolbar-btn ${isLoading ? 'loading' : ''} ${!button.enabled ? 'disabled' : ''} ${isPinned ? 'pinned' : ''}`}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          disabled={!button.enabled || isLoading}
          title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
        >
          <span className="button-icon">
            {isLoading ? (
              <svg className="spinner" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 7 7" to="360 7 7" dur="1s" repeatCount="indefinite" />
                </circle>
              </svg>
            ) : (
              getIcon()
            )}
          </span>

          {isPinned && <span className="pin-indicator">📌</span>}

          {slot && slot.usageCount > 0 && (
            <span className="usage-badge">{Math.min(slot.usageCount, 99)}</span>
          )}
        </button>

        <span className="button-label">{button.label}</span>
      </div>

      {showContextMenu && (
        <>
          <div className="context-menu-overlay" onClick={() => setShowContextMenu(false)} />
          <div
            className="context-menu"
            style={{
              position: 'fixed',
              top: `${contextMenuPos.y}px`,
              left: `${contextMenuPos.x}px`,
            }}
          >
            <button
              className="context-menu-item"
              onClick={handlePinToggle}
            >
              {isPinned ? '📍 Unpin' : '📌 Pin'}
            </button>
            <button
              className="context-menu-item danger"
              onClick={handleRemove}
            >
              ✕ Remove
            </button>
          </div>
        </>
      )}
    </>
  );
}
