/**
 * ScheduledTaskDialog — Stub for Task 2 compilation. Full implementation in Task 3.
 */

import type { ScheduledTask } from '@afw/shared';
import type { WorkbenchId } from '@/lib/types';

export interface ScheduledTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: ScheduledTask | null;
  workbenchId: WorkbenchId;
  onSaved: () => void;
}

export function ScheduledTaskDialog(_props: ScheduledTaskDialogProps) {
  return null;
}
