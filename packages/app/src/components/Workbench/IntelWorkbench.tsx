/**
 * IntelWorkbench Component
 * Dossier-based intelligence monitoring and analysis workbench
 *
 * Features:
 * - List of dossiers with status indicators
 * - Create new dossiers
 * - View selected dossier or empty state
 * - Widget-based layout rendering (future)
 */

import { useState } from 'react';
import { DossierList, DossierView, DossierCreationDialog } from '../IntelDossier';
import { useDossiers } from '../../hooks/useDossiers';
import type { DossierId } from '@afw/shared';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import { OrchestratorButton } from '../OrchestratorButton';
import './IntelWorkbench.css';

// ============================================================================
// Types
// ============================================================================

export interface IntelWorkbenchProps {
  // No external props needed - hook manages state
}

// ============================================================================
// Main Component
// ============================================================================

export function IntelWorkbench(_props?: IntelWorkbenchProps) {
  // Hook for dossier data and operations
  const {
    dossiers,
    loading,
    error,
    createDossier,
    deleteDossier,
    triggerAnalysis,
  } = useDossiers();

  // State
  const [selectedDossierId, setSelectedDossierId] = useState<DossierId | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Selected dossier
  const selectedDossier = dossiers.find((d) => d.id === selectedDossierId) || null;

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'IntelWorkbench',
    getContext: () => ({
      dossierCount: dossiers.length,
      activeDossier: selectedDossierId,
    }),
  });

  // Handlers
  const handleDossierSelect = (dossierId: string) => {
    setSelectedDossierId(dossierId as DossierId);
  };

  const handleNewDossier = () => {
    setShowCreateDialog(true);
  };

  const handleCreateSubmit = async (name: string, targets: string[], context: string) => {
    try {
      const newDossier = await createDossier(name, targets, context);
      setShowCreateDialog(false);
      setSelectedDossierId(newDossier.id);
    } catch (err) {
      console.error('Failed to create dossier:', err);
      // Error is already handled by the hook
    }
  };

  const handleAnalyze = () => {
    if (selectedDossier) {
      triggerAnalysis(selectedDossier.id);
    }
  };

  const handleDelete = async () => {
    if (selectedDossier) {
      try {
        await deleteDossier(selectedDossier.id);
        setSelectedDossierId(null);
      } catch (err) {
        console.error('Failed to delete dossier:', err);
      }
    }
  };

  return (
    <div className="intel-workbench">
      {/* Header */}
      <header className="intel-workbench__header">
        <h1 className="intel-workbench__title">Intel</h1>
        <DiscussButton componentName="IntelWorkbench" onClick={openDialog} size="small" />
        <OrchestratorButton source="intel-analyze" context={{ action: 'analyze-intel' }}>
          <button className="intel-workbench__action-btn">Analyze with Orchestrator</button>
        </OrchestratorButton>
        <button
          className="intel-workbench__new-btn"
          onClick={handleNewDossier}
          type="button"
        >
          + New Dossier
        </button>
      </header>

      {/* Main Content */}
      <div className="intel-workbench__content">
        {/* Loading State */}
        {loading && (
          <div className="intel-workbench__loading">
            <p>Loading dossiers...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="intel-workbench__error">
            <p>Error loading dossiers:</p>
            <p className="error-message">{error}</p>
          </div>
        )}

        {/* Main Layout: Left Panel + Right Panel */}
        {!loading && !error && (
          <>
            {/* Left Panel: Dossier List */}
            <aside className="intel-workbench__sidebar">
              <DossierList
                dossiers={dossiers}
                selectedId={selectedDossierId}
                onSelect={handleDossierSelect}
              />
            </aside>

            {/* Right Panel: Selected Dossier View or Empty State */}
            <main className="intel-workbench__main">
              {!selectedDossier ? (
                <div className="intel-workbench__empty">
                  <h2>No Dossier Selected</h2>
                  <p>Select a dossier from the list or create a new one to get started.</p>
                </div>
              ) : (
                <DossierView
                  dossier={selectedDossier}
                  onAnalyze={handleAnalyze}
                  onDelete={handleDelete}
                />
              )}
            </main>
          </>
        )}
      </div>

      {/* Dossier Creation Dialog */}
      {showCreateDialog && (
        <DossierCreationDialog
          onSubmit={handleCreateSubmit}
          onClose={() => setShowCreateDialog(false)}
        />
      )}

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="IntelWorkbench"
        componentContext={{
          dossierCount: dossiers.length,
          activeDossier: selectedDossierId,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
