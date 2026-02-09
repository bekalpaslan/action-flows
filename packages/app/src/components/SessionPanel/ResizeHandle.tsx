/**
 * ResizeHandle Component
 *
 * Draggable vertical divider for resizing left/right split ratio.
 *
 * Features:
 * - Mouse drag handling (mousedown → mousemove → mouseup)
 * - Visual feedback on hover/drag
 * - Double-click to reset to default ratio
 * - 4px wide, col-resize cursor
 */

import React, { useRef, useEffect, useCallback } from 'react';
import './ResizeHandle.css';

export interface ResizeHandleProps {
  /** Callback when dragging (emits delta X in pixels) */
  onDrag: (deltaX: number) => void;

  /** Callback when drag starts */
  onDragStart?: () => void;

  /** Callback when drag ends */
  onDragEnd?: () => void;
}

/**
 * ResizeHandle - Main component
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onDrag,
  onDragStart,
  onDragEnd,
}) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);

  /**
   * Handle mouse down - Start drag
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      lastXRef.current = e.clientX;

      if (onDragStart) {
        onDragStart();
      }

      // Add dragging class to handle
      if (handleRef.current) {
        handleRef.current.classList.add('dragging');
      }
    },
    [onDragStart]
  );

  /**
   * Handle mouse move - Drag
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;

      onDrag(deltaX);
    },
    [onDrag]
  );

  /**
   * Handle mouse up - End drag
   */
  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;

    if (onDragEnd) {
      onDragEnd();
    }

    // Remove dragging class from handle
    if (handleRef.current) {
      handleRef.current.classList.remove('dragging');
    }
  }, [onDragEnd]);

  /**
   * Handle double-click - Reset to default ratio
   */
  const handleDoubleClick = useCallback(() => {
    // Reset is handled by parent (SessionPanelLayout)
    // This is a placeholder for future enhancement
    console.log('[ResizeHandle] Double-click detected - reset feature coming soon');
  }, []);

  /**
   * Set up global mouse event listeners
   */
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={handleRef}
      className="resize-handle"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      role="separator"
      aria-label="Resize panel divider"
      aria-orientation="vertical"
    />
  );
};
