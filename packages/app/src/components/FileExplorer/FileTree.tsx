import { useState, useCallback, useEffect, MouseEvent } from 'react';
import { FileIcon } from './FileIcon';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';

export interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modified?: string;
  children?: DirectoryEntry[];
}

export interface FileTreeProps {
  tree: DirectoryEntry[];
  onFileSelect?: (path: string) => void;
  onFileOpen?: (path: string) => void;
  level?: number;
}

/**
 * FileTree component - Recursive tree view for directories and files
 *
 * Features:
 * - Collapsible directories
 * - File type icons
 * - Selection highlighting
 * - Context menu support
 */
export function FileTree({
  tree,
  onFileSelect,
  onFileOpen,
  level = 0,
}: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [contextMenuPath, setContextMenuPath] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'FileExplorer',
    getContext: () => ({
      currentPath: selectedPath,
      fileCount: tree.length,
      selectedFile: selectedPath,
    }),
  });

  const toggleDirectory = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleFileClick = useCallback(
    (entry: DirectoryEntry) => {
      if (entry.type === 'directory') {
        toggleDirectory(entry.path);
      } else {
        setSelectedPath(entry.path);
        onFileSelect?.(entry.path);
      }
    },
    [toggleDirectory, onFileSelect]
  );

  const handleFileDoubleClick = useCallback(
    (entry: DirectoryEntry) => {
      if (entry.type === 'file') {
        onFileOpen?.(entry.path);
      }
    },
    [onFileOpen]
  );

  const handleContextMenu = useCallback((e: MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenuPath(path);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleContextMenuAction = useCallback(
    (action: 'open' | 'copy' | 'reveal', path: string) => {
      setContextMenuPath(null);
      setContextMenuPosition(null);

      switch (action) {
        case 'open':
          onFileOpen?.(path);
          break;
        case 'copy':
          navigator.clipboard.writeText(path);
          break;
        case 'reveal':
          // TODO: Implement reveal in file system
          console.log('Reveal:', path);
          break;
      }
    },
    [onFileOpen]
  );

  // Close context menu on any click
  useEffect(() => {
    const handleClick = () => {
      if (contextMenuPath) {
        setContextMenuPath(null);
        setContextMenuPosition(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenuPath]);

  return (
    <>
      {level === 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px' }}>
          <DiscussButton componentName="FileExplorer" onClick={openDialog} size="small" />
        </div>
      )}
      <ul className="file-tree" style={{ paddingLeft: level === 0 ? 0 : 16 }}>
        {tree.map((entry) => {
          const isExpanded = expandedDirs.has(entry.path);
          const isSelected = selectedPath === entry.path;

          return (
            <li key={entry.path} className="file-tree-item">
              <div
                className={`file-tree-entry ${entry.type} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleFileClick(entry)}
                onDoubleClick={() => handleFileDoubleClick(entry)}
                onContextMenu={(e) => handleContextMenu(e, entry.path)}
              >
                {entry.type === 'directory' && (
                  <span className="directory-toggle">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                )}
                <FileIcon type={entry.type} name={entry.name} />
                <span className="entry-name">{entry.name}</span>
                {entry.size !== undefined && (
                  <span className="entry-size">{formatSize(entry.size)}</span>
                )}
              </div>

              {entry.type === 'directory' && isExpanded && entry.children && entry.children.length > 0 && (
                <FileTree
                  tree={entry.children}
                  onFileSelect={onFileSelect}
                  onFileOpen={onFileOpen}
                  level={level + 1}
                />
              )}
            </li>
          );
        })}
      </ul>

      {contextMenuPath && contextMenuPosition && (
        <div
          className="file-context-menu"
          style={{
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
        >
          <button onClick={() => handleContextMenuAction('open', contextMenuPath)}>
            Open
          </button>
          <button onClick={() => handleContextMenuAction('copy', contextMenuPath)}>
            Copy Path
          </button>
          <button onClick={() => handleContextMenuAction('reveal', contextMenuPath)}>
            Reveal in Explorer
          </button>
        </div>
      )}
      {level === 0 && (
        <DiscussDialog
          isOpen={isDialogOpen}
          componentName="FileExplorer"
          componentContext={{
            currentPath: selectedPath,
            fileCount: tree.length,
            selectedFile: selectedPath,
          }}
          onSend={handleSend}
          onClose={closeDialog}
        />
      )}
    </>
  );
}

/**
 * Format file size in human-readable format
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
