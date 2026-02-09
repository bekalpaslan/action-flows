/**
 * FileTreeWidget Component
 *
 * Displays a simple nested file tree with files and directories.
 */

import { useState } from 'react';
import './widgets.css';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface FileTreeWidgetProps {
  data: {
    root: string;
    nodes: FileNode[];
  };
  span: number;
}

/**
 * Nested list of files and folders.
 */
export function FileTreeWidget({ data, span }: FileTreeWidgetProps) {
  const { root, nodes } = data;

  return (
    <div className="widget widget-file-tree" style={{ gridColumn: `span ${span}` }}>
      <div className="widget-file-tree__root">{root}</div>
      <div className="widget-file-tree__nodes">
        {nodes.map((node, index) => (
          <FileTreeNode key={index} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const icon = node.type === 'directory'
    ? (isExpanded ? '📂' : '📁')
    : '📄';

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="widget-file-tree__node">
      <div
        className="widget-file-tree__node-label"
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={handleToggle}
      >
        <span className="widget-file-tree__icon">{icon}</span>
        <span className="widget-file-tree__name">{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className="widget-file-tree__children">
          {node.children!.map((child, index) => (
            <FileTreeNode key={index} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
