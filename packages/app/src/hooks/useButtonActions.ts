/**
 * Hook for routing button actions
 * Handles command queue dispatch, API calls, quick actions, clipboard operations, and navigation
 * Integrates with the button system (SRD Section 2.3)
 */

import { useCallback } from 'react';
import type { ButtonDefinition, ButtonAction, SessionId } from '@afw/shared';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface UseButtonActionsResult {
  /** Execute a button's action */
  executeAction: (button: ButtonDefinition) => Promise<void>;
  /** Track button usage (calls toolbar API) */
  trackUsage: (buttonId: string, projectId: string) => Promise<void>;
}

/**
 * Hook that routes button clicks to appropriate handlers.
 *
 * Action routing:
 * - 'command': Dispatch to command queue via command API
 * - 'api-call': Make HTTP request to specified endpoint
 * - 'quick-action': Trigger quick action via quick-actions API
 * - 'clipboard': Copy payload to clipboard
 * - 'navigate': Use router navigation (placeholder for future routing)
 * - 'custom': Log warning (custom handlers not yet implemented)
 */
export function useButtonActions(sessionId: SessionId): UseButtonActionsResult {
  const executeAction = useCallback(
    async (button: ButtonDefinition) => {
      const { action } = button;

      try {
        switch (action.type) {
          case 'command':
            await executeCommandAction(action, sessionId);
            break;

          case 'api-call':
            await executeApiCallAction(action);
            break;

          case 'quick-action':
            await executeQuickActionAction(action, sessionId);
            break;

          case 'clipboard':
            await executeClipboardAction(action);
            break;

          case 'navigate':
            await executeNavigateAction(action);
            break;

          case 'custom':
            console.warn(`[useButtonActions] Custom action not implemented:`, {
              button,
              sessionId,
            });
            break;

          default:
            const exhaustiveCheck: never = action.type;
            console.warn(`[useButtonActions] Unknown action type:`, exhaustiveCheck);
        }
      } catch (error) {
        console.error(`[useButtonActions] Action failed:`, error);
        throw error;
      }
    },
    [sessionId]
  );

  const trackUsage = useCallback(
    async (buttonId: string, projectId: string) => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/toolbar/${projectId}/track`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ buttonId, sessionId }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to track button usage: ${response.status}`);
        }

        console.log(`[useButtonActions] Usage tracked for button: ${buttonId}`);
      } catch (error) {
        // Non-critical, just log warning
        console.warn(`[useButtonActions] Failed to track usage:`, error);
      }
    },
    [sessionId]
  );

  return { executeAction, trackUsage };
}

/**
 * Execute a command action by sending to the command queue API
 */
async function executeCommandAction(
  action: ButtonAction,
  sessionId: SessionId
): Promise<void> {
  if (!action.commandType) {
    throw new Error('Command action missing commandType');
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/sessions/${sessionId}/commands`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: action.commandType,
          payload: action.payload,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Command failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log(
      `[useButtonActions] Command queued: ${action.commandType}`,
      result.commandId
    );
  } catch (error) {
    console.error(`[useButtonActions] Command action failed:`, error);
    throw error;
  }
}

/**
 * Execute an API call action by making an HTTP request
 */
async function executeApiCallAction(action: ButtonAction): Promise<void> {
  if (!action.endpoint) {
    throw new Error('API call action missing endpoint');
  }

  try {
    const response = await fetch(action.endpoint, {
      method: action.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: action.payload ? JSON.stringify(action.payload) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json().catch(() => ({}));
    console.log(`[useButtonActions] API call success: ${action.endpoint}`, result);
  } catch (error) {
    console.error(`[useButtonActions] API call failed:`, error);
    throw error;
  }
}

/**
 * Execute a quick action by calling the quick-actions API
 */
async function executeQuickActionAction(
  action: ButtonAction,
  sessionId: SessionId
): Promise<void> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/sessions/${sessionId}/quick-actions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Quick action failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log(`[useButtonActions] Quick action executed:`, result);
  } catch (error) {
    console.error(`[useButtonActions] Quick action failed:`, error);
    throw error;
  }
}

/**
 * Execute a clipboard action by copying text to clipboard
 */
async function executeClipboardAction(action: ButtonAction): Promise<void> {
  const text = action.payload?.text;

  if (!text) {
    throw new Error('Clipboard action missing text payload');
  }

  try {
    await navigator.clipboard.writeText(String(text));
    console.log(`[useButtonActions] Copied to clipboard:`, text);
  } catch (error) {
    console.error(`[useButtonActions] Failed to copy to clipboard:`, error);
    throw error;
  }
}

/**
 * Execute a navigate action
 * Currently logs to console - integration with router will happen in future step
 */
async function executeNavigateAction(action: ButtonAction): Promise<void> {
  const target = action.payload?.target || action.target;

  if (!target) {
    throw new Error('Navigate action missing target');
  }

  console.log(`[useButtonActions] Navigate to: ${target}`, action.payload);

  // TODO: Integrate with React Router when navigation system is implemented
  // const navigate = useNavigate();
  // navigate(target, { state: action.payload });
}
