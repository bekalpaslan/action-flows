import { useState, useEffect } from 'react';
import type { CustomWorkbench } from '@afw/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { ICON_MAP, ICON_NAMES } from '@/lib/iconMap';
import { useCustomWorkbenchStore } from '@/stores/customWorkbenchStore';

interface CustomWorkbenchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workbench?: CustomWorkbench | null;
  onSaved: () => void;
}

/**
 * Dialog for creating or editing a custom workbench.
 * Fields: name, icon, greeting, tone, agent instructions (system prompt snippet).
 */
export function CustomWorkbenchDialog({
  open,
  onOpenChange,
  workbench,
  onSaved,
}: CustomWorkbenchDialogProps) {
  const createWorkbench = useCustomWorkbenchStore((s) => s.createWorkbench);
  const updateWorkbench = useCustomWorkbenchStore((s) => s.updateWorkbench);
  const storeError = useCustomWorkbenchStore((s) => s.error);

  const isEdit = !!workbench;

  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('briefcase');
  const [greeting, setGreeting] = useState('');
  const [tone, setTone] = useState('');
  const [systemPromptSnippet, setSystemPromptSnippet] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Populate fields when editing
  useEffect(() => {
    if (workbench) {
      setName(workbench.name);
      setIconName(workbench.iconName);
      setGreeting(workbench.greeting);
      setTone(workbench.tone);
      setSystemPromptSnippet(workbench.systemPromptSnippet);
    } else {
      setName('');
      setIconName('briefcase');
      setGreeting('');
      setTone('');
      setSystemPromptSnippet('');
    }
    setLocalError(null);
  }, [workbench, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setLocalError('Name is required');
      return;
    }

    setSaving(true);
    setLocalError(null);

    try {
      if (isEdit && workbench) {
        await updateWorkbench(workbench.id, {
          name,
          iconName,
          greeting,
          tone,
          systemPromptSnippet,
        });
      } else {
        const result = await createWorkbench({
          name,
          iconName,
          greeting,
          tone,
          systemPromptSnippet,
        });
        if (!result) {
          // Store error was set by the store (e.g. name conflict)
          setSaving(false);
          return;
        }
      }

      setSaving(false);
      onSaved();
      onOpenChange(false);
    } catch {
      setSaving(false);
      setLocalError('An unexpected error occurred');
    }
  };

  const errorMessage = localError || storeError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Workbench' : 'Create Workbench'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this workbench configuration.'
              : 'Create a new workbench with its own session, pipeline, chat, and flows.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Name field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cwb-name" className="text-body font-medium text-text">
              Name
            </label>
            <Input
              id="cwb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workbench name (e.g., Research)"
              aria-required
            />
            {errorMessage && (
              <p className="text-caption text-red-400" role="alert">{errorMessage}</p>
            )}
          </div>

          {/* Icon field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cwb-icon" className="text-body font-medium text-text">
              Icon
            </label>
            <Select value={iconName} onValueChange={setIconName}>
              <SelectTrigger id="cwb-icon" aria-label="Choose icon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICON_NAMES.map((iconKey) => {
                  const IconComponent = ICON_MAP[iconKey];
                  return IconComponent ? (
                    <SelectItem key={iconKey} value={iconKey}>
                      <span className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {iconKey}
                      </span>
                    </SelectItem>
                  ) : null;
                })}
              </SelectContent>
            </Select>
            <p className="text-caption text-text-muted">Choose a lucide icon for the sidebar.</p>
          </div>

          {/* Greeting field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cwb-greeting" className="text-body font-medium text-text">
              Greeting
            </label>
            <Input
              id="cwb-greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="What should this agent say when you open it?"
              aria-required
            />
          </div>

          {/* Tone field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cwb-tone" className="text-body font-medium text-text">
              Tone
            </label>
            <Input
              id="cwb-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="e.g., Analytical, patient"
              aria-required
            />
          </div>

          {/* Agent instructions (system prompt snippet) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cwb-instructions" className="text-body font-medium text-text">
              Agent instructions
            </label>
            <textarea
              id="cwb-instructions"
              value={systemPromptSnippet}
              onChange={(e) => setSystemPromptSnippet(e.target.value)}
              placeholder="Describe how this agent should behave."
              className="w-full min-h-[120px] rounded-md border border-border bg-surface px-3 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Workbench'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
