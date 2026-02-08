#!/usr/bin/env node
/**
 * ActionFlows Dashboard - Session End Hook
 *
 * Hook: SessionEnd
 * Purpose: Notify backend when Claude Code session ends
 *
 * This hook fires when a Claude Code session ends. It:
 * 1. Extracts session ID and duration
 * 2. POSTs SessionEndedEvent to backend
 * 3. Triggers backend cleanup (save to JSON, clear Redis)
 * 4. Exits with code 0 (silent failure mode)
 *
 * This enables the Dashboard to finalize session state and free resources.
 */

import * as fs from 'fs';
import { readSettings } from './utils/settings.js';
import { postEvent } from './utils/http.js';
import { brandedTypes, duration, SessionEndedEvent } from '@afw/shared';

// Configuration
const ENABLED = process.env.AFW_ENABLED !== 'false';

interface SessionEndHookInput {
  session_id: string;
  duration_ms?: number;
  reason?: string;
}

/**
 * Reads stdin until EOF
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data);
    });

    process.stdin.on('error', (error) => {
      reject(error);
    });

    // Set a timeout in case stdin never closes
    setTimeout(() => {
      if (!data) {
        reject(new Error('Timeout waiting for stdin'));
      }
    }, 5000);
  });
}

async function main() {
  if (!ENABLED) {
    process.exit(0); // Silently pass through when disabled
  }

  try {
    // Read hook input from stdin
    const inputData = await readStdin();
    const hookInput: SessionEndHookInput = JSON.parse(inputData);

    const sessionId = hookInput.session_id;
    const durationMs = hookInput.duration_ms;
    const reason = hookInput.reason;

    // Read settings
    const settings = readSettings();

    // Build SessionEndedEvent
    const event: SessionEndedEvent = {
      type: 'session:ended',
      sessionId: brandedTypes.sessionId(sessionId),
      timestamp: brandedTypes.currentTimestamp(),
      user: settings.user,
      duration: durationMs ? duration.ms(durationMs) : undefined,
      reason: reason,
      summary: undefined, // Not available from this hook
      totalStepsExecuted: undefined, // Backend will compute from stored events
      totalChainsCompleted: undefined, // Backend will compute from stored events
    };

    // POST event to backend
    const posted = await postEvent(settings.backendUrl, event);

    if (!posted) {
      console.error('[AFW] Failed to post SessionEndedEvent to backend');
    } else {
      console.log(`[AFW] Session ended: ${sessionId}`);
    }

    // Always exit with code 0 (silent failure mode)
    process.exit(0);
  } catch (error) {
    // Silent failure - log error but exit cleanly
    console.error('Session end hook error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(0);
  }
}

main();
