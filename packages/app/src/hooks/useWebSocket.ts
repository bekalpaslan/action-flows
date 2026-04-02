import { useEffect } from 'react';
import { wsClient } from '../lib/ws-client';
import { useWSStore } from '../stores/wsStore';
import { useUIStore } from '../stores/uiStore';

/**
 * Root-level hook that manages WebSocket connection lifecycle.
 * Call ONCE in AppShell -- not per-component.
 */
export function useWebSocket(): void {
  const setStatus = useWSStore((s) => s.setStatus);
  const addChannel = useWSStore((s) => s.addChannel);
  const removeChannel = useWSStore((s) => s.removeChannel);
  const activeWorkbench = useUIStore((s) => s.activeWorkbench);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    wsClient.connect();
    const unsub = wsClient.onStatusChange(setStatus);
    return () => { unsub(); wsClient.disconnect(); };
  }, [setStatus]);

  // Subscribe to active workbench channel when it changes
  useEffect(() => {
    wsClient.subscribeChannel(activeWorkbench);
    addChannel(activeWorkbench);
    return () => {
      wsClient.unsubscribeChannel(activeWorkbench);
      removeChannel(activeWorkbench);
    };
  }, [activeWorkbench, addChannel, removeChannel]);
}
