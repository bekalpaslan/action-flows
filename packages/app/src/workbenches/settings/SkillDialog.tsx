/**
 * SkillDialog — create/edit skill form dialog.
 * Per UI-SPEC Section 5: Name, Description, Trigger, Action fields with validation.
 */

import { useState, useEffect, useId } from 'react';
import type { Skill } from '@afw/shared';
import type { WorkbenchId } from '@/lib/types';
import { useSkillStore } from '@/stores/skillStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface SkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: Skill | null;
  workbenchId: WorkbenchId;
  onSaved: () => void;
}

export function SkillDialog({
  open,
  onOpenChange,
  skill,
  workbenchId,
  onSaved,
}: SkillDialogProps) {
  const addSkill = useSkillStore((s) => s.addSkill);
  const updateSkill = useSkillStore((s) => s.updateSkill);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('');
  const [action, setAction] = useState('');
  const [errors, setErrors] = useState<{ name?: string; trigger?: string }>({});
  const [saving, setSaving] = useState(false);

  const triggerHintId = useId();
  const isEditing = skill != null;

  // Pre-fill form when editing
  useEffect(() => {
    if (open) {
      if (skill) {
        setName(skill.name);
        setDescription(skill.description);
        setTrigger(skill.trigger);
        setAction(skill.action);
      } else {
        setName('');
        setDescription('');
        setTrigger('');
        setAction('');
      }
      setErrors({});
    }
  }, [open, skill]);

  const validate = (): boolean => {
    const newErrors: { name?: string; trigger?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!trigger.trim()) {
      newErrors.trigger = 'Trigger is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (isEditing) {
        await updateSkill(workbenchId, skill.id as string, {
          name: name.trim(),
          description: description.trim(),
          trigger: trigger.trim(),
          action: action.trim(),
        });
      } else {
        await addSkill(workbenchId, {
          name: name.trim(),
          description: description.trim(),
          trigger: trigger.trim(),
          action: action.trim(),
        });
      }
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Skill' : 'Create Skill'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="skill-name" className="text-caption font-semibold text-text">
              Name
            </label>
            <Input
              id="skill-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skill name (e.g., summarize-chain)"
              error={!!errors.name}
              required
            />
            {errors.name && (
              <span className="text-caption text-destructive">{errors.name}</span>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label htmlFor="skill-description" className="text-caption font-semibold text-text">
              Description
            </label>
            <Input
              id="skill-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this skill do?"
            />
          </div>

          {/* Trigger */}
          <div className="flex flex-col gap-1">
            <label htmlFor="skill-trigger" className="text-caption font-semibold text-text">
              Trigger
            </label>
            <Input
              id="skill-trigger"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="e.g., /summarize"
              error={!!errors.trigger}
              required
              aria-describedby={triggerHintId}
            />
            <span id={triggerHintId} className="text-caption text-text-dim">
              The phrase that activates this skill in chat.
            </span>
            {errors.trigger && (
              <span className="text-caption text-destructive">{errors.trigger}</span>
            )}
          </div>

          {/* Action (textarea) */}
          <div className="flex flex-col gap-1">
            <label htmlFor="skill-action" className="text-caption font-semibold text-text">
              Action
            </label>
            <textarea
              id="skill-action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Describe what the agent should do when triggered."
              className="w-full min-h-[100px] rounded-md border border-border bg-[rgba(138,138,138,0.24)] px-3 py-2 text-body text-text placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-glow-focus"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Skill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
