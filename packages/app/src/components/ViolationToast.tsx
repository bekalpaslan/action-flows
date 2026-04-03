import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ViolationSignal, ViolationSeverity } from '@afw/shared';

interface ViolationToastProps {
  violation: ViolationSignal;
  toastId: string | number;
}

const SEVERITY_BORDER: Record<ViolationSeverity, string> = {
  critical: 'border-destructive',
  warning: 'border-warning',
  info: 'border-info',
};

const SEVERITY_BADGE_VARIANT: Record<ViolationSeverity, 'error' | 'warning' | 'default'> = {
  critical: 'error',
  warning: 'warning',
  info: 'default',
};

const SEVERITY_TITLE: Record<ViolationSeverity, string> = {
  critical: 'Design System Violation',
  warning: 'Design System Warning',
  info: 'Style Suggestion',
};

export function ViolationToast({ violation }: ViolationToastProps) {
  return (
    <div
      className={cn(
        'border-l-[3px] bg-surface-2 p-3 rounded-md',
        SEVERITY_BORDER[violation.severity]
      )}
    >
      <div className="flex flex-col gap-1">
        {/* Row 1: Badge + rule name */}
        <div className="flex items-center gap-2">
          <Badge variant={SEVERITY_BADGE_VARIANT[violation.severity]} size="sm">
            {SEVERITY_TITLE[violation.severity]}
          </Badge>
          <span className="text-body font-semibold text-text truncate">
            {violation.rule}
          </span>
        </div>

        {/* Row 2: Description */}
        <p className="text-caption text-text-dim">
          {violation.description}
        </p>

        {/* Row 3: File path and line */}
        <span className="text-caption font-mono text-text-muted">
          {violation.filePath}:{violation.line}
        </span>
      </div>
    </div>
  );
}
