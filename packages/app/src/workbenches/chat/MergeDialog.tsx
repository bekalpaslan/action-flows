/**
 * MergeDialog — dialog for resolving merge conflicts when merging a fork back to parent.
 *
 * D-13: Three resolution strategies:
 * - theirs: Use fork version, discard parent
 * - parent: Use parent version, discard fork changes
 * - manual: Write merged content manually
 */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForkStore } from '@/stores/forkStore';
import type { MergeResolution } from '@afw/shared';

export interface MergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forkId: string;
  onMerged?: () => void;
}

const RESOLUTION_OPTIONS: Array<{
  value: MergeResolution;
  label: string;
  hint: string;
}> = [
  {
    value: 'theirs',
    label: 'Use fork version',
    hint: 'Keep the changes from this fork, discard parent.',
  },
  {
    value: 'parent',
    label: 'Use parent version',
    hint: 'Keep parent unchanged, discard fork.',
  },
  {
    value: 'manual',
    label: 'Manual merge',
    hint: 'Write the merged content yourself.',
  },
];

export function MergeDialog({
  open,
  onOpenChange,
  forkId,
  onMerged,
}: MergeDialogProps) {
  const [resolution, setResolution] = useState<MergeResolution>('theirs');
  const [manualContent, setManualContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mergeFork = useForkStore((s) => s.mergeFork);
  const storeError = useForkStore((s) => s.error);

  const isManualEmpty = resolution === 'manual' && !manualContent.trim();

  const handleSubmit = async () => {
    if (isManualEmpty) return;

    setSubmitting(true);
    await mergeFork(forkId, resolution, resolution === 'manual' ? manualContent.trim() : undefined);
    setSubmitting(false);

    // Reset and close
    setResolution('theirs');
    setManualContent('');
    onOpenChange(false);
    onMerged?.();
  };

  const handleClose = () => {
    setResolution('theirs');
    setManualContent('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Merge Fork</DialogTitle>
          <DialogDescription>
            Choose how to resolve conflicts with the parent branch.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <RadioGroup
            value={resolution}
            onValueChange={(val) => setResolution(val as MergeResolution)}
            className="gap-3"
          >
            {RESOLUTION_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-[rgba(255,255,255,0.04)] data-[state=checked]:border-accent"
              >
                <RadioGroupItem value={opt.value} className="mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-body font-semibold text-text">{opt.label}</span>
                  <span className="text-caption text-text-dim">{opt.hint}</span>
                </div>
              </label>
            ))}
          </RadioGroup>

          {/* Manual merge textarea */}
          {resolution === 'manual' && (
            <div className="mt-3">
              <label htmlFor="manual-merge-content" className="text-body font-semibold text-text">
                Merged content
              </label>
              <textarea
                id="manual-merge-content"
                className="mt-1 min-h-[200px] w-full resize-y rounded-md border border-border bg-surface-1 px-3 py-2 text-body text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
                placeholder="Enter the merged content..."
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {storeError && (
            <p className="mt-2 text-caption text-destructive" role="alert">
              {storeError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isManualEmpty || submitting}
          >
            {submitting ? 'Merging...' : 'Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
