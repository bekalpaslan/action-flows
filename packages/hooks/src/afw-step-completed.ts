#!/usr/bin/env node

/**
 * SubagentStop Hook - afw-step-completed
 *
 * Triggered when Claude Code completes a subagent step execution.
 * Receives hook data via stdin and posts a StepCompletedEvent to the backend.
 *
 * Receives:
 * {
 *   "session_id": "...",
 *   "agent_id": "...",
 *   "exit_status": "completed" | "error" | "cancelled",
 *   "duration_ms": 12345,
 *   "output": "agent output text"
 * }
 *
 * Behavior:
 * - Extracts automatic fields: sessionId, agentId, exitStatus, durationMs
 * - Parses output to extract: stepNumber, action, result, learning
 * - Maps exit_status to Status enum
 * - POSTs to backend /api/events endpoint
 * - Exits with code 0 regardless of POST success (silent failure)
 */

import { readSettings, validateSettings } from './utils/settings.js';
import { postEvent } from './utils/http.js';
import { parseAgentOutput } from './utils/parser.js';
import { Status, brandedTypes, duration, StepCompletedEvent } from '@afw/shared';

/**
 * Hook data format received from Claude Code
 */
interface HookData {
  session_id: string;
  agent_id: string;
  exit_status: 'completed' | 'error' | 'cancelled';
  duration_ms: number;
  output: string;
}

/**
 * Validates hook data has required fields
 */
function validateHookData(data: unknown): data is HookData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.session_id === 'string' &&
    typeof obj.agent_id === 'string' &&
    (obj.exit_status === 'completed' || obj.exit_status === 'error' || obj.exit_status === 'cancelled') &&
    typeof obj.duration_ms === 'number' &&
    typeof obj.output === 'string'
  );
}

/**
 * Maps hook exit_status to Status enum
 */
function mapExitStatusToStatus(exitStatus: string): string {
  switch (exitStatus) {
    case 'completed':
      return Status.COMPLETED;
    case 'error':
      return Status.FAILED;
    case 'cancelled':
      return Status.SKIPPED;
    default:
      return Status.FAILED;
  }
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

/**
 * Main hook execution
 */
async function main(): Promise<void> {
  try {
    // Read hook data from stdin
    const stdinData = await readStdin();

    // Parse JSON
    let hookData: unknown;
    try {
      hookData = JSON.parse(stdinData);
    } catch (error) {
      console.error('Failed to parse JSON from stdin');
      process.exit(0); // Silent failure
    }

    // Validate hook data
    if (!validateHookData(hookData)) {
      console.error('Invalid hook data format');
      process.exit(0); // Silent failure
    }

    // Read settings
    const settings = readSettings();

    // Parse agent output
    const parsed = parseAgentOutput(hookData.output);

    // Map exit status to Status enum
    const status = mapExitStatusToStatus(hookData.exit_status);

    // Extract step number (try to parse, or use agent_id as fallback)
    const stepNumber = parsed.stepNumber || 1;

    // Build StepCompletedEvent
    const event: StepCompletedEvent = {
      type: 'step:completed',
      sessionId: brandedTypes.sessionId(hookData.session_id),
      timestamp: brandedTypes.currentTimestamp(),
      user: settings.user,
      stepNumber: brandedTypes.stepNumber(stepNumber),
      duration: duration.ms(hookData.duration_ms),
      action: parsed.action,
      status: (status as any),
      result: parsed.result,
      learning: parsed.learning,
      summary: parsed.result,
      succeeded: status === Status.COMPLETED,
      outputLength: hookData.output.length,
    };

    // POST event to backend
    const posted = await postEvent(settings.backendUrl, event);

    if (!posted) {
      console.error('Failed to post event to backend');
    }

    // Always exit with code 0 (silent failure mode)
    process.exit(0);
  } catch (error) {
    // Catch-all error handler - silent failure
    if (error instanceof Error) {
      console.error(`Hook error: ${error.message}`);
    } else {
      console.error('Unknown hook error');
    }
    process.exit(0); // Silent failure
  }
}

// Run the hook
main();
