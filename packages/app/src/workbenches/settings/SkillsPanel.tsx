/**
 * SkillsPanel — per-workbench skills list with create/edit/delete.
 * Per UI-SPEC Section 4: header with "Create Skill" button, skills list, empty state.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Skill } from '@afw/shared';
import type { WorkbenchId } from '@/lib/types';
import { useSkillStore } from '@/stores/skillStore';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '../shared/DeleteConfirmationDialog';
import { SkillRow } from './SkillRow';
import { SkillDialog } from './SkillDialog';

export interface SkillsPanelProps {
  workbenchId: WorkbenchId;
  workbenchLabel: string;
}

export function SkillsPanel({ workbenchId, workbenchLabel }: SkillsPanelProps) {
  const loadSkills = useSkillStore((s) => s.loadSkills);
  const getSkillsByWorkbench = useSkillStore((s) => s.getSkillsByWorkbench);
  const deleteSkill = useSkillStore((s) => s.deleteSkill);
  const loading = useSkillStore((s) => s.loading);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [deleting, setDeleting] = useState(false);

  const skills = getSkillsByWorkbench(workbenchId);

  // Load skills on mount and when workbenchId changes
  useEffect(() => {
    loadSkills(workbenchId);
  }, [workbenchId, loadSkills]);

  const handleCreateClick = useCallback(() => {
    setEditingSkill(null);
    setDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((skill: Skill) => {
    setEditingSkill(skill);
    setDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((skill: Skill) => {
    setDeleteTarget(skill);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSkill(workbenchId, deleteTarget.id as string);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteSkill, workbenchId]);

  const handleSaved = useCallback(() => {
    loadSkills(workbenchId);
  }, [loadSkills, workbenchId]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-heading font-semibold">Skills</h2>
          <p className="text-caption text-text-dim">
            Reusable commands scoped to the {workbenchLabel} workbench.
          </p>
        </div>
        <Button className="ml-auto" onClick={handleCreateClick}>
          Create Skill
        </Button>
      </div>

      {/* Skills list or empty state */}
      {loading && skills.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-body text-text-dim">Loading skills...</p>
        </div>
      ) : skills.length === 0 ? (
        <div className="py-12 text-center" role="status">
          <h3 className="text-heading font-semibold">No skills yet</h3>
          <p className="text-body text-text-dim mt-2">
            Create a skill to give this workbench a reusable command.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2" role="list">
          {skills.map((skill) => (
            <div key={skill.id as string} role="listitem">
              <SkillRow
                skill={skill}
                onEdit={() => handleEditClick(skill)}
                onDelete={() => handleDeleteClick(skill)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <SkillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        skill={editingSkill}
        workbenchId={workbenchId}
        onSaved={handleSaved}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this skill?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed from this workbench. This cannot be undone.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
}
