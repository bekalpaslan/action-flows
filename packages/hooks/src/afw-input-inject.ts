#!/usr/bin/env node
/**
 * ActionFlows Dashboard - Input Injection Hook
 *
 * Hook: Stop
 * Purpose: Automatically inject Dashboard input as systemMessage when Claude pauses
 *
 * This hook fires when Claude finishes responding (Stop event). It:
 * 1. POSTs to /sessions/:id/awaiting to mark session as awaiting input
 * 2. Polls GET /sessions/:id/input with timeout (default: 30s)
 * 3. Returns { systemMessage: "User: {input}" } if input available
 * 4. Returns { systemMessage: "[Awaiting Dashboard input...]" } if timeout
 *
 * STRUCTURAL, NOT BEHAVIORAL: Claude does NOT poll for input - the hook does it automatically.
 */

import * as fs from 'fs';

// Configuration
const BACKEND_URL = process.env.AFW_BACKEND_URL || 'http://localhost:3001';
const POLL_TIMEOUT_MS = parseInt(process.env.AFW_INPUT_TIMEOUT || '30000'); // 30 seconds default

interface StopHookInput {
  message: {
    role: string;
    content: string;
  };
  session_id: string;
  transcript_path?: string;
}

interface HookResponse {
  systemMessage?: string;
}

/**
 * Extracts prompt information from Claude's last message
 * Detects patterns like "Execute?", "Should I proceed?", etc.
 */
function detectPrompt(content: string): { type: string; text: string; quickResponses?: string[] } | null {
  // Chain approval pattern
  if (/Execute\?/i.test(content) && /##\s*Chain:/i.test(content)) {
    return {
      type: 'chain_approval',
      text: 'Execute?',
      quickResponses: ['Yes', 'No', 'Show details'],
    };
  }

  // Binary question patterns
  const binaryPatterns = [
    /Should I (proceed|continue|implement|fix)/i,
    /Would you like (me to|to)/i,
    /(Execute|Continue|Proceed)\?/i,
  ];

  for (const pattern of binaryPatterns) {
    if (pattern.test(content)) {
      const match = content.match(/.{0,100}?\?/); // Get question with context
      return {
        type: 'binary',
        text: match ? match[0] : 'Continue?',
        quickResponses: ['Yes', 'No'],
      };
    }
  }

  // Default text input
  return {
    type: 'text',
    text: 'Awaiting input...',
  };
}

/**
 * Marks session as awaiting input
 */
async function markAwaiting(sessionId: string, prompt: ReturnType<typeof detectPrompt>): Promise<boolean> {
  try {
    const url = `${BACKEND_URL.replace(/\/$/, '')}/api/sessions/${sessionId}/awaiting`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        promptType: prompt?.type || 'text',
        promptText: prompt?.text || 'Awaiting input...',
        quickResponses: prompt?.quickResponses,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`Failed to mark awaiting: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking awaiting:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Polls for pending input with long-polling support
 */
async function pollForInput(sessionId: string, timeoutMs: number): Promise<string | null> {
  try {
    const url = `${BACKEND_URL.replace(/\/$/, '')}/api/sessions/${sessionId}/input?timeout=${timeoutMs}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs + 5000), // Add 5s buffer to timeout
    });

    if (!response.ok) {
      console.error(`Failed to poll input: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json() as Record<string, unknown>;

    if (data.available && data.input) {
      const input = data.input as Record<string, unknown>;
      return (input.input as string) || (data.input as string); // Handle both formats
    }

    return null;
  } catch (error) {
    console.error('Error polling for input:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

async function main() {
  try {
    // Read hook input from stdin
    const inputData = fs.readFileSync(0, 'utf-8');
    const hookInput: StopHookInput = JSON.parse(inputData);

    const sessionId = hookInput.session_id;
    const lastMessage = hookInput.message?.content || '';

    // Detect if Claude is asking a question
    const prompt = detectPrompt(lastMessage);

    // Mark session as awaiting input
    const marked = await markAwaiting(sessionId, prompt);

    if (!marked) {
      console.error('Failed to mark session as awaiting - backend may be down');
      // Exit with code 0 (silent failure) - orchestration must continue
      process.exit(0);
    }

    // Poll for input with timeout
    const input = await pollForInput(sessionId, POLL_TIMEOUT_MS);

    const response: HookResponse = {};

    if (input) {
      // Input received - inject as systemMessage
      response.systemMessage = `User: ${input}`;
      console.log(`Input received from Dashboard: "${input}"`);
    } else {
      // Timeout - notify that we're awaiting
      response.systemMessage = '[Awaiting Dashboard input...]';
      console.log('Input poll timeout - awaiting Dashboard response');
    }

    // Output response to stdout
    console.log(JSON.stringify(response));

    process.exit(0);
  } catch (error) {
    // Silent failure - log error but exit cleanly
    console.error('Hook error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(0);
  }
}

main();
