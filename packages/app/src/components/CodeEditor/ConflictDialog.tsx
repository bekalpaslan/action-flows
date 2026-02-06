/**
 * ConflictDialog Component (Phase 10 - Task 10.6)
 *
 * Modal dialog shown when a file is modified externally while having unsaved changes.
 * Provides options: Keep Mine, Take Theirs, or Show Diff.
 */

import { useState } from 'react';
import './ConflictDialog.css';

export interface ConflictDialogProps {
  filePath: string;
  userVersion: string;
  externalVersion: string;
  onResolve: (resolution: 'keep-mine' | 'take-theirs') => void;
  onShowDiff: () => void;
  onCancel: () => void;
}

export function ConflictDialog({
  filePath,
  userVersion,
  externalVersion,
  onResolve,
  onShowDiff,
  onCancel,
}: ConflictDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  const userLineCount = userVersion.split('\n').length;
  const externalLineCount = externalVersion.split('\n').length;

  return (
    <div className="conflict-dialog-backdrop">
      <div className="conflict-dialog">
        <div className="conflict-dialog-header">
          <h2>⚠️ File Conflict Detected</h2>
        </div>

        <div className="conflict-dialog-body">
          <p className="conflict-message">
            The file <strong>{filePath}</strong> was modified externally while you have unsaved changes.
          </p>

          {showDetails && (
            <div className="conflict-details">
              <div className="version-info">
                <div className="version-card">
                  <h4>Your Version</h4>
                  <p>{userLineCount} lines</p>
                </div>
                <div className="version-card">
                  <h4>External Version</h4>
                  <p>{externalLineCount} lines</p>
                </div>
              </div>
            </div>
          )}

          <button
            className="show-details-btn"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          <p className="conflict-instructions">
            Choose how to resolve this conflict:
          </p>

          <div className="conflict-actions">
            <button
              className="btn btn-primary"
              onClick={() => onResolve('keep-mine')}
              title="Keep your unsaved changes and discard external changes"
            >
              📝 Keep My Changes
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => onResolve('take-theirs')}
              title="Discard your changes and use the external version"
            >
              ⬇️ Take External Version
            </button>

            <button
              className="btn btn-tertiary"
              onClick={onShowDiff}
              title="View differences between versions"
            >
              🔍 Show Diff
            </button>
          </div>
        </div>

        <div className="conflict-dialog-footer">
          <button className="btn btn-text" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
