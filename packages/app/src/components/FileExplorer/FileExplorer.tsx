import { useState, useEffect, useCallback } from 'react';
import { FileTree } from './FileTree';
import { useFileTree } from '../../hooks/useFileTree';
import './FileExplorer.css';

export interface FileExplorerProps {
  sessionId: string;
  onFileSelect?: (path: string) => void;
  onFileOpen?: (path: string) => void;
  showHidden?: boolean;
}

/**
 * FileExplorer component for browsing session's working directory
 *
 * Features:
 * - Directory tree navigation with expand/collapse
 * - File type icons
 * - File selection and context menu
 * - Hidden files toggle
 * - Lazy loading of nested directories
 */
export function FileExplorer({
  sessionId,
  onFileSelect,
  onFileOpen,
  showHidden: initialShowHidden = false,
}: FileExplorerProps) {
  const [showHidden, setShowHidden] = useState(initialShowHidden);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { tree, isLoading, error, refresh } = useFileTree(sessionId, showHidden);

  const handleToggleHidden = useCallback(() => {
    setShowHidden((prev) => !prev);
  }, []);

  return (
    <aside className={`file-explorer ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="file-explorer-header">
        <h3 className="file-explorer-title">Files</h3>
        <div className="file-explorer-actions">
          <button
            className="action-btn"
            onClick={handleToggleHidden}
            title={showHidden ? 'Hide hidden files' : 'Show hidden files'}
            aria-label={showHidden ? 'Hide hidden files' : 'Show hidden files'}
          >
            {showHidden ? '👁️' : '👁️‍🗨️'}
          </button>
          <button
            className="action-btn"
            onClick={refresh}
            title="Refresh file tree"
            aria-label="Refresh file tree"
          >
            🔄
          </button>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            aria-label={isCollapsed ? 'Expand file explorer' : 'Collapse file explorer'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      <div className="file-explorer-content">
        {isLoading && <div className="file-explorer-loading">Loading...</div>}
        {error && (
          <div className="file-explorer-error">
            <p>Error loading files:</p>
            <p className="error-message">{error}</p>
          </div>
        )}
        {!isLoading && !error && tree && (
          <FileTree
            tree={tree}
            onFileSelect={onFileSelect}
            onFileOpen={onFileOpen}
          />
        )}
        {!isLoading && !error && !tree && (
          <div className="file-explorer-empty">
            <p>No files found</p>
          </div>
        )}
      </div>
    </aside>
  );
}
