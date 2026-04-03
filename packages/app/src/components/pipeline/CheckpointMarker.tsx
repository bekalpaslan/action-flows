import { useState } from 'react';
import type { CheckpointData } from '@afw/shared';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface CheckpointMarkerProps {
  checkpoint: CheckpointData;
  onRevert: (commitHash: string) => void;
}

/**
 * Formats an ISO timestamp to a relative time string (e.g., "2m ago", "1h ago").
 */
function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now();
  const then = new Date(isoTimestamp).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

/**
 * Checkpoint marker rendered below pipeline step nodes.
 * Shows a dot that reveals a tooltip on hover with commit info and revert button.
 * Revert opens a confirmation dialog before calling the API.
 */
export function CheckpointMarker({ checkpoint, onRevert }: CheckpointMarkerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const truncatedMessage =
    checkpoint.commitMessage.length > 60
      ? checkpoint.commitMessage.slice(0, 60) + '...'
      : checkpoint.commitMessage;

  const handleRevertClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmRevert = () => {
    onRevert(checkpoint.commitHash);
    setIsDialogOpen(false);
  };

  const handleCancelRevert = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col items-center mt-1">
        <TooltipProvider>
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <div
                role="button"
                aria-label={`Checkpoint: ${checkpoint.commitMessage}`}
                className="w-2 h-2 rounded-full bg-surface-3 border border-border hover:bg-accent hover:border-accent transition-colors cursor-pointer"
              />
            </TooltipTrigger>
            <TooltipContent className="bg-surface-2 px-3 py-2" side="bottom">
              <div className="flex flex-col gap-1">
                <span className="text-caption font-semibold text-text">
                  {truncatedMessage}
                </span>
                <span className="text-caption text-text-muted font-mono">
                  {formatRelativeTime(checkpoint.timestamp)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-caption font-semibold mt-1"
                  onClick={handleRevertClick}
                >
                  Revert to this point
                </Button>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revert to checkpoint?</DialogTitle>
            <DialogDescription>
              This will create a new commit that undoes all changes after this point.
              Your current work will not be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCancelRevert} autoFocus>
              Keep changes
            </Button>
            <Button variant="destructive" onClick={handleConfirmRevert}>
              Revert changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
