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
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
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
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'DossierList',
    getContext: () => ({
      dossierCount: dossiers.length,
      selectedDossierId: selectedId || 'none',
      hasSelection: !!selectedId,
    }),
  });

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="dossier-list__count">{dossiers.length}</span>
          <DiscussButton componentName="DossierList" onClick={openDialog} size="small" />
        </div>
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

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="DossierList"
        componentContext={{
          dossierCount: dossiers.length,
          selectedDossierId: selectedId || 'none',
          hasSelection: !!selectedId,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
