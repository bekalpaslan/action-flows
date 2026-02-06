#!/usr/bin/env node

/**
 * PreToolUse Hook - afw-step-spawned
 *
 * Triggered when Claude Code is about to spawn a subagent step.
 * Receives hook data via stdin and posts a StepSpawnedEvent to the backend.
 *
 * Receives:
 * {
 *   "session_id": "abc123",
 *   "tool_name": "Task",
 *   "tool_input": {
 *     "description": "Step 3: Review changes",
 *     "prompt": "Read .../actions/review/agent.md...",
 *     "model": "sonnet"
 *   }
 * }
 *
 * Behavior:
 * - Extracts sessionId from session_id field
 * - Extracts action name from prompt (regex: /\.\/actions\/([a-z\-]+)\/|actions\/([a-z\-]+)\//i)
 * - Extracts model from tool_input.model
 * - Extracts description from tool_input.description
 * - Parses stepNumber from description (nullable if not found)
 * - POSTs to backend /api/events endpoint as StepSpawnedEvent
 * - Exits with code 0 regardless of POST success (silent failure)
 */

import { readSettings } from './utils/settings';
import { postEvent } from './utils/http';
import { brandedTypes, StepSpawnedEvent } from '@afw/shared';

/**
 * Hook data format received from Claude Code (PreToolUse event)
 */
interface HookData {
  session_id: string;
  tool_name: string;
  tool_input: {
    description?: string;
    prompt?: string;
    model?: string;
    [key: string]: unknown;
  };
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
    typeof obj.tool_name === 'string' &&
    typeof obj.tool_input === 'object' &&
    obj.tool_input !== null
  );
}

/**
 * Extracts action name from prompt text
 * Looks for patterns like "./../actions/review/" or "actions/code/"
 */
function extractActionFromPrompt(prompt: string): string | null {
  if (!prompt || typeof prompt !== 'string') {
    return null;
  }

  // Match patterns like "./actions/{action}/" or "actions/{action}/" or ".../actions/{action}/"
  const matches = prompt.match(/\.?\.?\.?\/actions\/([a-z\-]+)\//i);
  if (matches && matches[1]) {
    return matches[1];
  }

  // Fallback: look for "actions/{action}/" anywhere
  const fallbackMatches = prompt.match(/actions\/([a-z\-]+)\//i);
  if (fallbackMatches && fallbackMatches[1]) {
    return fallbackMatches[1];
  }

  return null;
}

/**
 * Extracts step number from description text
 * Looks for patterns like "Step 1", "Step 2", etc.
 * Returns null if not found
 */
function extractStepNumberFromDescription(description?: string): number | null {
  if (!description || typeof description !== 'string') {
    return null;
  }

  // Match patterns like "Step 1:", "Step 2 -", "Step 3 :", etc.
  const matches = description.match(/^Step\s+(\d+)/i);
  if (matches && matches[1]) {
    const num = parseInt(matches[1], 10);
    return !isNaN(num) ? num : null;
  }

  return null;
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

    // Read settings (returns defaults if not available)
    const settings = readSettings();

    // Extract fields from hook data
    const prompt = hookData.tool_input.prompt as string | undefined;
    const model = (hookData.tool_input.model as string | undefined) || undefined;
    const description = (hookData.tool_input.description as string | undefined) || undefined;

    // Extract action from prompt
    const action = extractActionFromPrompt(prompt || '');

    // Extract step number from description (nullable)
    const stepNumber = extractStepNumberFromDescription(description);

    // If we don't have a step number, we can't create a valid event
    // (StepSpawnedEvent requires stepNumber in the automatic fields)
    // Use 0 as placeholder or skip posting
    const finalStepNumber = stepNumber !== null ? stepNumber : 0;

    // Build StepSpawnedEvent
    const event: StepSpawnedEvent = {
      type: 'step:spawned',
      sessionId: brandedTypes.sessionId(hookData.session_id),
      timestamp: brandedTypes.currentTimestamp(),
      user: settings.user,
      stepNumber: brandedTypes.stepNumber(finalStepNumber),
      action: action,
      model: (model as any) || undefined,
      description: description,
      inputs: undefined, // Not available from this hook
      waitsFor: undefined, // Not available from this hook
    };

    // POST event to backend
    const posted = await postEvent(settings.backendUrl, event);

    if (!posted) {
      console.error('Failed to post StepSpawnedEvent to backend');
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
