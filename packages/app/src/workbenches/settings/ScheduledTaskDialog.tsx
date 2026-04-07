/**
 * ScheduledTaskDialog — Create/Edit form for scheduled tasks.
 *
 * Provides cron input with validation hints, target type selection,
 * and name/description fields. Calls store createTask or updateTask on save.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useScheduleStore } from '@/stores/scheduleStore';
import type { ScheduledTask } from '@afw/shared';
import type { WorkbenchId } from '@/lib/types';

export interface ScheduledTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: ScheduledTask | null;
  workbenchId: WorkbenchId;
  onSaved: () => void;
}

/** Basic cron syntax validation (5 space-separated fields) */
function isLikelyCron(expr: string): boolean {
  const trimmed = expr.trim();
  if (!trimmed) return false;
  const parts = trimmed.split(/\s+/);
  return parts.length === 5 || parts.length === 6;
}

export function ScheduledTaskDialog({
  open,
  onOpenChange,
  task,
  workbenchId,
  onSaved,
}: ScheduledTaskDialogProps) {
  const createTask = useScheduleStore((s) => s.createTask);
  const updateTask = useScheduleStore((s) => s.updateTask);

  const isEdit = task !== null && task !== undefined;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cronExpression, setCronExpression] = useState('');
  const [targetType, setTargetType] = useState<'flow' | 'action'>('flow');
  const [targetName, setTargetName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (task) {
        setName(task.name);
        setDescription(task.description);
        setCronExpression(task.cronExpression);
        setTargetType(task.target.type);
        setTargetName(task.target.name);
      } else {
        setName('');
        setDescription('');
        setCronExpression('');
        setTargetType('flow');
        setTargetName('');
      }
      setError(null);
      setSaving(false);
    }
  }, [open, task]);

  const handleSave = useCallback(async () => {
    // Validate
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!cronExpression.trim()) {
      setError('Schedule is required.');
      return;
    }
    if (!isLikelyCron(cronExpression)) {
      setError('Invalid cron expression. Check the format.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        await updateTask(workbenchId, task!.id, {
          name: name.trim(),
          description: description.trim(),
          cronExpression: cronExpression.trim(),
          target: { type: targetType, name: targetName.trim() },
        });
      } else {
        await createTask(workbenchId, {
          name: name.trim(),
          description: description.trim(),
          cronExpression: cronExpression.trim(),
          target: { type: targetType, name: targetName.trim() },
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  }, [
    name,
    description,
    cronExpression,
    targetType,
    targetName,
    isEdit,
    task,
    workbenchId,
    createTask,
    updateTask,
    onSaved,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the scheduled task configuration.'
              : 'Define a cron-based automation for this workbench.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-name" className="text-caption font-semibold text-text-dim">
              Name
            </label>
            <Input
              id="task-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Task name (e.g., morning-review)"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-description" className="text-caption font-semibold text-text-dim">
              Description
            </label>
            <Input
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this task do?"
            />
          </div>

          {/* Schedule (Cron) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-cron" className="text-caption font-semibold text-text-dim">
              Schedule
            </label>
            <Input
              id="task-cron"
              value={cronExpression}
              onChange={(e) => {
                setCronExpression(e.target.value);
                setError(null);
              }}
              placeholder="0 9 * * 1-5"
              className="font-mono"
              required
            />
            <p className="text-caption text-text-muted">
              Standard 5-field cron syntax. Example: 0 9 * * 1-5 runs at 9am on weekdays.
            </p>
            {cronExpression.trim() && !isLikelyCron(cronExpression) && (
              <p className="text-caption text-destructive">
                Invalid cron expression. Check the format.
              </p>
            )}
          </div>

          {/* Target */}
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-semibold text-text-dim">Target</label>
            <div className="flex gap-2">
              <Select
                value={targetType}
                onValueChange={(val: string) => setTargetType(val as 'flow' | 'action')}
              >
                <SelectTrigger className="w-[120px]" aria-label="Target type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flow">Flow</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="Target name"
                className="flex-1"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-caption text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
