/**
 * ConflictDialog Component (Phase 10 - Task 10.6)
 *
 * Modal dialog shown when a file is modified externally while having unsaved changes.
 * Provides options: Keep Mine, Take Theirs, or Show Diff.
 */

import { useState } from 'react';
import { Button } from '../primitives';
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
    <div
      className="conflict-dialog-backdrop"
      role="presentation"
    >
      <div
        className="conflict-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-dialog-title"
      >
        <div className="conflict-dialog-header">
          <h2 id="conflict-dialog-title">⚠️ File Conflict Detected</h2>
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

          <Button variant="ghost"
            className="show-details-btn"
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            aria-label={showDetails ? 'Hide version details' : 'Show version details'}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>

          <p className="conflict-instructions">
            Choose how to resolve this conflict:
          </p>

          <div className="conflict-actions">
            <Button variant="ghost"
              className="btn btn-primary"
              onClick={() => onResolve('keep-mine')}
              title="Keep your unsaved changes and discard external changes"
              aria-label="Keep my changes and discard external changes"
            >
              📝 Keep My Changes
            </Button>

            <Button variant="ghost"
              className="btn btn-secondary"
              onClick={() => onResolve('take-theirs')}
              title="Discard your changes and use the external version"
              aria-label="Take external version and discard my changes"
            >
              ⬇️ Take External Version
            </Button>

            <Button variant="ghost"
              className="btn btn-tertiary"
              onClick={onShowDiff}
              title="View differences between versions"
              aria-label="Show differences between my version and external version"
            >
              🔍 Show Diff
            </Button>
          </div>
        </div>

        <div className="conflict-dialog-footer">
          <Button variant="ghost"
            className="btn btn-text"
            onClick={onCancel}
            aria-label="Close conflict dialog without resolving"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}


