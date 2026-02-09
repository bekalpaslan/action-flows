/**
 * DossierList Component
 * Vertical list of dossier cards for the Intel workbench sidebar
 *
 * Features:
 * - Renders list of DossierCard components
 * - Handles selection state
 * - Shows empty state when no dossiers
 */

import { DossierCard } from './DossierCard';
import type { IntelDossier } from '@afw/shared';
import './DossierList.css';

// ============================================================================
// Types
// ============================================================================

export interface DossierListProps {
  /** List of dossiers to display */
  dossiers: IntelDossier[];
  /** Currently selected dossier ID */
  selectedId: string | null;
  /** Callback when a dossier is selected */
  onSelect: (dossierId: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function DossierList({ dossiers, selectedId, onSelect }: DossierListProps) {
  // Empty state
  if (dossiers.length === 0) {
    return (
      <div className="dossier-list dossier-list--empty">
        <div className="dossier-list__empty-state">
          <p className="dossier-list__empty-message">No dossiers yet.</p>
          <p className="dossier-list__empty-hint">Create one to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dossier-list">
      <div className="dossier-list__header">
        <h2 className="dossier-list__title">Dossiers</h2>
        <span className="dossier-list__count">{dossiers.length}</span>
      </div>
      <div className="dossier-list__items">
        {dossiers.map((dossier) => (
          <DossierCard
            key={dossier.id}
            dossier={dossier}
            isSelected={dossier.id === selectedId}
            onClick={() => onSelect(dossier.id)}
          />
        ))}
      </div>
    </div>
  );
}
