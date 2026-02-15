/**
 * useSlackConfig Hook
 *
 * Manages Slack notification configuration state and API interactions.
 * Provides methods to get/update config, test connection, and view history.
 */

import { useState, useEffect, useCallback } from 'react';
import type { SlackConfig } from '@afw/shared';
import { DEFAULT_SLACK_CONFIG } from '@afw/shared';

const API_BASE = 'http://localhost:3001/api/surfaces/slack';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'testing';

export interface UseSlackConfigReturn {
  /** Current Slack configuration */
  config: SlackConfig;

  /** Whether config is being loaded */
  isLoading: boolean;

  /** Error message if any */
  error: string | null;

  /** Update configuration */
  updateConfig: (config: Partial<SlackConfig>) => Promise<void>;

  /** Test Slack connection */
  testConnection: () => Promise<void>;

  /** Connection status */
  connectionStatus: ConnectionStatus;

  /** Refresh configuration from server */
  refresh: () => Promise<void>;
}

/**
 * Hook for managing Slack notification configuration
 */
export function useSlackConfig(): UseSlackConfigReturn {
  const [config, setConfig] = useState<SlackConfig>(DEFAULT_SLACK_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  /**
   * Fetch current configuration from backend
   */
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/notifications/config`);
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      }
      const data = await response.json();
      setConfig(data);

      // Update connection status based on config
      if (data.enabled) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update configuration on backend
   */
  const updateConfig = useCallback(async (updates: Partial<SlackConfig>) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/notifications/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update config: ${response.statusText}`);
      }

      const data = await response.json();
      setConfig(data);

      // Update connection status
      if (data.enabled) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    }
  }, []);

  /**
   * Test Slack connection
   * Sends a test notification to verify MCP integration
   */
  const testConnection = useCallback(async () => {
    setConnectionStatus('testing');
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/notifications/chain-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chainTitle: 'Slack Connection Test',
          steps: 1,
          status: 'success',
          logPath: '/test/connection.md',
        }),
      });

      if (response.status === 204) {
        // Notification was filtered out (notifications disabled)
        setConnectionStatus('disconnected');
        setError('Notifications are disabled');
        return;
      }

      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.statusText}`);
      }

      // Successfully prepared notification
      const notification = await response.json();
      console.log('[Slack] Test notification prepared:', notification);

      setConnectionStatus('connected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection test failed';
      setError(message);
      setConnectionStatus('error');
      throw err;
    }
  }, []);

  /**
   * Refresh configuration from server
   */
  const refresh = useCallback(() => fetchConfig(), [fetchConfig]);

  // Fetch config on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    testConnection,
    connectionStatus,
    refresh,
  };
}
