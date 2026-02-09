/**
 * DossierCard Component
 * Compact card view of a single intel dossier for sidebar lists
 *
 * Shows:
 * - Dossier name
 * - Target path count badge
 * - Last updated relative time
 * - Status indicator dot (idle=green, analyzing=yellow, error=red)
 */

import type { IntelDossier } from '@afw/shared';

// ============================================================================
// Types
// ============================================================================

export interface DossierCardProps {
  /** Dossier to display */
  dossier: IntelDossier;
  /** Whether this card is selected */
  isSelected: boolean;
  /** Callback when card is clicked */
  onClick: () => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format relative time from ISO timestamp
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
function getStatusColor(status: IntelDossier['status']): string {
  const colors = {
    idle: '#4caf50',
    analyzing: '#f0ad4e',
    error: '#f44336',
  };
  return colors[status];
}

/**
 * Get status label
 */
function getStatusLabel(status: IntelDossier['status']): string {
  const labels = {
    idle: 'Idle',
    analyzing: 'Analyzing',
    error: 'Error',
  };
  return labels[status];
}

// ============================================================================
// Main Component
// ============================================================================

export function DossierCard({ dossier, isSelected, onClick }: DossierCardProps) {
  return (
    <button
      className={`dossier-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      type="button"
      aria-label={`Select dossier: ${dossier.name}`}
    >
      {/* Header: Name + Status Dot */}
      <div className="dossier-card__header">
        <h3 className="dossier-card__name">{dossier.name}</h3>
        <span
          className="dossier-card__status-dot"
          style={{ backgroundColor: getStatusColor(dossier.status) }}
          title={getStatusLabel(dossier.status)}
          aria-label={`Status: ${getStatusLabel(dossier.status)}`}
        />
      </div>

      {/* Meta: Target Count + Last Updated */}
      <div className="dossier-card__meta">
        <span className="dossier-card__target-count" title={`${dossier.targets.length} target paths`}>
          {dossier.targets.length} {dossier.targets.length === 1 ? 'target' : 'targets'}
        </span>
        <span className="dossier-card__separator">•</span>
        <span className="dossier-card__updated">{formatRelativeTime(dossier.updatedAt)}</span>
      </div>

      {/* Analysis Count Badge (if > 0) */}
      {dossier.analysisCount > 0 && (
        <div className="dossier-card__badge">
          {dossier.analysisCount} {dossier.analysisCount === 1 ? 'analysis' : 'analyses'}
        </div>
      )}

      {/* Error Indicator */}
      {dossier.error && (
        <div className="dossier-card__error-indicator" title={dossier.error}>
          Error: {dossier.error}
        </div>
      )}
    </button>
  );
}
