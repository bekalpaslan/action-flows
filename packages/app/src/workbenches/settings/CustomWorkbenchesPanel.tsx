import { useEffect, useState } from 'react';
import type { CustomWorkbench } from '@afw/shared';
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';
import { useCustomWorkbenchStore } from '@/stores/customWorkbenchStore';
import { CustomWorkbenchCard } from './CustomWorkbenchCard';
import { CustomWorkbenchDialog } from './CustomWorkbenchDialog';
import { DeleteConfirmationDialog } from '../shared/DeleteConfirmationDialog';

/**
 * Settings panel for managing custom workbenches.
 * Displays a card grid with create/edit/delete actions.
 */
export function CustomWorkbenchesPanel() {
  const workbenches = useCustomWorkbenchStore((s) => s.workbenches);
  const loading = useCustomWorkbenchStore((s) => s.loading);
  const loadWorkbenches = useCustomWorkbenchStore((s) => s.loadWorkbenches);
  const deleteWorkbench = useCustomWorkbenchStore((s) => s.deleteWorkbench);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomWorkbench | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomWorkbench | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadWorkbenches();
  }, [loadWorkbenches]);

  const handleCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleEdit = (wb: CustomWorkbench) => {
    setEditTarget(wb);
    setDialogOpen(true);
  };

  const handleDeleteClick = (wb: CustomWorkbench) => {
    setDeleteTarget(wb);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteWorkbench(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleSaved = () => {
    loadWorkbenches();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-heading font-semibold text-text">Custom Workbenches</h2>
          <p className="text-body text-text-dim mt-1">
            Create additional workbenches beyond the 7 defaults. Each gets its own session, pipeline, chat, and flows.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workbench
        </Button>
      </div>

      {/* Card grid or empty state */}
      {loading && workbenches.length === 0 ? (
        <p className="text-body text-text-dim">Loading...</p>
      ) : workbenches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-heading font-semibold text-text mb-2">No custom workbenches</h3>
          <p className="text-body text-text-dim">
            Create a workbench to add a new domain to your sidebar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workbenches.map((wb) => (
            <CustomWorkbenchCard
              key={wb.id}
              workbench={wb}
              onEdit={() => handleEdit(wb)}
              onDelete={() => handleDeleteClick(wb)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <CustomWorkbenchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workbench={editTarget}
        onSaved={handleSaved}
      />

      {/* Delete confirmation */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete "${deleteTarget?.name ?? ''}"?`}
        description="This workbench and its configuration will be permanently removed. Sessions and data associated with it will be lost."
        confirmLabel="Delete Workbench"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
