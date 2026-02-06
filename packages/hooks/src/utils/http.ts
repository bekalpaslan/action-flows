/**
 * HTTP utility for making POST requests to backend
 * Handles silent failures (exits with code 0)
 */

import type { WorkspaceEvent } from '@afw/shared';

/**
 * POSTs an event to the backend API
 * @param backendUrl - Base URL of the backend
 * @param event - Event to POST (any WorkspaceEvent type)
 * @returns true if successful, false if failed (but doesn't throw)
 */
export async function postEvent(backendUrl: string, event: WorkspaceEvent): Promise<boolean> {
  try {
    const url = `${backendUrl.replace(/\/$/, '')}/api/events`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      console.error(`Failed to post event: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    // Silent failure - log for debugging but don't throw
    if (error instanceof Error) {
      console.error(`Error posting event: ${error.message}`);
    } else {
      console.error('Unknown error posting event');
    }
    return false;
  }
}
