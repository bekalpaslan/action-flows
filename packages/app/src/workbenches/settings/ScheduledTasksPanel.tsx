/**
 * ScheduledTasksPanel — Per-workbench task list with create button and per-task run history.
 *
 * Renders the list of scheduled tasks for a given workbench,
 * with a "Create Task" button, empty state, and per-row expansion
 * for run history.
 */

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useScheduleStore } from '@/stores/scheduleStore';
import { ScheduledTaskRow } from './ScheduledTaskRow';
import { ScheduledTaskDialog } from './ScheduledTaskDialog';
import { DeleteConfirmationDialog } from '@/workbenches/shared/DeleteConfirmationDialog';
import type { ScheduledTask } from '@afw/shared';
import type { WorkbenchId } from '@/lib/types';

export interface ScheduledTasksPanelProps {
  workbenchId: WorkbenchId;
  workbenchLabel: string;
}

export function ScheduledTasksPanel({ workbenchId, workbenchLabel }: ScheduledTasksPanelProps) {
  const loadTasks = useScheduleStore((s) => s.loadTasks);
  const getTasksByWorkbench = useScheduleStore((s) => s.getTasksByWorkbench);
  const deleteTask = useScheduleStore((s) => s.deleteTask);
  const runNow = useScheduleStore((s) => s.runNow);

  const tasks = getTasksByWorkbench(workbenchId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduledTask | null>(null);

  useEffect(() => {
    loadTasks(workbenchId);
  }, [workbenchId, loadTasks]);

  const handleCreate = useCallback(() => {
    setEditingTask(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((task: ScheduledTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((task: ScheduledTask) => {
    setDeleteTarget(task);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget) {
      await deleteTask(workbenchId, deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteTask, workbenchId]);

  const handleRunNow = useCallback(
    async (task: ScheduledTask) => {
      await runNow(workbenchId, task.id);
    },
    [runNow, workbenchId]
  );

  const handleSaved = useCallback(() => {
    loadTasks(workbenchId);
  }, [loadTasks, workbenchId]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading font-semibold">Scheduled Tasks</h2>
          <p className="text-body text-text-dim">
            Cron-based automations for the {workbenchLabel} workbench.
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          Create Task
        </Button>
      </div>

      {/* Task list or empty state */}
      {tasks.length === 0 ? (
        <div className="py-12 text-center" role="status">
          <h3 className="text-heading font-semibold">No scheduled tasks</h3>
          <p className="text-body text-text-dim mt-2">
            Create a task to automate flows or actions on a recurring schedule.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <ScheduledTaskRow
              key={task.id}
              task={task}
              workbenchId={workbenchId}
              onEdit={() => handleEdit(task)}
              onDelete={() => handleDelete(task)}
              onRunNow={() => handleRunNow(task)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <ScheduledTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        workbenchId={workbenchId}
        onSaved={handleSaved}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Scheduled Task"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This will also remove all run history.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
