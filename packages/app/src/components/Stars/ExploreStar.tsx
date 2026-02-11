/**
 * ExploreStar Component
 * File explorer workbench with search and keyboard navigation
 *
 * Features:
 * - File tree view with expand/collapse
 * - Search input with real-time filtering
 * - Keyboard navigation (arrow keys, Enter to open)
 * - File metadata display (size, modified date)
 * - Session-based file browsing
 */

import React, { useState, useCallback, useMemo, useRef, useEffect, KeyboardEvent } from 'react';
import type { DirectoryEntry } from '../FileExplorer/FileTree';
import { FileIcon } from '../FileExplorer/FileIcon';
import { useFileTree } from '../../hooks/useFileTree';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './ExploreStar.css';

export interface ExploreStarProps {
  /** Session ID for file tree context (optional - uses global workspace if not provided) */
  sessionId?: string;

  /** Callback when a file is selected */
  onFileSelect?: (path: string) => void;

  /** Callback when a file is opened (double-click or Enter) */
  onFileOpen?: (path: string) => void;

  /** Whether to show hidden files by default */
  showHidden?: boolean;
}

/**
 * Flattens a directory tree into a list of entries with paths for keyboard navigation
 */
function flattenTree(
  entries: DirectoryEntry[],
  expandedDirs: Set<string>,
  result: DirectoryEntry[] = []
): DirectoryEntry[] {
  for (const entry of entries) {
    result.push(entry);
    if (entry.type === 'directory' && expandedDirs.has(entry.path) && entry.children) {
      flattenTree(entry.children, expandedDirs, result);
    }
  }
  return result;
}

/**
 * Filters tree entries by search query (matches file/folder names)
 */
function filterTree(entries: DirectoryEntry[], query: string): DirectoryEntry[] {
  if (!query.trim()) return entries;

  const lowerQuery = query.toLowerCase();
  const filtered: DirectoryEntry[] = [];

  for (const entry of entries) {
    const nameMatches = entry.name.toLowerCase().includes(lowerQuery);
    const pathMatches = entry.path.toLowerCase().includes(lowerQuery);

    if (entry.type === 'directory' && entry.children) {
      const filteredChildren = filterTree(entry.children, query);
      if (filteredChildren.length > 0 || nameMatches || pathMatches) {
        filtered.push({
          ...entry,
          children: filteredChildren,
        });
      }
    } else if (nameMatches || pathMatches) {
      filtered.push(entry);
    }
  }

  return filtered;
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

/**
 * Format date in human-readable format
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch {
    return dateStr;
  }
}

/**
 * ExploreStar - File explorer with search and keyboard navigation
 */
export function ExploreStar({
  sessionId = 'global',
  onFileSelect,
  onFileOpen,
  showHidden: initialShowHidden = false,
}: ExploreStarProps): React.ReactElement {
  const [showHidden, setShowHidden] = useState(initialShowHidden);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const { tree, isLoading, error, refresh } = useFileTree(sessionId, showHidden);

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'ExploreStar',
    getContext: () => ({
      currentView: showHidden ? 'with-hidden' : 'without-hidden',
      searchQuery,
      filteredCount: flattenedEntries.length,
    }),
  });

  // Filter tree based on search query
  const filteredTree = useMemo(() => {
    if (!tree) return [];
    return filterTree(tree, searchQuery);
  }, [tree, searchQuery]);

  // Flatten tree for keyboard navigation
  const flattenedEntries = useMemo(() => {
    return flattenTree(filteredTree, expandedDirs);
  }, [filteredTree, expandedDirs]);

  // Toggle directory expansion
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

  // Handle entry click
  const handleEntryClick = useCallback(
    (entry: DirectoryEntry, index: number) => {
      setFocusedIndex(index);
      setSelectedPath(entry.path);

      if (entry.type === 'directory') {
        toggleDirectory(entry.path);
      } else {
        onFileSelect?.(entry.path);
      }
    },
    [toggleDirectory, onFileSelect]
  );

  // Handle entry double-click
  const handleEntryDoubleClick = useCallback(
    (entry: DirectoryEntry) => {
      if (entry.type === 'file') {
        onFileOpen?.(entry.path);
      }
    },
    [onFileOpen]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (flattenedEntries.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev < flattenedEntries.length - 1 ? prev + 1 : prev;
            const entry = flattenedEntries[next];
            if (entry) setSelectedPath(entry.path);
            return next;
          });
          break;

        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : 0;
            const entry = flattenedEntries[next];
            if (entry) setSelectedPath(entry.path);
            return next;
          });
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (focusedIndex >= 0) {
            const entry = flattenedEntries[focusedIndex];
            if (entry?.type === 'directory' && !expandedDirs.has(entry.path)) {
              toggleDirectory(entry.path);
            }
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (focusedIndex >= 0) {
            const entry = flattenedEntries[focusedIndex];
            if (entry?.type === 'directory' && expandedDirs.has(entry.path)) {
              toggleDirectory(entry.path);
            }
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0) {
            const entry = flattenedEntries[focusedIndex];
            if (entry) {
              if (entry.type === 'directory') {
                toggleDirectory(entry.path);
              } else {
                onFileOpen?.(entry.path);
              }
            }
          }
          break;

        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          if (flattenedEntries[0]) {
            setSelectedPath(flattenedEntries[0].path);
          }
          break;

        case 'End':
          e.preventDefault();
          const lastIndex = flattenedEntries.length - 1;
          setFocusedIndex(lastIndex);
          if (flattenedEntries[lastIndex]) {
            setSelectedPath(flattenedEntries[lastIndex].path);
          }
          break;
      }
    },
    [flattenedEntries, focusedIndex, expandedDirs, toggleDirectory, onFileOpen]
  );

  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setFocusedIndex(-1);
    setSelectedPath(null);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setFocusedIndex(-1);
    searchInputRef.current?.focus();
  }, []);

  // Toggle hidden files
  const handleToggleHidden = useCallback(() => {
    setShowHidden((prev) => !prev);
  }, []);

  // Focus search input on Ctrl/Cmd + F
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && treeContainerRef.current) {
      const focusedElement = treeContainerRef.current.querySelector(
        `[data-index="${focusedIndex}"]`
      );
      focusedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex]);

  // Calculate depth for indentation
  const getEntryDepth = useCallback((entry: DirectoryEntry): number => {
    const parts = entry.path.split(/[/\\]/);
    // Subtract 1 because the root is included in the path
    return Math.max(0, parts.length - 2);
  }, []);

  return (
    <div className="explore-workbench">
      {/* Header */}
      <div className="explore-workbench__header">
        <div className="explore-workbench__header-left">
          <h1 className="explore-workbench__title">Explorer</h1>
        </div>
        <div className="explore-workbench__header-right">
          <DiscussButton componentName="ExploreStar" onClick={openDialog} size="small" />
          <button
            className="explore-workbench__action-btn"
            onClick={handleToggleHidden}
            title={showHidden ? 'Hide hidden files' : 'Show hidden files'}
            aria-label={showHidden ? 'Hide hidden files' : 'Show hidden files'}
          >
            {showHidden ? 'Hide Hidden' : 'Show Hidden'}
          </button>
          <button
            className="explore-workbench__action-btn"
            onClick={refresh}
            title="Refresh file tree"
            aria-label="Refresh file tree"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="explore-workbench__search">
        <div className="explore-workbench__search-input-wrapper">
          <span className="explore-workbench__search-icon">&#128269;</span>
          <input
            ref={searchInputRef}
            type="text"
            className="explore-workbench__search-input"
            placeholder="Search files... (Ctrl+F)"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search files"
          />
          {searchQuery && (
            <button
              className="explore-workbench__search-clear"
              onClick={handleClearSearch}
              title="Clear search"
              aria-label="Clear search"
            >
              &#10005;
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="explore-workbench__search-results">
            {flattenedEntries.length} {flattenedEntries.length === 1 ? 'result' : 'results'}
          </div>
        )}
      </div>

      {/* File Tree Content */}
      <div
        ref={treeContainerRef}
        className="explore-workbench__content"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="tree"
        aria-label="File tree"
      >
        {isLoading && (
          <div className="explore-workbench__loading">
            <span className="explore-workbench__loading-spinner" />
            Loading files...
          </div>
        )}

        {error && (
          <div className="explore-workbench__error">
            <p>Error loading files:</p>
            <p className="explore-workbench__error-message">{error}</p>
            <button className="explore-workbench__retry-btn" onClick={refresh}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && flattenedEntries.length === 0 && (
          <div className="explore-workbench__empty">
            {searchQuery ? (
              <>
                <p>No files match "{searchQuery}"</p>
                <button className="explore-workbench__clear-btn" onClick={handleClearSearch}>
                  Clear search
                </button>
              </>
            ) : (
              <p>No files found</p>
            )}
          </div>
        )}

        {!isLoading && !error && flattenedEntries.length > 0 && (
          <ul className="explore-workbench__tree">
            {flattenedEntries.map((entry, index) => {
              const isExpanded = expandedDirs.has(entry.path);
              const isSelected = selectedPath === entry.path;
              const isFocused = focusedIndex === index;
              const depth = getEntryDepth(entry);

              return (
                <li
                  key={entry.path}
                  className="explore-workbench__tree-item"
                  data-index={index}
                  role="treeitem"
                  aria-selected={isSelected}
                  aria-expanded={entry.type === 'directory' ? isExpanded : undefined}
                >
                  <div
                    className={`explore-workbench__tree-entry ${entry.type} ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
                    style={{ paddingLeft: `${12 + depth * 16}px` }}
                    onClick={() => handleEntryClick(entry, index)}
                    onDoubleClick={() => handleEntryDoubleClick(entry)}
                  >
                    {entry.type === 'directory' && (
                      <span className="explore-workbench__toggle">
                        {isExpanded ? '\u25BC' : '\u25B6'}
                      </span>
                    )}
                    <FileIcon type={entry.type} name={entry.name} />
                    <span className="explore-workbench__entry-name" title={entry.path}>
                      {entry.name}
                    </span>
                    <div className="explore-workbench__entry-meta">
                      {entry.size !== undefined && (
                        <span className="explore-workbench__entry-size">
                          {formatSize(entry.size)}
                        </span>
                      )}
                      {entry.modified && (
                        <span className="explore-workbench__entry-date" title={entry.modified}>
                          {formatDate(entry.modified)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Status Bar */}
      <div className="explore-workbench__status-bar">
        <span className="explore-workbench__status-item">
          {flattenedEntries.length} items
        </span>
        {selectedPath && (
          <span className="explore-workbench__status-path" title={selectedPath}>
            {selectedPath}
          </span>
        )}
      </div>

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="ExploreStar"
        componentContext={{
          currentView: showHidden ? 'with-hidden' : 'without-hidden',
          searchQuery,
          filteredCount: flattenedEntries.length,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
