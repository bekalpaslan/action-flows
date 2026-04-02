import { Loader2, Circle, Pause, AlertCircle, Square } from 'lucide-react';
import { StatusDot } from '@/components/ui/status-dot';
import { Badge } from '@/components/ui/badge';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import { SessionControls } from './SessionControls';
import { WORKBENCHES } from '@/lib/types';
import type { WorkbenchSession, SessionStatus } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';

export interface AgentStatusRowProps {
  session: WorkbenchSession;
}

/** Map session status to Badge variant */
function badgeVariant(status: SessionStatus) {
  switch (status) {
    case 'running': return 'accent' as const;
    case 'idle': return 'success' as const;
    case 'connecting': return 'warning' as const;
    case 'error': return 'error' as const;
    case 'suspended':
    case 'stopped':
    default: return 'default' as const;
  }
}

/** Status display text */
function statusText(status: SessionStatus): string {
  switch (status) {
    case 'running': return 'Running';
    case 'idle': return 'Idle';
    case 'suspended': return 'Suspended';
    case 'connecting': return 'Connecting...';
    case 'error': return 'Error';
    case 'stopped': return 'Stopped';
  }
}

/** Status icon component per UI-SPEC Session Status Colors table */
function StatusIcon({ status }: { status: SessionStatus }) {
  const iconSize = 'h-3.5 w-3.5';
  switch (status) {
    case 'running':
      return <Loader2 className={cn(iconSize, 'animate-spin text-accent')} />;
    case 'idle':
      return <Circle className={cn(iconSize, 'text-success')} />;
    case 'suspended':
      return <Pause className={cn(iconSize, 'text-text-muted')} />;
    case 'error':
      return <AlertCircle className={cn(iconSize, 'text-destructive')} />;
    case 'connecting':
      return <Loader2 className={cn(iconSize, 'animate-spin text-warning')} />;
    case 'stopped':
      return <Square className={cn(iconSize, 'text-text-muted')} />;
  }
}

/**
 * Format elapsed milliseconds to human-readable string.
 * "12s" (< 60s), "1m 23s" (< 60m), "2h 10m" (>= 60m), "--" for null
 */
function formatElapsed(ms: number | null): string {
  if (ms === null) return '--';
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Single workbench session row in the AgentStatusPanel table.
 * Shows workbench name, status indicator, elapsed time, and start/stop controls.
 */
export function AgentStatusRow({ session }: AgentStatusRowProps) {
  const { workbenchId, status, startedAt } = session;
  const isActive = status === 'running' || status === 'idle';
  const elapsed = useElapsedTime(startedAt, isActive);

  const meta = WORKBENCHES.find((w) => w.id === workbenchId);
  const Icon = meta?.icon;
  const label = meta?.label ?? workbenchId.charAt(0).toUpperCase() + workbenchId.slice(1);

  return (
    <tr
      className={cn(
        'h-10 border-b border-border',
        'transition-colors duration-150',
        'hover:bg-surface-2'
      )}
      aria-label={`${label} agent, status: ${statusText(status)}`}
    >
      {/* Agent column */}
      <td className="px-3 min-w-[120px]">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-text-dim shrink-0" />}
          <span className="text-caption font-semibold truncate">{label}</span>
        </div>
      </td>

      {/* Status column */}
      <td className="px-3 w-[100px]">
        <div className="flex items-center gap-2">
          <StatusDot status={status} size="md" />
          <StatusIcon status={status} />
          <Badge variant={badgeVariant(status)} size="sm">
            {statusText(status)}
          </Badge>
        </div>
      </td>

      {/* Elapsed column */}
      <td className="px-3 w-[80px]">
        <span className="text-caption font-mono text-text-dim">
          {formatElapsed(elapsed)}
        </span>
      </td>

      {/* Actions column */}
      <td className="px-3 w-[80px]">
        <SessionControls workbenchId={workbenchId} status={status} />
      </td>
    </tr>
  );
}
