import React from 'react';
import './TreeNode.css';

export interface TreeNodeData {
  /** Node label */
  label: string;
  /** Optional variant for the node box */
  variant?: 'default' | 'page-link' | 'content' | 'highlight' | 'menu-item' | 'cta';
  /** Child nodes */
  children?: TreeNodeData[];
}

export interface TreeNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tree data */
  data: TreeNodeData;
  /** Layout direction */
  direction?: 'vertical' | 'horizontal';
  /** Connector line color */
  lineColor?: string;
}

export const TreeNode = React.forwardRef<HTMLDivElement, TreeNodeProps>(
  ({ data, direction = 'vertical', lineColor, className, style, ...props }, ref) => {
    const hasChildren = data.children && data.children.length > 0;
    const variant = data.variant || 'default';

    const rootClassName = [
      'afw-tree-node',
      direction === 'horizontal' && 'afw-tree-node--horizontal',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const rootStyle: React.CSSProperties = {
      ...style,
      ...(lineColor && { '--tree-line-color': lineColor } as React.CSSProperties),
    };

    return (
      <div ref={ref} className={rootClassName} style={rootStyle} {...props}>
        <div className={`afw-tree-node__label afw-tree-node__label--${variant}`}>
          {data.label}
        </div>

        {hasChildren && (
          <>
            <div className="afw-tree-node__connector" />
            <div className="afw-tree-node__children">
              {data.children!.map((child, index) => (
                <div key={index} className="afw-tree-node__child">
                  <TreeNode data={child} direction={direction} lineColor={lineColor} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
);

TreeNode.displayName = 'TreeNode';
