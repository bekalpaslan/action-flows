/**
 * ForkDialog — dialog for creating a new session fork.
 *
 * D-14: Requires a description before fork creation.
 * Includes graceful degradation for Phase 6 dependency — when backend returns
 * 503 FORK_SESSION_UNAVAILABLE, shows a clear degradation message instead of a cryptic error.
 */
import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForkStore } from '@/stores/forkStore';

export interface ForkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentSessionId: string;
  workbenchId: string;
  forkPointMessageId?: string;
  onCreated?: () => void;
}

export function ForkDialog({
  open,
  onOpenChange,
  parentSessionId,
  workbenchId,
  forkPointMessageId,
  onCreated,
}: ForkDialogProps) {
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const createFork = useForkStore((s) => s.createFork);
  const forkUnavailable = useForkStore((s) => s.forkUnavailable);
  const storeError = useForkStore((s) => s.error);

  const handleSubmit = async () => {
    // D-14: validate description
    if (!description.trim()) {
      setValidationError('Fork description is required.');
      return;
    }

    setValidationError('');
    setSubmitting(true);

    const fork = await createFork(parentSessionId, workbenchId, description.trim(), forkPointMessageId);

    setSubmitting(false);

    if (fork) {
      setDescription('');
      onOpenChange(false);
      onCreated?.();
    }
    // If fork is null but forkUnavailable is true, the degradation UI will show
  };

  const handleClose = () => {
    setDescription('');
    setValidationError('');
    onOpenChange(false);
  };

  const descriptionId = 'fork-description-hint';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Fork</DialogTitle>
          <DialogDescription>
            Branch this conversation to explore an alternative without losing the original.
          </DialogDescription>
        </DialogHeader>

        {forkUnavailable ? (
          /* Graceful degradation when Phase 6 is unavailable */
          <>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <GitBranch className="h-8 w-8 text-text-muted" />
              <p className="text-body font-semibold">Fork requires active agent sessions</p>
              <p className="text-caption text-text-dim">
                Session forking depends on the agent session management layer (Phase 6),
                which is not yet available. Fork creation will work once agent sessions are enabled.
              </p>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Normal fork creation form */
          <>
            <div className="flex flex-col gap-2 py-2">
              <label htmlFor="fork-description" className="text-body font-semibold text-text">
                Fork description
              </label>
              <textarea
                id="fork-description"
                className="min-h-[80px] w-full resize-y rounded-md border border-border bg-surface-1 px-3 py-2 text-body text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
                placeholder="Why are you forking? (e.g., Try aggressive refactor)"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (validationError) setValidationError('');
                }}
                aria-describedby={descriptionId}
                autoFocus
              />
              <p id={descriptionId} className="text-caption text-text-dim">
                Required. Be specific — this is how you'll find the fork later.
              </p>
              {validationError && (
                <p className="text-caption text-destructive" role="alert">
                  {validationError}
                </p>
              )}
              {storeError && !forkUnavailable && (
                <p className="text-caption text-destructive" role="alert">
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
                disabled={!description.trim() || submitting}
              >
                {submitting ? 'Creating...' : 'Create Fork'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
