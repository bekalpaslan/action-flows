import { useState, useMemo, useCallback } from 'react';
import type { ChangePreviewProps, ChangePreviewData, ChangeSummary } from './types';
import './ChangePreview.css';

/**
 * Format a value for display, with syntax highlighting for JSON/code
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * Check if a value is complex (object/array) and should be collapsible
 */
function isComplexValue(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0)
  );
}

/**
 * Get the appropriate icon for a change type
 */
function getChangeIcon(changeType: ChangePreviewData['changeType']): string {
  switch (changeType) {
    case 'create':
      return '+';
    case 'delete':
      return '-';
    case 'modify':
      return '~';
  }
}

/**
 * Get the label for a change type
 */
function getChangeLabel(changeType: ChangePreviewData['changeType']): string {
  switch (changeType) {
    case 'create':
      return 'Created';
    case 'delete':
      return 'Deleted';
    case 'modify':
      return 'Modified';
  }
}

/**
 * Individual change item component
 */
interface ChangeItemProps {
  change: ChangePreviewData;
  isExpanded: boolean;
  onToggle: () => void;
}

function ChangeItem({ change, isExpanded, onToggle }: ChangeItemProps) {
  const hasComplexValues = isComplexValue(change.currentValue) || isComplexValue(change.newValue);
  const isCollapsible = hasComplexValues;

  return (
    <div
      className={`change-item change-${change.changeType} ${change.isDestructive ? 'change-destructive' : ''}`}
    >
      <div
        className={`change-header ${isCollapsible ? 'collapsible' : ''}`}
        onClick={isCollapsible ? onToggle : undefined}
        role={isCollapsible ? 'button' : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        onKeyDown={
          isCollapsible
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle();
                }
              }
            : undefined
        }
      >
        <span className={`change-icon change-icon-${change.changeType}`}>
          {getChangeIcon(change.changeType)}
        </span>

        <div className="change-info">
          <span className="change-field">{change.field}</span>
          <span className="change-path">{change.path}</span>
        </div>

        <span className={`change-badge change-badge-${change.changeType}`}>
          {getChangeLabel(change.changeType)}
        </span>

        {change.isDestructive && (
          <span className="destructive-badge" title="This change is destructive">
            Destructive
          </span>
        )}

        {isCollapsible && (
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
            {isExpanded ? '\u25BC' : '\u25B6'}
          </span>
        )}
      </div>

      <div className={`change-values ${isCollapsible && !isExpanded ? 'collapsed' : ''}`}>
        {change.changeType !== 'create' && (
          <div className="value-block value-removed">
            <span className="value-label">Current:</span>
            <pre className="value-content">{formatValue(change.currentValue)}</pre>
          </div>
        )}

        {change.changeType !== 'delete' && (
          <div className="value-block value-added">
            <span className="value-label">New:</span>
            <pre className="value-content">{formatValue(change.newValue)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ChangePreview Component
 *
 * Displays a diff-style preview of changes before applying them.
 * Features:
 * - Diff-style highlighting (red for removed, green for added)
 * - Collapsible sections for complex values
 * - Syntax highlighting for JSON/code values
 * - Warning indicators for destructive changes
 * - Summary of total changes
 * - Confirm and Cancel buttons
 */
export function ChangePreview({
  changes,
  onConfirm,
  onCancel,
  isLoading = false,
}: ChangePreviewProps) {
  // Track which items are expanded
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Calculate summary
  const summary: ChangeSummary = useMemo(() => {
    return changes.reduce(
      (acc, change) => {
        acc.total++;
        if (change.isDestructive) acc.destructive++;
        switch (change.changeType) {
          case 'create':
            acc.additions++;
            break;
          case 'modify':
            acc.modifications++;
            break;
          case 'delete':
            acc.removals++;
            break;
        }
        return acc;
      },
      { additions: 0, modifications: 0, removals: 0, destructive: 0, total: 0 }
    );
  }, [changes]);

  // Toggle item expansion
  const toggleItem = useCallback((index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  // Expand/collapse all
  const expandAll = useCallback(() => {
    setExpandedItems(new Set(changes.map((_, i) => i)));
  }, [changes]);

  const collapseAll = useCallback(() => {
    setExpandedItems(new Set());
  }, []);

  const hasDestructiveChanges = summary.destructive > 0;

  return (
    <div className="change-preview">
      {/* Header with summary */}
      <div className="change-preview-header">
        <h3 className="change-preview-title">Preview Changes</h3>
        <div className="change-summary">
          {summary.additions > 0 && (
            <span className="summary-item summary-additions">+{summary.additions} added</span>
          )}
          {summary.modifications > 0 && (
            <span className="summary-item summary-modifications">
              ~{summary.modifications} modified
            </span>
          )}
          {summary.removals > 0 && (
            <span className="summary-item summary-removals">-{summary.removals} removed</span>
          )}
          <span className="summary-total">{summary.total} total changes</span>
        </div>
      </div>

      {/* Destructive warning */}
      {hasDestructiveChanges && (
        <div className="destructive-warning">
          <span className="warning-icon">!</span>
          <span className="warning-text">
            {summary.destructive} destructive change{summary.destructive !== 1 ? 's' : ''} detected.
            Please review carefully before confirming.
          </span>
        </div>
      )}

      {/* Expand/Collapse controls */}
      {changes.length > 1 && (
        <div className="expand-controls">
          <button type="button" className="expand-btn" onClick={expandAll} disabled={isLoading}>
            Expand All
          </button>
          <button type="button" className="expand-btn" onClick={collapseAll} disabled={isLoading}>
            Collapse All
          </button>
        </div>
      )}

      {/* Changes list */}
      <div className="change-list">
        {changes.length === 0 ? (
          <div className="no-changes">No changes to preview</div>
        ) : (
          changes.map((change, index) => (
            <ChangeItem
              key={`${change.path}-${index}`}
              change={change}
              isExpanded={expandedItems.has(index)}
              onToggle={() => toggleItem(index)}
            />
          ))
        )}
      </div>

      {/* Action buttons */}
      <div className="change-preview-footer">
        {onCancel && (
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
        )}
        {onConfirm && (
          <button
            type="button"
            className={`confirm-btn ${hasDestructiveChanges ? 'confirm-destructive' : ''}`}
            onClick={onConfirm}
            disabled={isLoading || changes.length === 0}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Applying...
              </>
            ) : hasDestructiveChanges ? (
              'Confirm Destructive Changes'
            ) : (
              'Confirm Changes'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
