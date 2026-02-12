/**
 * VirtualFileTree - Virtualized file tree using react-window
 *
 * Efficiently renders large file trees by virtualizing the visible rows.
 * Only renders file entries that are currently visible in the viewport.
 *
 * Performance improvement: Handles 10,000+ file entries without lag
 *
 * Usage:
 *   <VirtualFileTree
 *     tree={fileTree}
 *     onFileSelect={handleSelect}
 *     onFileOpen={handleOpen}
 *   />
 */

import React, { useMemo, useCallback, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import type { DirectoryEntry } from '../FileExplorer/FileTree';

export interface VirtualFileTreeProps {
  tree: DirectoryEntry[];
  onFileSelect?: (path: string) => void;
  onFileOpen?: (path: string) => void;
  maxHeight?: number;
  width?: number | string;
  className?: string;
}

interface FlattenedItem {
  entry: DirectoryEntry;
  level: number;
  isExpanded: boolean;
}

/**
 * Flatten tree into array with level information for virtualization
 */
const flattenTree = (
  tree: DirectoryEntry[],
  expandedDirs: Set<string>,
  level = 0
): FlattenedItem[] => {
  const items: FlattenedItem[] = [];

  for (const entry of tree) {
    items.push({
      entry,
      level,
      isExpanded: expandedDirs.has(entry.path),
    });

    // Add children if directory is expanded
    if (entry.type === 'directory' && entry.children && expandedDirs.has(entry.path)) {
      items.push(...flattenTree(entry.children, expandedDirs, level + 1));
    }
  }

  return items;
};

/**
 * Row renderer for the virtual file tree
 */
const TreeRow = ({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: {
    items: FlattenedItem[];
    onToggle: (path: string) => void;
    onFileSelect?: (path: string) => void;
    onFileOpen?: (path: string) => void;
    selectedPath: string | null;
  };
}) => {
  const { items, onToggle, onFileSelect, onFileOpen, selectedPath } = data;
  const item = items[index];

  if (!item) return null;

  const { entry, level } = item;
  const isSelected = selectedPath === entry.path;
  const padding = level * 16;

  const handleClick = () => {
    if (entry.type === 'directory') {
      onToggle(entry.path);
    } else {
      onFileSelect?.(entry.path);
    }
  };

  const handleDoubleClick = () => {
    if (entry.type === 'file') {
      onFileOpen?.(entry.path);
    }
  };

  return (
    <div
      style={style}
      className={`virtual-tree-row ${isSelected ? 'virtual-tree-row--selected' : ''}`}
    >
      <div
        className="virtual-tree-row__content"
        style={{ paddingLeft: `${padding}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {entry.type === 'directory' && (
          <span className={`virtual-tree-row__toggle ${item.isExpanded ? 'virtual-tree-row__toggle--open' : ''}`}>
            ▶
          </span>
        )}
        <span className="virtual-tree-row__icon">{entry.type === 'directory' ? '📁' : '📄'}</span>
        <span className="virtual-tree-row__name">{entry.name}</span>
      </div>
    </div>
  );
};

/**
 * VirtualFileTree component
 */
export const VirtualFileTree = React.forwardRef<HTMLDivElement, VirtualFileTreeProps>(
  ({
    tree,
    onFileSelect,
    onFileOpen,
    maxHeight = 600,
    width = '100%',
    className,
  }, ref) => {
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
    const [selectedPath, setSelectedPath] = useState<string | null>(null);

    // Flatten tree for virtualization
    const flattenedItems = useMemo(
      () => flattenTree(tree, expandedDirs),
      [tree, expandedDirs]
    );

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

    const handleFileSelect = useCallback((path: string) => {
      setSelectedPath(path);
      onFileSelect?.(path);
    }, [onFileSelect]);

    const itemSize = () => 24; // Fixed row height for simplicity

    return (
      <div ref={ref} className={className}>
        <List
          height={maxHeight}
          itemCount={flattenedItems.length}
          itemSize={itemSize}
          width={width}
          itemData={{
            items: flattenedItems,
            onToggle: toggleDirectory,
            onFileSelect: handleFileSelect,
            onFileOpen,
            selectedPath,
          }}
        >
          {TreeRow}
        </List>
      </div>
    );
  }
);

VirtualFileTree.displayName = 'VirtualFileTree';

export default VirtualFileTree;
