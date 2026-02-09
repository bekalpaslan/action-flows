import { useState, useCallback, useMemo, ChangeEvent, KeyboardEvent } from 'react';
import './FolderHierarchy.css';

/**
 * File tree node structure for folder hierarchy
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  expanded?: boolean;
}

export interface FolderHierarchyProps {
  workspaceRoot: string;
  onFileSelect?: (filePath: string) => void;
  height?: number | string;
}

/**
 * FolderHierarchy component — Workspace file tree panel with expand/collapse folders,
 * file icons, and search functionality.
 *
 * Phase 1: Uses STATIC mock data representing the ActionFlows Dashboard project structure.
 * TODO: Backend integration — Replace MOCK_FILE_TREE with API call to GET /api/workspace/:sessionId/files
 */
export function FolderHierarchy({
  workspaceRoot,
  onFileSelect,
  height = 200,
}: FolderHierarchyProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([
    'D:/ActionFlowsDashboard/packages',
    'D:/ActionFlowsDashboard/.claude',
  ]));
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Phase 1: MOCK DATA representing ActionFlows Dashboard structure
  // TODO: Replace with backend API integration
  const MOCK_FILE_TREE: FileTreeNode[] = useMemo(() => [
    {
      name: 'packages',
      path: 'D:/ActionFlowsDashboard/packages',
      type: 'directory',
      children: [
        {
          name: 'app',
          path: 'D:/ActionFlowsDashboard/packages/app',
          type: 'directory',
          children: [
            {
              name: 'src',
              path: 'D:/ActionFlowsDashboard/packages/app/src',
              type: 'directory',
              children: [
                {
                  name: 'components',
                  path: 'D:/ActionFlowsDashboard/packages/app/src/components',
                  type: 'directory',
                  children: [
                    { name: 'SessionPanel', path: 'D:/ActionFlowsDashboard/packages/app/src/components/SessionPanel', type: 'directory' },
                    { name: 'SessionTile', path: 'D:/ActionFlowsDashboard/packages/app/src/components/SessionTile', type: 'directory' },
                    { name: 'Workbench', path: 'D:/ActionFlowsDashboard/packages/app/src/components/Workbench', type: 'directory' },
                  ],
                },
                { name: 'main.tsx', path: 'D:/ActionFlowsDashboard/packages/app/src/main.tsx', type: 'file' },
                { name: 'App.tsx', path: 'D:/ActionFlowsDashboard/packages/app/src/App.tsx', type: 'file' },
              ],
            },
            { name: 'package.json', path: 'D:/ActionFlowsDashboard/packages/app/package.json', type: 'file' },
          ],
        },
        {
          name: 'backend',
          path: 'D:/ActionFlowsDashboard/packages/backend',
          type: 'directory',
          children: [
            {
              name: 'src',
              path: 'D:/ActionFlowsDashboard/packages/backend/src',
              type: 'directory',
              children: [
                { name: 'index.ts', path: 'D:/ActionFlowsDashboard/packages/backend/src/index.ts', type: 'file' },
                { name: 'routes', path: 'D:/ActionFlowsDashboard/packages/backend/src/routes', type: 'directory' },
                { name: 'storage', path: 'D:/ActionFlowsDashboard/packages/backend/src/storage', type: 'directory' },
              ],
            },
            { name: 'package.json', path: 'D:/ActionFlowsDashboard/packages/backend/package.json', type: 'file' },
          ],
        },
        {
          name: 'shared',
          path: 'D:/ActionFlowsDashboard/packages/shared',
          type: 'directory',
          children: [
            {
              name: 'src',
              path: 'D:/ActionFlowsDashboard/packages/shared/src',
              type: 'directory',
              children: [
                { name: 'index.ts', path: 'D:/ActionFlowsDashboard/packages/shared/src/index.ts', type: 'file' },
                { name: 'types.ts', path: 'D:/ActionFlowsDashboard/packages/shared/src/types.ts', type: 'file' },
                { name: 'events.ts', path: 'D:/ActionFlowsDashboard/packages/shared/src/events.ts', type: 'file' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: '.claude',
      path: 'D:/ActionFlowsDashboard/.claude',
      type: 'directory',
      children: [
        {
          name: 'actionflows',
          path: 'D:/ActionFlowsDashboard/.claude/actionflows',
          type: 'directory',
          children: [
            { name: 'ORCHESTRATOR.md', path: 'D:/ActionFlowsDashboard/.claude/actionflows/ORCHESTRATOR.md', type: 'file' },
            { name: 'FLOWS.md', path: 'D:/ActionFlowsDashboard/.claude/actionflows/FLOWS.md', type: 'file' },
            { name: 'ACTIONS.md', path: 'D:/ActionFlowsDashboard/.claude/actionflows/ACTIONS.md', type: 'file' },
            { name: 'logs', path: 'D:/ActionFlowsDashboard/.claude/actionflows/logs', type: 'directory' },
          ],
        },
        { name: 'CLAUDE.md', path: 'D:/ActionFlowsDashboard/.claude/CLAUDE.md', type: 'file' },
      ],
    },
    { name: 'package.json', path: 'D:/ActionFlowsDashboard/package.json', type: 'file' },
    { name: 'README.md', path: 'D:/ActionFlowsDashboard/README.md', type: 'file' },
    { name: 'tsconfig.json', path: 'D:/ActionFlowsDashboard/tsconfig.json', type: 'file' },
  ], []);

  // Filter tree based on search query (shows matching files + their parent folders)
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_FILE_TREE;

    const query = searchQuery.toLowerCase();

    const filterNode = (node: FileTreeNode): FileTreeNode | null => {
      const nameMatches = node.name.toLowerCase().includes(query);

      if (node.type === 'file') {
        return nameMatches ? node : null;
      }

      // Directory: filter children
      const filteredChildren = node.children
        ?.map(filterNode)
        .filter((child): child is FileTreeNode => child !== null);

      // Show directory if it has matching children OR if its own name matches
      if ((filteredChildren && filteredChildren.length > 0) || nameMatches) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return MOCK_FILE_TREE.map(filterNode).filter(
      (node): node is FileTreeNode => node !== null
    );
  }, [searchQuery, MOCK_FILE_TREE]);

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

  const handleNodeClick = useCallback(
    (node: FileTreeNode) => {
      if (node.type === 'directory') {
        toggleDirectory(node.path);
      } else {
        setSelectedPath(node.path);
        onFileSelect?.(node.path);
      }
    },
    [toggleDirectory, onFileSelect]
  );

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // Keyboard navigation: Arrow up/down, Enter, Left collapse, Right expand
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // TODO: Implement keyboard navigation
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // TODO: Implement keyboard navigation
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // TODO: Implement Enter to open/select
      } else if (e.key === 'ArrowLeft' && selectedPath) {
        e.preventDefault();
        // TODO: Collapse selected directory
      } else if (e.key === 'ArrowRight' && selectedPath) {
        e.preventDefault();
        // TODO: Expand selected directory
      }
    },
    [selectedPath]
  );

  return (
    <div
      className={`folder-hierarchy ${isCollapsed ? 'collapsed' : ''}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
      onKeyDown={handleKeyDown}
    >
      {/* Collapsible header */}
      <div className="folder-hierarchy__header">
        <button
          className="folder-hierarchy__collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <span className="chevron">{isCollapsed ? '▶' : '▼'}</span>
        </button>
        <h3 className="folder-hierarchy__title">Files</h3>
      </div>

      {!isCollapsed && (
        <>
          {/* Search input */}
          <div className="folder-hierarchy__search">
            <input
              type="text"
              placeholder="Filter by file name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="folder-hierarchy__search-input"
            />
          </div>

          {/* Scrollable tree view */}
          <div className="folder-hierarchy__tree">
            <FileTreeRecursive
              nodes={filteredTree}
              expandedDirs={expandedDirs}
              selectedPath={selectedPath}
              onNodeClick={handleNodeClick}
              level={0}
            />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Recursive tree renderer
 */
interface FileTreeRecursiveProps {
  nodes: FileTreeNode[];
  expandedDirs: Set<string>;
  selectedPath: string | null;
  onNodeClick: (node: FileTreeNode) => void;
  level: number;
}

function FileTreeRecursive({
  nodes,
  expandedDirs,
  selectedPath,
  onNodeClick,
  level,
}: FileTreeRecursiveProps) {
  return (
    <ul className="folder-hierarchy__list" style={{ paddingLeft: level === 0 ? 0 : 16 }}>
      {nodes.map((node) => {
        const isExpanded = expandedDirs.has(node.path);
        const isSelected = selectedPath === node.path;

        return (
          <li key={node.path} className="folder-hierarchy__item">
            <div
              className={`folder-hierarchy__node ${node.type} ${isSelected ? 'selected' : ''}`}
              onClick={() => onNodeClick(node)}
            >
              {node.type === 'directory' && (
                <span className="folder-hierarchy__chevron">
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              <span className="folder-hierarchy__icon">
                {getFileIcon(node.type, node.name)}
              </span>
              <span className="folder-hierarchy__name">{node.name}</span>
            </div>

            {node.type === 'directory' &&
              isExpanded &&
              node.children &&
              node.children.length > 0 && (
                <FileTreeRecursive
                  nodes={node.children}
                  expandedDirs={expandedDirs}
                  selectedPath={selectedPath}
                  onNodeClick={onNodeClick}
                  level={level + 1}
                />
              )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Get file type icon (emoji/unicode)
 */
function getFileIcon(type: 'file' | 'directory', name: string): string {
  if (type === 'directory') {
    return '📁';
  }

  // Specific file type icons based on extension
  if (name.endsWith('.ts')) return '📘';
  if (name.endsWith('.tsx')) return '⚛️';
  if (name.endsWith('.css')) return '🎨';
  if (name.endsWith('.md')) return '📝';
  if (name.endsWith('.json')) return '📋';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return '📜';
  if (name.endsWith('.html')) return '🌐';

  // Generic file
  return '📄';
}
