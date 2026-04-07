/**
 * ForkButton — hover-reveal icon button to fork from a chat message.
 *
 * Renders as a ghost variant icon button with GitBranch icon.
 * Opens ForkDialog when clicked.
 */
import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ForkDialog } from './ForkDialog';

export interface ForkButtonProps {
  messageId: string;
  parentSessionId: string;
  workbenchId: string;
  onForkCreated?: () => void;
}

export function ForkButton({
  messageId,
  parentSessionId,
  workbenchId,
  onForkCreated,
}: ForkButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150"
            aria-label="Fork from this message"
            onClick={() => setDialogOpen(true)}
          >
            <GitBranch className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fork from this message</TooltipContent>
      </Tooltip>

      <ForkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parentSessionId={parentSessionId}
        workbenchId={workbenchId}
        forkPointMessageId={messageId}
        onCreated={onForkCreated}
      />
    </>
  );
}
