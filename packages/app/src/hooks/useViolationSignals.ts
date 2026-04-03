import { useEffect, createElement } from 'react';
import { toast } from 'sonner';
import { wsClient } from '@/lib/ws-client';
import { useValidationStore } from '@/stores/validationStore';
import { ViolationToast } from '@/components/ViolationToast';
import type { WSEnvelope, ViolationSignal, ViolationSeverity } from '@afw/shared';
import type { WorkbenchId } from '@/lib/types';

const SEVERITY_DURATION: Record<ViolationSeverity, number> = {
  critical: Infinity,
  warning: 8000,
  info: 5000,
};

function handleViolationEnvelope(
  envelope: WSEnvelope,
  workbenchId: WorkbenchId
): void {
  if (envelope.type !== 'validation:violation') return;

  const violation = envelope.payload as ViolationSignal;
  useValidationStore.getState().addViolation(workbenchId, violation);

  toast.custom(
    (id) => createElement(ViolationToast, { violation, toastId: id }),
    {
      duration: SEVERITY_DURATION[violation.severity],
      id: violation.id,
    }
  );
}

/**
 * Subscribes to WebSocket validation:violation events and shows severity-colored
 * sonner toasts. Violations are stored per-workbench in validationStore.
 *
 * Critical violations persist until dismissed. Warning auto-dismiss after 8s.
 * Info auto-dismiss after 5s.
 */
export function useViolationSignals(workbenchId: WorkbenchId): void {
  useEffect(() => {
    const handler = (envelope: WSEnvelope) => {
      handleViolationEnvelope(envelope, workbenchId);
    };

    // Subscribe to workbench-specific channel
    const unsubWorkbench = wsClient.subscribe(workbenchId, handler);

    // Subscribe to system channel for system-wide violation broadcasts
    const unsubSystem = wsClient.subscribe('_system', handler);

    return () => {
      unsubWorkbench();
      unsubSystem();
    };
  }, [workbenchId]);
}
