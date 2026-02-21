import React, { forwardRef, useState, useMemo } from 'react';
import './DataTable.css';

export type SortDirection = 'asc' | 'desc' | null;

export type CellType = 'text' | 'heading' | 'checkbox' | 'radio' | 'tag' | 'link' | 'avatar' | 'avatar-group' | 'icon-actions';

export interface DataTableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  cellType?: CellType;
}

export interface DataTableAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: (rowId: string) => void;
  variant?: 'default' | 'danger';
}

export interface DataTableBulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: 'default' | 'danger';
}

export interface DataTableRow {
  id: string;
  cells: Record<string, React.ReactNode>;
  disabled?: boolean;
}

export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (columnId: string, direction: SortDirection) => void;
  actions?: DataTableAction[];
  bulkActions?: DataTableBulkAction[];
  size?: 'wide' | 'compact';
  toolbar?: React.ReactNode;
}

export const DataTable = forwardRef<HTMLDivElement, DataTableProps>(
  (
    {
      columns,
      rows,
      selectable = false,
      selectedIds: controlledSelectedIds,
      onSelectionChange,
      sortColumn,
      sortDirection,
      onSort,
      actions,
      bulkActions,
      size = 'wide',
      toolbar,
      className,
      ...props
    },
    ref
  ) => {
    const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);

    const isControlled = controlledSelectedIds !== undefined;
    const selectedIds = isControlled ? controlledSelectedIds : internalSelectedIds;

    const handleSelectionChange = (newIds: string[]) => {
      if (!isControlled) {
        setInternalSelectedIds(newIds);
      }
      onSelectionChange?.(newIds);
    };

    const selectableRowIds = useMemo(
      () => rows.filter((row) => !row.disabled).map((row) => row.id),
      [rows]
    );

    const allSelected = selectableRowIds.length > 0 && selectableRowIds.every((id) => selectedIds.includes(id));
    const someSelected = selectedIds.length > 0 && !allSelected;

    const handleSelectAll = () => {
      if (allSelected) {
        handleSelectionChange([]);
      } else {
        handleSelectionChange(selectableRowIds);
      }
    };

    const handleRowToggle = (rowId: string) => {
      if (selectedIds.includes(rowId)) {
        handleSelectionChange(selectedIds.filter((id) => id !== rowId));
      } else {
        handleSelectionChange([...selectedIds, rowId]);
      }
    };

    const handleSort = (columnId: string) => {
      if (!onSort) return;

      let newDirection: SortDirection = 'asc';
      if (sortColumn === columnId) {
        if (sortDirection === 'asc') newDirection = 'desc';
        else if (sortDirection === 'desc') newDirection = null;
      }

      onSort(columnId, newDirection);
    };

    const handleClearSelection = () => {
      handleSelectionChange([]);
    };

    const showBulkBar = bulkActions && bulkActions.length > 0 && selectedIds.length > 0;

    const SortIcon = ({ direction }: { direction: SortDirection }) => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="afw-data-table__sort-icon"
      >
        <path d="M8 4L12 8H4L8 4Z" fill="currentColor" opacity={direction === 'asc' ? 1 : 0.3} />
        <path d="M8 12L4 8H12L8 12Z" fill="currentColor" opacity={direction === 'desc' ? 1 : 0.3} />
      </svg>
    );

    return (
      <div
        ref={ref}
        className={`afw-data-table afw-data-table--${size}${className ? ` ${className}` : ''}`}
        {...props}
      >
        {toolbar && <div className="afw-data-table__toolbar">{toolbar}</div>}

        {showBulkBar && (
          <div className="afw-data-table__bulk-bar">
            <button
              className="afw-data-table__bulk-close"
              aria-label="Clear selection"
              onClick={handleClearSelection}
            >
              ✕
            </button>
            <span className="afw-data-table__bulk-count">
              {selectedIds.length} SELECTED
            </span>
            <div className="afw-data-table__bulk-actions">
              {bulkActions.map((action) => (
                <button
                  key={action.id}
                  className={`afw-data-table__bulk-action${action.variant === 'danger' ? ' afw-data-table__bulk-action--danger' : ''}`}
                  onClick={() => action.onClick(selectedIds)}
                >
                  {action.icon && <span className="afw-data-table__bulk-action-icon">{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <table className="afw-data-table__table">
          <thead className="afw-data-table__head">
            <tr className="afw-data-table__header-row">
              {selectable && (
                <th className="afw-data-table__th afw-data-table__th--checkbox">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someSelected;
                      }
                    }}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`afw-data-table__th${column.sortable ? ' afw-data-table__th--sortable' : ''}${column.align ? ` afw-data-table__th--${column.align}` : ''}`}
                  style={{ width: column.width }}
                  aria-sort={
                    column.sortable && sortColumn === column.id
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : sortDirection === 'desc'
                          ? 'descending'
                          : 'none'
                      : undefined
                  }
                >
                  {column.sortable ? (
                    <button
                      className="afw-data-table__sort-btn"
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                      <SortIcon direction={sortColumn === column.id ? (sortDirection ?? null) : null} />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="afw-data-table__th afw-data-table__th--actions"></th>
              )}
            </tr>
          </thead>
          <tbody className="afw-data-table__body">
            {rows.map((row) => {
              const isSelected = selectedIds.includes(row.id);
              return (
                <tr
                  key={row.id}
                  className={`afw-data-table__row${isSelected ? ' afw-data-table__row--selected' : ''}${row.disabled ? ' afw-data-table__row--disabled' : ''}`}
                >
                  {selectable && (
                    <td className="afw-data-table__td afw-data-table__td--checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRowToggle(row.id)}
                        disabled={row.disabled}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`afw-data-table__td${column.align ? ` afw-data-table__td--${column.align}` : ''}`}
                    >
                      {row.cells[column.id]}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="afw-data-table__td afw-data-table__td--actions">
                      <div className="afw-data-table__action-icons">
                        {actions.map((action) => (
                          <button
                            key={action.id}
                            className={`afw-data-table__action-btn${action.variant === 'danger' ? ' afw-data-table__action-btn--danger' : ''}`}
                            onClick={() => action.onClick(row.id)}
                            aria-label={action.label}
                          >
                            {action.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';
