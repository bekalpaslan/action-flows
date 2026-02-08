#!/usr/bin/env node
/**
 * ActionFlows Dashboard - Session Start Hook
 *
 * Hook: SessionStart
 * Purpose: Register session with backend when Claude Code session begins
 *
 * This hook fires when a new Claude Code session starts. It:
 * 1. Extracts session ID and working directory
 * 2. Detects user from settings or environment
 * 3. POSTs SessionStartedEvent to backend
 * 4. Exits with code 0 (silent failure mode)
 *
 * This enables the Dashboard to track all active sessions.
 */

import * as fs from 'fs';
import * as os from 'os';
import { readSettings } from './utils/settings.js';
import { postEvent } from './utils/http.js';
import { brandedTypes, SessionStartedEvent } from '@afw/shared';

// Configuration
const ENABLED = process.env.AFW_ENABLED !== 'false';

interface SessionStartHookInput {
  session_id: string;
  cwd: string;
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
    const hookInput: SessionStartHookInput = JSON.parse(inputData);

    const sessionId = hookInput.session_id;
    const cwd = hookInput.cwd;

    // Read settings
    const settings = readSettings();

    // Get system info
    const hostname = os.hostname();
    const platform = os.platform();

    // Build SessionStartedEvent
    const event: SessionStartedEvent = {
      type: 'session:started',
      sessionId: brandedTypes.sessionId(sessionId),
      timestamp: brandedTypes.currentTimestamp(),
      user: settings.user,
      cwd: cwd,
      hostname: hostname,
      platform: platform,
    };

    // POST event to backend
    const posted = await postEvent(settings.backendUrl, event);

    if (!posted) {
      console.error('[AFW] Failed to post SessionStartedEvent to backend');
    } else {
      console.log(`[AFW] Session started: ${sessionId} in ${cwd}`);
    }

    // Always exit with code 0 (silent failure mode)
    process.exit(0);
  } catch (error) {
    // Silent failure - log error but exit cleanly
    console.error('Session start hook error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(0);
  }
}

main();
