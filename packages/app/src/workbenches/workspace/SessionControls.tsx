import { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { wsClient } from '@/lib/ws-client';
import type { WorkbenchId } from '@/lib/types';
import type { SessionStatus } from '@/stores/sessionStore';

export interface SessionControlsProps {
  workbenchId: WorkbenchId;
  status: SessionStatus;
}

/**
 * Start/stop action buttons for a workbench session.
 * Sends WebSocket commands to backend SessionManager.
 * Stop includes a confirmation state before executing.
 */
export function SessionControls({ workbenchId, status }: SessionControlsProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  // Close confirmation on Escape key
  useEffect(() => {
    if (!showConfirm) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowConfirm(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showConfirm]);

  const isStopped = status === 'stopped' || status === 'suspended';

  const handleStart = () => {
    wsClient.send({
      type: 'session:start',
      channel: '_system',
      payload: { workbenchId },
    });
  };

  const handleStopConfirm = () => {
    wsClient.send({
      type: 'session:stop',
      channel: '_system',
      payload: { workbenchId },
    });
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleStopConfirm}
          aria-label={`Confirm stop ${workbenchId} session`}
        >
          Stop Session
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(false)}
          aria-label="Keep session running"
        >
          Keep Session
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        {isStopped ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleStart}
                aria-label={`Start ${workbenchId} session`}
              >
                <Play className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start session</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowConfirm(true)}
                aria-label={`Stop ${workbenchId} session`}
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stop session</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
