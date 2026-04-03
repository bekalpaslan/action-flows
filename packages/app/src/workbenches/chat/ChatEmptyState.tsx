import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatEmptyStateProps {
  connected: boolean;
  workbenchLabel: string;
  className?: string;
}

/**
 * Empty state for chat panel. Shows connected or disconnected variant
 * with appropriate messaging (per UI-SPEC Copywriting Contract).
 */
export function ChatEmptyState({ connected, workbenchLabel, className }: ChatEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center h-full gap-3 px-4', className)}>
      <MessageSquare className="h-8 w-8 text-text-muted" />
      <h3 className="text-body font-semibold text-text">
        {connected ? 'Start a conversation' : 'No active session'}
      </h3>
      <p className="text-caption text-text-dim max-w-xs text-center">
        {connected
          ? `Send a message to your ${workbenchLabel} agent. It can help you with code, answer questions, and execute tasks in your workspace.`
          : `Start a session from the status panel (Ctrl+Shift+S) to begin chatting with your ${workbenchLabel} agent.`}
      </p>
    </div>
  );
}
