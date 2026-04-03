import { useState, useEffect, useCallback } from 'react';
import { History, MoreVertical } from 'lucide-react';
import { StatusDot } from '@/components/ui/status-dot';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { wsClient } from '@/lib/ws-client';
import { cn } from '@/lib/utils';
import type { WorkbenchId } from '@/lib/types';
import type { SessionStatus } from '@/stores/sessionStore';

export interface ChatHeaderProps {
  workbenchId: WorkbenchId;
  workbenchLabel: string;
  sessionStatus: SessionStatus;
  className?: string;
}

/**
 * Truncate a string to maxLen characters, appending "..." if truncated.
 */
function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

/**
 * Derive the display label based on session status per UI-SPEC.
 */
function getStatusLabel(status: SessionStatus, workbenchLabel: string): string {
  switch (status) {
    case 'idle':
    case 'running':
      return `${workbenchLabel} Chat`;
    case 'connecting':
      return 'Connecting...';
    case 'stopped':
    case 'suspended':
      return 'Disconnected';
    case 'error':
      return 'Connection error';
    default:
      return 'Disconnected';
  }
}

interface HistoryEntry {
  role: string;
  content: string;
  timestamp?: string;
}

/**
 * Chat panel header with session status dot, workbench label,
 * session history dropdown (loads real data via session:history WS request),
 * and overflow menu.
 *
 * Per UI-SPEC Chat Header Contract (D-09, D-10, CHAT-07).
 */
export function ChatHeader({ workbenchId, workbenchLabel, sessionStatus, className }: ChatHeaderProps) {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Send session:history WS request when dropdown opens
  const handleHistoryOpen = useCallback((open: boolean) => {
    if (!open) return;
    setHistoryLoading(true);
    wsClient.send({ type: 'session:history', payload: { workbenchId } });
  }, [workbenchId]);

  // Subscribe to _system channel for session:history responses
  useEffect(() => {
    const unsub = wsClient.subscribe('_system', (envelope) => {
      if (
        envelope.type === 'session:history' &&
        (envelope.payload as Record<string, unknown>)?.workbenchId === workbenchId
      ) {
        const messages = ((envelope.payload as Record<string, unknown>)?.messages ?? []) as Array<Record<string, unknown>>;
        setHistoryEntries(
          messages.slice(0, 20).map((m) => ({
            role: (typeof m.role === 'string' ? m.role : 'unknown'),
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? ''),
            timestamp: (typeof m.timestamp === 'string' ? m.timestamp : typeof m.created_at === 'string' ? m.created_at : undefined),
          }))
        );
        setHistoryLoading(false);
      }
    });
    return unsub;
  }, [workbenchId]);

  const statusLabel = getStatusLabel(sessionStatus, workbenchLabel);

  return (
    <div className={cn('h-10 flex items-center justify-between px-3 bg-surface-2 border-b border-border shrink-0', className)}>
      {/* Left side: status dot + label */}
      <div className="flex items-center gap-2">
        <StatusDot status={sessionStatus} size="md" />
        <span className="text-caption font-semibold">{statusLabel}</span>
      </div>

      {/* Right side: history dropdown + overflow menu */}
      <div className="flex items-center gap-1">
        {/* Session history dropdown (CHAT-07) */}
        <DropdownMenu onOpenChange={handleHistoryOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Session history">
                    <History className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Session history</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end" className="w-[280px] max-h-[320px] overflow-y-auto">
            <DropdownMenuLabel className="text-caption font-semibold">Session History</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {historyLoading ? (
              <DropdownMenuItem disabled className="justify-center text-text-muted">
                Loading...
              </DropdownMenuItem>
            ) : historyEntries.length === 0 ? (
              <DropdownMenuItem disabled className="justify-center text-text-muted">
                No previous sessions
              </DropdownMenuItem>
            ) : (
              historyEntries.map((entry, index) => (
                <DropdownMenuItem key={index} className="flex items-start gap-2 cursor-default">
                  <Badge variant={entry.role === 'user' ? 'default' : 'accent'} size="sm" className="shrink-0 mt-0.5">
                    {entry.role === 'user' ? 'user' : 'agent'}
                  </Badge>
                  <span className="text-caption text-text-dim truncate">
                    {truncateText(entry.content, 60)}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Overflow menu */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Chat panel options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
