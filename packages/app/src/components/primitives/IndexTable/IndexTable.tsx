import React, { forwardRef } from 'react';
import { Badge } from '../Badge';
import './IndexTable.css';

export type IndexTableStatus = 'none' | 'review' | 'ready' | 'progress' | 'hold';

export interface IndexTableItem {
  /** Item name */
  name: string;
  /** Optional leading icon/emoji */
  icon?: React.ReactNode;
  /** Release/version string */
  release?: string;
  /** Status */
  status?: IndexTableStatus;
  /** Optional click handler for the row */
  onClick?: () => void;
}

export interface IndexTableGroup {
  /** Group title (e.g., "FOUNDATION") */
  title: string;
  /** Optional group icon/emoji */
  icon?: React.ReactNode;
  /** Items in this group */
  items: IndexTableItem[];
}

export interface IndexTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Column headers — defaults to ['Name', 'Release', 'Status'] */
  columns?: [string, string, string];
  /** Grouped data */
  groups: IndexTableGroup[];
  /** Hide column headers */
  hideHeaders?: boolean;
}

const STATUS_CONFIG: Record<IndexTableStatus, { label: string; color: 'neutral' | 'blue' | 'green' | 'orange' | 'red' }> = {
  none: { label: '', color: 'neutral' },
  review: { label: 'IN REVIEW', color: 'blue' },
  ready: { label: 'READY', color: 'green' },
  progress: { label: 'IN PROGRESS', color: 'orange' },
  hold: { label: 'ON HOLD', color: 'red' },
};

export const IndexTable = forwardRef<HTMLDivElement, IndexTableProps>(
  (
    {
      columns = ['Name', 'Release', 'Status'],
      groups,
      hideHeaders = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`afw-index-table ${className || ''}`}
        {...props}
      >
        {!hideHeaders && (
          <div className="afw-index-table__header">
            <div className="afw-index-table__header-cell">{columns[0].toUpperCase()}</div>
            <div className="afw-index-table__header-cell">{columns[1].toUpperCase()}</div>
            <div className="afw-index-table__header-cell">{columns[2].toUpperCase()}</div>
          </div>
        )}

        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="afw-index-table__group">
            <div className="afw-index-table__group-header">
              {group.icon && <span className="afw-index-table__group-icon">{group.icon}</span>}
              {group.title}
            </div>

            {group.items.map((item, itemIndex) => {
              const isLastItem = itemIndex === group.items.length - 1;
              const statusConfig = item.status
                ? STATUS_CONFIG[item.status]
                : STATUS_CONFIG.none;

              return (
                <div
                  key={itemIndex}
                  className={`afw-index-table__row ${
                    item.onClick ? 'afw-index-table__row--interactive' : ''
                  } ${isLastItem ? 'afw-index-table__row--last' : ''}`}
                  onClick={item.onClick}
                  role={item.onClick ? 'button' : undefined}
                  tabIndex={item.onClick ? 0 : undefined}
                  onKeyDown={
                    item.onClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            item.onClick?.();
                          }
                        }
                      : undefined
                  }
                >
                  <div className="afw-index-table__cell afw-index-table__cell--name">
                    {item.icon && (
                      <span className="afw-index-table__cell-icon">{item.icon}</span>
                    )}
                    {item.name}
                  </div>
                  <div className="afw-index-table__cell afw-index-table__cell--release">
                    {item.release || '—'}
                  </div>
                  <div className="afw-index-table__cell afw-index-table__cell--status">
                    {statusConfig.label && (
                      <Badge
                        label={statusConfig.label}
                        color={statusConfig.color}
                        size="xs"
                        shape="rounded"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
);

IndexTable.displayName = 'IndexTable';
