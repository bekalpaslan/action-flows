/**
 * useHealingWatcher — Hook that connects validation/runtime errors
 * to the self-healing pipeline.
 *
 * Subscribes to WebSocket events on the active workbench channel.
 * When a runtime error event arrives, calls POST /api/healing/attempts
 * and surfaces the approval card in chat via the healing store.
 */

import { useEffect, useCallback } from 'react';
import { useHealingStore } from '@/stores/healingStore';
import { wsClient } from '@/lib/ws-client';
import type { WorkbenchId } from '@/lib/types';
import type { WSEnvelope } from '@afw/shared';

/**
 * Watch for runtime/validation errors on the active workbench
 * and trigger healing attempts via the backend API.
 *
 * This hook does NOT render anything — it only manages store state.
 * The ChatPanel reads `pendingApprovalId` from the store to render
 * HealingApprovalCard.
 */
export function useHealingWatcher(workbenchId: WorkbenchId, sessionId: string): void {
  const addPendingApproval = useHealingStore((s) => s.addPendingApproval);

  const handleError = useCallback(
    async (envelope: WSEnvelope) => {
      // Listen for runtime:error or validation:error events
      if (
        envelope.type !== 'runtime:error' &&
        envelope.type !== 'validation:error'
      ) {
        return;
      }

      const payload = envelope.payload as {
        errorMessage?: string;
        errorClass?: string;
        flowId?: string;
      } | undefined;

      if (!payload?.errorMessage || !payload.errorClass) {
        return;
      }

      try {
        const res = await fetch('/api/healing/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errorMessage: payload.errorMessage,
            errorClass: payload.errorClass,
            workbenchId,
            flowId: payload.flowId ?? 'default',
            sessionId,
          }),
        });

        if (res.status === 201) {
          const data = await res.json();
          if (data.success && data.attempt) {
            // Surface the approval card in chat
            // The approval ID is derived from the attempt creation timestamp
            // The backend correlates approval<->attempt via healingApprovalMap
            const approvalId = data.approvalId ?? `approval_${data.attempt.id}`;
            addPendingApproval(data.attempt, approvalId);
          }
        } else if (res.status === 409) {
          // Circuit breaker active — the UI will show CircuitBreakerNotice
          // based on quota state (no action needed here)
          console.log('[useHealingWatcher] Circuit breaker active, skipping healing');
        }
      } catch (err) {
        console.error('[useHealingWatcher] Failed to create healing attempt:', err);
      }
    },
    [workbenchId, sessionId, addPendingApproval]
  );

  useEffect(() => {
    // Subscribe to the workbench channel for runtime error events
    const unsub = wsClient.subscribe(workbenchId, handleError);
    return unsub;
  }, [workbenchId, handleError]);
}
