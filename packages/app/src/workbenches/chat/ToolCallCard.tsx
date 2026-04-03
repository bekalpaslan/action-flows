import { useState } from 'react';
import {
  ChevronRight,
  Pencil,
  FileEdit,
  FileText,
  Terminal,
  FolderSearch,
  Search,
  Globe,
  Download,
  ListTodo,
  Wrench,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCall } from '@/lib/chat-types';
import type { LucideIcon } from 'lucide-react';

/**
 * Icon mapping from tool name to Lucide icon per UI-SPEC Tool Icon Mapping.
 */
const TOOL_ICONS: Record<string, LucideIcon> = {
  Edit: Pencil,
  Write: FileEdit,
  Read: FileText,
  Bash: Terminal,
  Glob: FolderSearch,
  Grep: Search,
  WebSearch: Globe,
  WebFetch: Download,
  TodoWrite: ListTodo,
};

export interface ToolCallCardProps {
  toolCall: ToolCall;
  className?: string;
}

/**
 * Collapsible tool call card displaying tool name, icon, status, and
 * expandable input/output detail. Supports running, complete, and error states.
 */
export function ToolCallCard({ toolCall, className }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Icon selection based on status
  let Icon: LucideIcon;
  let iconClassName = 'h-4 w-4 shrink-0';

  if (toolCall.status === 'running') {
    Icon = Loader2;
    iconClassName = cn(iconClassName, 'animate-spin text-accent');
  } else if (toolCall.status === 'error') {
    Icon = AlertCircle;
    iconClassName = cn(iconClassName, 'text-destructive');
  } else {
    Icon = TOOL_ICONS[toolCall.name] ?? Wrench;
    iconClassName = cn(iconClassName, 'text-text-dim');
  }

  // Summary text based on status
  let summary: string;
  if (toolCall.status === 'running') {
    summary = 'Running...';
  } else if (toolCall.status === 'error') {
    const errorMsg = toolCall.output ?? 'Unknown error';
    summary = errorMsg.length > 80 ? errorMsg.slice(0, 80) + '...' : errorMsg;
  } else {
    const outputText = toolCall.output ?? '';
    summary = outputText.length > 80 ? outputText.slice(0, 80) + '...' : outputText;
  }

  const handleToggle = () => setExpanded((prev) => !prev);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className={cn(
        'bg-surface-2 border rounded-md my-2',
        expanded ? 'border-border-strong' : 'border-border',
        className
      )}
    >
      {/* Header row - always visible */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${toolCall.name} tool call - click to expand`}
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-3/50 rounded-t-md"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <Icon className={iconClassName} />
        <span className="text-caption font-semibold">{toolCall.name}</span>
        <span className="text-caption text-text-dim truncate flex-1">
          {summary}
        </span>
        <ChevronRight
          className={cn(
            'h-4 w-4 shrink-0 text-text-dim transition-transform duration-150',
            expanded && 'rotate-90'
          )}
        />
      </div>

      {/* Expanded content - lazy rendered */}
      {expanded && (
        <div className="px-3 py-3 border-t border-border max-h-96 overflow-y-auto animate-slide-in-bottom">
          <div className="mb-2">
            <span className="text-caption font-semibold text-text-dim">Input</span>
            <pre className="mt-1 bg-surface-3 rounded-md p-2 text-caption font-mono overflow-x-auto max-h-48 overflow-y-auto">
              {formatJson(toolCall.input)}
            </pre>
          </div>
          <div>
            <span className="text-caption font-semibold text-text-dim">Output</span>
            <pre className="mt-1 bg-surface-3 rounded-md p-2 text-caption font-mono overflow-x-auto max-h-48 overflow-y-auto">
              {toolCall.output ?? 'No output yet'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Attempt to pretty-print JSON string. Falls back to raw string if invalid.
 */
function formatJson(input: string): string {
  try {
    return JSON.stringify(JSON.parse(input), null, 2);
  } catch {
    return input;
  }
}
