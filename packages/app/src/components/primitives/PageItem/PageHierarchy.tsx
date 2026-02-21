import React from 'react';
import { PageItem, PageItemColor } from './PageItem';
import './PageItem.css';

export interface PageHierarchyItem {
  title: string;
  color?: PageItemColor;
  indent?: number;
  onClick?: () => void;
}

export interface PageHierarchyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Hierarchy title */
  title?: string;
  /** Items to display */
  items: PageHierarchyItem[];
}

export const PageHierarchy = React.forwardRef<HTMLDivElement, PageHierarchyProps>(
  ({ title = 'Page hierarchy', items, className, ...props }, ref) => {
    const classNames = ['afw-page-hierarchy', className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {title && <h3 className="afw-page-hierarchy__title">{title}</h3>}
        <div className="afw-page-hierarchy__items">
          {items.map((item, index) => (
            <PageItem
              key={index}
              title={item.title}
              color={item.color}
              indent={item.indent}
              interactive={!!item.onClick}
              onClick={item.onClick}
            />
          ))}
        </div>
      </div>
    );
  }
);

PageHierarchy.displayName = 'PageHierarchy';
