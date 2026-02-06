import { useCallback, useRef, useEffect, useState } from 'react';
import './EditorTabs.css';

export interface EditorFile {
  path: string;
  isDirty: boolean;
}

export interface EditorTabsProps {
  files: EditorFile[];
  activeFilePath: string | null;
  onTabClick: (path: string) => void;
  onTabClose: (path: string) => void;
}

/**
 * EditorTabs component for managing open files
 *
 * Features:
 * - Tab bar showing open files
 * - Close buttons on each tab
 * - Active tab highlighting
 * - Unsaved changes indicator (dot)
 * - Overflow scrolling for many tabs
 * - Middle-click to close
 */
export function EditorTabs({
  files,
  activeFilePath,
  onTabClick,
  onTabClose,
}: EditorTabsProps) {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /**
   * Check scroll state
   */
  const checkScrollState = useCallback(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  }, []);

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [checkScrollState]);

  useEffect(() => {
    checkScrollState();
  }, [files, checkScrollState]);

  /**
   * Scroll active tab into view if needed
   */
  useEffect(() => {
    if (!activeFilePath) return;

    const container = tabsContainerRef.current;
    if (!container) return;

    // Find the active tab element
    const activeTab = container.querySelector('.editor-tab.active') as HTMLElement;
    if (!activeTab) return;

    // Check if active tab is visible
    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    const isVisible =
      tabRect.left >= containerRect.left &&
      tabRect.right <= containerRect.right;

    // Scroll to make active tab visible if it's not
    if (!isVisible) {
      activeTab.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
      // Update scroll state after scroll completes
      setTimeout(checkScrollState, 300);
    }
  }, [activeFilePath, checkScrollState]);

  /**
   * Scroll tabs left
   */
  const scrollLeft = useCallback(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    container.scrollBy({ left: -200, behavior: 'smooth' });
    setTimeout(checkScrollState, 300);
  }, [checkScrollState]);

  /**
   * Scroll tabs right
   */
  const scrollRight = useCallback(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    container.scrollBy({ left: 200, behavior: 'smooth' });
    setTimeout(checkScrollState, 300);
  }, [checkScrollState]);

  /**
   * Handle middle-click to close
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, path: string) => {
      if (e.button === 1) {
        // Middle mouse button
        e.preventDefault();
        onTabClose(path);
      }
    },
    [onTabClose]
  );

  /**
   * Get file name from path
   */
  const getFileName = (path: string): string => {
    return path.split('/').pop() || path;
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="editor-tabs">
      {canScrollLeft && (
        <button
          className="tab-scroll-btn tab-scroll-left"
          onClick={scrollLeft}
          aria-label="Scroll tabs left"
        >
          ‹
        </button>
      )}

      <div
        ref={tabsContainerRef}
        className="editor-tabs-container"
        onScroll={checkScrollState}
      >
        {files.map((file) => (
          <div
            key={file.path}
            className={`editor-tab ${
              activeFilePath === file.path ? 'active' : ''
            }`}
            onClick={() => onTabClick(file.path)}
            onMouseDown={(e) => handleMouseDown(e, file.path)}
            title={file.path}
          >
            <span className="tab-name">
              {file.isDirty && <span className="dirty-indicator">●</span>}
              {getFileName(file.path)}
            </span>
            <button
              className="tab-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(file.path);
              }}
              aria-label={`Close ${file.path}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {canScrollRight && (
        <button
          className="tab-scroll-btn tab-scroll-right"
          onClick={scrollRight}
          aria-label="Scroll tabs right"
        >
          ›
        </button>
      )}
    </div>
  );
}
