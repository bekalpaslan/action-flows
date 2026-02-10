/**
 * ArchiveWorkbench Component
 * Session archive browser for viewing and managing archived/completed sessions
 *
 * Features:
 * - Display archived sessions in a searchable, filterable list
 * - Show session metadata (date, duration, steps completed)
 * - Date range filtering
 * - Text search across session IDs and users
 * - Restore archived sessions to active workbench
 * - Delete archived sessions permanently
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { ArchivedSession } from '../../hooks/useSessionArchive';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './ArchiveWorkbench.css';

export interface ArchiveWorkbenchProps {
  /** Archived sessions to display */
  archivedSessions: ArchivedSession[];

  /** Callback when a session is restored */
  onRestore: (sessionId: string) => void;

  /** Callback when a session is deleted */
  onDelete: (sessionId: string) => void;

  /** Callback when all sessions are cleared */
  onClearAll?: () => void;
}

type SortField = 'archivedAt' | 'startedAt' | 'chainsCount';
type SortDirection = 'asc' | 'desc';

/**
 * ArchiveWorkbench - Full-page workbench for browsing archived sessions
 */
export function ArchiveWorkbench({
  archivedSessions,
  onRestore,
  onDelete,
  onClearAll,
}: ArchiveWorkbenchProps): React.ReactElement {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField>('archivedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'ArchiveWorkbench',
    getContext: () => ({
      archivedCount: archivedSessions.length,
      selectedSession: selectedIds.size > 0 ? Array.from(selectedIds)[0] : null,
      filteredCount: filteredSessions.length,
      searchQuery,
      statusFilter,
    }),
  });

  // Get unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(archivedSessions.map((s) => s.sessionData.status));
    return Array.from(statuses).sort();
  }, [archivedSessions]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let result = [...archivedSessions];

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (session) =>
          session.sessionId.toLowerCase().includes(query) ||
          session.sessionData.user.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((session) => session.sessionData.status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom).getTime();
      result = result.filter((session) => session.archivedAt >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo).getTime() + 86400000; // Add 24 hours to include the entire day
      result = result.filter((session) => session.archivedAt <= toDate);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'archivedAt':
          comparison = a.archivedAt - b.archivedAt;
          break;
        case 'startedAt':
          comparison =
            new Date(a.sessionData.startedAt).getTime() -
            new Date(b.sessionData.startedAt).getTime();
          break;
        case 'chainsCount':
          comparison = a.sessionData.chainsCount - b.sessionData.chainsCount;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [archivedSessions, searchQuery, statusFilter, dateFrom, dateTo, sortField, sortDirection]);

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: number | string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }, []);

  // Calculate session duration
  const calculateDuration = useCallback((startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const durationMs = end - start;

    if (durationMs < 60000) {
      return `${Math.round(durationMs / 1000)}s`;
    } else if (durationMs < 3600000) {
      return `${Math.round(durationMs / 60000)}m`;
    } else {
      const hours = Math.floor(durationMs / 3600000);
      const minutes = Math.round((durationMs % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    }
  }, []);

  // Toggle sort
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('desc');
      }
    },
    [sortField]
  );

  // Selection handlers
  const toggleSelection = useCallback((sessionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredSessions.map((s) => s.sessionId)));
  }, [filteredSessions]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Bulk actions
  const handleBulkRestore = useCallback(() => {
    selectedIds.forEach((id) => onRestore(id));
    setSelectedIds(new Set());
  }, [selectedIds, onRestore]);

  const handleBulkDelete = useCallback(() => {
    if (window.confirm(`Delete ${selectedIds.size} archived session(s)? This cannot be undone.`)) {
      selectedIds.forEach((id) => onDelete(id));
      setSelectedIds(new Set());
    }
  }, [selectedIds, onDelete]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
  }, []);

  const hasActiveFilters = searchQuery || dateFrom || dateTo || statusFilter !== 'all';

  return (
    <div className="archive-workbench">
      {/* Header */}
      <div className="archive-workbench__header">
        <div className="archive-workbench__header-left">
          <h1 className="archive-workbench__title">Session Archive</h1>
          <div className="archive-workbench__count">
            <span className="archive-count-badge">
              {filteredSessions.length} of {archivedSessions.length} archived
            </span>
          </div>
        </div>
        <div className="archive-workbench__header-right">
          <DiscussButton componentName="ArchiveWorkbench" onClick={openDialog} size="small" />
          {onClearAll && archivedSessions.length > 0 && (
            <button
              className="archive-workbench__clear-all-btn"
              onClick={() => {
                if (window.confirm('Delete all archived sessions? This cannot be undone.')) {
                  onClearAll();
                }
              }}
              title="Clear all archives"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="archive-workbench__filters">
        <div className="archive-filter-row">
          <div className="archive-filter-group">
            <label htmlFor="archive-search" className="archive-filter-label">
              Search
            </label>
            <input
              id="archive-search"
              type="text"
              className="archive-filter-input"
              placeholder="Search by ID or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="archive-filter-group">
            <label htmlFor="archive-status" className="archive-filter-label">
              Status
            </label>
            <select
              id="archive-status"
              className="archive-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="archive-filter-group">
            <label htmlFor="archive-date-from" className="archive-filter-label">
              From
            </label>
            <input
              id="archive-date-from"
              type="date"
              className="archive-filter-input archive-filter-date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="archive-filter-group">
            <label htmlFor="archive-date-to" className="archive-filter-label">
              To
            </label>
            <input
              id="archive-date-to"
              type="date"
              className="archive-filter-input archive-filter-date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <button
              className="archive-filter-clear-btn"
              onClick={clearFilters}
              title="Clear all filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="archive-workbench__bulk-actions">
          <span className="bulk-actions-count">{selectedIds.size} selected</span>
          <div className="bulk-actions-buttons">
            <button className="bulk-action-btn bulk-restore-btn" onClick={handleBulkRestore}>
              Restore Selected
            </button>
            <button className="bulk-action-btn bulk-delete-btn" onClick={handleBulkDelete}>
              Delete Selected
            </button>
            <button className="bulk-action-btn bulk-deselect-btn" onClick={deselectAll}>
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="archive-workbench__content">
        {archivedSessions.length === 0 ? (
          <div className="archive-workbench__empty">
            <div className="empty-icon">📁</div>
            <h2>No Archived Sessions</h2>
            <p>Completed sessions will appear here when they are archived.</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="archive-workbench__empty">
            <div className="empty-icon">🔍</div>
            <h2>No Matching Sessions</h2>
            <p>Try adjusting your filters or search query.</p>
            <button className="archive-clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="archive-table-header">
              <div className="archive-table-cell archive-cell-select">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredSessions.length && filteredSessions.length > 0}
                  onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
                  title="Select all"
                />
              </div>
              <div
                className={`archive-table-cell archive-cell-id ${sortField === 'startedAt' ? 'sorted' : ''}`}
                onClick={() => handleSort('startedAt')}
              >
                Session ID
                {sortField === 'startedAt' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                )}
              </div>
              <div className="archive-table-cell archive-cell-user">User</div>
              <div className="archive-table-cell archive-cell-status">Status</div>
              <div
                className={`archive-table-cell archive-cell-chains ${sortField === 'chainsCount' ? 'sorted' : ''}`}
                onClick={() => handleSort('chainsCount')}
              >
                Chains
                {sortField === 'chainsCount' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                )}
              </div>
              <div className="archive-table-cell archive-cell-duration">Duration</div>
              <div
                className={`archive-table-cell archive-cell-archived ${sortField === 'archivedAt' ? 'sorted' : ''}`}
                onClick={() => handleSort('archivedAt')}
              >
                Archived At
                {sortField === 'archivedAt' && (
                  <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                )}
              </div>
              <div className="archive-table-cell archive-cell-actions">Actions</div>
            </div>

            {/* Table Body */}
            <div className="archive-table-body">
              {filteredSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={`archive-table-row ${selectedIds.has(session.sessionId) ? 'selected' : ''}`}
                >
                  <div className="archive-table-cell archive-cell-select">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(session.sessionId)}
                      onChange={() => toggleSelection(session.sessionId)}
                    />
                  </div>
                  <div className="archive-table-cell archive-cell-id">
                    <span className="session-id-text" title={session.sessionId}>
                      {session.sessionId.length > 24
                        ? `${session.sessionId.slice(0, 21)}...`
                        : session.sessionId}
                    </span>
                  </div>
                  <div className="archive-table-cell archive-cell-user">
                    {session.sessionData.user}
                  </div>
                  <div className="archive-table-cell archive-cell-status">
                    <span className={`status-badge status-${session.sessionData.status.toLowerCase()}`}>
                      {session.sessionData.status}
                    </span>
                  </div>
                  <div className="archive-table-cell archive-cell-chains">
                    {session.sessionData.chainsCount}
                  </div>
                  <div className="archive-table-cell archive-cell-duration">
                    {calculateDuration(
                      session.sessionData.startedAt,
                      session.sessionData.endedAt
                    )}
                  </div>
                  <div className="archive-table-cell archive-cell-archived">
                    {formatTimestamp(session.archivedAt)}
                  </div>
                  <div className="archive-table-cell archive-cell-actions">
                    <button
                      className="archive-action-btn restore-btn"
                      onClick={() => onRestore(session.sessionId)}
                      title="Restore session"
                    >
                      Restore
                    </button>
                    <button
                      className="archive-action-btn delete-btn"
                      onClick={() => {
                        if (window.confirm('Delete this archived session? This cannot be undone.')) {
                          onDelete(session.sessionId);
                        }
                      }}
                      title="Delete permanently"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="ArchiveWorkbench"
        componentContext={{
          archivedCount: archivedSessions.length,
          selectedSession: selectedIds.size > 0 ? Array.from(selectedIds)[0] : null,
          filteredCount: filteredSessions.length,
          searchQuery,
          statusFilter,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
