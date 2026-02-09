/**
 * ReviewWorkbench Component
 * PR/Diff viewer workbench for code reviews, PR checks, and audits
 *
 * Features:
 * - List of pending reviews/PRs with status indicators
 * - Monaco-powered diff viewer (unified/split toggle)
 * - Approve/reject/comment actions
 * - Filter by status, author, or repository
 * - Review summary with stats
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import './ReviewWorkbench.css';

// ============================================================================
// Types
// ============================================================================

export type ReviewStatus = 'pending' | 'approved' | 'changes_requested' | 'commented' | 'merged' | 'closed';
export type DiffViewMode = 'unified' | 'split';

export interface ReviewFile {
  /** File path relative to repository root */
  path: string;
  /** Original content (before changes) */
  before: string;
  /** Modified content (after changes) */
  after: string;
  /** Number of additions */
  additions: number;
  /** Number of deletions */
  deletions: number;
  /** File status */
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  /** Old path for renamed files */
  oldPath?: string;
}

export interface ReviewComment {
  /** Unique comment ID */
  id: string;
  /** File path the comment is on */
  filePath: string;
  /** Line number in the diff */
  line: number;
  /** Comment author */
  author: string;
  /** Comment body */
  body: string;
  /** When the comment was created */
  createdAt: string;
  /** Whether this comment is resolved */
  resolved: boolean;
}

export interface PullRequest {
  /** Unique PR identifier */
  id: string;
  /** PR number (e.g., #123) */
  number: number;
  /** PR title */
  title: string;
  /** PR description/body */
  description: string;
  /** PR author */
  author: string;
  /** Repository name (owner/repo) */
  repository: string;
  /** Source branch */
  sourceBranch: string;
  /** Target branch */
  targetBranch: string;
  /** Current status */
  status: ReviewStatus;
  /** When the PR was created */
  createdAt: string;
  /** When the PR was last updated */
  updatedAt: string;
  /** Files changed in this PR */
  files: ReviewFile[];
  /** Comments on this PR */
  comments: ReviewComment[];
  /** Number of approvals */
  approvalCount: number;
  /** Number of requested changes */
  changesRequestedCount: number;
  /** Labels on this PR */
  labels: string[];
  /** Whether the PR is a draft */
  isDraft: boolean;
  /** Whether the PR has conflicts */
  hasConflicts: boolean;
}

export interface ReviewWorkbenchProps {
  /** Callback when a review action is taken */
  onReviewAction?: (prId: string, action: 'approve' | 'request_changes' | 'comment', body?: string) => Promise<void>;
  /** Callback when a PR is selected */
  onPRSelect?: (prId: string) => void;
  /** Optional list of pull requests (for controlled mode) */
  pullRequests?: PullRequest[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error message if any */
  error?: string | null;
}

// ============================================================================
// Mock Data for Development
// ============================================================================

const MOCK_PULL_REQUESTS: PullRequest[] = [
  {
    id: 'pr-1',
    number: 142,
    title: 'feat: Add WebSocket reconnection logic',
    description: 'Implements automatic reconnection with exponential backoff when the WebSocket connection drops.',
    author: 'claude-agent',
    repository: 'action-flows/dashboard',
    sourceBranch: 'feature/websocket-reconnect',
    targetBranch: 'main',
    status: 'pending',
    createdAt: '2026-02-08T10:30:00Z',
    updatedAt: '2026-02-08T14:22:00Z',
    files: [
      {
        path: 'packages/app/src/hooks/useWebSocket.ts',
        before: `import { useEffect, useState } from 'react';

export function useWebSocket(url: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    setWs(socket);

    return () => socket.close();
  }, [url]);

  return ws;
}`,
        after: `import { useEffect, useState, useCallback, useRef } from 'react';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

export function useWebSocket(url: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const retriesRef = useRef(0);

  const connect = useCallback(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      setIsConnected(true);
      retriesRef.current = 0;
    };

    socket.onclose = () => {
      setIsConnected(false);
      if (retriesRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retriesRef.current);
        retriesRef.current++;
        setTimeout(connect, delay);
      }
    };

    setWs(socket);
    return socket;
  }, [url]);

  useEffect(() => {
    const socket = connect();
    return () => socket.close();
  }, [connect]);

  return { ws, isConnected };
}`,
        additions: 28,
        deletions: 8,
        status: 'modified',
      },
    ],
    comments: [
      {
        id: 'c1',
        filePath: 'packages/app/src/hooks/useWebSocket.ts',
        line: 15,
        author: 'human-reviewer',
        body: 'Consider adding a max delay cap to prevent very long waits',
        createdAt: '2026-02-08T12:00:00Z',
        resolved: false,
      },
    ],
    approvalCount: 0,
    changesRequestedCount: 0,
    labels: ['enhancement', 'websocket'],
    isDraft: false,
    hasConflicts: false,
  },
  {
    id: 'pr-2',
    number: 141,
    title: 'fix: Resolve memory leak in session storage',
    description: 'Fixes a memory leak caused by event listeners not being cleaned up properly.',
    author: 'maintenance-bot',
    repository: 'action-flows/dashboard',
    sourceBranch: 'fix/session-memory-leak',
    targetBranch: 'main',
    status: 'approved',
    createdAt: '2026-02-07T09:15:00Z',
    updatedAt: '2026-02-08T11:00:00Z',
    files: [
      {
        path: 'packages/backend/src/storage/MemoryStorage.ts',
        before: `export class MemoryStorage {
  private sessions = new Map();

  addListener(event: string, cb: () => void) {
    // Missing cleanup
  }
}`,
        after: `export class MemoryStorage {
  private sessions = new Map();
  private listeners = new Set<() => void>();

  addListener(event: string, cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  dispose() {
    this.listeners.clear();
    this.sessions.clear();
  }
}`,
        additions: 10,
        deletions: 2,
        status: 'modified',
      },
    ],
    comments: [],
    approvalCount: 2,
    changesRequestedCount: 0,
    labels: ['bug', 'memory'],
    isDraft: false,
    hasConflicts: false,
  },
  {
    id: 'pr-3',
    number: 140,
    title: 'docs: Update API documentation for v2 endpoints',
    description: 'Updates the API documentation to reflect the new v2 endpoint structure.',
    author: 'docs-bot',
    repository: 'action-flows/dashboard',
    sourceBranch: 'docs/api-v2',
    targetBranch: 'main',
    status: 'changes_requested',
    createdAt: '2026-02-06T16:45:00Z',
    updatedAt: '2026-02-08T09:30:00Z',
    files: [
      {
        path: 'docs/API.md',
        before: '# API Reference\n\n## v1 Endpoints\n\n...',
        after: '# API Reference\n\n## v2 Endpoints\n\n### Sessions\n\n- GET /api/v2/sessions\n- POST /api/v2/sessions\n\n...',
        additions: 45,
        deletions: 12,
        status: 'modified',
      },
    ],
    comments: [
      {
        id: 'c2',
        filePath: 'docs/API.md',
        line: 8,
        author: 'api-reviewer',
        body: 'Missing authentication section for v2 endpoints',
        createdAt: '2026-02-07T10:00:00Z',
        resolved: false,
      },
    ],
    approvalCount: 0,
    changesRequestedCount: 1,
    labels: ['documentation'],
    isDraft: false,
    hasConflicts: false,
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get language from file extension for Monaco editor
 */
function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    json: 'json',
    md: 'markdown',
    html: 'html',
    css: 'css',
    scss: 'scss',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    sh: 'shell',
    bash: 'shell',
    sql: 'sql',
    go: 'go',
    rs: 'rust',
    java: 'java',
  };
  return languageMap[ext || ''] || 'plaintext';
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get status color
 */
function getStatusColor(status: ReviewStatus): string {
  const colors: Record<ReviewStatus, string> = {
    pending: '#f0ad4e',
    approved: '#4caf50',
    changes_requested: '#f44336',
    commented: '#2196f3',
    merged: '#9c27b0',
    closed: '#808080',
  };
  return colors[status];
}

/**
 * Get status label
 */
function getStatusLabel(status: ReviewStatus): string {
  const labels: Record<ReviewStatus, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    changes_requested: 'Changes Requested',
    commented: 'Commented',
    merged: 'Merged',
    closed: 'Closed',
  };
  return labels[status];
}

// ============================================================================
// Sub-Components
// ============================================================================

interface PRListItemProps {
  pr: PullRequest;
  isSelected: boolean;
  onClick: () => void;
}

function PRListItem({ pr, isSelected, onClick }: PRListItemProps) {
  return (
    <button
      className={`review-pr-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      type="button"
    >
      <div className="review-pr-item__header">
        <span className="review-pr-number">#{pr.number}</span>
        <span
          className="review-pr-status"
          style={{ backgroundColor: getStatusColor(pr.status) }}
        >
          {getStatusLabel(pr.status)}
        </span>
      </div>
      <h4 className="review-pr-title">{pr.title}</h4>
      <div className="review-pr-meta">
        <span className="review-pr-author">{pr.author}</span>
        <span className="review-pr-separator">|</span>
        <span className="review-pr-time">{formatRelativeTime(pr.updatedAt)}</span>
        <span className="review-pr-separator">|</span>
        <span className="review-pr-changes">
          <span className="additions">+{pr.files.reduce((s, f) => s + f.additions, 0)}</span>
          <span className="deletions">-{pr.files.reduce((s, f) => s + f.deletions, 0)}</span>
        </span>
      </div>
      <div className="review-pr-labels">
        {pr.labels.map((label) => (
          <span key={label} className="review-pr-label">
            {label}
          </span>
        ))}
        {pr.isDraft && <span className="review-pr-label draft">Draft</span>}
        {pr.hasConflicts && <span className="review-pr-label conflict">Conflicts</span>}
      </div>
      {pr.comments.filter((c) => !c.resolved).length > 0 && (
        <div className="review-pr-comments">
          {pr.comments.filter((c) => !c.resolved).length} unresolved comment(s)
        </div>
      )}
    </button>
  );
}

interface FileListProps {
  files: ReviewFile[];
  selectedFilePath: string | null;
  onFileSelect: (path: string) => void;
}

function FileList({ files, selectedFilePath, onFileSelect }: FileListProps) {
  return (
    <div className="review-file-list">
      <h5 className="review-file-list__title">Changed Files ({files.length})</h5>
      <ul className="review-file-list__items">
        {files.map((file) => (
          <li key={file.path}>
            <button
              className={`review-file-item ${selectedFilePath === file.path ? 'selected' : ''}`}
              onClick={() => onFileSelect(file.path)}
              type="button"
            >
              <span className={`review-file-status ${file.status}`}>
                {file.status === 'added' && 'A'}
                {file.status === 'modified' && 'M'}
                {file.status === 'deleted' && 'D'}
                {file.status === 'renamed' && 'R'}
              </span>
              <span className="review-file-path">{file.path}</span>
              <span className="review-file-changes">
                <span className="additions">+{file.additions}</span>
                <span className="deletions">-{file.deletions}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ReviewActionsProps {
  pr: PullRequest;
  onApprove: () => void;
  onRequestChanges: () => void;
  onComment: () => void;
  isSubmitting: boolean;
}

function ReviewActions({ pr, onApprove, onRequestChanges, onComment, isSubmitting }: ReviewActionsProps) {
  return (
    <div className="review-actions">
      <button
        className="review-action-btn approve"
        onClick={onApprove}
        disabled={isSubmitting || pr.status === 'merged' || pr.status === 'closed'}
        type="button"
      >
        Approve
      </button>
      <button
        className="review-action-btn request-changes"
        onClick={onRequestChanges}
        disabled={isSubmitting || pr.status === 'merged' || pr.status === 'closed'}
        type="button"
      >
        Request Changes
      </button>
      <button
        className="review-action-btn comment"
        onClick={onComment}
        disabled={isSubmitting}
        type="button"
      >
        Comment
      </button>
    </div>
  );
}

interface DiffViewerProps {
  file: ReviewFile;
  viewMode: DiffViewMode;
}

function DiffViewer({ file, viewMode }: DiffViewerProps) {
  const language = getLanguageFromPath(file.path);

  return (
    <div className="review-diff-viewer">
      <div className="review-diff-header">
        <span className="review-diff-path">{file.path}</span>
        <span className="review-diff-stats">
          <span className="additions">+{file.additions}</span>
          <span className="deletions">-{file.deletions}</span>
        </span>
      </div>
      <div className="review-diff-content">
        <DiffEditor
          height="100%"
          language={language}
          original={file.before}
          modified={file.after}
          theme="vs-dark"
          options={{
            readOnly: true,
            renderSideBySide: viewMode === 'split',
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderIndicators: true,
            renderOverviewRuler: true,
          }}
        />
      </div>
    </div>
  );
}

interface CommentDialogProps {
  isOpen: boolean;
  actionType: 'approve' | 'request_changes' | 'comment';
  onSubmit: (body: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function CommentDialog({ isOpen, actionType, onSubmit, onCancel, isSubmitting }: CommentDialogProps) {
  const [body, setBody] = useState('');

  if (!isOpen) return null;

  const titles: Record<string, string> = {
    approve: 'Approve Pull Request',
    request_changes: 'Request Changes',
    comment: 'Add Comment',
  };

  const handleSubmit = () => {
    onSubmit(body);
    setBody('');
  };

  return (
    <div className="review-comment-dialog-overlay">
      <div className="review-comment-dialog">
        <h3 className="review-comment-dialog__title">{titles[actionType]}</h3>
        <textarea
          className="review-comment-dialog__textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={actionType === 'approve' ? 'Optional comment...' : 'Add your review comment...'}
          rows={6}
          disabled={isSubmitting}
        />
        <div className="review-comment-dialog__actions">
          <button
            className="review-comment-dialog__btn cancel"
            onClick={onCancel}
            disabled={isSubmitting}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`review-comment-dialog__btn submit ${actionType}`}
            onClick={handleSubmit}
            disabled={isSubmitting || (actionType !== 'approve' && !body.trim())}
            type="button"
          >
            {isSubmitting ? 'Submitting...' : actionType === 'approve' ? 'Approve' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ReviewWorkbench({
  onReviewAction,
  onPRSelect,
  pullRequests: externalPRs,
  isLoading = false,
  error = null,
}: ReviewWorkbenchProps) {
  // State
  const [pullRequests, setPullRequests] = useState<PullRequest[]>(externalPRs || MOCK_PULL_REQUESTS);
  const [selectedPRId, setSelectedPRId] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<DiffViewMode>('split');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    actionType: 'approve' | 'request_changes' | 'comment';
  }>({ isOpen: false, actionType: 'comment' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update PRs when external data changes
  useEffect(() => {
    if (externalPRs) {
      setPullRequests(externalPRs);
    }
  }, [externalPRs]);

  // Filtered PRs
  const filteredPRs = useMemo(() => {
    if (statusFilter === 'all') return pullRequests;
    return pullRequests.filter((pr) => pr.status === statusFilter);
  }, [pullRequests, statusFilter]);

  // Selected PR
  const selectedPR = useMemo(() => {
    return pullRequests.find((pr) => pr.id === selectedPRId) || null;
  }, [pullRequests, selectedPRId]);

  // Selected file
  const selectedFile = useMemo(() => {
    if (!selectedPR || !selectedFilePath) return null;
    return selectedPR.files.find((f) => f.path === selectedFilePath) || null;
  }, [selectedPR, selectedFilePath]);

  // Auto-select first file when PR changes
  useEffect(() => {
    if (selectedPR && selectedPR.files.length > 0) {
      setSelectedFilePath(selectedPR.files[0].path);
    } else {
      setSelectedFilePath(null);
    }
  }, [selectedPR]);

  // Handlers
  const handlePRSelect = useCallback(
    (prId: string) => {
      setSelectedPRId(prId);
      onPRSelect?.(prId);
    },
    [onPRSelect]
  );

  const handleOpenDialog = useCallback((actionType: 'approve' | 'request_changes' | 'comment') => {
    setDialogState({ isOpen: true, actionType });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogState({ isOpen: false, actionType: 'comment' });
  }, []);

  const handleSubmitReview = useCallback(
    async (body: string) => {
      if (!selectedPRId) return;

      setIsSubmitting(true);
      try {
        await onReviewAction?.(selectedPRId, dialogState.actionType, body);

        // Update local state for demo
        setPullRequests((prev) =>
          prev.map((pr) =>
            pr.id === selectedPRId
              ? {
                  ...pr,
                  status:
                    dialogState.actionType === 'approve'
                      ? 'approved'
                      : dialogState.actionType === 'request_changes'
                      ? 'changes_requested'
                      : pr.status,
                  approvalCount:
                    dialogState.actionType === 'approve' ? pr.approvalCount + 1 : pr.approvalCount,
                  changesRequestedCount:
                    dialogState.actionType === 'request_changes'
                      ? pr.changesRequestedCount + 1
                      : pr.changesRequestedCount,
                }
              : pr
          )
        );

        handleCloseDialog();
      } catch (err) {
        console.error('Error submitting review:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedPRId, dialogState.actionType, onReviewAction, handleCloseDialog]
  );

  // Compute stats
  const stats = useMemo(() => {
    return {
      total: pullRequests.length,
      pending: pullRequests.filter((pr) => pr.status === 'pending').length,
      approved: pullRequests.filter((pr) => pr.status === 'approved').length,
      changesRequested: pullRequests.filter((pr) => pr.status === 'changes_requested').length,
    };
  }, [pullRequests]);

  return (
    <div className="review-workbench">
      {/* Header */}
      <header className="review-workbench__header">
        <div className="review-workbench__header-left">
          <h1 className="review-workbench__title">Review Dashboard</h1>
          <div className="review-workbench__stats">
            <span className="stat pending">{stats.pending} pending</span>
            <span className="stat approved">{stats.approved} approved</span>
            <span className="stat changes">{stats.changesRequested} changes requested</span>
          </div>
        </div>
        <div className="review-workbench__header-right">
          <select
            className="review-workbench__filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | 'all')}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="commented">Commented</option>
            <option value="merged">Merged</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </header>

      {/* Main Content */}
      <div className="review-workbench__content">
        {/* Loading State */}
        {isLoading && (
          <div className="review-workbench__loading">
            <p>Loading pull requests...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="review-workbench__error">
            <p>Error loading pull requests:</p>
            <p className="error-message">{error}</p>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && !error && filteredPRs.length === 0 && (
          <div className="review-workbench__empty">
            <h2>No pull requests</h2>
            <p>
              {statusFilter === 'all'
                ? 'There are no pull requests to review.'
                : `No pull requests with status "${getStatusLabel(statusFilter as ReviewStatus)}".`}
            </p>
          </div>
        )}

        {/* PR List */}
        {!isLoading && !error && filteredPRs.length > 0 && (
          <>
            <aside className="review-workbench__sidebar">
              <div className="review-pr-list">
                {filteredPRs.map((pr) => (
                  <PRListItem
                    key={pr.id}
                    pr={pr}
                    isSelected={pr.id === selectedPRId}
                    onClick={() => handlePRSelect(pr.id)}
                  />
                ))}
              </div>
            </aside>

            {/* Detail Panel */}
            <main className="review-workbench__main">
              {!selectedPR ? (
                <div className="review-workbench__no-selection">
                  <h2>Select a Pull Request</h2>
                  <p>Choose a PR from the list to view its changes</p>
                </div>
              ) : (
                <div className="review-detail">
                  {/* PR Info */}
                  <div className="review-detail__info">
                    <div className="review-detail__header">
                      <h2 className="review-detail__title">
                        <span className="pr-number">#{selectedPR.number}</span>
                        {selectedPR.title}
                      </h2>
                      <span
                        className="review-detail__status"
                        style={{ backgroundColor: getStatusColor(selectedPR.status) }}
                      >
                        {getStatusLabel(selectedPR.status)}
                      </span>
                    </div>
                    <div className="review-detail__meta">
                      <span>{selectedPR.author}</span>
                      <span>wants to merge</span>
                      <code>{selectedPR.sourceBranch}</code>
                      <span>into</span>
                      <code>{selectedPR.targetBranch}</code>
                    </div>
                    {selectedPR.description && (
                      <p className="review-detail__description">{selectedPR.description}</p>
                    )}
                  </div>

                  {/* View Controls */}
                  <div className="review-controls">
                    <div className="review-view-toggle">
                      <button
                        className={`view-toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
                        onClick={() => setViewMode('split')}
                        type="button"
                      >
                        Split
                      </button>
                      <button
                        className={`view-toggle-btn ${viewMode === 'unified' ? 'active' : ''}`}
                        onClick={() => setViewMode('unified')}
                        type="button"
                      >
                        Unified
                      </button>
                    </div>
                    <ReviewActions
                      pr={selectedPR}
                      onApprove={() => handleOpenDialog('approve')}
                      onRequestChanges={() => handleOpenDialog('request_changes')}
                      onComment={() => handleOpenDialog('comment')}
                      isSubmitting={isSubmitting}
                    />
                  </div>

                  {/* File List + Diff Viewer */}
                  <div className="review-diff-container">
                    <FileList
                      files={selectedPR.files}
                      selectedFilePath={selectedFilePath}
                      onFileSelect={setSelectedFilePath}
                    />
                    {selectedFile ? (
                      <DiffViewer file={selectedFile} viewMode={viewMode} />
                    ) : (
                      <div className="review-no-file">
                        <p>Select a file to view changes</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </>
        )}
      </div>

      {/* Comment Dialog */}
      <CommentDialog
        isOpen={dialogState.isOpen}
        actionType={dialogState.actionType}
        onSubmit={handleSubmitReview}
        onCancel={handleCloseDialog}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
