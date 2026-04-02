import { ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSessionStore } from '@/stores/sessionStore';
import { WORKBENCHES } from '@/lib/types';
import { AgentStatusRow } from './AgentStatusRow';

/**
 * Collapsible status panel showing all 7 workbench agent sessions.
 * Task manager style: table with status, elapsed time, and start/stop controls.
 * Sits inside a Panel in WorkspaceArea.
 */
export function AgentStatusPanel() {
  const sessions = useSessionStore((s) => s.sessions);
  const getSession = useSessionStore((s) => s.getSession);
  const statusPanelCollapsed = useSessionStore((s) => s.statusPanelCollapsed);
  const toggleStatusPanel = useSessionStore((s) => s.toggleStatusPanel);

  const runningCount = useSessionStore((s) => s.getRunningCount());
  const activeCount = useSessionStore((s) => s.getActiveCount());

  // Determine if there are any non-stopped sessions
  const hasActiveSessions = WORKBENCHES.some((w) => {
    const session = sessions.get(w.id);
    return session && session.status !== 'stopped';
  });

  // Count idle sessions (active but not running)
  const idleCount = activeCount - runningCount;

  return (
    <div
      className="flex flex-col h-full bg-surface overflow-hidden"
      role="region"
      aria-label="Agent session status"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between h-8 px-3 bg-surface-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-caption font-semibold">Agent Sessions</span>
          <div className="flex items-center gap-1.5" aria-live="polite">
            {runningCount > 0 && (
              <Badge variant="accent" size="sm">
                {runningCount} running
              </Badge>
            )}
            {idleCount > 0 && (
              <Badge variant="success" size="sm">
                {idleCount} idle
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={toggleStatusPanel}
          aria-label={statusPanelCollapsed ? 'Expand status panel' : 'Collapse status panel'}
        >
          {statusPanelCollapsed ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Table or empty state */}
      <div className="flex-1 overflow-y-auto">
        {hasActiveSessions ? (
          <table className="w-full">
            <thead>
              <tr className="bg-surface-2">
                <th className="px-3 py-1.5 text-left text-caption font-semibold text-text-dim">
                  Agent
                </th>
                <th className="px-3 py-1.5 text-left text-caption font-semibold text-text-dim">
                  Status
                </th>
                <th className="px-3 py-1.5 text-left text-caption font-semibold text-text-dim">
                  Elapsed
                </th>
                <th className="px-3 py-1.5 text-left text-caption font-semibold text-text-dim">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {WORKBENCHES.map((w) => (
                <AgentStatusRow key={w.id} session={getSession(w.id)} />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-6">
            <Bot className="h-6 w-6 text-text-muted" />
            <span className="text-caption font-semibold">No active sessions</span>
            <span className="text-caption text-text-dim text-center max-w-[280px]">
              Start a session from the chat panel or use the controls above to launch an agent
              for any workbench.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
