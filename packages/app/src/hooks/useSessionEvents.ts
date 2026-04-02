import { useEffect } from 'react';
import { wsClient } from '../lib/ws-client';
import { useSessionStore } from '../stores/sessionStore';
import type { WSEnvelope } from '@afw/shared';
import type { WorkbenchId } from '../lib/types';

/**
 * Subscribe to session lifecycle events on the _system WebSocket channel.
 * Maps session:status events to sessionStore updates.
 * Call ONCE in AppShell (not per-component).
 */
export function useSessionEvents(): void {
  const updateSession = useSessionStore((s) => s.updateSession);

  useEffect(() => {
    const unsub = wsClient.subscribe('_system', (envelope: WSEnvelope) => {
      if (envelope.type !== 'session:status') return;

      const payload = envelope.payload as {
        workbenchId: string;
        sessionId: string | null;
        status: string;
        startedAt: string | null;
        lastActivity: string | null;
        error: string | null;
      };

      if (!payload?.workbenchId) return;

      const workbenchId = payload.workbenchId as WorkbenchId;

      updateSession(workbenchId, {
        sessionId: payload.sessionId,
        status: payload.status as 'stopped' | 'connecting' | 'idle' | 'running' | 'suspended' | 'error',
        startedAt: payload.startedAt,
        lastActivity: payload.lastActivity,
        error: payload.error,
      });

      // Auto-expand panel on first session activity (per UI-SPEC)
      // Read collapsed state via getState() to avoid re-subscription churn
      const { statusPanelCollapsed, setStatusPanelCollapsed } = useSessionStore.getState();
      if (statusPanelCollapsed && (payload.status === 'connecting' || payload.status === 'idle' || payload.status === 'running')) {
        setStatusPanelCollapsed(false);
      }
    });

    // Subscribe to _system channel on the backend hub
    wsClient.subscribeChannel('_system');

    return () => {
      unsub();
      wsClient.unsubscribeChannel('_system');
    };
  }, [updateSession]);
}
