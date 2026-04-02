import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { wsClient } from '../lib/ws-client';
import type { WSEnvelope } from '@afw/shared';

/**
 * Fire sonner toasts on session lifecycle events.
 * Uses deduplication via sonner's `id` parameter (per UI-SPEC Toast Deduplication).
 * Call ONCE in AppShell (not per-component).
 */
export function useSessionToasts(): void {
  // Track last toast time per workbench+event to debounce within 2s
  const lastToast = useRef(new Map<string, number>());

  useEffect(() => {
    const unsub = wsClient.subscribe('_system', (envelope: WSEnvelope) => {
      if (envelope.type !== 'session:status') return;

      const payload = envelope.payload as {
        workbenchId: string;
        status: string;
        error: string | null;
        description?: string;
      };
      if (!payload?.workbenchId) return;

      const { workbenchId, status, error } = payload;
      const label = workbenchId.charAt(0).toUpperCase() + workbenchId.slice(1);
      const dedupeKey = `${workbenchId}-${status}`;

      // Dedup: skip if same event within 2s (per UI-SPEC)
      const now = Date.now();
      const last = lastToast.current.get(dedupeKey) ?? 0;
      if (now - last < 2000) return;
      lastToast.current.set(dedupeKey, now);

      switch (status) {
        case 'idle': {
          // Connected event (idle means session is alive)
          toast.success(`${label} agent connected`, {
            id: `${workbenchId}-connected`,
            description: 'New session started.',
            duration: 4000,
          });
          // Dismiss any lingering disconnect toast
          toast.dismiss(`${workbenchId}-disconnected`);
          break;
        }
        case 'error': {
          const errorMsg = error && error.length > 0
            ? (error.length > 120 ? error.substring(0, 120) + '...' : error)
            : 'An unexpected error occurred. Check session logs for details.';
          toast.error(`${label} agent error`, {
            id: `${workbenchId}-error`,
            description: errorMsg,
            duration: 8000,
          });
          break;
        }
        case 'stopped': {
          toast.info(`${label} agent stopped`, {
            id: `${workbenchId}-stopped`,
            description: 'Session terminated by user.',
            duration: 3000,
          });
          break;
        }
        case 'suspended': {
          toast.info(`${label} session suspended`, {
            id: `${workbenchId}-suspended`,
            description: 'Session will close in ~30s.',
            duration: 3000,
          });
          break;
        }
        // 'connecting' and 'running' do not trigger toasts (per UI-SPEC)
      }
    });

    return unsub;
  }, []);
}
